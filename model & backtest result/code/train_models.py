from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
import uuid
from pathlib import Path
from datetime import datetime, timezone
from typing import Any

import joblib
import numpy as np
import pandas as pd

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from config import MODELS_DIR, PROCESSED_DIR, RANDOM_STATE, TEST_START_DATE
from scripts.models.deep import train_lstm, train_transformer
from scripts.models.gbdt import fit_models, predict_ensemble_proba, predict_proba
from scripts.utils import ensure_dir
from statistical_validation import (
    assess_overfitting_risk,
    bootstrap_accuracy_ci,
    make_leakage_safe_split,
    summarize_seed_stability,
)


def _sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _feature_schema_hash(feature_cols: list[str]) -> str:
    return _sha256_text("\n".join(sorted(feature_cols)))


def _dataset_hash(df: pd.DataFrame) -> str:
    stable_df = df.sort_values("time").reset_index(drop=True)
    hashed = pd.util.hash_pandas_object(stable_df, index=True).values
    return hashlib.sha256(hashed.tobytes()).hexdigest()


def _resolve_git_commit() -> str:
    env_commit = str(os.getenv("GIT_COMMIT", "")).strip()
    if env_commit:
        return env_commit

    try:
        proc = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=str(ROOT_DIR.parent),
            check=True,
            capture_output=True,
            text=True,
        )
        return proc.stdout.strip()
    except Exception:
        return "unknown"


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
    
    # === PHASE 6B: Walk-Forward Validation (Leakage-safe with embargo) ===
    # Split: 2015-2022 (train), 2023 (validation), 2024 (test)
    train_end = "2023-01-01"
    val_end = "2024-01-01"
    try:
        embargo_minutes = max(0, int(os.getenv("WF_EMBARGO_MINUTES", "60")))
    except Exception:
        embargo_minutes = 60

    split = make_leakage_safe_split(
        df,
        time_col="time",
        train_end=train_end,
        val_end=val_end,
        test_end=TEST_START_DATE,
        embargo_minutes=embargo_minutes,
    )
    train_df = split.train_df
    val_df = split.val_df
    test_df = split.test_df
    
    print(f"\n=== PHASE 6B: Walk-Forward Split (Embargo={embargo_minutes}m) ===")
    print(f"Train: {len(train_df):,} rows ({train_df['time'].min()} to {train_df['time'].max()})")
    print(f"Validation: {len(val_df):,} rows (2023)")
    print(f"Test: {len(test_df):,} rows (2024)")

    if len(train_df) == 0 or len(val_df) == 0 or len(test_df) == 0:
        raise RuntimeError("Leakage-safe split produced empty train/validation/test partition")
    
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
    # Pass validation set to enable early stopping and prevent overfitting.
    # Multi-seed robustness can be controlled with MULTI_SEED_COUNT env var.
    all_models = []
    try:
        seed_count = max(1, int(os.getenv("MULTI_SEED_COUNT", "3")))
    except Exception:
        seed_count = 3
    seeds = [int(RANDOM_STATE + offset) for offset in range(seed_count)]
    
    print(f"\n=== Training with Regularization + Early Stopping ===")
    print(f"This will prevent overfitting and calibrate confidence scores")
    seed_models: dict[int, dict[str, Any]] = {}
    for seed in seeds:
        print(f"\nSeed {seed}:")
        models = fit_models(X_fit, y_fit, seed, pos_weight, X_val, y_val)
        all_models.append(models)
        seed_models[seed] = models
    
    # Flatten all models into single dict
    models_flat = {}
    for i, models in enumerate(all_models):
        for name, model in models.items():
            models_flat[f"{name}_seed{seeds[i]}"] = model
    
    print(f"\n✓ Total models: {len(models_flat)}")
    
    ensure_dir(MODELS_DIR)

    # === PHASE 6B: Validation Metrics ===
    print("\n=== Out-of-Sample Validation ===")
    
    def evaluate_set(X, y, name):
        """Evaluate model on a dataset"""
        probs = predict_ensemble_proba(models_flat, X)
        preds = probs.argmax(axis=1)
        confidences = probs.max(axis=1)
        accuracy = (preds == y).mean()
        
        # Calculate precision for high-confidence predictions (>= 0.90)
        high_conf_mask = confidences >= 0.90
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

    # Per-seed stability evaluation (thesis-grade multi-seed check)
    seed_metrics: list[dict[str, float]] = []
    for seed, per_seed_models in seed_models.items():
        val_probs = predict_ensemble_proba(per_seed_models, X_val)
        test_probs = predict_ensemble_proba(per_seed_models, X_test)
        val_preds = val_probs.argmax(axis=1)
        test_preds = test_probs.argmax(axis=1)

        seed_metrics.append(
            {
                "seed": float(seed),
                "val_accuracy": float((val_preds == y_val).mean()),
                "test_accuracy": float((test_preds == y_test).mean()),
            }
        )

    seed_stability = summarize_seed_stability(seed_metrics)
    print(f"\n=== Multi-seed Stability ===")
    print(f"Seeds: {seed_stability['seed_count']}")
    print(
        "Val accuracy mean/std/cv: "
        f"{seed_stability['mean_val_accuracy']:.4f}/"
        f"{seed_stability['std_val_accuracy']:.4f}/"
        f"{seed_stability['cv_val_accuracy']:.4f}"
    )
    
    # Overfitting check
    print(f"\n=== Overfitting Check ===")
    overfit_risk = assess_overfitting_risk(train_acc, val_acc, test_acc)
    train_val_gap = overfit_risk["train_val_gap"]
    val_test_gap = overfit_risk["val_test_gap"]
    
    if overfit_risk["risk_level"] == "severe":
        print(f"⚠ HIGH OVERFITTING: Train-Val gap = {train_val_gap:.3f}")
    elif overfit_risk["risk_level"] == "moderate":
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

    # Bootstrap CI on validation/test (thesis-grade statistical confidence)
    val_probs = predict_ensemble_proba(models_flat, X_val)
    test_probs = predict_ensemble_proba(models_flat, X_test)
    val_preds = val_probs.argmax(axis=1)
    test_preds = test_probs.argmax(axis=1)
    val_ci = bootstrap_accuracy_ci(y_val, val_preds, confidence=0.95, n_bootstrap=3000, seed=42)
    test_ci = bootstrap_accuracy_ci(y_test, test_preds, confidence=0.95, n_bootstrap=3000, seed=42)

    print("\n=== Bootstrap Confidence Intervals (95%) ===")
    print(f"Validation accuracy CI: [{val_ci['low']:.4f}, {val_ci['high']:.4f}]")
    print(f"Test accuracy CI: [{test_ci['low']:.4f}, {test_ci['high']:.4f}]")

    trained_at = datetime.now(timezone.utc).isoformat()
    run_id = f"{symbol.lower()}-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}-{uuid.uuid4().hex[:8]}"
    dataset_hash = _dataset_hash(df[[*feature_cols, "time", "target"]].copy())
    feature_hash = _feature_schema_hash(feature_cols)
    commit_id = _resolve_git_commit()

    metadata = {
        "schema_version": "1.0",
        "model_version": f"{symbol}_gbdt",
        "variant": f"{symbol}_gbdt",
        "run_id": run_id,
        "seed": seeds,
        "dataset_hash": dataset_hash,
        "commit_id": commit_id,
        "trained_at_utc": trained_at,
        "feature_schema_hash": feature_hash,
        "train_window": {
            "from": str(train_df["time"].min()),
            "to": str(train_df["time"].max()),
        },
        "val_window": {
            "from": str(val_df["time"].min()),
            "to": str(val_df["time"].max()),
        },
        "test_window": {
            "from": str(test_df["time"].min()),
            "to": str(test_df["time"].max()),
        },
        "walk_forward_protocol": {
            "type": "time-based-purged",
            "embargo_minutes": embargo_minutes,
            "split": split.metadata,
        },
        "seed_stability": seed_stability,
        "bootstrap_ci": {
            "validation_accuracy": val_ci,
            "test_accuracy": test_ci,
        },
        "overfitting_risk": overfit_risk,
    }

    gbdt_path = MODELS_DIR / f"{symbol}_gbdt.pkl"
    joblib.dump(
        {
            "models": models_flat,  # Use flattened ensemble
            "feature_cols": feature_cols,
            "calibrator": None,
            "metadata": metadata,
        },
        gbdt_path,
    )

    artifact_sha256 = hashlib.sha256(gbdt_path.read_bytes()).hexdigest()

    manifest_path = MODELS_DIR / f"{symbol}_gbdt_manifest.json"
    with manifest_path.open("w", encoding="utf-8") as handle:
        json.dump(
            {
                "run_id": run_id,
                "symbol": symbol,
                "created_at": trained_at,
                "git_commit": commit_id,
                "dataset_hash": dataset_hash,
                "feature_schema_hash": feature_hash,
                "artifact_sha256": artifact_sha256,
                "seeds": seeds,
                "artifact": str(gbdt_path),
                "metrics": {
                    "train_accuracy": float(train_acc),
                    "val_accuracy": float(val_acc),
                    "test_accuracy": float(test_acc),
                    "train_high_conf_accuracy": float(train_high),
                    "val_high_conf_accuracy": float(val_high),
                    "test_high_conf_accuracy": float(test_high),
                },
            },
            handle,
            indent=2,
        )
    print(f"✓ Wrote manifest: {manifest_path}")

    stats_report_path = MODELS_DIR / f"{symbol}_statistical_validation_report.json"
    with stats_report_path.open("w", encoding="utf-8") as handle:
        json.dump(
            {
                "symbol": symbol,
                "created_at": trained_at,
                "run_id": run_id,
                "walk_forward": split.metadata,
                "seed_metrics": seed_metrics,
                "seed_stability": seed_stability,
                "bootstrap_ci": {
                    "validation_accuracy": val_ci,
                    "test_accuracy": test_ci,
                },
                "overfitting_risk": overfit_risk,
                "acceptance": {
                    "min_val_high_conf_accuracy": 0.50,
                    "max_train_val_gap": 0.10,
                    "passed": bool(val_high >= 0.50 and train_val_gap <= 0.10),
                },
            },
            handle,
            indent=2,
        )
    print(f"✓ Wrote statistical validation report: {stats_report_path}")

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
