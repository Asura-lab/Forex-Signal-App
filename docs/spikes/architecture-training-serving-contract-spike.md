---
title: "Unify Training-Serving Feature and Artifact Contract"
category: "Architecture & Design"
status: "Not Started"
priority: "High"
timebox: "1 week"
created: 2026-04-04
updated: 2026-04-04
owner: "ML Platform"
tags: ["technical-spike", "architecture", "mlops", "model-governance"]
---

# Unify Training-Serving Feature and Artifact Contract

## Summary

**Spike Objective:** Define a single shared contract for feature definitions, model metadata, and artifact promotion into backend runtime.

**Why This Matters:** Feature logic is duplicated across `backend/ml/signal_generator_gbdt.py` and research pipelines (`model & backtest result`, `Protrader`), creating training-serving skew risk.

**Timebox:** 1 week

**Decision Deadline:** Before next production model replacement.

## Research Question(s)

**Primary Question:** How should feature schema and model metadata be versioned and validated at runtime?

**Secondary Questions:**
- Can a shared Python package host feature definitions for both training and serving?
- What artifact manifest fields are mandatory (feature hash, train period, label settings)?
- What promotion path is needed from training output to `backend/ml/models`?

## Investigation Plan

### Research Tasks
- [ ] Compare feature code and parameters across all model pipelines.
- [ ] Draft contract schema for model metadata and feature hash.
- [ ] Build startup validator prototype in backend.
- [ ] Define artifact registry/promotion workflow.
- [ ] Document rollback and compatibility policy.

### Success Criteria

**This spike is complete when:**
- [ ] Shared contract draft is reviewed.
- [ ] Runtime can reject incompatible artifacts in prototype.
- [ ] Promotion flow has explicit versioning and changelog points.
- [ ] Migration path from current artifacts is documented.

## Technical Context

**Related Components:** `backend/ml/signal_generator_gbdt.py`, `backend/ml/models/*`, `model & backtest result/code/*`, `Protrader/scripts/*`.

**Dependencies:** ADR-003.

**Constraints:** Preserve current single-model runtime policy while adding metadata validation.

## Research Findings

### Investigation Results
- Pending.

### Prototype/Testing Notes
- Pending.

### External Resources
- https://mlflow.org/docs/latest/model-registry.html
- https://docs.dvc.org/

## Decision

### Recommendation
- Pending spike outcome.

### Rationale
- Pending spike outcome.

### Implementation Notes
- Pending spike outcome.

### Follow-up Actions
- [ ] Create implementation tasks
- [ ] Update architecture documents
- [ ] Add model contract checks to CI

## Status History

| Date       | Status      | Notes                          |
| ---------- | ----------- | ------------------------------ |
| 2026-04-04 | Not Started | Spike created and scoped       |

---

Last updated: 2026-04-04 by ML Platform
