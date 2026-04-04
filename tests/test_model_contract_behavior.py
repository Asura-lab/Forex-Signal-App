from __future__ import annotations

from pathlib import Path
import tempfile
import unittest

from backend.ml.model_contract import (
    build_model_contract,
    feature_schema_hash,
    validate_model_contract,
)


class ModelContractBehaviorTest(unittest.TestCase):
    def test_feature_schema_hash_is_order_invariant(self):
        first = feature_schema_hash(["ema_20", "rsi_14", "atr_14"])
        second = feature_schema_hash(["rsi_14", "atr_14", "ema_20"])
        self.assertEqual(first, second)

    def test_build_model_contract_and_validate_success(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            model_path = Path(tmp_dir) / "model.pkl"
            model_path.write_bytes(b"binary-model-content")

            features = ["ema_20", "rsi_14", "atr_14"]
            model_data = {
                "metadata": {
                    "schema_version": "1.0",
                    "model_version": "eurusd_gbdt",
                    "run_id": "run-001",
                    "seed": [42, 43, 44],
                    "dataset_hash": "dataset-hash",
                    "commit_id": "abc123",
                    "trained_at_utc": "2026-04-04T00:00:00+00:00",
                    "feature_schema_hash": feature_schema_hash(features),
                }
            }

            contract = build_model_contract(model_data, model_path, features)
            ok, errors = validate_model_contract(contract, feature_schema_hash(features))

            self.assertTrue(ok)
            self.assertEqual(errors, [])
            self.assertEqual(contract["model_version"], "eurusd_gbdt")
            self.assertEqual(contract["run_id"], "run-001")

    def test_validate_fails_on_feature_hash_mismatch(self):
        contract = {
            "schema_version": "1.0",
            "model_version": "eurusd_gbdt",
            "run_id": "run-002",
            "seed": [42],
            "dataset_hash": "dataset-hash",
            "commit_id": "abc123",
            "model_file_sha256": "cafebabe",
            "feature_schema_hash": "bad-hash",
        }
        ok, errors = validate_model_contract(contract, expected_feature_hash="good-hash")

        self.assertFalse(ok)
        self.assertIn("feature_schema_hash mismatch", errors)


if __name__ == "__main__":
    unittest.main()
