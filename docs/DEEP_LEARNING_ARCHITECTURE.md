# 🚀 Deep Learning Prediction System - Architecture Document

**Project:** Forex Signal App - Multi-Horizon Price Prediction  
**Version:** 1.1.1
**Date:** October 22, 2025  
**Author:** AI Development Team

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Design](#architecture-design)
3. [Model Architecture](#model-architecture)
4. [Data Pipeline](#data-pipeline)
5. [Training Strategy](#training-strategy)
6. [Live Prediction System](#live-prediction-system)
7. [Performance Metrics](#performance-metrics)
8. [Deployment Plan](#deployment-plan)

---

## 1. System Overview

### 1.1 Objectives

Forex арилжааны богино хугацааны чиглэлийг **өндөр нарийвчлалтай** таамаглах систем:

- ✅ **15-минутын** prediction (scalping strategy)
- ✅ **30-минутын** prediction (swing trading)
- ✅ **60-минутын** prediction (trend following)

### 1.2 Success Criteria

| Metric            | Target | Method                           |
| ----------------- | ------ | -------------------------------- |
| **Accuracy**      | 85-92% | With confidence filtering (>85%) |
| **Daily Signals** | 15-25  | High quality only                |
| **Win Rate**      | 80-88% | Actual profitable trades         |
| **Latency**       | <200ms | Real-time prediction             |
| **Uptime**        | 99.5%  | 24/5 operation                   |

### 1.3 Technology Stack

```
Frontend:  React Native + Expo
Backend:   Flask + Python 3.11
ML:        TensorFlow 2.15 + Keras
Data:      MongoDB + MT5 API
Deployment: Docker + AWS/Azure
```

---

## 2. Architecture Design

### 2.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    USER MOBILE APP                           │
│  - Real-time signal notifications                           │
│  - Multi-timeframe predictions                              │
│  - Trade entry/exit recommendations                         │
└─────────────────────────────────────────────────────────────┘
                            ↕ REST API
┌─────────────────────────────────────────────────────────────┐
│                   FLASK API SERVER                           │
│  - /api/predictions/live  (GET)                             │
│  - /api/predictions/history (GET)                           │
│  - /api/model/retrain (POST)                                │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│               PREDICTION ENGINE (Core)                       │
│                                                             │
│  ┌────────────────┬──────────────────┬─────────────────┐   │
│  │ 15-min Model   │ 30-min Model     │ 60-min Model    │   │
│  │ Transformer+   │ Bi-LSTM+         │ CNN-LSTM        │   │
│  │ LSTM           │ Attention        │ Hybrid          │   │
│  └────────────────┴──────────────────┴─────────────────┘   │
│                            ↓                                │
│                    Meta-Learner (XGBoost)                   │
│                            ↓                                │
│                  Confidence Filter (>85%)                   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                  DATA SOURCES                                │
│  - MetaTrader 5 API (Live data)                            │
│  - Historical Database (MongoDB)                            │
│  - Feature Store (Redis cache)                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Model Architecture

### 3.1 Transformer + LSTM Hybrid Model

**15-минутын модел архитектур:**

```python
Input: (batch_size, 60 timesteps, 100 features)
    ↓
┌─────────────────────────────────────────┐
│ TRANSFORMER BRANCH                       │
│  - Multi-Head Attention (8 heads)       │
│  - Key dimension: 64                    │
│  - Feed-forward: 256 units              │
│  - Output: Global patterns              │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ LSTM BRANCH                              │
│  - Bi-LSTM Layer 1: 128 units           │
│  - Bi-LSTM Layer 2: 64 units            │
│  - Output: Sequential patterns          │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ CONCATENATION                            │
│  - Combine both branches                │
│  - Dense: 128 units (ReLU)              │
│  - BatchNorm + Dropout (0.3)            │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ OUTPUT HEADS                             │
│  - Direction: 3 classes (Softmax)       │
│    [SELL, NEUTRAL, BUY]                 │
│  - Confidence: 1 unit (Sigmoid)         │
│    [0.0 - 1.0]                          │
└─────────────────────────────────────────┘

Total Parameters: ~2.5M
Training Time: 4-6 hours (GPU)
Inference Time: 50-80ms
```

### 3.2 Model Specifications

| Component       | 15-min Model     | 30-min Model      | 60-min Model |
| --------------- | ---------------- | ----------------- | ------------ |
| Architecture    | Transformer+LSTM | Bi-LSTM+Attention | CNN-LSTM     |
| Sequence Length | 60               | 100               | 120          |
| Features        | 100              | 80                | 60           |
| Hidden Units    | 128/64           | 256/128           | 128/64       |
| Dropout         | 0.3              | 0.2               | 0.25         |
| Training Data   | 3M samples       | 2M samples        | 1.5M samples |
| Target Accuracy | 88-92%           | 85-89%            | 82-86%       |

---

## 4. Data Pipeline

### 4.1 Feature Engineering

**100+ Technical Features:**

```
1. PRICE FEATURES (10)
   - Open, High, Low, Close
   - Returns (1, 5, 10, 15 periods)
   - Log returns
   - Price volatility

2. MOVING AVERAGES (15)
   - SMA: 5, 10, 20, 50, 100, 200
   - EMA: 9, 12, 26, 50
   - WMA: 10, 20
   - VWAP
   - MA crosses (5/20, 20/50, 50/200)

3. MOMENTUM INDICATORS (12)
   - RSI (9, 14, 21)
   - Stochastic (K, D)
   - ROC (10, 20)
   - Williams %R
   - CCI (Commodity Channel Index)
   - MFI (Money Flow Index)
   - Ultimate Oscillator

4. TREND INDICATORS (10)
   - MACD (line, signal, histogram)
   - ADX + DI+/DI-
   - Aroon (up, down)
   - Parabolic SAR
   - Ichimoku Cloud components

5. VOLATILITY INDICATORS (8)
   - Bollinger Bands (upper, lower, width, %B)
   - ATR (14, 50)
   - Standard Deviation (20, 50)
   - Keltner Channels

6. VOLUME INDICATORS (8)
   - Volume
   - Volume MA (20)
   - Volume ratio
   - OBV (On Balance Volume)
   - VWAP
   - Volume Price Trend
   - Ease of Movement
   - Chaikin Money Flow

7. CANDLESTICK PATTERNS (15)
   - Doji, Hammer, Shooting Star
   - Engulfing (bullish/bearish)
   - Morning/Evening Star
   - Three White Soldiers/Black Crows
   - Harami, Piercing, Dark Cloud
   - Spinning Top, Marubozu

8. MARKET MICROSTRUCTURE (10)
   - Bid-Ask Spread
   - Order Flow Imbalance
   - Trade Aggressiveness
   - Quote Imbalance
   - Tick direction

9. MULTI-TIMEFRAME (12)
   - Higher timeframe trend (5m, 15m, 1h)
   - MTF RSI alignment
   - MTF MACD alignment
   - Volume profile

10. TIME-BASED FEATURES (8)
    - Hour of day
    - Day of week
    - Session (Asian/London/NY)
    - Time to major news
```

### 4.2 Data Preprocessing

```python
# Sequence creation
def create_sequences(data, lookback=60):
    X, y = [], []
    for i in range(lookback, len(data)):
        X.append(data[i-lookback:i])
        y.append(data[i])
    return np.array(X), np.array(y)

# Normalization strategy
- RobustScaler for price-based features
- MinMaxScaler for bounded indicators (RSI, Stochastic)
- StandardScaler for unbounded features
- Binary encoding for categorical features
```

### 4.3 Label Creation Strategy

**3-Class Classification:**

```python
def create_labels(df, horizon=15, threshold=0.05):
    """
    Args:
        horizon: minutes ahead to predict
        threshold: percentage change threshold

    Returns:
        labels: 0=SELL, 1=NEUTRAL, 2=BUY
    """
    future_price = df['close'].shift(-horizon)
    price_change = (future_price - df['close']) / df['close'] * 100

    labels = np.where(
        price_change > threshold, 2,    # BUY
        np.where(
            price_change < -threshold, 0,  # SELL
            1                               # NEUTRAL
        )
    )

    return labels

# Threshold tuning:
# - 15-min: 0.05% (5 pips on EURUSD)
# - 30-min: 0.08% (8 pips)
# - 60-min: 0.12% (12 pips)
```

---

## 5. Training Strategy

### 5.1 Data Split

```
Timeline-based split (NO random shuffle):

├── Training Set: 2020-01-01 to 2022-12-31 (70%)
│   - 3+ million samples
│   - Multiple market conditions
│
├── Validation Set: 2023-01-01 to 2023-06-30 (15%)
│   - 600k samples
│   - Used for hyperparameter tuning
│
└── Test Set: 2023-07-01 to 2024-10-22 (15%)
    - 600k samples
    - Completely unseen data
    - Final performance evaluation
```

### 5.2 Training Configuration

```python
TRAINING_CONFIG = {
    # Model parameters
    'sequence_length': 60,
    'batch_size': 128,
    'epochs': 100,
    'learning_rate': 0.0001,

    # Optimizer
    'optimizer': 'Adam',
    'beta_1': 0.9,
    'beta_2': 0.999,

    # Loss functions
    'direction_loss': 'categorical_crossentropy',
    'confidence_loss': 'mse',
    'loss_weights': {'direction': 1.0, 'confidence': 0.5},

    # Regularization
    'dropout_rate': 0.3,
    'l2_regularization': 0.0001,

    # Callbacks
    'early_stopping_patience': 10,
    'reduce_lr_patience': 5,
    'reduce_lr_factor': 0.5,
    'min_learning_rate': 1e-7,

    # Data augmentation
    'add_noise': True,
    'noise_std': 0.001,
    'time_shift': True,
    'shift_range': 5,
}
```

### 5.3 Cross-Validation Strategy

```python
# Walk-Forward Validation
for year in [2020, 2021, 2022, 2023]:
    train_window = data[year-2:year]
    test_window = data[year:year+1]

    model.fit(train_window)
    metrics = model.evaluate(test_window)

    if metrics['accuracy'] < 0.75:
        retrain_with_more_data()
```

---

## 6. Live Prediction System

### 6.1 Real-Time Pipeline

```
┌─────────────────────────────────────────┐
│ Step 1: Data Ingestion (50ms)          │
│  - MT5 API call                         │
│  - Get last 200 candles                 │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│ Step 2: Feature Calculation (80ms)     │
│  - 100+ technical indicators            │
│  - Redis cache for optimization         │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│ Step 3: Model Inference (50ms)         │
│  - TensorFlow Lite (quantized)          │
│  - Parallel execution (3 models)        │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│ Step 4: Ensemble Voting (20ms)         │
│  - Weighted average                     │
│  - Confidence calculation               │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│ Step 5: Quality Filter (10ms)          │
│  - Confidence > 85%                     │
│  - Multi-timeframe alignment            │
│  - News calendar check                  │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│ Step 6: Signal Output (10ms)           │
│  - Format for mobile app                │
│  - Entry/Target/SL calculation          │
│  - Push notification                    │
└─────────────────────────────────────────┘

Total Latency: ~220ms
Target: <200ms (optimization needed)
```

### 6.2 Confidence Scoring System

```python
def calculate_final_confidence(predictions, market_state):
    """
    Multi-factor confidence scoring
    """
    # Base confidence from models
    model_conf = np.mean([
        predictions['15min']['confidence'],
        predictions['30min']['confidence'],
        predictions['60min']['confidence']
    ])

    # Adjustment factors
    factors = {
        'multi_timeframe_alignment': 0.0,  # +10% if all agree
        'volatility_regime': 0.0,           # +5% in favorable volatility
        'spread_quality': 0.0,              # -5% if spread > 2 pips
        'news_proximity': 0.0,              # -15% if news in 30min
        'session_activity': 0.0,            # +5% in active session
    }

    # Check alignment
    if all_models_agree(predictions):
        factors['multi_timeframe_alignment'] = 0.10

    # Check volatility
    if is_favorable_volatility(market_state):
        factors['volatility_regime'] = 0.05

    # Check spread
    if market_state['spread'] > 2.0:
        factors['spread_quality'] = -0.05

    # Check news
    if upcoming_news_in_30min():
        factors['news_proximity'] = -0.15

    # Check session
    if is_active_session():
        factors['session_activity'] = 0.05

    # Final confidence
    final_conf = model_conf + sum(factors.values())

    return max(0.0, min(1.0, final_conf))
```

---

## 7. Performance Metrics

### 7.1 Model Evaluation Metrics

```python
METRICS = {
    # Classification metrics
    'accuracy': accuracy_score,
    'precision': precision_score,
    'recall': recall_score,
    'f1_score': f1_score,
    'confusion_matrix': confusion_matrix,

    # Directional accuracy (ignore NEUTRAL)
    'directional_accuracy': directional_accuracy,

    # Trading metrics
    'win_rate': calculate_win_rate,
    'profit_factor': calculate_profit_factor,
    'sharpe_ratio': calculate_sharpe_ratio,
    'max_drawdown': calculate_max_drawdown,
    'average_profit_per_trade': calculate_avg_profit,

    # Confidence calibration
    'brier_score': brier_score_loss,
    'calibration_curve': calibration_curve,
}
```

### 7.2 Expected Performance

| Metric                            | 15-min     | 30-min     | 60-min     |
| --------------------------------- | ---------- | ---------- | ---------- |
| **Raw Accuracy**                  | 75-80%     | 72-78%     | 68-75%     |
| **Filtered Accuracy (>85% conf)** | 88-92%     | 85-89%     | 82-86%     |
| **Daily Signals (filtered)**      | 8-12       | 5-8        | 3-5        |
| **Win Rate**                      | 85-90%     | 82-87%     | 78-85%     |
| **Avg Profit/Trade**              | 10-15 pips | 15-25 pips | 25-40 pips |
| **Sharpe Ratio**                  | 2.0-2.5    | 1.8-2.3    | 1.5-2.0    |
| **Max Drawdown**                  | <10%       | <12%       | <15%       |

---

## 8. Deployment Plan

### 8.1 Phase 1: Development (Week 1-2)

```
Day 1-2:  Data preparation & feature engineering
Day 3-5:  Model architecture implementation
Day 6-8:  Training & hyperparameter tuning
Day 9-10: Backtesting & validation
Day 11-12: Integration testing
Day 13-14: Bug fixes & optimization
```

### 8.2 Phase 2: Testing (Week 3)

```
Day 15-17: Paper trading (simulated)
Day 18-19: Performance monitoring
Day 20-21: Model refinement based on results
```

### 8.3 Phase 3: Production (Week 4+)

```
Day 22-23: Production deployment
Day 24-25: Live monitoring
Day 26+:   Continuous improvement
```

### 8.4 Monitoring & Maintenance

```python
MONITORING_SCHEDULE = {
    'real_time': [
        'prediction_latency',
        'api_response_time',
        'error_rate',
    ],

    'daily': [
        'prediction_accuracy',
        'signal_count',
        'win_rate',
        'profit/loss',
    ],

    'weekly': [
        'model_drift_detection',
        'feature_importance_shift',
        'data_quality_check',
    ],

    'monthly': [
        'full_model_retraining',
        'hyperparameter_optimization',
        'architecture_review',
    ]
}
```

---

## 9. Risk Management

### 9.1 Model Risks

```
1. Overfitting
   - Mitigation: Cross-validation, dropout, regularization

2. Market Regime Change
   - Mitigation: Monthly retraining, regime detection

3. Data Quality Issues
   - Mitigation: Automated validation, outlier detection

4. Latency Spikes
   - Mitigation: Caching, model optimization, fallback mechanisms
```

### 9.2 Trading Risks

```
1. High Volatility Events
   - Mitigation: Disable during news, volatility filters

2. Spread Widening
   - Mitigation: Spread monitoring, signal rejection

3. Slippage
   - Mitigation: Realistic backtesting, market orders
```

---

## 10. Future Improvements

### 10.1 Short-term (1-3 months)

- ✅ Add sentiment analysis from news
- ✅ Implement reinforcement learning
- ✅ Multi-currency correlation
- ✅ Auto-retraining pipeline

### 10.2 Long-term (3-6 months)

- ✅ Real-time order book analysis
- ✅ Advanced NLP for fundamental analysis
- ✅ Quantum computing exploration
- ✅ Multi-asset predictions (crypto, stocks)

---

## 11. References

```
Papers:
1. "Attention Is All You Need" (Vaswani et al., 2017)
2. "Deep Learning for Financial Time Series" (Zhang et al., 2020)
3. "Transformer-Based Deep Learning Models for Forex Forecasting" (2023)

Libraries:
- TensorFlow 2.15
- Keras
- scikit-learn
- pandas
- numpy
- MetaTrader5

Resources:
- Kaggle Forex Datasets
- Institutional Trading Strategies
- Quantitative Finance Papers
```

---

**Document Version:** 1.0.0  
**Last Updated:** October 22, 2025  
**Status:** Ready for Implementation ✅
