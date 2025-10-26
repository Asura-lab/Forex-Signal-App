# 🏗️ Deep Learning Architectures

Энэ project нь **3 өөр deep learning архитектур** ашиглан Forex зах зээлийн prediction хийнэ.

## 📊 Архитектурын хураангуй

```
┌─────────────────────────────────────────────────┐
│  PARALLEL PREDICTION MODELS:                    │
│                                                 │
│  ┌────────────────┬───────────────────────┐    │
│  │ 15-min Model   │ Transformer + LSTM    │    │
│  │ Expected: 88%  │ Focus: Quick scalping │    │
│  └────────────────┴───────────────────────┘    │
│                                                 │
│  ┌────────────────┬───────────────────────┐    │
│  │ 30-min Model   │ Bi-LSTM + Attention   │    │
│  │ Expected: 85%  │ Focus: Swing trades   │    │
│  └────────────────┴───────────────────────┘    │
│                                                 │
│  ┌────────────────┬───────────────────────┐    │
│  │ 60-min Model   │ CNN-LSTM Hybrid       │    │
│  │ Expected: 82%  │ Focus: Trend following│    │
│  └────────────────┴───────────────────────┘    │
└─────────────────────────────────────────────────┘
```

---

## 1️⃣ Transformer + LSTM (15-минут)

### 🎯 Зорилго

**Scalping strategy** - богино хугацааны хурдан арилжаа

### 🏗️ Архитектур

```
INPUT (60 steps, n_features)
    ↓
┌─────────────────────────┐
│ Multi-Head Attention    │
│ • 8 attention heads     │
│ • Pattern recognition   │
│ • Parallel processing   │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│ Feed-Forward Network    │
│ • 256 units             │
│ • ReLU activation       │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│ LSTM Layer 1            │
│ • 128 units             │
│ • Temporal dependency   │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│ LSTM Layer 2            │
│ • 64 units              │
│ • Sequential patterns   │
└─────────────────────────┘
    ↓
OUTPUT: Direction (3 classes) + Confidence
```

### ✨ Онцлог

- **Multi-head attention**: 8 өөр attention head нь өөр өөр pattern-үүдийг олно
- **Transformer block**: Parallel processing, long-range dependencies
- **LSTM layers**: Sequential temporal modeling
- **Batch normalization**: Stable training
- **Dropout**: Overfitting prevention (30%)

### 📈 Performance Target

- **Accuracy**: 88%+
- **Sequence length**: 60 steps (15 minutes)
- **Parameters**: ~500K
- **Best for**: 15-min to 30-min scalping

### 💡 Яагаад энэ архитектурыг сонгосон?

15-минут timeframe нь **хурдан өөрчлөлт** бүхий зах зээл. Transformer-ийн attention mechanism нь:

- Богино хугацааны pattern-үүдийг илрүүлнэ
- Market regime shifts-ийг хурдан ойлгоно
- Multiple timeframe relationships-ийг capture хийнэ

---

## 2️⃣ Bi-LSTM + Attention (30-минут)

### 🎯 Зорилго

**Swing trading strategy** - дунд хугацааны trend дагасан арилжаа

### 🏗️ Архитектур

```
INPUT (48 steps, n_features)
    ↓
┌─────────────────────────┐
│ Bidirectional LSTM 1    │
│ • Forward: 128 units    │
│ • Backward: 128 units   │
│ • Total: 256 context    │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│ Batch Normalization     │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│ Bidirectional LSTM 2    │
│ • Forward: 64 units     │
│ • Backward: 64 units    │
│ • Total: 128 context    │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│ Custom Attention Layer  │
│ • 128 attention units   │
│ • Learnable weights     │
│ • Context vector        │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│ Dense Layers            │
│ • 128 → 64 units        │
│ • ReLU activation       │
└─────────────────────────┘
    ↓
OUTPUT: Direction (3 classes) + Confidence
```

### ✨ Онцлог

- **Bidirectional LSTM**: Өмнөх болон дараагийн context-ийг хоёуланг нь ашиглана
- **Custom attention**: Чухал time steps-үүд дээр анхаарал төвлөрүүлнэ
- **Attention weights**: Learnable parameters for importance
- **Recurrent dropout**: Temporal regularization (15%)

### 📈 Performance Target

- **Accuracy**: 85%+
- **Sequence length**: 48 steps (30 minutes)
- **Parameters**: ~400K
- **Best for**: 30-min to 2-hour swing trades

### 💡 Яагаад энэ архитектурыг сонгосон?

30-минут timeframe нь **trend formation** үзүүлнэ. Bi-LSTM + Attention:

- Өмнөх болон дараагийн context-ийг хослуулна
- Support/resistance levels-ийг илрүүлнэ
- Чухал price action moments-д focus хийнэ

---

## 3️⃣ CNN-LSTM Hybrid (60-минут)

### 🎯 Зорилго

**Trend following strategy** - урт хугацааны trend-ийн дагуу

### 🏗️ Архитектур

```
INPUT (48 steps, n_features)
    ↓
┌─────────────────────────┐
│ Conv1D Layer 1          │
│ • 64 filters            │
│ • Kernel size: 3        │
│ • Local pattern extract │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│ Conv1D Layer 2          │
│ • 128 filters           │
│ • Kernel size: 3        │
│ • Complex features      │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│ Conv1D Layer 3          │
│ • 64 filters            │
│ • Kernel size: 3        │
│ • Feature refinement    │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│ MaxPooling1D            │
│ • Pool size: 2          │
│ • Dimensionality reduce │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│ LSTM Layer 1            │
│ • 128 units             │
│ • Temporal modeling     │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│ LSTM Layer 2            │
│ • 64 units              │
│ • Sequence refinement   │
└─────────────────────────┘
    ↓
OUTPUT: Direction (3 classes) + Confidence
```

### ✨ Онцлог

- **1D Convolutions**: Price pattern-үүдийг automatic feature extraction
- **Multiple conv layers**: Hierarchical feature learning
- **Max pooling**: Dimensionality reduction, translation invariance
- **LSTM processing**: Temporal dependencies from CNN features
- **Hybrid approach**: Best of both worlds

### 📈 Performance Target

- **Accuracy**: 82%+
- **Sequence length**: 48 steps (60 minutes)
- **Parameters**: ~450K
- **Best for**: 1-hour to 4-hour trend following

### 💡 Яагаад энэ архитектурыг сонгосон?

60-минут timeframe нь **established trends** үзүүлнэ. CNN-LSTM:

- CNN нь chart patterns-ийг олно (head & shoulders, triangles)
- LSTM нь trend continuation/reversal-ийг prediction хийнэ
- Hierarchical features нь multi-scale analysis өгнө

---

## 🔄 Архитектурын харьцуулалт

| Онцлог              | Transformer+LSTM     | Bi-LSTM+Attention                | CNN-LSTM                      |
| ------------------- | -------------------- | -------------------------------- | ----------------------------- |
| **Timeframe**       | 15-min               | 30-min                           | 60-min                        |
| **Strategy**        | Scalping             | Swing Trading                    | Trend Following               |
| **Sequence Length** | 60 steps             | 48 steps                         | 48 steps                      |
| **Key Mechanism**   | Multi-head attention | Bidirectional + Custom attention | Feature extraction + temporal |
| **Parameters**      | ~500K                | ~400K                            | ~450K                         |
| **Training Speed**  | Medium               | Fast                             | Slow                          |
| **Inference Speed** | Fast                 | Very Fast                        | Medium                        |
| **Best For**        | Quick reversals      | Swing points                     | Long trends                   |
| **Target Accuracy** | 88%                  | 85%                              | 82%                           |

---

## 📊 Training Configuration

### Common Settings

```python
# Data
CURRENCY_PAIRS = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'USD_CAD', 'USD_CHF', 'XAU_USD']
FEATURES = 100+ technical indicators + pair encoding (6)

# Training
BATCH_SIZE = 64
EPOCHS = 50
OPTIMIZER = Adam
LEARNING_RATE = 0.001
DROPOUT = 0.3
```

### Per-Architecture Settings

#### 15-min (Transformer+LSTM)

```python
CONFIG_15MIN = {
    'n_heads': 8,
    'ff_dim': 256,
    'lstm_units': [128, 64],
    'sequence_length': 60
}
```

#### 30-min (Bi-LSTM+Attention)

```python
CONFIG_30MIN = {
    'lstm_units': [128, 64],
    'attention_units': 128,
    'sequence_length': 48
}
```

#### 60-min (CNN-LSTM)

```python
CONFIG_60MIN = {
    'cnn_filters': [64, 128, 64],
    'kernel_size': 3,
    'lstm_units': [128, 64],
    'sequence_length': 48
}
```

---

## 🚀 Usage

### Import Models

```python
from ml.models.transformer_lstm import build_transformer_lstm_model
from ml.models.bilstm_attention import build_bilstm_attention_model
from ml.models.cnn_lstm import build_cnn_lstm_model
```

### Build 15-min Model

```python
model_15min = build_transformer_lstm_model(
    sequence_length=60,
    n_features=106,  # 100 indicators + 6 pair encoding
    n_heads=8,
    ff_dim=256,
    lstm_units=[128, 64],
    dropout_rate=0.3,
    n_classes=3
)
```

### Build 30-min Model

```python
model_30min = build_bilstm_attention_model(
    sequence_length=48,
    n_features=106,
    lstm_units=[128, 64],
    attention_units=128,
    dropout_rate=0.3,
    n_classes=3
)
```

### Build 60-min Model

```python
model_60min = build_cnn_lstm_model(
    sequence_length=48,
    n_features=106,
    cnn_filters=[64, 128, 64],
    kernel_size=3,
    lstm_units=[128, 64],
    dropout_rate=0.3,
    n_classes=3
)
```

---

## 📈 Training Process

1. **Data Loading**: Бүх 6 валютын датаг нэгтгэнэ
2. **Resampling**: 15-min, 30-min, 60-min timeframes
3. **Feature Engineering**: 100+ technical indicators
4. **Pair Encoding**: 6 валют → one-hot features
5. **Sequence Creation**: Sliding windows
6. **Model Training**: Architecture-specific training
7. **Evaluation**: Per-pair accuracy + overall metrics

---

## 🎯 Expected Results

### Overall Accuracy

- **15-min**: 88%+ (Transformer advantage on short-term patterns)
- **30-min**: 85%+ (Attention mechanism on swing points)
- **60-min**: 82%+ (CNN's pattern recognition for trends)

### Per-Pair Performance

Expect variations across currency pairs:

- EUR/USD: Highest (most liquid, predictable)
- GBP/USD: High (volatile but trendy)
- USD/JPY: Medium-High (follows interest rates)
- USD/CAD: Medium (commodity-driven)
- USD/CHF: Medium (safe-haven effects)
- XAU/USD: Variable (gold's unique dynamics)

---

## 🔧 Hyperparameter Tuning

### Transformer+LSTM

- `n_heads`: 4, 8, 16 (8 is sweet spot)
- `ff_dim`: 128, 256, 512 (256 balanced)
- `sequence_length`: 48, 60, 72 (60 for 15-min)

### Bi-LSTM+Attention

- `lstm_units`: [64,32], [128,64], [256,128]
- `attention_units`: 64, 128, 256
- `bidirectional`: True (always for swing trading)

### CNN-LSTM

- `cnn_filters`: [32,64,32], [64,128,64], [128,256,128]
- `kernel_size`: 3, 5, 7 (3 is best for forex)
- `pool_size`: 2, 3 (2 preserves more info)

---

## 📚 References

### Papers

1. **Attention Is All You Need** (Vaswani et al., 2017) - Transformer architecture
2. **Bidirectional LSTM** (Graves & Schmidhuber, 2005) - Bi-LSTM foundations
3. **CNN for Time Series** (Wang et al., 2017) - 1D convolutions
4. **Attention Mechanisms** (Bahdanau et al., 2014) - Attention in RNNs

### Implementation

- TensorFlow/Keras: Deep learning framework
- Custom attention layer: Learnable importance weights
- Hybrid architectures: Combining strengths

---

## 🎓 Key Takeaways

1. **Different architectures for different timeframes** - No one-size-fits-all
2. **Transformer excels at pattern recognition** - Best for scalping
3. **Bi-LSTM captures bidirectional context** - Perfect for swings
4. **CNN extracts hierarchical features** - Ideal for trends
5. **Attention focuses on important moments** - Critical for all timeframes
6. **Multi-currency training** - Learns universal forex patterns
7. **Ensemble potential** - Combine all 3 for meta-predictions

---

## 🔜 Next Steps

1. ✅ Train all 3 models on combined data
2. ✅ Evaluate per-pair and overall accuracy
3. ⏳ Build meta-learner (XGBoost) on top
4. ⏳ Deploy to Flask API
5. ⏳ Integrate with mobile app
6. ⏳ Real-time prediction pipeline

---

**Created**: 2025-10-23  
**Version**: 1.0  
**Status**: Ready for training
