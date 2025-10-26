"""
Data Loader for Forex Training Data
Handles large CSV files efficiently
"""
import pandas as pd
import numpy as np
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ForexDataLoader:
    """
    Load and preprocess forex data from train/test folders
    """
    
    def __init__(self, data_dir='data'):
        self.data_dir = Path(data_dir)
        self.train_dir = self.data_dir / 'train'
        self.test_dir = self.data_dir / 'test'
        
        # Available currency pairs
        self.pairs = [
            'EUR_USD', 'GBP_USD', 'USD_JPY', 
            'USD_CAD', 'USD_CHF', 'XAU_USD'
        ]
    
    def load_train_data(self, pair='EUR_USD', nrows=None):
        """
        Load training data for a currency pair
        
        Args:
            pair: Currency pair name (e.g., 'EUR_USD')
            nrows: Number of rows to load (None = all)
            
        Returns:
            DataFrame with OHLCV data
        """
        filepath = self.train_dir / f"{pair}_1min.csv"
        
        if not filepath.exists():
            logger.error(f"File not found: {filepath}")
            return None
        
        logger.info(f"📥 Loading {pair} training data...")
        
        # Load with chunking for large files
        if nrows is None:
            df = pd.read_csv(filepath)
        else:
            df = pd.read_csv(filepath, nrows=nrows)
        
        # Parse datetime
        if 'time' in df.columns:
            df['time'] = pd.to_datetime(df['time'])
            df.set_index('time', inplace=True)
        elif 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df.set_index('timestamp', inplace=True)
        
        # Standardize volume column name
        if 'tick_volume' not in df.columns and 'volume' in df.columns:
            df['tick_volume'] = df['volume']
        
        logger.info(f"✅ Loaded {len(df):,} rows")
        logger.info(f"📅 Date range: {df.index.min()} to {df.index.max()}")
        logger.info(f"📋 Columns: {df.columns.tolist()}")
        
        return df
    
    def load_test_data(self, pair='EUR_USD'):
        """
        Load test data for a currency pair
        
        Args:
            pair: Currency pair name
            
        Returns:
            DataFrame with test data
        """
        filepath = self.test_dir / f"{pair}_test.csv"
        
        if not filepath.exists():
            logger.error(f"File not found: {filepath}")
            return None
        
        logger.info(f"📥 Loading {pair} test data...")
        
        df = pd.read_csv(filepath)
        
        # Parse datetime
        if 'time' in df.columns:
            df['time'] = pd.to_datetime(df['time'])
            df.set_index('time', inplace=True)
        elif 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df.set_index('timestamp', inplace=True)
        
        # Standardize volume column name
        if 'tick_volume' not in df.columns and 'volume' in df.columns:
            df['tick_volume'] = df['volume']
        
        logger.info(f"✅ Loaded {len(df):,} test rows")
        logger.info(f"📋 Columns: {df.columns.tolist()}")
        
        return df
    
    def load_all_pairs(self, train=True, nrows=None):
        """
        Load data for all currency pairs
        
        Args:
            train: If True, load training data; else test data
            nrows: Number of rows per pair (None = all)
            
        Returns:
            Dictionary {pair: dataframe}
        """
        data = {}
        
        for pair in self.pairs:
            if train:
                df = self.load_train_data(pair, nrows=nrows)
            else:
                df = self.load_test_data(pair)
            
            if df is not None:
                data[pair] = df
        
        logger.info(f"✅ Loaded {len(data)} currency pairs")
        return data
    
    def get_data_info(self):
        """
        Get information about available data
        
        Returns:
            Dictionary with data statistics
        """
        info = {
            'train_files': [],
            'test_files': [],
            'total_train_size': 0,
            'total_test_size': 0
        }
        
        # Check train files
        for pair in self.pairs:
            train_file = self.train_dir / f"{pair}_1min.csv"
            if train_file.exists():
                size_mb = train_file.stat().st_size / (1024 * 1024)
                info['train_files'].append({
                    'pair': pair,
                    'file': train_file.name,
                    'size_mb': round(size_mb, 2)
                })
                info['total_train_size'] += size_mb
        
        # Check test files
        for pair in self.pairs:
            test_file = self.test_dir / f"{pair}_test.csv"
            if test_file.exists():
                size_mb = test_file.stat().st_size / (1024 * 1024)
                info['test_files'].append({
                    'pair': pair,
                    'file': test_file.name,
                    'size_mb': round(size_mb, 2)
                })
                info['total_test_size'] += size_mb
        
        info['total_train_size'] = round(info['total_train_size'], 2)
        info['total_test_size'] = round(info['total_test_size'], 2)
        
        return info


def create_labels(df, horizon=15, threshold=0.0005):
    """
    Create labels for classification with improved logic
    
    Args:
        df: DataFrame with 'close' column
        horizon: Minutes ahead to predict (default: 15)
        threshold: Minimum price change to consider signal (default: 0.05% = ~5 pips)
        
    Returns:
        Series with labels: 0=SELL, 1=NEUTRAL, 2=BUY
        
    Notes:
        - Threshold 0.0005 (0.05%) ≈ 5 pips for EUR/USD
        - This accounts for typical spread (1-2 pips) + small profit margin
        - Avoids labeling market noise as signals
    """
    # Calculate future returns
    future_price = df['close'].shift(-horizon)
    returns = (future_price - df['close']) / df['close']
    
    # Calculate ATR-based adaptive threshold (more sophisticated)
    # If ATR exists, use it to adapt threshold to market volatility
    if 'atr_14' in df.columns:
        # Normalize ATR to percentage
        atr_pct = df['atr_14'] / df['close']
        # Use minimum of fixed threshold or 0.5 * ATR
        adaptive_threshold = pd.Series(threshold, index=df.index)
        adaptive_threshold = adaptive_threshold.combine(atr_pct * 0.5, max)
    else:
        adaptive_threshold = threshold
    
    # Create labels with adaptive threshold
    labels = pd.Series(1, index=df.index)  # Default: NEUTRAL
    
    if isinstance(adaptive_threshold, pd.Series):
        # Adaptive thresholding
        labels[returns > adaptive_threshold] = 2  # BUY
        labels[returns < -adaptive_threshold] = 0  # SELL
    else:
        # Fixed thresholding
        labels[returns > adaptive_threshold] = 2  # BUY
        labels[returns < -adaptive_threshold] = 0  # SELL
    
    return labels


if __name__ == "__main__":
    # Test the loader
    loader = ForexDataLoader(data_dir='../../../data')
    
    # Get data info
    info = loader.get_data_info()
    
    print("📊 Data Information:")
    print(f"\n🎓 Training Files:")
    for file_info in info['train_files']:
        print(f"  - {file_info['pair']}: {file_info['size_mb']} MB")
    print(f"  Total: {info['total_train_size']} MB")
    
    print(f"\n🧪 Test Files:")
    for file_info in info['test_files']:
        print(f"  - {file_info['pair']}: {file_info['size_mb']} MB")
    print(f"  Total: {info['total_test_size']} MB")
    
    # Test loading one pair
    print("\n" + "="*50)
    df = loader.load_train_data('EUR_USD', nrows=100000)
    
    if df is not None:
        print(f"\n📊 Sample Data:")
        print(df.head())
        print(f"\n📈 Columns: {df.columns.tolist()}")
