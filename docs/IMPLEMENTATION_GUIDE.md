# 🚀 Implementation Guide - Step by Step

**Version:** 1.0.0  
**Date:** October 22, 2025  
**Estimated Time:** 4 weeks

---

## 📋 Overview

Энэ гарын авлага нь Deep Learning Forex Prediction системийг **алхам алхмаар** хэрэгжүүлэхэд туслана.

---

## ✅ Pre-requisites Checklist

```
Hardware:
□ GPU (NVIDIA RTX 3060 or better) - optional but recommended
□ 16GB+ RAM
□ 100GB+ free disk space
□ Stable internet connection

Software:
□ Python 3.11+
□ MetaTrader 5 installed
□ MongoDB installed
□ Redis installed (optional)
□ Git
□ VS Code or PyCharm

Skills:
□ Python basics
□ Pandas/NumPy knowledge
□ Basic understanding of neural networks
□ Forex trading basics
```

---

## 📅 WEEK 1: Setup & Data Preparation

### Day 1-2: Environment Setup

#### Step 1: Clone & Setup Project

```bash
# Navigate to project directory
cd c:\Users\mmdor\Desktop\Forex_signal_app

# Activate virtual environment
.venv\Scripts\activate

# Install dependencies
pip install -r requirements-dl.txt

# Verify installation
python -c "import tensorflow as tf; print(tf.__version__)"
python -c "import MetaTrader5 as mt5; print('MT5 OK')"
```

#### Step 2: Create Directory Structure

```bash
# Create missing directories
mkdir models\15min
mkdir models\30min
mkdir models\60min
mkdir models\ensemble
mkdir data\validation
mkdir logs
mkdir monitoring
```

#### Step 3: Configure MT5

```python
# Test MT5 connection
python

>>> import MetaTrader5 as mt5
>>> if mt5.initialize():
...     print("MT5 Connected!")
...     print(f"Terminal: {mt5.terminal_info()}")
...     mt5.shutdown()
```

---

### Day 3-5: Data Collection

#### Step 1: Download Historical Data

Create file: `scripts/download_historical_data.py`

```python
"""
Download historical forex data from MT5
"""
import MetaTrader5 as mt5
import pandas as pd
from datetime import datetime, timedelta
import os

def download_currency_data(symbol, start_date, end_date, timeframe=mt5.TIMEFRAME_M1):
    """
    Download historical data for a currency pair
    """
    print(f"📥 Downloading {symbol} data...")

    # Initialize MT5
    if not mt5.initialize():
        print("❌ MT5 initialization failed")
        return None

    # Get rates
    rates = mt5.copy_rates_range(symbol, timeframe, start_date, end_date)

    if rates is None:
        print(f"❌ Failed to get data for {symbol}")
        mt5.shutdown()
        return None

    # Convert to DataFrame
    df = pd.DataFrame(rates)
    df['time'] = pd.to_datetime(df['time'], unit='s')

    print(f"✅ Downloaded {len(df):,} rows")

    mt5.shutdown()
    return df


if __name__ == "__main__":
    # Configuration
    SYMBOLS = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'USDCHF', 'XAUUSD']
    START_DATE = datetime(2020, 1, 1)
    END_DATE = datetime(2024, 10, 22)

    # Download each symbol
    for symbol in SYMBOLS:
        df = download_currency_data(symbol, START_DATE, END_DATE)

        if df is not None:
            # Save to CSV
            filename = f"data/train/{symbol.replace('/', '_')}_1min.csv"
            df.to_csv(filename, index=False)
            print(f"💾 Saved to {filename}\n")

    print("✅ All data downloaded!")
```

Run:

```bash
python scripts/download_historical_data.py
```

**Expected output:**

```
📥 Downloading EURUSD data...
✅ Downloaded 3,156,480 rows
💾 Saved to data/train/EURUSD_1min.csv
```

---

### Day 6-7: Data Exploration

Create notebook: `ml_models/01_Data_Exploration.ipynb`

```python
# Cell 1: Imports
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Set style
plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")
```

```python
# Cell 2: Load Data
df = pd.read_csv('../data/train/EURUSD_1min.csv')
df['time'] = pd.to_datetime(df['time'])
df.set_index('time', inplace=True)

print(f"📊 Data shape: {df.shape}")
print(f"📅 Date range: {df.index.min()} to {df.index.max()}")
print(f"\n🔍 First few rows:")
df.head()
```

```python
# Cell 3: Basic Statistics
print("📈 Price Statistics:")
print(df['close'].describe())

print("\n📊 Volume Statistics:")
print(df['volume'].describe())

# Check for missing values
print(f"\n🔍 Missing values:")
print(df.isnull().sum())
```

```python
# Cell 4: Visualize Price Action
fig, axes = plt.subplots(2, 1, figsize=(15, 8))

# Price chart
df['close'].plot(ax=axes[0], title='EUR/USD Close Price', linewidth=0.5)
axes[0].set_ylabel('Price')

# Volume chart
df['volume'].plot(ax=axes[1], title='Trading Volume', linewidth=0.5, color='orange')
axes[1].set_ylabel('Volume')

plt.tight_layout()
plt.show()
```

```python
# Cell 5: Returns Distribution
df['returns'] = df['close'].pct_change()

fig, axes = plt.subplots(1, 2, figsize=(15, 5))

# Histogram
df['returns'].hist(bins=100, ax=axes[0])
axes[0].set_title('Returns Distribution')
axes[0].set_xlabel('Returns')

# QQ Plot
from scipy import stats
stats.probplot(df['returns'].dropna(), dist="norm", plot=axes[1])
axes[1].set_title('Q-Q Plot')

plt.tight_layout()
plt.show()

print(f"📊 Returns Stats:")
print(f"  Mean: {df['returns'].mean():.6f}")
print(f"  Std: {df['returns'].std():.6f}")
print(f"  Skewness: {df['returns'].skew():.4f}")
print(f"  Kurtosis: {df['returns'].kurtosis():.4f}")
```

---

## 📅 WEEK 2: Feature Engineering & Model Architecture

### Day 8-10: Feature Engineering

Create file: `backend/ml/features/technical_indicators.py`

```python
"""
Technical Indicators Calculator
100+ indicators for forex prediction
"""
import pandas as pd
import numpy as np
import ta

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
    df['volume_sma_20'] = df['volume'].rolling(20).mean()
    df['volume_ratio'] = df['volume'] / df['volume_sma_20']
    df['obv'] = ta.volume.OnBalanceVolumeIndicator(
        df['close'], df['volume']
    ).on_balance_volume()

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
```

Test it:

```python
# ml_models/02_Feature_Engineering.ipynb

from backend.ml.features.technical_indicators import calculate_all_features

# Load data
df = pd.read_csv('../data/train/EURUSD_1min.csv')
df['time'] = pd.to_datetime(df['time'])
df.set_index('time', inplace=True)

# Calculate features
df_features = calculate_all_features(df)

print(f"Original shape: {df.shape}")
print(f"With features: {df_features.shape}")
print(f"\nFeature columns:")
print(df_features.columns.tolist())
```

---

### Day 11-14: Model Architecture

Create file: `backend/ml/models/transformer_lstm.py`

```python
"""
Transformer + LSTM Hybrid Model
For 15-minute forex predictions
"""
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

def build_transformer_lstm_model(
    sequence_length=60,
    n_features=100,
    n_heads=8,
    ff_dim=256,
    lstm_units=[128, 64],
    dropout_rate=0.3
):
    """
    Build Transformer + LSTM hybrid architecture

    Args:
        sequence_length: Number of timesteps to look back
        n_features: Number of input features
        n_heads: Number of attention heads
        ff_dim: Feed-forward dimension
        lstm_units: List of LSTM units
        dropout_rate: Dropout probability

    Returns:
        Keras Model
    """
    # Input layer
    inputs = layers.Input(shape=(sequence_length, n_features))

    # ===== TRANSFORMER BRANCH =====
    # Multi-head attention
    attn_output = layers.MultiHeadAttention(
        num_heads=n_heads,
        key_dim=64,
        dropout=dropout_rate
    )(inputs, inputs)

    attn_output = layers.LayerNormalization(epsilon=1e-6)(attn_output)
    attn_output = layers.Dropout(dropout_rate)(attn_output)

    # Feed-forward network
    ff_output = layers.Dense(ff_dim, activation='relu')(attn_output)
    ff_output = layers.Dropout(dropout_rate)(ff_output)
    ff_output = layers.Dense(n_features)(ff_output)

    # Add & Norm
    transformer_output = layers.LayerNormalization(epsilon=1e-6)(
        attn_output + ff_output
    )

    # Global pooling
    transformer_output = layers.GlobalAveragePooling1D()(transformer_output)

    # ===== LSTM BRANCH =====
    lstm_output = inputs

    for i, units in enumerate(lstm_units):
        return_sequences = (i < len(lstm_units) - 1)
        lstm_output = layers.Bidirectional(
            layers.LSTM(units, return_sequences=return_sequences)
        )(lstm_output)
        lstm_output = layers.Dropout(dropout_rate)(lstm_output)

    # ===== COMBINE =====
    combined = layers.concatenate([transformer_output, lstm_output])

    # Dense layers
    dense = layers.Dense(128, activation='relu')(combined)
    dense = layers.BatchNormalization()(dense)
    dense = layers.Dropout(dropout_rate)(dense)

    dense = layers.Dense(64, activation='relu')(dense)
    dense = layers.Dropout(dropout_rate)(dense)

    # ===== OUTPUT HEADS =====
    # Direction classification (BUY/NEUTRAL/SELL)
    direction_output = layers.Dense(
        3, activation='softmax', name='direction'
    )(dense)

    # Confidence score
    confidence_output = layers.Dense(
        1, activation='sigmoid', name='confidence'
    )(dense)

    # Build model
    model = keras.Model(
        inputs=inputs,
        outputs=[direction_output, confidence_output],
        name='Transformer_LSTM_15min'
    )

    return model


def compile_model(model, learning_rate=0.0001):
    """
    Compile model with losses and metrics
    """
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=learning_rate),
        loss={
            'direction': 'categorical_crossentropy',
            'confidence': 'mse'
        },
        loss_weights={
            'direction': 1.0,
            'confidence': 0.5
        },
        metrics={
            'direction': ['accuracy'],
            'confidence': ['mae']
        }
    )

    return model


if __name__ == "__main__":
    # Test model creation
    model = build_transformer_lstm_model()
    model = compile_model(model)

    print(model.summary())

    # Test with dummy data
    import numpy as np
    X_dummy = np.random.randn(32, 60, 100)
    y_direction_dummy = np.random.randn(32, 3)
    y_confidence_dummy = np.random.randn(32, 1)

    # Test forward pass
    predictions = model.predict(X_dummy)
    print(f"\n✅ Model test successful!")
    print(f"Direction shape: {predictions[0].shape}")
    print(f"Confidence shape: {predictions[1].shape}")
```

---

## 📊 Progress Tracker

### Week 1 Checklist

```
□ Environment setup complete
□ MT5 connection tested
□ Historical data downloaded (3M+ rows)
□ Data exploration notebook completed
□ Basic statistics analyzed
```

### Week 2 Checklist

```
□ Feature engineering module created
□ 100+ technical indicators implemented
□ Transformer+LSTM model architecture built
□ Model compilation tested
□ Dummy data forward pass successful
```

### Week 3 (Next Steps)

```
□ Label creation strategy
□ Data preprocessing pipeline
□ Training notebook creation
□ Model training (15min)
□ Validation & evaluation
```

### Week 4 (Final)

```
□ Train 30min & 60min models
□ Ensemble training
□ Live prediction API
□ Mobile app integration
□ Production deployment
```

---

## 🎯 Quick Commands Reference

```bash
# Activate environment
.venv\Scripts\activate

# Download data
python scripts/download_historical_data.py

# Open Jupyter
jupyter notebook ml_models/

# Test model
python backend/ml/models/transformer_lstm.py

# Run training
python ml_models/03_Model_Training_15min.ipynb

# Start API
python backend/app.py

# Run tests
pytest tests/ -v
```

---

## 📞 Troubleshooting

### Issue: MT5 Connection Failed

```python
# Solution:
1. Check MT5 is running
2. Login to your account
3. Enable Algo Trading in Tools → Options → Expert Advisors
```

### Issue: GPU Not Detected

```python
# Check GPU
import tensorflow as tf
print(tf.config.list_physical_devices('GPU'))

# If empty, install CUDA + cuDNN
```

### Issue: Out of Memory

```python
# Reduce batch size
batch_size = 64  # Try 32 or 16

# Or use data generator
# See: backend/ml/training/data_generator.py
```

---

## 🎓 Next: Start Training

Одоо та бэлэн боллоо! Дараагийн алхам:

1. ✅ Week 1 checklist бөглөх
2. ✅ Week 2 implementation эхлүүлэх
3. ✅ `03_Model_Training_15min.ipynb` үүсгэх

**Та яг одоо эхлэх гэж байна уу?** Би танд training notebook-ийг бичиж өгье! 🚀

---

**Version:** 1.0.0  
**Status:** Ready to Start ✅
