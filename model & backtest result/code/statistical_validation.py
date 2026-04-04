from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd


@dataclass
class WalkForwardSplit:
    train_df: pd.DataFrame
    val_df: pd.DataFrame
    test_df: pd.DataFrame
    metadata: dict[str, Any]


def make_leakage_safe_split(
    df: pd.DataFrame,
    *,
    time_col: str,
    train_end: str,
    val_end: str,
    test_end: str,
    embargo_minutes: int = 60,
) -> WalkForwardSplit:
    work = df.sort_values(time_col).copy()
    work[time_col] = pd.to_datetime(work[time_col], utc=False)

    train_end_ts = pd.Timestamp(train_end)
    val_end_ts = pd.Timestamp(val_end)
    test_end_ts = pd.Timestamp(test_end)
    embargo = pd.Timedelta(minutes=max(0, int(embargo_minutes)))

    train_df = work[work[time_col] < train_end_ts - embargo].copy()
    val_df = work[
        (work[time_col] >= train_end_ts + embargo)
        & (work[time_col] < val_end_ts - embargo)
    ].copy()
    test_df = work[
        (work[time_col] >= val_end_ts + embargo)
        & (work[time_col] < test_end_ts)
    ].copy()

    metadata = {
        "embargo_minutes": int(max(0, embargo_minutes)),
        "train_end": train_end_ts.isoformat(),
        "val_end": val_end_ts.isoformat(),
        "test_end": test_end_ts.isoformat(),
    }

    return WalkForwardSplit(train_df=train_df, val_df=val_df, test_df=test_df, metadata=metadata)


def bootstrap_accuracy_ci(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    *,
    confidence: float = 0.95,
    n_bootstrap: int = 2000,
    seed: int = 42,
) -> dict[str, float]:
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    n = len(y_true)
    if n == 0:
        return {"mean": 0.0, "low": 0.0, "high": 0.0}

    rng = np.random.default_rng(seed)
    scores = []
    for _ in range(max(100, int(n_bootstrap))):
        idx = rng.integers(0, n, n)
        score = float((y_true[idx] == y_pred[idx]).mean())
        scores.append(score)

    alpha = (1.0 - confidence) / 2.0
    low = float(np.quantile(scores, alpha))
    high = float(np.quantile(scores, 1.0 - alpha))
    return {
        "mean": float(np.mean(scores)),
        "low": low,
        "high": high,
    }


def summarize_seed_stability(seed_metrics: list[dict[str, float]]) -> dict[str, float]:
    if not seed_metrics:
        return {
            "seed_count": 0,
            "mean_val_accuracy": 0.0,
            "std_val_accuracy": 0.0,
            "cv_val_accuracy": 0.0,
            "min_val_accuracy": 0.0,
            "max_val_accuracy": 0.0,
        }

    vals = np.array([float(item["val_accuracy"]) for item in seed_metrics], dtype=float)
    mean_val = float(vals.mean())
    std_val = float(vals.std(ddof=0))
    cv = float(std_val / mean_val) if mean_val > 1e-12 else 0.0

    return {
        "seed_count": int(len(seed_metrics)),
        "mean_val_accuracy": mean_val,
        "std_val_accuracy": std_val,
        "cv_val_accuracy": cv,
        "min_val_accuracy": float(vals.min()),
        "max_val_accuracy": float(vals.max()),
    }


def assess_overfitting_risk(
    train_accuracy: float,
    val_accuracy: float,
    test_accuracy: float,
    *,
    severe_gap: float = 0.10,
    moderate_gap: float = 0.05,
) -> dict[str, Any]:
    train_val_gap = float(train_accuracy - val_accuracy)
    val_test_gap = float(val_accuracy - test_accuracy)

    if train_val_gap > severe_gap:
        level = "severe"
    elif train_val_gap > moderate_gap:
        level = "moderate"
    else:
        level = "low"

    return {
        "train_val_gap": train_val_gap,
        "val_test_gap": val_test_gap,
        "risk_level": level,
        "is_overfit": level in ("moderate", "severe"),
    }
