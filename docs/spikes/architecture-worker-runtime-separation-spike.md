---
title: "Separate API Runtime and Background Workers"
category: "Architecture & Design"
status: "Not Started"
priority: "High"
timebox: "1 week"
created: 2026-04-04
updated: 2026-04-04
owner: "Architecture Team"
tags: ["technical-spike", "architecture", "workers", "reliability"]
---

# Separate API Runtime and Background Workers

## Summary

**Spike Objective:** Define and validate a production-safe split between HTTP API runtime and background worker runtime.

**Why This Matters:** The current API process in `backend/app.py` hosts long-running loops and request serving together, increasing blast radius and blocking horizontal scale.

**Timebox:** 1 week

**Decision Deadline:** Before any scale-out or multi-instance rollout.

## Research Question(s)

**Primary Question:** What is the lowest-risk way to run workers independently from API without breaking existing behavior?

**Secondary Questions:**
- Which startup side effects must be removed from API process bootstrap?
- Should worker dispatch use Redis queue or Mongo-backed queue first?
- How should health checks represent API-only vs worker-only status?

## Investigation Plan

### Research Tasks
- [ ] Map all background loops and dependencies in `backend/app.py`.
- [ ] Prototype separate worker entrypoint with same environment/config.
- [ ] Validate lock semantics when API and worker run separately.
- [ ] Define deployment topology for Fly and Azure.
- [ ] Document cutover and rollback steps.

### Success Criteria

**This spike is complete when:**
- [ ] API process can boot without background loop side effects.
- [ ] Worker process can run all required loops independently.
- [ ] Locking behavior is verified in dual-process mode.
- [ ] Operational runbook and rollback plan are documented.

## Technical Context

**Related Components:** `backend/app.py`, `backend/Dockerfile`, `backend/Procfile`, `backend/fly.toml`.

**Dependencies:** ADR-001.

**Constraints:** Must preserve existing endpoint contracts and current single-pair runtime policy.

## Research Findings

### Investigation Results
- Pending.

### Prototype/Testing Notes
- Pending.

### External Resources
- https://12factor.net/processes
- https://fly.io/docs/reference/configuration/

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
- [ ] Add worker/API health SLO metrics

## Status History

| Date       | Status      | Notes                          |
| ---------- | ----------- | ------------------------------ |
| 2026-04-04 | Not Started | Spike created and scoped       |

---

Last updated: 2026-04-04 by Architecture Team
