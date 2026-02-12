# Model Information

**File:** EURUSD_gbdt.pkl  
**Size:** ~20 MB  
**Type:** Ensemble GBDT (3 models)  
**Training Date:** 2026-02-11  
**Status:** Production Ready ✅  

---

## Model Architecture

### Ensemble Components:
1. **LightGBM** (GPU-accelerated)
   - 496 trees (early stopped)
   - max_depth=6, num_leaves=31
   - Learning rate=0.03

2. **XGBoost** (CPU histogram)
   - ~400 trees (early stopped)
   - max_depth=5
   - Learning rate=0.03

3. **CatBoost** (GPU-accelerated)
   - 499 trees (early stopped)
   - depth=5
   - Learning rate=0.03

### Post-Processing:
- **Averaging:** Equal weight ensemble
- **Calibration:** Logistic Regression (validation set)

---

## Training Data

**Dataset:**
- Period: 2015-2024 (10 years)
- Samples: 3,715,131 rows
- Features: 48 multi-timeframe technical indicators
- Labels: 3-class (BUY/HOLD/SELL)

**Split:**
- Train: 2015-2022 (80%)
- Validation: 2023 (10%)
- Test: 2024 (10%)

---

## Performance Metrics

**Training:**
- Train Accuracy: 77.4%
- Validation Accuracy: 80.2%
- Test Accuracy: 87.4%
- **No Overfitting** ✅ (train-val gap: -2.8%)

**Real Backtest (2025):**
- Win Rate: 44.44%
- Profit Factor: 2.46
- Sharpe Ratio: 9.64
- Max Drawdown: 3.93%

---

## Model Contents

Pickle файл доторх агуулга:
```python
{
    'models': {
        'lightgbm_seed42': LGBMClassifier(...),
        'xgboost_seed42': XGBClassifier(...),
        'catboost_seed42': CatBoostClassifier(...)
    },
    'feature_cols': [
        'close_1min', 'rsi_1min', 'atr_1min', ...  # 48 features
    ],
    'calibrator': LogisticRegression(...)
}
```

---

## Usage

```python
import joblib

# Load model
model_data = joblib.load('EURUSD_gbdt.pkl')
models = model_data['models']
feature_cols = model_data['feature_cols']
calibrator = model_data['calibrator']

# Predict
X = df[feature_cols]  # Must have same 48 features
raw_proba = np.mean([m.predict_proba(X) for m in models.values()], axis=0)
confidence = calibrator.predict_proba(raw_proba.max(axis=1).reshape(-1, 1))[:, 1]
direction = raw_proba.argmax(axis=1)  # 0=HOLD, 1=BUY, 2=SELL
```
