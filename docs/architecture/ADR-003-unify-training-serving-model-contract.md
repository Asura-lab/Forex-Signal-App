# ADR-003: Unify Training-Serving Model Contract and Artifact Registry

Date: 2026-04-04
Status: Proposed

## Context
- Runtime model loading is fixed in `backend/ml/signal_generator_gbdt.py`.
- Training/backtest code exists in at least two separate pipelines (`model & backtest result`, `Protrader`) plus backend runtime folder.
- Feature definitions are duplicated and manually kept in sync.

## Decision Drivers
- Prevent training-serving skew
- Improve reproducibility and release safety
- Simplify rollback and provenance tracking

## Options Considered
1. Keep manual artifact copy and duplicated feature logic
2. Keep separate pipelines but add manual checklist
3. Define single model contract package and versioned artifact registry

## Decision
Choose option 3: create shared contract module for features/metadata and adopt versioned artifact promotion flow.

## Consequences
### Positive
- Reduces model mismatch incidents.
- Enables reproducible model promotion with metadata checks.
- Easier audit of which model version served each signal.

### Negative
- Requires migration of existing scripts and release tooling.
- Requires contract governance and compatibility policy.

## Follow-up
- Technical spike: `docs/spikes/architecture-training-serving-contract-spike.md`
- Add startup validation for feature schema hash and artifact metadata.
