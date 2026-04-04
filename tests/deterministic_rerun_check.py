from __future__ import annotations

import importlib.util
from pathlib import Path
import sys

import numpy as np
import pandas as pd

ROOT_DIR = Path(__file__).resolve().parent.parent
MODULE_PATH = ROOT_DIR / "model & backtest result" / "code" / "statistical_validation.py"


spec = importlib.util.spec_from_file_location("statistical_validation", MODULE_PATH)
statistical_validation = importlib.util.module_from_spec(spec)
assert spec and spec.loader
sys.modules[spec.name] = statistical_validation
spec.loader.exec_module(statistical_validation)


def main() -> int:
    y_true = np.array([1, 0, 1, 1, 0, 0, 1, 0, 1, 1])
    y_pred = np.array([1, 0, 1, 0, 0, 1, 1, 0, 1, 0])

    ci_first = statistical_validation.bootstrap_accuracy_ci(
        y_true, y_pred, confidence=0.95, n_bootstrap=1000, seed=99
    )
    ci_second = statistical_validation.bootstrap_accuracy_ci(
        y_true, y_pred, confidence=0.95, n_bootstrap=1000, seed=99
    )

    if ci_first != ci_second:
        raise SystemExit("Deterministic rerun check failed: bootstrap CI mismatch")

    frame = pd.DataFrame(
        {
            "time": pd.date_range("2024-01-01", periods=128, freq="15min"),
            "value": np.arange(128),
        }
    )

    split_a = statistical_validation.make_leakage_safe_split(
        frame,
        time_col="time",
        train_end="2024-01-01 12:00:00",
        val_end="2024-01-01 20:00:00",
        test_end="2024-01-02",
        embargo_minutes=60,
    )
    split_b = statistical_validation.make_leakage_safe_split(
        frame,
        time_col="time",
        train_end="2024-01-01 12:00:00",
        val_end="2024-01-01 20:00:00",
        test_end="2024-01-02",
        embargo_minutes=60,
    )

    if not split_a.train_df.equals(split_b.train_df):
        raise SystemExit("Deterministic rerun check failed: train split mismatch")
    if not split_a.val_df.equals(split_b.val_df):
        raise SystemExit("Deterministic rerun check failed: validation split mismatch")
    if not split_a.test_df.equals(split_b.test_df):
        raise SystemExit("Deterministic rerun check failed: test split mismatch")

    print("Deterministic rerun check passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
