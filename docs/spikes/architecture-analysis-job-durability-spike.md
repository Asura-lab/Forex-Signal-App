---
title: "Persist Analysis Queue and Job State"
category: "Architecture & Design"
status: "Not Started"
priority: "High"
timebox: "5 days"
created: 2026-04-04
updated: 2026-04-04
owner: "Architecture Team"
tags: ["technical-spike", "architecture", "queue", "durability"]
---

# Persist Analysis Queue and Job State

## Summary

**Spike Objective:** Replace in-memory analysis queue/job state with durable shared storage.

**Why This Matters:** `/api/market-analysis/status/<job_id>` depends on memory-resident state in `backend/app.py`, which is restart-sensitive and not scale-safe.

**Timebox:** 5 days

**Decision Deadline:** Before enabling any multi-instance API deployment.

## Research Question(s)

**Primary Question:** Which durable mechanism best fits current stack for queueing and status tracking (Redis vs Mongo)?

**Secondary Questions:**
- What job schema and TTL policy should be used?
- How can idempotency be guaranteed for pair refresh jobs?
- What polling contract changes, if any, are needed for mobile?

## Investigation Plan

### Research Tasks
- [ ] Capture current job lifecycle states and transitions.
- [ ] Prototype Redis queue + status store.
- [ ] Prototype Mongo queue/state pattern as fallback.
- [ ] Compare latency, complexity, and failure recovery.
- [ ] Recommend final design with migration plan.

### Success Criteria

**This spike is complete when:**
- [ ] Job state survives process restart in prototype.
- [ ] Poll endpoint returns stable result across retries.
- [ ] Duplicate job prevention strategy is verified.
- [ ] Cost and operational trade-offs are documented.

## Technical Context

**Related Components:** `backend/app.py` async analysis section, `mobile_app/src/services/api.ts` polling logic.

**Dependencies:** ADR-002.

**Constraints:** Keep existing API response contract backward-compatible.

## Research Findings

### Investigation Results
- Pending.

### Prototype/Testing Notes
- Pending.

### External Resources
- https://redis.io/docs/latest/
- https://www.mongodb.com/docs/manual/core/write-operations-atomicity/

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
- [ ] Add queue depth and stale job alerts

## Status History

| Date       | Status      | Notes                          |
| ---------- | ----------- | ------------------------------ |
| 2026-04-04 | Not Started | Spike created and scoped       |

---

Last updated: 2026-04-04 by Architecture Team
