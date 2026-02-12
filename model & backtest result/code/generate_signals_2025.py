"""Generate 2025 signals using Phase 7B model with matching features"""
import sys
from pathlib import Path
import joblib
import numpy as np
import pandas as pd

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT_DIR))

from config import OUTPUT_DIR, MIN_SL_PIPS, MIN_TP_PIPS, SL_MULT, TP_MULT
from scripts.build_from_train import compute_features
from scripts.utils import pip_size

SIGNAL_DIR = ROOT_DIR / "data" / "signal"
MODEL_PATH = ROOT_DIR / "models" / "EURUSD_gbdt.pkl"
CONF_THRESHOLD = 0.90  # Phase 6B proven
MIN_ATR_PIPS = 4.0

def load_signal_data():
    """Load 2025 signal data"""
    print("\nLoading 2025 signal data...")
    
    timeframes = {
        "m1": "1min",
        "m5": "5min",
        "m15": "15min",
        "m30": "30min",
        "h1": "1H",
        "h4": "4H"
    }
    
    data = {}
    for tf_short, tf_long in timeframes.items():
        path = SIGNAL_DIR / f"EURUSD_{tf_short}.csv"
        if not path.exists():
            print(f"  WARNING: {path} not found")
            continue
        df = pd.read_csv(path, parse_dates=["time"])
        df = df.sort_values("time").reset_index(drop=True)
        data[tf_long] = df
        print(f"  {tf_long}: {len(df):,} rows")
    
    return data

def build_features(data):
    """Build multi-timeframe features like training"""
    print("\nBuilding features...")
    
    base = data["1min"].copy()
    print(f"  M1 base: {len(base):,} rows")
    
    # M1 features
    feat_m1 = compute_features(base, "1min")
    result = pd.concat([base[["time", "open", "high", "low", "close", "volume"]], feat_m1], axis=1)
    
    # Merge other timeframes
    for tf in ["5min", "15min", "30min", "1H", "4H"]:
        if tf not in data:
            print(f"  WARNING: {tf} missing")
            continue
        
        df_tf = data[tf]
        feat_tf = compute_features(df_tf, tf)
        
        # Merge on time (backward fill)
        df_merged = pd.merge_asof(
            result[["time"]],
            pd.concat([df_tf[["time"]], feat_tf], axis=1),
            on="time",
            direction="backward"
        )
        
        for col in feat_tf.columns:
            result[col] = df_merged[col].values
    
    # Drop NaN
    n_before = len(result)
    result = result.dropna()
    n_after = len(result)
    print(f"  Dropped {n_before - n_after:,} rows with NaN")
    print(f"  Final: {n_after:,} rows, {len(result.columns)} columns")
    
    return result

def calculate_sl_tp(df, symbol="EURUSD"):
    """Calculate SL/TP like training"""
    pips = pip_size(symbol)
    
    atr_col = "atr_1min"
    if atr_col not in df.columns:
        print(f"WARNING: {atr_col} not found, using default SL/TP")
        df["SL_pips"] = MIN_SL_PIPS
        df["TP_pips"] = MIN_TP_PIPS
        return df
    
    atr_pips = df[atr_col] / pips
    
    sl_pips = (atr_pips * SL_MULT).clip(lower=MIN_SL_PIPS)
    tp_pips = (sl_pips * (TP_MULT / SL_MULT)).clip(lower=MIN_TP_PIPS)
    
    df["SL_pips"] = sl_pips
    df["TP_pips"] = tp_pips
    df["ATR_pips"] = atr_pips
    
    return df

def generate_signals():
    """Main signal generation"""
    print("="*60)
    print("PHASE 7B: Generate 2025 Signals (Calibrated Model)")
    print("="*60)
    
    # Load model
    print(f"\nLoading model: {MODEL_PATH}")
    model_data = joblib.load(MODEL_PATH)
    models = model_data["models"]
    feature_cols = model_data["feature_cols"]
    calibrator = model_data.get("calibrator")
    print(f"  Models: {list(models.keys())}")
    print(f"  Features: {len(feature_cols)}")
    
    # Load data
    data = load_signal_data()
    if "1min" not in data:
        raise ValueError("M1 data required")
    
    # Build features
    df = build_features(data)
    
    # Check features
    missing = [f for f in feature_cols if f not in df.columns]
    if missing:
        print(f"\nERROR: Missing features: {missing[:10]}")
        raise ValueError("Feature mismatch")
    
    # Extract features
    X = df[feature_cols].to_numpy()
    print(f"\nPredicting on {len(X):,} samples...")
    
    # Ensemble prediction
    all_proba = []
    for name, model in models.items():
        proba = model.predict_proba(X)
        all_proba.append(proba)
        print(f"  {name}: {proba.shape}")
    
    # Average
    ensemble_proba = np.mean(all_proba, axis=0)
    
    # Get predictions before calibration
    pred_class = ensemble_proba.argmax(axis=1)
    pred_conf = ensemble_proba.max(axis=1)
    
    # Calibrate confidence scores (if calibrator exists)
    if calibrator is not None:
        # Calibrator expects 1D confidence scores
        pred_conf = calibrator.predict_proba(pred_conf.reshape(-1, 1))[:, 1]
        print("  ✓ Calibrated confidence scores")
    
    # Map back to -1,0,1
    class_map = {0: -1, 1: 0, 2: 1}  # Adjust if needed
    pred_signal = np.array([class_map[c] for c in pred_class])
    
    df["signal"] = pred_signal
    df["confidence"] = pred_conf
    
    # Filter
    print(f"\nFiltering signals (conf≥{CONF_THRESHOLD}, ATR≥{MIN_ATR_PIPS}pips)...")
    df = calculate_sl_tp(df)
    
    # Apply filters
    mask_buy = (df["signal"] == 1) & (df["confidence"] >= CONF_THRESHOLD) & (df["ATR_pips"] >= MIN_ATR_PIPS)
    mask_sell = (df["signal"] == -1) & (df["confidence"] >= CONF_THRESHOLD) & (df["ATR_pips"] >= MIN_ATR_PIPS)
    
    signals = df[mask_buy | mask_sell].copy()
    print(f"  Raw BUY: {mask_buy.sum():,}, SELL: {mask_sell.sum():,}")
    print(f"  Total signals: {len(signals):,}")
    
    if len(signals) == 0:
        print("\nWARNING: No signals passed filters!")
        return
    
    # Format output
    signals["Symbol"] = "EURUSD"
    signals["Direction"] = signals["signal"].map({1: "BUY", -1: "SELL"})
    signals["EntryPrice"] = signals["close"]
    signals["TimeStop"] = 0  # No time stop
    
    output_cols = [
        "Symbol", "time", "Direction", "EntryPrice",
        "SL_pips", "TP_pips", "TimeStop", "confidence", "ATR_pips"
    ]
    
    output = signals[output_cols].copy()
    
    # Save
    out_path = OUTPUT_DIR / "signals.csv"
    output.to_csv(out_path, index=False)
    
    print(f"\n✓ Saved to: {out_path}")
    print(f"  Signals: {len(output):,}")
    print(f"  BUY: {(output['Direction']=='BUY').sum():,}")
    print(f"  SELL: {(output['Direction']=='SELL').sum():,}")
    print(f"  Avg confidence: {output['confidence'].mean():.3f}")
    print(f"  Avg SL: {output['SL_pips'].mean():.1f} pips")
    print(f"  Avg TP: {output['TP_pips'].mean():.1f} pips")
    
    print("\n" + "="*60)
    print("Ready for MT5 backtest!")
    print("="*60)

if __name__ == "__main__":
    generate_signals()
