"""
Sequence Generator for Time Series Data
Creates input sequences for LSTM/Transformer models
"""
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SequenceGenerator:
    """
    Generate sequences for time series prediction
    """
    
    def __init__(self, sequence_length=60, horizon=15, step=1):
        """
        Args:
            sequence_length: Number of timesteps to look back
            horizon: Minutes ahead to predict
            step: Step size for sliding window
        """
        self.sequence_length = sequence_length
        self.horizon = horizon
        self.step = step
        self.scaler = StandardScaler()
        self.feature_columns = None
    
    def create_sequences(self, df, features, labels):
        """
        Create sequences from dataframe
        
        Args:
            df: DataFrame with features
            features: List of feature column names
            labels: Series with labels
            
        Returns:
            X: Array of shape (n_samples, sequence_length, n_features)
            y: Array of labels
            indices: DataFrame indices for each sequence
        """
        logger.info(f"🔧 Creating sequences...")
        logger.info(f"  Sequence length: {self.sequence_length}")
        logger.info(f"  Horizon: {self.horizon} minutes")
        logger.info(f"  Step size: {self.step}")
        
        # Align data
        valid_idx = df.index.intersection(labels.index)
        df = df.loc[valid_idx]
        labels = labels.loc[valid_idx]
        
        # Extract features
        X_data = df[features].values
        y_data = labels.values
        
        # Create sequences
        X_sequences = []
        y_sequences = []
        indices = []
        
        for i in range(0, len(X_data) - self.sequence_length - self.horizon, self.step):
            # Input sequence
            X_seq = X_data[i:i + self.sequence_length]
            
            # Target (label at future point)
            y_idx = i + self.sequence_length + self.horizon - 1
            
            if y_idx < len(y_data):
                y_seq = y_data[y_idx]
                
                X_sequences.append(X_seq)
                y_sequences.append(y_seq)
                indices.append(valid_idx[y_idx])
        
        X = np.array(X_sequences)
        y = np.array(y_sequences)
        
        logger.info(f"✅ Created {len(X):,} sequences")
        logger.info(f"  Shape: {X.shape}")
        
        return X, y, indices
    
    def fit_scaler(self, X):
        """
        Fit scaler on training data
        
        Args:
            X: Training sequences (n_samples, sequence_length, n_features)
        """
        # Reshape to 2D for scaler
        n_samples, seq_len, n_features = X.shape
        X_reshaped = X.reshape(-1, n_features)
        
        logger.info("🔧 Fitting scaler...")
        self.scaler.fit(X_reshaped)
        logger.info("✅ Scaler fitted")
    
    def transform(self, X):
        """
        Transform sequences using fitted scaler
        
        Args:
            X: Sequences to transform
            
        Returns:
            Scaled sequences
        """
        n_samples, seq_len, n_features = X.shape
        X_reshaped = X.reshape(-1, n_features)
        
        # Scale
        X_scaled = self.scaler.transform(X_reshaped)
        
        # Reshape back
        X_scaled = X_scaled.reshape(n_samples, seq_len, n_features)
        
        return X_scaled
    
    def fit_transform(self, X):
        """
        Fit scaler and transform sequences
        """
        self.fit_scaler(X)
        return self.transform(X)
    
    def prepare_data(self, df, features, labels, fit_scaler=True):
        """
        Complete data preparation pipeline
        
        Args:
            df: DataFrame with features
            features: List of feature columns
            labels: Series with labels
            fit_scaler: Whether to fit scaler (True for training)
            
        Returns:
            X: Scaled sequences
            y: Labels
            y_onehot: One-hot encoded labels
            indices: Sequence indices
        """
        # Create sequences
        X, y, indices = self.create_sequences(df, features, labels)
        
        # Scale features
        if fit_scaler:
            X = self.fit_transform(X)
        else:
            X = self.transform(X)
        
        # One-hot encode labels
        from tensorflow.keras.utils import to_categorical
        y_onehot = to_categorical(y, num_classes=3)
        
        logger.info(f"✅ Data preparation complete")
        logger.info(f"  X shape: {X.shape}")
        logger.info(f"  y shape: {y.shape}")
        logger.info(f"  y_onehot shape: {y_onehot.shape}")
        
        # Class distribution
        unique, counts = np.unique(y, return_counts=True)
        logger.info(f"  Class distribution:")
        for cls, count in zip(unique, counts):
            pct = count / len(y) * 100
            cls_name = ['SELL', 'NEUTRAL', 'BUY'][cls]
            logger.info(f"    {cls_name}: {count:,} ({pct:.1f}%)")
        
        return X, y, y_onehot, indices


def split_train_val_test(X, y, y_onehot, indices, 
                          train_ratio=0.7, val_ratio=0.15):
    """
    Split data into train/validation/test sets (chronological)
    
    Args:
        X, y, y_onehot: Data arrays
        indices: Time indices
        train_ratio: Proportion for training
        val_ratio: Proportion for validation
        
    Returns:
        Dictionary with train/val/test splits
    """
    n_samples = len(X)
    
    # Calculate split points (chronological)
    train_end = int(n_samples * train_ratio)
    val_end = int(n_samples * (train_ratio + val_ratio))
    
    splits = {
        'X_train': X[:train_end],
        'y_train': y[:train_end],
        'y_train_onehot': y_onehot[:train_end],
        'indices_train': indices[:train_end],
        
        'X_val': X[train_end:val_end],
        'y_val': y[train_end:val_end],
        'y_val_onehot': y_onehot[train_end:val_end],
        'indices_val': indices[train_end:val_end],
        
        'X_test': X[val_end:],
        'y_test': y[val_end:],
        'y_test_onehot': y_onehot[val_end:],
        'indices_test': indices[val_end:]
    }
    
    logger.info(f"📊 Data Split:")
    logger.info(f"  Train: {len(splits['X_train']):,} samples")
    logger.info(f"  Val:   {len(splits['X_val']):,} samples")
    logger.info(f"  Test:  {len(splits['X_test']):,} samples")
    
    return splits


if __name__ == "__main__":
    # Test sequence generator
    print("Testing SequenceGenerator...")
    
    # Create dummy data
    dates = pd.date_range('2024-01-01', periods=1000, freq='1min')
    df = pd.DataFrame({
        'feature1': np.random.randn(1000),
        'feature2': np.random.randn(1000),
        'feature3': np.random.randn(1000)
    }, index=dates)
    
    labels = pd.Series(np.random.randint(0, 3, 1000), index=dates)
    
    # Create sequences
    gen = SequenceGenerator(sequence_length=60, horizon=15)
    X, y, y_onehot, indices = gen.prepare_data(
        df, 
        features=['feature1', 'feature2', 'feature3'],
        labels=labels
    )
    
    print(f"\n✅ Test passed!")
    print(f"X shape: {X.shape}")
    print(f"y shape: {y.shape}")


# ============================================================================
# Standalone helper function for notebook usage
# ============================================================================

def create_sequences(X, y, sequence_length):
    """
    Simple sequence creation for LSTM/Transformer input
    
    This is a standalone function for easy use in notebooks and scripts.
    For more advanced features, use the SequenceGenerator class above.
    
    Args:
        X: Feature array of shape (n_samples, n_features)
        y: Label array of shape (n_samples,)
        sequence_length: Number of timesteps per sequence
        
    Returns:
        X_seq: Array of shape (n_sequences, sequence_length, n_features)
        y_seq: Array of shape (n_sequences,)
    
    Example:
        >>> X = np.random.randn(1000, 50)  # 1000 samples, 50 features
        >>> y = np.random.randint(0, 3, 1000)  # 1000 labels
        >>> X_seq, y_seq = create_sequences(X, y, sequence_length=60)
        >>> print(X_seq.shape)  # (940, 60, 50)
        >>> print(y_seq.shape)  # (940,)
    """
    X_seq = []
    y_seq = []
    
    for i in range(sequence_length, len(X)):
        X_seq.append(X[i-sequence_length:i])
        y_seq.append(y[i])
    
    return np.array(X_seq), np.array(y_seq)
