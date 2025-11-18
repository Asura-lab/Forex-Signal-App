# 🚀 Hybrid Trading System - 4 Сарын Сургалтын Төлөвлөгөө

**Эхлэх огноо:** 2025-11-12  
**Дуусах огноо:** 2026-03-12  
**Нийт хугацаа:** 16 долоо хоног (4 сар)  
**Зорилго:** Шинээр нэг универсал Direction Predictor + Price Target Predictor + RL Agent

---

## 🎯 Системийн Тодорхойлолт

### Архитектурын Тойм

```
┌─────────────────────────────────────────────────────────────┐
│                    HYBRID TRADING SYSTEM                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  MODEL 1: Universal Direction Predictor (NEW!)              │
│  ─────────────────────────────────────────────              │
│  Input: Historical OHLCV + 40+ indicators                   │
│  Architecture: Transformer + Bi-LSTM + Attention            │
│  Output: [UP, DOWN, NEUTRAL] + Confidence                   │
│  Training: 6 валютын хос нэгтгэсэн                          │
│  No timeframe split (Universal model)                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  MODEL 2: Price Target Predictor (Regression)               │
│  ─────────────────────────────────────────────              │
│  Input: Direction + Confidence + Features                   │
│  Output: Entry Price, Take Profit, Stop Loss                │
│  Architecture: LSTM + Dense layers                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  MODEL 3: RL Agent (PPO/A2C)                                │
│  ─────────────────────────────────────────────              │
│  State: Market + Position + P&L + Predictions               │
│  Action: [BUY, SELL, HOLD, CLOSE]                           │
│  Reward: Profit + Risk-adjusted metrics                     │
│  Training: Gym environment with backtest                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📅 Сарын Тойм

| Сар       | Үндсэн Ажил                             | Гол Үр Дүн                   |
| --------- | --------------------------------------- | ---------------------------- |
| **Сар 1** | Model 1 - Universal Direction Predictor | 90%+ accuracy модель         |
| **Сар 2** | Model 2 - Price Target Predictor        | Entry/TP/SL таамаглах модель |
| **Сар 3** | Model 3 - RL Agent сургалт              | Автомат trading agent        |
| **Сар 4** | Integration + Production deployment     | Live trading system          |

---

# 📆 САРЫН ДЭЛГЭРЭНГҮЙ ТӨЛӨВЛӨГӨӨ

---

## 🗓️ САР 1: Universal Direction Predictor (Долоо хоног 1-4)

**Зорилго:** Нэг хүчирхэг универсал модель бүтээх (timeframe split байхгүй)

---

### ✅ ДОЛОО ХОНОГ 1: Өгөгдөл бэлтгэх & Feature Engineering

**Огноо:** 2025-11-12 → 2025-11-18

#### Даалгавар 1.1: Түүхэн өгөгдөл татах (2 өдөр)

```bash
Ажил:
- MetaTrader 5-аас 12-24 сарын 1-минутын өгөгдөл татах
- 6 валютын хос (EUR/USD, GBP/USD, USD/JPY, USD/CAD, USD/CHF, XAU/USD)
- Өгөгдөл шалгах, алдаатай мөр устгах
- Цагийн бүс тохируулах (UTC)

Хүлээгдэж буй үр дүн:
- data/train/PAIR_NAME_1min_12months.csv
- Багадаа 500k+ rows per pair
- Clean, validated data

Code файл:
- scripts/download_extended_data.py
```

**Sample code:**

```python
# scripts/download_extended_data.py
import MetaTrader5 as mt5
from datetime import datetime, timedelta
import pandas as pd

def download_historical_data(symbol, months=12):
    """12 сарын түүхэн өгөгдөл татах"""
    if not mt5.initialize():
        print("MT5 эхлүүлэх алдаа")
        return None

    # 12 сарын өмнөх огноо
    end_date = datetime.now()
    start_date = end_date - timedelta(days=365)  # ~12 months

    # 1-минутын өгөгдөл
    rates = mt5.copy_rates_range(
        symbol,
        mt5.TIMEFRAME_M1,
        start_date,
        end_date
    )

    if rates is None or len(rates) == 0:
        print(f"Өгөгдөл татах алдаа: {symbol}")
        return None

    df = pd.DataFrame(rates)
    df['time'] = pd.to_datetime(df['time'], unit='s')

    # Save
    filename = f'data/train/{symbol}_1min_12months.csv'
    df.to_csv(filename, index=False)
    print(f"✓ {symbol}: {len(df)} rows татагдлаа")

    return df

# Татах
pairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'USDCHF', 'XAUUSD']
for pair in pairs:
    download_historical_data(pair, months=12)
```

#### Даалгавар 1.2: Advanced Feature Engineering (3 өдөр)

```bash
Ажил:
- 40+ техникал индикатор нэмэх
- Market microstructure features
- Order flow proxies
- Volatility clustering features
- Time-based features (hour, day, week)

Шинэ features:
- Volume Profile indicators
- Market breadth indicators
- Correlation features (pair-to-pair)
- Sentiment proxies
- Multi-timeframe aggregation (5min, 15min, 1h average)

Code файл:
- ml_models/feature_engineering_advanced.py
```

**Advanced features:**

```python
# ml_models/feature_engineering_advanced.py
import pandas as pd
import numpy as np
import talib

def calculate_advanced_features(df):
    """40+ Advanced техникал индикатор"""

    # === EXISTING FEATURES (30) ===
    # Price features
    df['returns'] = df['close'].pct_change()
    df['log_returns'] = np.log(df['close']).diff()
    df['hl_ratio'] = (df['high'] - df['low']) / df['close']
    df['co_ratio'] = (df['close'] - df['open']) / df['open']

    # Moving Averages
    for period in [5, 10, 20, 50, 100, 200]:
        df[f'sma_{period}'] = df['close'].rolling(period).mean()
        df[f'ema_{period}'] = df['close'].ewm(span=period).mean()

    # RSI
    df['rsi_14'] = talib.RSI(df['close'], timeperiod=14)
    df['rsi_28'] = talib.RSI(df['close'], timeperiod=28)

    # MACD
    macd, signal, hist = talib.MACD(df['close'])
    df['macd'] = macd
    df['macd_signal'] = signal
    df['macd_hist'] = hist

    # Bollinger Bands
    upper, middle, lower = talib.BBANDS(df['close'])
    df['bb_upper'] = upper
    df['bb_middle'] = middle
    df['bb_lower'] = lower
    df['bb_width'] = (upper - lower) / middle

    # ATR
    df['atr_14'] = talib.ATR(df['high'], df['low'], df['close'], timeperiod=14)
    df['atr_28'] = talib.ATR(df['high'], df['low'], df['close'], timeperiod=28)

    # Stochastic
    slowk, slowd = talib.STOCH(df['high'], df['low'], df['close'])
    df['stoch_k'] = slowk
    df['stoch_d'] = slowd

    # === NEW ADVANCED FEATURES (10+) ===

    # 1. ADX (Trend Strength)
    df['adx'] = talib.ADX(df['high'], df['low'], df['close'], timeperiod=14)

    # 2. CCI (Commodity Channel Index)
    df['cci'] = talib.CCI(df['high'], df['low'], df['close'], timeperiod=20)

    # 3. Williams %R
    df['willr'] = talib.WILLR(df['high'], df['low'], df['close'], timeperiod=14)

    # 4. MFI (Money Flow Index)
    df['mfi'] = talib.MFI(df['high'], df['low'], df['close'], df['tick_volume'], timeperiod=14)

    # 5. OBV (On Balance Volume)
    df['obv'] = talib.OBV(df['close'], df['tick_volume'])
    df['obv_ema'] = df['obv'].ewm(span=20).mean()

    # 6. Parabolic SAR
    df['sar'] = talib.SAR(df['high'], df['low'])

    # 7. TRIX (Triple Exponential Average)
    df['trix'] = talib.TRIX(df['close'], timeperiod=30)

    # 8. Ichimoku Cloud components
    # Tenkan-sen (Conversion Line)
    high_9 = df['high'].rolling(window=9).max()
    low_9 = df['low'].rolling(window=9).min()
    df['tenkan_sen'] = (high_9 + low_9) / 2

    # Kijun-sen (Base Line)
    high_26 = df['high'].rolling(window=26).max()
    low_26 = df['low'].rolling(window=26).min()
    df['kijun_sen'] = (high_26 + low_26) / 2

    # Senkou Span A (Leading Span A)
    df['senkou_span_a'] = ((df['tenkan_sen'] + df['kijun_sen']) / 2).shift(26)

    # 9. Volatility indicators
    df['historical_volatility'] = df['returns'].rolling(20).std() * np.sqrt(252)
    df['parkinson_volatility'] = np.sqrt(
        (1 / (4 * np.log(2))) *
        ((np.log(df['high'] / df['low'])) ** 2).rolling(20).mean()
    )

    # 10. Market microstructure
    df['spread'] = df['spread']  # Already exists
    df['volume_imbalance'] = (df['tick_volume'] - df['tick_volume'].rolling(20).mean()) / df['tick_volume'].rolling(20).std()

    # 11. Time-based features
    df['hour'] = pd.to_datetime(df['time']).dt.hour
    df['day_of_week'] = pd.to_datetime(df['time']).dt.dayofweek
    df['is_london_session'] = ((df['hour'] >= 8) & (df['hour'] < 16)).astype(int)
    df['is_ny_session'] = ((df['hour'] >= 13) & (df['hour'] < 21)).astype(int)
    df['is_overlap'] = ((df['hour'] >= 13) & (df['hour'] < 16)).astype(int)

    # 12. Multi-timeframe aggregation
    # Calculate 5-min features
    df['close_5min'] = df['close'].rolling(5).mean()
    df['volatility_5min'] = df['returns'].rolling(5).std()

    # Calculate 15-min features
    df['close_15min'] = df['close'].rolling(15).mean()
    df['volatility_15min'] = df['returns'].rolling(15).std()

    # Calculate 1-hour features
    df['close_1h'] = df['close'].rolling(60).mean()
    df['volatility_1h'] = df['returns'].rolling(60).std()

    # Drop NaN
    df = df.dropna()

    return df
```

#### Даалгавар 1.3: Label Generation Strategy (2 өдөр)

```bash
Ажил:
- Fixed horizon labeling (30/60/120 минутын ирээдүй)
- Adaptive labeling (volatility-based)
- Triple barrier method (TP/SL based)
- Multiple label strategies тестлэх

Үр дүн:
- Optimal labeling strategy сонгох
- Training labels бүтээх
- Label distribution шинжлэх

Code файл:
- ml_models/label_generation_strategy.py
```

**Label generation:**

```python
# ml_models/label_generation_strategy.py
import pandas as pd
import numpy as np

def triple_barrier_labeling(df, lookforward=60, profit_target=0.5, stop_loss=0.3):
    """
    Triple Barrier Method for labeling

    Args:
        lookforward: Хэдэн минут урагш харах
        profit_target: TP хувь (0.5% = 50 pips for forex)
        stop_loss: SL хувь (0.3% = 30 pips)

    Returns:
        labels: ['UP', 'DOWN', 'NEUTRAL']
    """
    labels = []

    for i in range(len(df) - lookforward):
        entry_price = df.iloc[i]['close']
        future_prices = df.iloc[i+1:i+lookforward+1]['close']

        # Define barriers
        upper_barrier = entry_price * (1 + profit_target / 100)
        lower_barrier = entry_price * (1 - stop_loss / 100)

        # Check which barrier is hit first
        hit_upper = (future_prices >= upper_barrier).any()
        hit_lower = (future_prices <= lower_barrier).any()

        if hit_upper and hit_lower:
            # Both hit - check which came first
            upper_idx = (future_prices >= upper_barrier).idxmax()
            lower_idx = (future_prices <= lower_barrier).idxmax()

            if upper_idx < lower_idx:
                labels.append('UP')
            else:
                labels.append('DOWN')
        elif hit_upper:
            labels.append('UP')
        elif hit_lower:
            labels.append('DOWN')
        else:
            # Neither hit - check final direction
            final_return = (future_prices.iloc[-1] - entry_price) / entry_price
            if final_return > 0.001:  # >0.1%
                labels.append('UP')
            elif final_return < -0.001:
                labels.append('DOWN')
            else:
                labels.append('NEUTRAL')

    return labels

def adaptive_labeling(df, lookforward=60, volatility_multiplier=2.0):
    """
    Adaptive labeling based on ATR (volatility)
    TP/SL dynamically adjusted
    """
    labels = []

    for i in range(len(df) - lookforward):
        entry_price = df.iloc[i]['close']
        atr = df.iloc[i]['atr_14']

        # Dynamic barriers
        upper_barrier = entry_price + (atr * volatility_multiplier)
        lower_barrier = entry_price - (atr * volatility_multiplier)

        future_prices = df.iloc[i+1:i+lookforward+1]['close']

        hit_upper = (future_prices >= upper_barrier).any()
        hit_lower = (future_prices <= lower_barrier).any()

        if hit_upper and not hit_lower:
            labels.append('UP')
        elif hit_lower and not hit_upper:
            labels.append('DOWN')
        else:
            labels.append('NEUTRAL')

    return labels
```

---

### ✅ ДОЛОО ХОНОГ 2: Model Architecture Design

**Огноо:** 2025-11-19 → 2025-11-25

#### Даалгавар 2.1: Hybrid Architecture тодорхойлох (2 өдөр)

```bash
Ажил:
- Transformer + Bi-LSTM + Attention архитектур дизайн
- Layer бүрийн үүрэг тодорхойлох
- Hyperparameter space тодорхойлох

Архитектур:
┌────────────────────────────────────┐
│ Input (sequence_length, features)  │
│           ↓                        │
│ TransformerBlock (4 heads)         │
│           ↓                        │
│ Bidirectional LSTM (256 units)     │
│           ↓                        │
│ Attention Layer                    │
│           ↓                        │
│ Dense (128, relu) + Dropout(0.3)   │
│           ↓                        │
│ Dense (64, relu) + Dropout(0.3)    │
│           ↓                        │
│ Output (3, softmax)                │
│ [UP, DOWN, NEUTRAL]                │
└────────────────────────────────────┘

Code файл:
- ml_models/hybrid_direction_model.py
```

**Model architecture:**

```python
# ml_models/hybrid_direction_model.py
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import keras

class TransformerBlock(layers.Layer):
    """Multi-head self-attention + Feed-forward"""
    def __init__(self, embed_dim, num_heads, ff_dim, dropout_rate=0.1):
        super().__init__()
        self.att = layers.MultiHeadAttention(
            num_heads=num_heads,
            key_dim=embed_dim
        )
        self.ffn = keras.Sequential([
            layers.Dense(ff_dim, activation="relu"),
            layers.Dense(embed_dim),
        ])
        self.layernorm1 = layers.LayerNormalization(epsilon=1e-6)
        self.layernorm2 = layers.LayerNormalization(epsilon=1e-6)
        self.dropout1 = layers.Dropout(dropout_rate)
        self.dropout2 = layers.Dropout(dropout_rate)

    def call(self, inputs, training=False):
        attn_output = self.att(inputs, inputs)
        attn_output = self.dropout1(attn_output, training=training)
        out1 = self.layernorm1(inputs + attn_output)
        ffn_output = self.ffn(out1)
        ffn_output = self.dropout2(ffn_output, training=training)
        return self.layernorm2(out1 + ffn_output)

def build_hybrid_direction_model(
    sequence_length=60,
    n_features=45,
    transformer_heads=4,
    transformer_ff_dim=128,
    lstm_units=256,
    dropout_rate=0.3
):
    """
    Hybrid Direction Predictor Model

    Architecture:
        Input → Transformer → Bi-LSTM → Attention → Dense → Output

    Args:
        sequence_length: Цагийн багцын урт (default: 60)
        n_features: Feature тоо (default: 45)
        transformer_heads: Attention heads (default: 4)
        transformer_ff_dim: FF network dim (default: 128)
        lstm_units: LSTM нэгжийн тоо (default: 256)
        dropout_rate: Dropout rate (default: 0.3)

    Returns:
        model: Keras Model
    """

    # Input
    inputs = layers.Input(shape=(sequence_length, n_features))

    # Transformer Block
    x = TransformerBlock(
        embed_dim=n_features,
        num_heads=transformer_heads,
        ff_dim=transformer_ff_dim,
        dropout_rate=0.1
    )(inputs)

    # Bidirectional LSTM
    x = layers.Bidirectional(
        layers.LSTM(lstm_units, return_sequences=True)
    )(x)
    x = layers.Dropout(dropout_rate)(x)

    # Attention mechanism
    attention = layers.MultiHeadAttention(
        num_heads=4,
        key_dim=lstm_units*2
    )(x, x)
    x = layers.Add()([x, attention])
    x = layers.LayerNormalization()(x)

    # Global pooling
    x = layers.GlobalAveragePooling1D()(x)

    # Dense layers
    x = layers.Dense(128, activation='relu')(x)
    x = layers.Dropout(dropout_rate)(x)
    x = layers.Dense(64, activation='relu')(x)
    x = layers.Dropout(dropout_rate)(x)

    # Output layer
    outputs = layers.Dense(3, activation='softmax', name='direction')(x)

    # Confidence output (auxiliary)
    confidence = layers.Dense(1, activation='sigmoid', name='confidence')(x)

    # Model
    model = keras.Model(
        inputs=inputs,
        outputs={'direction': outputs, 'confidence': confidence}
    )

    return model

# Example usage
model = build_hybrid_direction_model()
model.summary()
```

#### Даалгавар 2.2: Training Pipeline бүтээх (3 өдөр)

```bash
Ажил:
- Data preprocessing pipeline
- Custom data generator
- Multi-output loss function
- Custom callbacks (EarlyStopping, ReduceLR, ModelCheckpoint)
- TensorBoard logging

Code файл:
- ml_models/training_pipeline.py
```

#### Даалгавар 2.3: Cross-validation стратеги (2 өдөр)

```bash
Ажил:
- Time-series cross-validation
- Walk-forward validation
- Purging & embargo
- Validation metrics тодорхойлох

Стратеги:
- 70% train, 15% validation, 15% test
- Walk-forward: 5-fold expanding window

Code файл:
- ml_models/cross_validation.py
```

---

### ✅ ДОЛОО ХОНОГ 3: Model Training & Tuning

**Огноо:** 2025-11-26 → 2025-12-02

#### Даалгавар 3.1: Baseline модель сургах (2 өдөр)

```bash
Ажил:
- Энгийн hyperparameters-аар эхний модель сургах
- Training/validation accuracy хянах
- Overfitting шалгах
- Confusion matrix, classification report

Target:
- Validation accuracy: 70%+
- Balanced classes

Code:
- ml_models/train_baseline.py
```

#### Даалгавар 3.2: Hyperparameter Tuning with Optuna (3 өдөр)

```bash
Ажил:
- Optuna-аар hyperparameter optimization
- Search space тодорхойлох
- 50-100 trials ажиллуулах
- Best model сонгох

Hyperparameters:
- Learning rate: [1e-5, 1e-2]
- LSTM units: [128, 256, 512]
- Transformer heads: [2, 4, 8]
- Dropout: [0.2, 0.3, 0.4, 0.5]
- Batch size: [32, 64, 128]

Code:
- ml_models/hyperparameter_tuning.py
```

**Optuna code:**

```python
# ml_models/hyperparameter_tuning.py
import optuna
from optuna.integration import TFKerasPruningCallback

def objective(trial):
    # Hyperparameters
    learning_rate = trial.suggest_loguniform('learning_rate', 1e-5, 1e-2)
    lstm_units = trial.suggest_categorical('lstm_units', [128, 256, 512])
    transformer_heads = trial.suggest_categorical('transformer_heads', [2, 4, 8])
    dropout_rate = trial.suggest_uniform('dropout_rate', 0.2, 0.5)
    batch_size = trial.suggest_categorical('batch_size', [32, 64, 128])

    # Build model
    model = build_hybrid_direction_model(
        lstm_units=lstm_units,
        transformer_heads=transformer_heads,
        dropout_rate=dropout_rate
    )

    # Compile
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=learning_rate),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    # Train
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=50,
        batch_size=batch_size,
        callbacks=[
            TFKerasPruningCallback(trial, 'val_accuracy'),
            keras.callbacks.EarlyStopping(patience=10)
        ],
        verbose=0
    )

    # Return best validation accuracy
    return max(history.history['val_accuracy'])

# Run optimization
study = optuna.create_study(direction='maximize')
study.optimize(objective, n_trials=100, timeout=86400)  # 24 hours

print("Best hyperparameters:", study.best_params)
print("Best validation accuracy:", study.best_value)
```

#### Даалгавар 3.3: Best модель дахин сургах (2 өдөр)

```bash
Ажил:
- Best hyperparameters ашиглаж дахин сургах
- Full training data (train+val) ашиглах
- Final test set дээр үнэлэх
- Model хадгалах

Target:
- Test accuracy: 85%+
- Balanced precision/recall

Output:
- models/hybrid_direction_predictor_best.keras
- models/hybrid_direction_scaler.pkl
- models/hybrid_direction_metadata.json
```

---

### ✅ ДОЛОО ХОНОГ 4: Model Evaluation & Analysis

**Огноо:** 2025-12-03 → 2025-12-09

#### Даалгавар 4.1: Comprehensive evaluation (3 өдөр)

```bash
Ажил:
- Per-currency accuracy
- Per-timeframe performance analysis
- Confidence calibration
- Error analysis
- Confusion matrix visualization

Metrics:
- Accuracy, Precision, Recall, F1
- ROC-AUC, PR-AUC
- Sharpe ratio (if applicable)
- Win rate per confidence threshold

Code:
- ml_models/model_evaluation.py
```

#### Даалгавар 4.2: Backtesting simulation (2 өдөр)

```bash
Ажил:
- Direction-only backtesting
- Simple trading strategy (follow predictions)
- P&L calculation
- Drawdown analysis

Strategy:
- BUY if prediction=UP & confidence>0.7
- SELL if prediction=DOWN & confidence>0.7
- Exit after 60 minutes

Code:
- ml_models/direction_backtest.py
```

#### Даалгавар 4.3: Documentation & Cleanup (2 өдөр)

```bash
Ажил:
- Model architecture documentation
- Training процесс тайлбарлах
- Best practices бичих
- Code refactoring

Output:
- docs/MODEL1_DIRECTION_PREDICTOR.md
```

---

## 🗓️ САР 2: Price Target Predictor (Долоо хоног 5-8)

**Зорилго:** Entry, Take Profit, Stop Loss таамаглах regression модель

---

### ✅ ДОЛОО ХОНОГ 5: Architecture & Data Preparation

**Огноо:** 2025-12-10 → 2025-12-16

#### Даалгавар 5.1: Target generation (3 өдөр)

```bash
Ажил:
- Optimal entry point тодорхойлох
- TP/SL calculation strategy
- ATR-based dynamic levels
- Risk/Reward ratio optimization

Strategies:
1. Fixed TP/SL (50 pips TP, 30 pips SL)
2. ATR-based (2x ATR TP, 1x ATR SL)
3. Support/Resistance based
4. Fibonacci retracement

Output:
- Entry_price, TP_price, SL_price labels
```

**Target generation code:**

```python
def generate_price_targets(df, direction_predictions, atr_multiplier_tp=2.0, atr_multiplier_sl=1.0):
    """
    Generate Entry, TP, SL targets based on direction & ATR
    """
    targets = []

    for i in range(len(direction_predictions)):
        direction = direction_predictions[i]  # 'UP' or 'DOWN'
        confidence = direction_confidences[i]

        current_price = df.iloc[i]['close']
        atr = df.iloc[i]['atr_14']

        if direction == 'UP':
            entry = current_price
            tp = entry + (atr * atr_multiplier_tp)
            sl = entry - (atr * atr_multiplier_sl)
        elif direction == 'DOWN':
            entry = current_price
            tp = entry - (atr * atr_multiplier_tp)
            sl = entry + (atr * atr_multiplier_sl)
        else:  # NEUTRAL
            entry = current_price
            tp = current_price
            sl = current_price

        targets.append({
            'entry': entry,
            'tp': tp,
            'sl': sl,
            'direction': direction,
            'confidence': confidence
        })

    return targets
```

#### Даалгавар 5.2: Model architecture (2 өдөр)

```bash
Architecture:
Input: [Direction prediction, Confidence, Features]
       ↓
LSTM(128) → LSTM(64)
       ↓
Dense(64, relu) → Dropout(0.3)
       ↓
3 Outputs: [Entry, TP, SL] (regression)

Code:
- ml_models/price_target_model.py
```

#### Даалгавар 5.3: Training pipeline (2 өдөр)

```bash
Ажил:
- Multi-output regression loss
- Custom metrics (MAE, MAPE for each output)
- Training pipeline бүтээх

Code:
- ml_models/train_price_target.py
```

---

### ✅ ДОЛОО ХОНОГ 6: Training & Tuning

**Огноо:** 2025-12-17 → 2025-12-23

_(3 өдөр baseline, 3 өдөр tuning, 1 өдөр evaluation)_

---

### ✅ ДОЛОО ХОНОГ 7: Integration Testing

**Огноо:** 2025-12-24 → 2025-12-30

```bash
Ажил:
- Model 1 + Model 2 pipeline
- End-to-end testing
- Combined backtesting
- Performance analysis
```

---

### ✅ ДОЛОО ХОНОГ 8: Optimization & Documentation

**Огноо:** 2025-12-31 → 2026-01-06

---

## 🗓️ САР 3: RL Agent Training (Долоо хоног 9-12)

**Зорилго:** Автомат арилжааны шийдвэр гаргах agent

---

### ✅ ДОЛОО ХОНОГ 9: Trading Environment

**Огноо:** 2026-01-07 → 2026-01-13

#### Даалгавар 9.1: Gym environment (4 өдөр)

```python
# ml_models/trading_environment.py
import gym
from gym import spaces

class ForexTradingEnv(gym.Env):
    """
    Reinforcement Learning Trading Environment
    """
    def __init__(self, df, model1, model2, initial_balance=10000):
        super().__init__()

        self.df = df
        self.model1 = model1  # Direction predictor
        self.model2 = model2  # Price target predictor
        self.initial_balance = initial_balance

        # Actions: [HOLD, BUY, SELL, CLOSE]
        self.action_space = spaces.Discrete(4)

        # Observations: [market features, predictions, position info]
        self.observation_space = spaces.Box(
            low=-np.inf,
            high=np.inf,
            shape=(50,),  # State vector
            dtype=np.float32
        )

        self.reset()

    def reset(self):
        self.current_step = 60
        self.balance = self.initial_balance
        self.position = None
        self.entry_price = 0
        self.tp_price = 0
        self.sl_price = 0
        self.trades = []

        return self._get_state()

    def _get_state(self):
        """Construct state vector"""
        # Market features
        market_features = self.df.iloc[self.current_step][self.feature_columns].values

        # Model predictions
        sequence = self.df.iloc[self.current_step-60:self.current_step][self.feature_columns].values
        direction_pred = self.model1.predict(sequence[np.newaxis, ...])[0]
        price_targets = self.model2.predict(sequence[np.newaxis, ...])[0]

        # Position info
        position_features = [
            1 if self.position == 'LONG' else 0,
            1 if self.position == 'SHORT' else 0,
            self.balance / self.initial_balance,
            self.entry_price,
            self.tp_price,
            self.sl_price
        ]

        state = np.concatenate([
            market_features[-10:],  # Last 10 features
            direction_pred,
            price_targets,
            position_features
        ])

        return state

    def step(self, action):
        current_price = self.df.iloc[self.current_step]['close']
        reward = 0
        done = False

        # Execute action
        # ... (implementation similar to previous example)

        self.current_step += 1

        if self.current_step >= len(self.df) - 1:
            done = True

        return self._get_state(), reward, done, {}
```

#### Даалгавар 9.2: Reward function design (2 өдөр)

```python
def calculate_reward(self, action, pnl):
    """
    Sophisticated reward function
    """
    reward = 0

    # P&L reward
    reward += pnl / 100  # Scale by 100

    # Risk-adjusted reward (Sharpe ratio component)
    if len(self.trades) > 10:
        returns = [t['pnl'] for t in self.trades[-10:]]
        sharpe = np.mean(returns) / (np.std(returns) + 1e-6)
        reward += sharpe * 0.1

    # Win rate bonus
    if len(self.trades) > 0:
        win_rate = len([t for t in self.trades if t['pnl'] > 0]) / len(self.trades)
        if win_rate > 0.6:
            reward += 0.5

    # Drawdown penalty
    peak = max([t['balance'] for t in self.equity_curve])
    drawdown = (peak - self.balance) / peak
    if drawdown > 0.2:  # 20% drawdown
        reward -= 1.0

    return reward
```

---

### ✅ ДОЛОО ХОНОГ 10-11: PPO Agent Training

**Огноо:** 2026-01-14 → 2026-01-27

```bash
Ажил:
- PPO agent сургалт (stable-baselines3)
- Hyperparameter tuning
- Multiple episodes
- Performance tracking

Training:
- 1M+ timesteps
- 2 долоо хоног
```

---

### ✅ ДОЛОО ХОНОГ 12: RL Evaluation

**Огноо:** 2026-01-28 → 2026-02-03

```bash
Ажил:
- Backtesting on test set
- Performance metrics
- Comparison with baseline strategies
```

---

## 🗓️ САР 4: Integration & Production (Долоо хоног 13-16)

---

### ✅ ДОЛОО ХОНОГ 13-14: Full System Integration

**Огноо:** 2026-02-04 → 2026-02-17

```bash
Ажил:
- 3 модель нэгтгэх
- Backend API integration
- Mobile app updates
- Real-time prediction pipeline
```

---

### ✅ ДОЛОО ХОНОГ 15: Paper Trading

**Огноо:** 2026-02-18 → 2026-02-24

```bash
Ажил:
- Paper trading system
- Live market testing (no real money)
- Performance monitoring
- Bug fixing
```

---

### ✅ ДОЛОО ХОНОГ 16: Production Deployment

**Огноо:** 2026-02-25 → 2026-03-03

```bash
Ажил:
- Production deployment
- Monitoring setup
- Documentation
- User training
```

---

## 📊 Хүлээгдэж буй үр дүн

### Сар 1 дуусахад:

- ✅ Universal Direction Predictor (85%+ accuracy)
- ✅ 45+ features
- ✅ Comprehensive evaluation

### Сар 2 дуусахад:

- ✅ Price Target Predictor (MAE <10 pips)
- ✅ Model 1 + Model 2 pipeline
- ✅ Combined backtesting

### Сар 3 дуусахад:

- ✅ RL Agent (60%+ win rate)
- ✅ Full hybrid system
- ✅ Advanced backtesting

### Сар 4 дуусахад:

- ✅ Production-ready system
- ✅ Real-time trading capability
- ✅ Monitoring & maintenance

---

## 🎯 Success Metrics

| Metric             | Target   | Measurement      |
| ------------------ | -------- | ---------------- |
| Direction Accuracy | 85%+     | Model 1 test set |
| Price Target MAE   | <10 pips | Model 2 test set |
| RL Win Rate        | 60%+     | Backtesting      |
| Sharpe Ratio       | 1.5+     | RL agent         |
| Max Drawdown       | <15%     | RL agent         |
| Profit Factor      | 1.8+     | RL agent         |

---

## 🛠️ Tools & Libraries

```bash
# Core ML
tensorflow>=2.15.0
keras>=3.0.0
stable-baselines3
gym
optuna

# Data
pandas
numpy
talib
scikit-learn

# Visualization
matplotlib
seaborn
plotly

# Backend
flask
pymongo

# Monitoring
tensorboard
mlflow
```

---

## 📝 Deliverables

### Code:

- `ml_models/hybrid_direction_model.py`
- `ml_models/price_target_model.py`
- `ml_models/trading_environment.py`
- `ml_models/rl_agent.py`
- `ml_models/training_pipeline.py`

### Models:

- `models/hybrid_direction_predictor_best.keras`
- `models/price_target_predictor_best.keras`
- `models/rl_agent_ppo.zip`

### Documentation:

- `docs/MODEL1_DIRECTION_PREDICTOR.md`
- `docs/MODEL2_PRICE_TARGET.md`
- `docs/MODEL3_RL_AGENT.md`
- `docs/HYBRID_SYSTEM_GUIDE.md`

---

## ⚠️ Risks & Mitigation

| Risk                | Impact | Mitigation                                     |
| ------------------- | ------ | ---------------------------------------------- |
| Insufficient data   | High   | Extend data collection period                  |
| Overfitting         | High   | Robust cross-validation, regularization        |
| Slow training       | Medium | Use GPU, optimize code                         |
| Poor RL convergence | High   | Tune reward function, try different algorithms |
| Production bugs     | Medium | Extensive testing, paper trading               |

---

## 🎓 Learning Resources

**Week 1-4:**

- TensorFlow documentation
- Transformer papers

**Week 5-8:**

- Multi-output regression techniques
- ATR-based trading strategies

**Week 9-12:**

- "Reinforcement Learning" by Sutton & Barto
- Stable-Baselines3 documentation

**Week 13-16:**

- Production ML deployment
- MLOps best practices

---

**Төлөвлөгөөг баталсан:** 2025-11-12  
**Дуусах хугацаа:** 2026-03-12  
**Статус:** Эхлэхэд бэлэн ✅

**Амжилт хүсье! 🚀**
