# Research Hardening Baseline (Phase 1)

This document tracks the must-fix implementation baseline completed in code.

## Implemented in this patch

1. Reproducibility and lineage baseline
- Training artifact now writes metadata: `run_id`, `seed`, `dataset_hash`, `commit_id`, `feature_schema_hash`, `trained_at_utc`.
- Training now emits manifest JSON next to model artifact.
- Multi-seed training can be enabled with `MULTI_SEED_COUNT` (default `3`).

2. Training-serving model governance
- Backend model loader validates a model contract.
- In production mode, contract mismatch can fail fast via `MODEL_CONTRACT_REQUIRED=true`.
- Signal responses include `model_provenance`.

3. Signal persistence provenance
- Auto and manual signal save now persist:
  - `model_version`
  - `run_id`
  - `model_provenance`
- Mongo indexes added for `run_id` and `model_version` queryability.

4. Consent logging (auditable)
- Registration now requires a structured `consent` payload:
  - `accepted`
  - `terms_version`
  - `privacy_version`
  - `locale`
  - `accepted_at`
- Consent evidence trail persists `ip`, `user_agent`, and `recorded_at`.

5. Uncertainty and human oversight
- Signal and analysis payloads now include:
  - `uncertainty_level`
  - `actionability`
  - `human_oversight_required`
  - `oversight_note`

6. LLM safety and fallback governance
- Gemini safety threshold is now policy-driven (`GEMINI_SAFETY_MODE`: strict/balanced/off).
- External fallback is policy-gated (`ALLOW_EXTERNAL_LLM_FALLBACK`).

7. Security scanning in CI
- Added Gitleaks secret scanning to quality gate workflow.

8. Documentation coherence
- Updated policy summary token retention and hosting provider lines.

## Operational actions still required (manual)

1. Rotate and revoke all exposed secrets/keys immediately.
2. Remove real credentials from repository history (if any leaked).
3. Add lockfiles for reproducible Python environments and enforce in CI.
4. Expand thesis-grade statistical validation:
- walk-forward with embargo
- confidence intervals / bootstrap
- overfitting-aware metrics (e.g., deflated Sharpe style checks)
- stability report across seeds/regimes

## Recommended environment variables

- `MODEL_CONTRACT_REQUIRED=true`
- `ALLOW_EXTERNAL_LLM_FALLBACK=false`
- `GEMINI_SAFETY_MODE=strict`
- `POLICY_TERMS_VERSION=2026-04-04`
- `POLICY_PRIVACY_VERSION=2026-04-04`
- `MULTI_SEED_COUNT=3`
