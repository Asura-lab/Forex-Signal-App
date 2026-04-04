from __future__ import annotations

import importlib.util
from pathlib import Path
import sys
import unittest

import numpy as np
import pandas as pd

ROOT_DIR = Path(__file__).resolve().parent.parent
MODULE_PATH = ROOT_DIR / "model & backtest result" / "code" / "statistical_validation.py"


spec = importlib.util.spec_from_file_location("statistical_validation", MODULE_PATH)
statistical_validation = importlib.util.module_from_spec(spec)
assert spec and spec.loader
sys.modules[spec.name] = statistical_validation
spec.loader.exec_module(statistical_validation)


class StatisticalValidationBehaviorTest(unittest.TestCase):
    def test_leakage_safe_split_applies_embargo(self):
        df = pd.DataFrame(
            {
                "time": pd.date_range("2022-12-30 00:00:00", periods=600, freq="15min"),
                "value": np.arange(600),
            }
        )

        split = statistical_validation.make_leakage_safe_split(
            df,
            time_col="time",
            train_end="2023-01-01",
            val_end="2023-01-02",
            test_end="2023-01-03",
            embargo_minutes=120,
        )

        self.assertGreater(len(split.train_df), 0)
        self.assertGreater(len(split.val_df), 0)
        self.assertGreater(len(split.test_df), 0)

        max_train = pd.to_datetime(split.train_df["time"]).max()
        min_val = pd.to_datetime(split.val_df["time"]).min()
        max_val = pd.to_datetime(split.val_df["time"]).max()
        min_test = pd.to_datetime(split.test_df["time"]).min()

        self.assertLess(max_train, pd.Timestamp("2023-01-01") - pd.Timedelta(minutes=120))
        self.assertGreaterEqual(min_val, pd.Timestamp("2023-01-01") + pd.Timedelta(minutes=120))
        self.assertLess(max_val, pd.Timestamp("2023-01-02") - pd.Timedelta(minutes=120))
        self.assertGreaterEqual(min_test, pd.Timestamp("2023-01-02") + pd.Timedelta(minutes=120))

    def test_bootstrap_ci_is_deterministic_with_fixed_seed(self):
        y_true = np.array([1, 1, 0, 1, 0, 0, 1, 0, 1, 0])
        y_pred = np.array([1, 1, 0, 0, 0, 0, 1, 1, 1, 0])

        ci_a = statistical_validation.bootstrap_accuracy_ci(
            y_true,
            y_pred,
            confidence=0.95,
            n_bootstrap=800,
            seed=7,
        )
        ci_b = statistical_validation.bootstrap_accuracy_ci(
            y_true,
            y_pred,
            confidence=0.95,
            n_bootstrap=800,
            seed=7,
        )

        self.assertEqual(ci_a, ci_b)

    def test_overfitting_risk_flags_large_train_validation_gap(self):
        result = statistical_validation.assess_overfitting_risk(0.92, 0.74, 0.72)
        self.assertTrue(result["is_overfit"])
        self.assertEqual(result["risk_level"], "severe")


if __name__ == "__main__":
    unittest.main()
