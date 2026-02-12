from __future__ import annotations

import argparse
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from config import MODELS_DIR, PROCESSED_DIR, RANDOM_STATE, TEST_START_DATE
from scripts.models.deep import train_lstm, train_transformer
from scripts.models.gbdt import fit_models, predict_proba
from scripts.utils import ensure_dir


def load_dataset(symbol: str) -> pd.DataFrame:
    # Try PKL first (faster)
    pkl_path = PROCESSED_DIR / f"{symbol}_dataset.pkl"
    csv_path = PROCESSED_DIR / f"{symbol}_dataset.csv.gz"
    
    if pkl_path.exists():
        try:
            return pd.read_pickle(pkl_path)
        except Exception as e:
            print(f"Warning: PKL load failed ({e}), trying CSV...")
    
    if csv_path.exists():
        return pd.read_csv(csv_path, parse_dates=["time"])
    
    raise FileNotFoundError("Processed dataset not found. Run build_dataset.py first.")


def _time_split(df: pd.DataFrame, split_ratio: float = 0.8) -> tuple[pd.DataFrame, pd.DataFrame]:
    df_sorted = df.sort_values("time")
    split_idx = int(len(df_sorted) * split_ratio)
    return df_sorted.iloc[:split_idx], df_sorted.iloc[split_idx:]


def train(symbol: str, enable_deep: bool, seq_len: int, epochs: int) -> Path:
    df = load_dataset(symbol)
    df = df.replace([np.inf, -np.inf], np.nan).dropna()
    
    # === PHASE 6B: Walk-Forward Validation ===
    # Split: 2015-2022 (train), 2023 (validation), 2024 (test)
    train_end = "2023-01-01"
    val_end = "2024-01-01"
    
    train_df = df[df["time"] < train_end]
    val_df = df[(df["time"] >= train_end) & (df["time"] < val_end)]
    test_df = df[(df["time"] >= val_end) & (df["time"] < TEST_START_DATE)]
    
    print(f"\n=== PHASE 6B: Walk-Forward Split ===")
    print(f"Train: {len(train_df):,} rows ({train_df['time'].min()} to {train_df['time'].max()})")
    print(f"Validation: {len(val_df):,} rows (2023)")
    print(f"Test: {len(test_df):,} rows (2024)")
    
    # Further split train into fit/calibration
    train_fit, train_cal = _time_split(train_df, split_ratio=0.8)

    feature_cols = [
        c
        for c in df.columns
        if c not in {"time", "target"} and not c.startswith("symbol")
    ]
    
    # Remap labels: -1,0,1 → 0,1,2 (XGBoost requirement)
    label_map = {-1: 0, 0: 1, 1: 2}  # SELL=0, NEUTRAL=1, BUY=2
    
    X_fit = train_fit[feature_cols].to_numpy()
    y_fit = train_fit["target"].map(label_map).to_numpy()
    X_cal = train_cal[feature_cols].to_numpy()
    y_cal = train_cal["target"].map(label_map).to_numpy()
    
    # Validation data
    X_val = val_df[feature_cols].to_numpy()
    y_val = val_df["target"].map(label_map).to_numpy()
    
    # Test data
    X_test = test_df[feature_cols].to_numpy()
    y_test = test_df["target"].map(label_map).to_numpy()

    pos = max(y_fit.sum(), 1)
    neg = max(len(y_fit) - pos, 1)
    pos_weight = float(neg / pos)

    # === PHASE 7B: Train with Validation for Early Stopping ===
    # Pass validation set to enable early stopping and prevent overfitting
    all_models = []
    seeds = [42]  # Single seed for less complexity
    
    print(f"\n=== Training with Regularization + Early Stopping ===")
    print(f"This will prevent overfitting and calibrate confidence scores")
    for seed in seeds:
        print(f"\nSeed {seed}:")
        models = fit_models(X_fit, y_fit, seed, pos_weight, X_val, y_val)
        all_models.append(models)
    
    # Flatten all models into single dict
    models_flat = {}
    for i, models in enumerate(all_models):
        for name, model in models.items():
            models_flat[f"{name}_seed{seeds[i]}"] = model
    
    print(f"\n✓ Total models: {len(models_flat)}")
    
    ensure_dir(MODELS_DIR)

    cal = None
    if len(train_cal) > 0:
        print("\n=== Calibrating Ensemble ===")
        cal = LogisticRegression(max_iter=1000)
        cal.fit(predict_proba(models_flat, X_cal).reshape(-1, 1), y_cal)
        print("✓ Calibration done")
    
    # === PHASE 6B: Validation Metrics ===
    print("\n=== Out-of-Sample Validation ===")
    
    def evaluate_set(X, y, name):
        """Evaluate model on a dataset"""
        probs = predict_proba(models_flat, X)
        if cal is not None:
            probs = cal.predict_proba(probs.reshape(-1, 1))[:, 1]
        
        preds = (probs >= 0.5).astype(int)
        accuracy = (preds == y).mean()
        
        # Calculate precision for high-confidence predictions (>= 0.90)
        high_conf_mask = probs >= 0.90
        if high_conf_mask.sum() > 0:
            high_conf_acc = (preds[high_conf_mask] == y[high_conf_mask]).mean()
            high_conf_pct = high_conf_mask.mean() * 100
        else:
            high_conf_acc = 0
            high_conf_pct = 0
        
        print(f"{name}:")
        print(f"  Samples: {len(y):,}")
        print(f"  Accuracy: {accuracy:.3f} ({accuracy*100:.1f}%)")
        print(f"  High-conf (≥0.90): {high_conf_pct:.1f}% samples, {high_conf_acc:.3f} accuracy")
        
        return accuracy, high_conf_acc
    
    # Evaluate on all sets
    train_acc, train_high = evaluate_set(X_fit, y_fit, "Training (2015-2022)")
    val_acc, val_high = evaluate_set(X_val, y_val, "Validation (2023)")
    test_acc, test_high = evaluate_set(X_test, y_test, "Test (2024)")
    
    # Overfitting check
    print(f"\n=== Overfitting Check ===")
    train_val_gap = train_acc - val_acc
    val_test_gap = val_acc - test_acc
    
    if train_val_gap > 0.10:
        print(f"⚠ HIGH OVERFITTING: Train-Val gap = {train_val_gap:.3f}")
    elif train_val_gap > 0.05:
        print(f"⚠ Moderate overfitting: Train-Val gap = {train_val_gap:.3f}")
    else:
        print(f"✓ Good generalization: Train-Val gap = {train_val_gap:.3f}")
    
    if val_high < 0.40:
        print(f"⚠ LOW VALIDATION ACCURACY: {val_high:.1%} at high confidence")
        print(f"   Recommendation: DO NOT deploy to production!")
    elif val_high < 0.50:
        print(f"⚠ MARGINAL: {val_high:.1%} validation accuracy")
        print(f"   Consider further optimization")
    else:
        print(f"✓ GOOD: {val_high:.1%} validation accuracy at high confidence")

    gbdt_path = MODELS_DIR / f"{symbol}_gbdt.pkl"
    joblib.dump(
        {
            "models": models_flat,  # Use flattened ensemble
            "feature_cols": feature_cols,
            "calibrator": cal,
        },
        gbdt_path,
    )

    if enable_deep:
        lstm_pack = train_lstm(X_fit, y_fit, seq_len=seq_len, epochs=epochs, lr=1e-3)
        if lstm_pack is not None:
            deep_path = MODELS_DIR / f"{symbol}_lstm.pt"
            import torch

            torch.save(
                {"state_dict": lstm_pack["model"].state_dict(), "config": lstm_pack["config"]},
                deep_path,
            )

        transformer_pack = train_transformer(
            X_fit, y_fit, seq_len=seq_len, epochs=epochs, lr=1e-3
        )
        if transformer_pack is not None:
            deep_path = MODELS_DIR / f"{symbol}_transformer.pt"
            import torch

            torch.save(
                {
                    "state_dict": transformer_pack["model"].state_dict(),
                    "config": transformer_pack["config"],
                },
                deep_path,
            )

    return gbdt_path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--symbol", default="EURUSD")
    parser.add_argument("--enable-deep", action="store_true")
    parser.add_argument("--seq-len", type=int, default=60)
    parser.add_argument("--epochs", type=int, default=3)
    args = parser.parse_args()

    path = train(args.symbol, args.enable_deep, args.seq_len, args.epochs)
    print(f"Wrote {path}")


if __name__ == "__main__":
    main()
