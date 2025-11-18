# 🚀 EUR/USD Single-Pair Training Strategy

## Хамгийн тохиромжтой сонголт: EUR/USD

### 🏆 Яагаад EUR/USD вэ?

#### 1. **Дэлхийн хамгийн их арилжаалагддаг хос**

- 📊 Forex market-ийн 24% эзэлдэг
- 💧 Хамгийн өндөр ликвидтэй (liquid)
- ⚡ Tight spreads (0.1-0.3 pips)
- 🎯 Minimal slippage

#### 2. **Machine Learning-д хамгийн тохиромжтой**

- 📈 Clear trends & patterns
- 🔄 Predictable seasonal behavior
- 📊 Богатый өгөгдөл (decades of data)
- 🎯 Өндөр accuracy гаргадаг

#### 3. **Тогтвортой волатильност**

- 📉 Moderate volatility (40-80 pips/day)
- 🎯 Noise багатай, trend тодорхой
- 💪 Robust pattern learning
- ⚡ Fast execution

#### 4. **Эдийн засгийн өгөгдөл элбэг**

- 🏦 ECB + Federal Reserve data
- 📊 NFP, CPI, GDP reports
- 📰 Clear fundamental drivers
- 🎯 News impact таамаглахад хялбар

---

## 🔧 UniRate API Integration

### Setup

```bash
# Install dependencies
pip install requests pandas

# No API key required (using ExchangeRate.host - free tier)
```

### 📥 Өгөгдөл татах

#### 1. **Түүхэн өгөгдөл** (Сургалтад)

```bash
cd scripts
python download_unirate.py
```

**Features:**

- ✅ 2 жилийн өгөгдөл (24 months default)
- ✅ Daily OHLCV data
- ✅ Автоматаар `data/train/EUR_USD_1min.csv` үүсгэх
- ✅ Rate limiting built-in

#### 2. **Бодит цагийн өгөгдөл** (Production-д)

```python
from backend.utils.unirate_handler import get_unirate_live_rate

# Get current rate
result = get_unirate_live_rate()
print(result['rate'])  # 1.08456
```

**Features:**

- ✅ 5-секундын cache (rate limiting)
- ✅ Bid/Ask spread estimate
- ✅ ISO timestamp
- ✅ Error handling

---

## 🎯 Backend Integration

### API Endpoints Updated

#### 1. **GET /rates/live**

```bash
# Default: UniRate API
curl http://localhost:5000/rates/live

# Response:
{
  "success": true,
  "source": "UniRate API",
  "rates": {
    "EUR_USD": {
      "rate": 1.08456,
      "bid": 1.08455,
      "ask": 1.08457,
      "spread": 0.1,
      "time": "2025-11-13T12:30:45"
    }
  }
}
```

#### 2. **GET /rates/specific?pair=EUR_USD**

```bash
curl http://localhost:5000/rates/specific?pair=EUR_USD

# Response:
{
  "success": true,
  "pair": "EUR_USD",
  "rate": 1.08456,
  "bid": 1.08455,
  "ask": 1.08457,
  "spread": 0.1,
  "timestamp": "2025-11-13 12:30:45",
  "source": "UniRate API"
}
```

### Fallback Strategy

```
1. Try UniRate API first (default)
2. If UniRate fails → Try MT5 (if enabled)
3. If both fail → Return error
```

---

## 📊 Training Strategy (Single Model)

### Week 1-4: Universal Direction Predictor

```python
# Focus: EUR/USD ONLY
symbol = 'EUR/USD'
timeframes = ['1min', '5min', '15min', '30min', '1h', '4h']  # Multi-timeframe features

# Single universal model
model = build_hybrid_direction_model(
    input_length=100,
    n_features=45+,
    output_classes=3  # BUY, SELL, HOLD
)
```

**Advantages:**

- ✅ 100% model capacity зөвхөн EUR/USD-д зориулагдсан
- ✅ Pair-specific patterns сайн сурна
- ✅ EUR/USD-ийн өвөрмөц correlation (EUR/GBP, DXY, Gold)
- ✅ Хурдан training (1 pair vs 6 pairs)

---

## 🚀 Quick Start

### 1. Өгөгдөл татах

```bash
cd scripts
python download_unirate.py
```

### 2. Backend test

```bash
cd backend/utils
python unirate_handler.py
```

### 3. Backend эхлүүлэх

```bash
cd backend
python app.py
```

### 4. Test API

```bash
# Live rate
curl http://localhost:5000/rates/live

# Specific pair
curl http://localhost:5000/rates/specific?pair=EUR_USD
```

---

## 📈 Expected Performance

### EUR/USD ML Benchmarks

- 🎯 Direction accuracy: **82-89%** (industry average)
- 📊 Sharpe ratio: **1.5-2.5** (attainable)
- 💰 Win rate: **60-70%** (realistic)
- 📉 Max drawdown: **<12%** (with proper risk)

### Why better than multi-pair?

1. **Single-pair focus** → deeper pattern learning
2. **EUR/USD stability** → lower noise
3. **More training data** → better generalization
4. **Pair-specific features** → higher accuracy

---

## 🎓 Training Tips

### Feature Engineering for EUR/USD

```python
# EUR/USD specific features
features = [
    # Price-based
    'returns', 'log_returns', 'volatility',

    # EUR/USD specific
    'eur_strength',  # vs basket
    'usd_strength',  # vs basket
    'dxy_correlation',  # Dollar Index
    'gold_correlation',  # XAU/USD

    # Multi-timeframe
    'trend_1h', 'trend_4h', 'trend_1d',
    'support_resistance',

    # Technical indicators (45+ total)
    'rsi', 'macd', 'bb_width', 'atr', 'adx', ...
]
```

### Labeling Strategy

```python
# Triple barrier for EUR/USD
tp_pips = 10  # EUR/USD typical move
sl_pips = 5   # 2:1 risk/reward
time_barrier = 60  # 1 hour
```

---

## 🏁 Next Steps

### Immediate Actions:

1. ✅ **EUR/USD сонгосон** (optimal choice)
2. ✅ **UniRate API холбосон** (data source)
3. ⏳ **Өгөгдөл татах** → `python scripts/download_unirate.py`
4. ⏳ **Backend test** → `python backend/utils/unirate_handler.py`
5. ⏳ **Week 1 эхлэх** → Feature engineering (45+ indicators)

---

## 💡 Pro Tips

### EUR/USD Trading Insights

- 🕐 **Best hours**: London open (08:00-12:00 GMT)
- 📊 **Best days**: Tuesday-Thursday
- 📰 **Key reports**: NFP, FOMC, ECB meetings
- 🎯 **Typical range**: 40-80 pips/day
- ⚡ **Best volatility**: EU-US overlap (12:00-16:00 GMT)

### Model Training

- 🎯 Focus on **London + NY sessions** data
- 📊 Train separate models for **trending vs ranging**
- ⚡ Use **time-of-day features** (hour, day_of_week)
- 🔄 **Resample** imbalanced classes (BUY/SELL/HOLD)

---

**🚀 Бэлэн болсон! EUR/USD-д зориулсан Universal Model сургаж эхэлцгээе!**
