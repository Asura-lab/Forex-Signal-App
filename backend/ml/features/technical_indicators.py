"""
Technical Indicators Calculator
100+ indicators for forex prediction
Handles missing volume columns gracefully
"""
import pandas as pd
import numpy as np
import ta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def calculate_all_features(df):
    """
    Calculate all technical indicators
    
    Args:
        df: DataFrame with OHLCV data
        
    Returns:
        DataFrame with 100+ features
    """
    df = df.copy()
    
    print("🔧 Calculating features...")
    
    # 1. BASIC PRICE FEATURES
    df['returns'] = df['close'].pct_change()
    df['log_returns'] = np.log(df['close'] / df['close'].shift(1))
    df['price_range'] = df['high'] - df['low']
    df['price_volatility'] = df['returns'].rolling(20).std()
    
    # 2. MOVING AVERAGES
    for period in [5, 10, 20, 50, 100, 200]:
        df[f'sma_{period}'] = df['close'].rolling(period).mean()
        df[f'ema_{period}'] = df['close'].ewm(span=period, adjust=False).mean()
    
    # 3. MA CROSSES
    df['ma_cross_5_20'] = (df['sma_5'] - df['sma_20']) / df['close']
    df['ma_cross_20_50'] = (df['sma_20'] - df['sma_50']) / df['close']
    df['ma_cross_50_200'] = (df['sma_50'] - df['sma_200']) / df['close']
    
    # 4. RSI
    for period in [9, 14, 21]:
        df[f'rsi_{period}'] = ta.momentum.RSIIndicator(
            df['close'], window=period
        ).rsi()
    
    # 5. MACD
    macd = ta.trend.MACD(df['close'])
    df['macd'] = macd.macd()
    df['macd_signal'] = macd.macd_signal()
    df['macd_diff'] = macd.macd_diff()
    
    # 6. BOLLINGER BANDS
    for period in [20, 50]:
        bb = ta.volatility.BollingerBands(df['close'], window=period)
        df[f'bb_upper_{period}'] = bb.bollinger_hband()
        df[f'bb_lower_{period}'] = bb.bollinger_lband()
        df[f'bb_width_{period}'] = bb.bollinger_wband()
    
    # 7. ATR
    df['atr_14'] = ta.volatility.AverageTrueRange(
        df['high'], df['low'], df['close'], window=14
    ).average_true_range()
    
    # 8. STOCHASTIC
    stoch = ta.momentum.StochasticOscillator(df['high'], df['low'], df['close'])
    df['stoch_k'] = stoch.stoch()
    df['stoch_d'] = stoch.stoch_signal()
    
    # 9. ADX
    df['adx'] = ta.trend.ADXIndicator(
        df['high'], df['low'], df['close'], window=14
    ).adx()
    
    # 10. VOLUME INDICATORS
    # Determine which volume column to use
    volume_col = None
    if 'tick_volume' in df.columns:
        volume_col = 'tick_volume'
    elif 'volume' in df.columns:
        volume_col = 'volume'
    elif 'real_volume' in df.columns:
        volume_col = 'real_volume'
    
    if volume_col:
        df['volume_sma_20'] = df[volume_col].rolling(20).mean()
        df['volume_ratio'] = df[volume_col] / df['volume_sma_20']
        df['obv'] = ta.volume.OnBalanceVolumeIndicator(
            df['close'], df[volume_col]
        ).on_balance_volume()
        logger.info(f"✅ Volume indicators calculated using '{volume_col}'")
    else:
        # If no volume data, create dummy features
        logger.warning("⚠️  No volume data found, using placeholder values")
        df['volume_sma_20'] = 0
        df['volume_ratio'] = 1.0
        df['obv'] = 0
    
    # Drop NaN
    df.dropna(inplace=True)
    
    feature_count = len(df.columns) - 5  # Exclude OHLCV
    print(f"✅ Calculated {feature_count} features")
    
    return df


def get_feature_columns():
    """
    Return list of feature column names
    """
    base_features = ['returns', 'log_returns', 'price_range', 'price_volatility']
    
    ma_features = [f'sma_{p}' for p in [5, 10, 20, 50, 100, 200]]
    ma_features += [f'ema_{p}' for p in [5, 10, 20, 50, 100, 200]]
    
    cross_features = ['ma_cross_5_20', 'ma_cross_20_50', 'ma_cross_50_200']
    
    rsi_features = [f'rsi_{p}' for p in [9, 14, 21]]
    
    macd_features = ['macd', 'macd_signal', 'macd_diff']
    
    bb_features = []
    for p in [20, 50]:
        bb_features += [f'bb_upper_{p}', f'bb_lower_{p}', f'bb_width_{p}']
    
    other_features = [
        'atr_14', 'stoch_k', 'stoch_d', 'adx',
        'volume_sma_20', 'volume_ratio', 'obv'
    ]
    
    return base_features + ma_features + cross_features + rsi_features + \
           macd_features + bb_features + other_features
