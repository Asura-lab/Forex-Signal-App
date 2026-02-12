# ProTrader ML Trading System

**Хөгжүүлсэн огноо:** 2026-02-11  
**Систем:** EURUSD ML Trading  
**Үр дүн:** +41.61% return, 9.64 Sharpe Ratio, 3.93% Max DD  

---

## 📁 Хавтасын Бүтэц

### 📂 code/
Бүх Python код:
- `build_from_train.py` - Dataset бүтээх (CSV → pickle)
- `train_models.py` - Загвар сургах (LightGBM/XGBoost/CatBoost)
- `generate_signals_2025.py` - Trading signal үүсгэх
- `config.py` - Тохиргоо
- `requirements.txt` - Python packages
- `utils.py` - Helper функцүүд
- `models/gbdt.py` - GBDT загваруудын тодорхойлолт

### 📂 models/
- `EURUSD_gbdt.pkl` - Сургасан загвар (20 MB)

### 📂 results/
- `signals_2025.csv` - 1,065 trading signals (MT5 форматтай)

### 📂 documentation/
- `Technical_Report.md` - Бүрэн техникийн тайлан (39 KB)

### 📂 data/
Жишээ өгөгдөл (хоосон - анхны төсөлд байна)

### 📂 figures/
График, график зураг (хоосон - шаардлагатай бол үүсгэнэ)

---

## 🚀 Хэрхэн Ашиглах

### 1. Dataset бэлтгэх
```bash
python code/build_from_train.py
```

### 2. Загвар сургах
```bash
python code/train_models.py --symbol EURUSD
```

### 3. Signal үүсгэх
```bash
python code/generate_signals_2025.py
```

### 4. MT5 дээр backtest
- `results/signals_2025.csv` файлыг MT5 Common\Files\ руу хуулна
- SignalExecutor EA ажиллуулна

---

## 📊 Үндсэн Үр Дүн

| Metric | Value |
|--------|-------|
| Return | +41.61% |
| Sharpe Ratio | 9.64 |
| Win Rate | 44.44% |
| Profit Factor | 2.46 |
| Max Drawdown | 3.93% |
| Total Trades | 45 |

---

## 💻 Шаардлагатай Систем

- Python 3.10+
- GPU (NVIDIA) - Optional, харин хурдан
- RAM: 16GB+
- Disk: 5GB+ чөлөөтэй зай

**Python Packages:**
```
lightgbm
xgboost
catboost
pandas
numpy
scikit-learn
joblib
```

---

## 📝 Тэмдэглэл

Дэлгэрэнгүй мэдээлэл: `documentation/Technical_Report.md`
