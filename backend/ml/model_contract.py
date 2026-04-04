"""Model contract helpers for reproducibility and production governance."""

from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple


def _as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return str(value).strip().lower() in ("1", "true", "yes", "on")


def is_production_runtime() -> bool:
    explicit_env = str(os.getenv("APP_ENV", os.getenv("ENVIRONMENT", ""))).strip().lower()
    if explicit_env in ("prod", "production", "staging"):
        return True

    return bool(os.getenv("FLY_APP_NAME") or os.getenv("WEBSITE_SITE_NAME"))


def model_contract_required() -> bool:
    required_default = "true" if is_production_runtime() else "false"
    return _as_bool(os.getenv("MODEL_CONTRACT_REQUIRED", required_default), default=is_production_runtime())


def compute_sha256(file_path: str | Path) -> str:
    path = Path(file_path)
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while True:
            block = handle.read(1024 * 1024)
            if not block:
                break
            digest.update(block)
    return digest.hexdigest()


def load_model_manifest(manifest_path: str | Path) -> Dict[str, Any]:
    path = Path(manifest_path)
    if not path.exists():
        return {}

    try:
        with path.open("r", encoding="utf-8") as handle:
            manifest = json.load(handle)
        return manifest if isinstance(manifest, dict) else {}
    except Exception:
        return {}


def feature_schema_hash(feature_cols: List[str]) -> str:
    payload = "\n".join(sorted(str(col) for col in feature_cols))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _safe_str(value: Any) -> str:
    return str(value).strip() if value is not None else ""


def build_model_contract(
    model_data: Dict[str, Any],
    model_path: str | Path,
    feature_cols: List[str],
    manifest_data: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    metadata = model_data.get("metadata") if isinstance(model_data, dict) else {}
    metadata = metadata if isinstance(metadata, dict) else {}
    manifest = manifest_data if isinstance(manifest_data, dict) else {}

    model_path_str = str(Path(model_path).resolve())
    feature_hash = feature_schema_hash(feature_cols)

    contract = {
        "schema_version": _safe_str(metadata.get("schema_version") or "1.0"),
        "model_version": _safe_str(
            metadata.get("model_version")
            or metadata.get("variant")
            or manifest.get("model_version")
            or Path(model_path).stem
        ),
        "run_id": _safe_str(metadata.get("run_id") or manifest.get("run_id")),
        "seed": metadata.get("seed") or manifest.get("seeds"),
        "dataset_hash": _safe_str(metadata.get("dataset_hash") or manifest.get("dataset_hash")),
        "commit_id": _safe_str(metadata.get("commit_id") or manifest.get("git_commit") or os.getenv("GIT_COMMIT", "")),
        "trained_at_utc": _safe_str(metadata.get("trained_at_utc") or manifest.get("created_at")),
        "model_file_path": model_path_str,
        "model_file_sha256": compute_sha256(model_path_str),
        "feature_count": len(feature_cols),
        "feature_schema_hash": _safe_str(metadata.get("feature_schema_hash") or manifest.get("feature_schema_hash") or feature_hash),
        "manifest_path": _safe_str(manifest.get("artifact") or manifest.get("manifest_path") or ""),
        "manifest_run_id": _safe_str(manifest.get("run_id")),
        "manifest_dataset_hash": _safe_str(manifest.get("dataset_hash")),
        "manifest_feature_schema_hash": _safe_str(manifest.get("feature_schema_hash")),
        "manifest_artifact_sha256": _safe_str(manifest.get("artifact_sha256")),
    }

    if not contract["trained_at_utc"]:
        contract["trained_at_utc"] = datetime.now(timezone.utc).isoformat()

    return contract


def validate_model_contract(contract: Dict[str, Any], expected_feature_hash: str) -> Tuple[bool, List[str]]:
    errors: List[str] = []
    required_fields = (
        "schema_version",
        "model_version",
        "run_id",
        "dataset_hash",
        "commit_id",
        "model_file_sha256",
        "feature_schema_hash",
    )

    for field in required_fields:
        if not _safe_str(contract.get(field)):
            errors.append(f"missing required contract field: {field}")

    seed_value = contract.get("seed")
    if seed_value is None or _safe_str(seed_value) == "":
        errors.append("missing required contract field: seed")

    contract_feature_hash = _safe_str(contract.get("feature_schema_hash"))
    if contract_feature_hash and contract_feature_hash != expected_feature_hash:
        errors.append("feature_schema_hash mismatch")

    manifest_feature_hash = _safe_str(contract.get("manifest_feature_schema_hash"))
    if manifest_feature_hash and manifest_feature_hash != expected_feature_hash:
        errors.append("manifest feature_schema_hash mismatch")

    manifest_artifact_hash = _safe_str(contract.get("manifest_artifact_sha256"))
    model_file_hash = _safe_str(contract.get("model_file_sha256"))
    if manifest_artifact_hash and manifest_artifact_hash != model_file_hash:
        errors.append("manifest artifact_sha256 mismatch")

    manifest_run_id = _safe_str(contract.get("manifest_run_id"))
    if manifest_run_id and contract.get("run_id") and manifest_run_id != _safe_str(contract.get("run_id")):
        errors.append("manifest run_id mismatch")

    manifest_dataset_hash = _safe_str(contract.get("manifest_dataset_hash"))
    if manifest_dataset_hash and contract.get("dataset_hash") and manifest_dataset_hash != _safe_str(contract.get("dataset_hash")):
        errors.append("manifest dataset_hash mismatch")

    return len(errors) == 0, errors
