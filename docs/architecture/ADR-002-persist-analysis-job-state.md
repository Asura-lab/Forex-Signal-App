# ADR-002: Persist Analysis Job Queue and Job State

Date: 2026-04-04
Status: Proposed

## Context
- Async analysis jobs use in-memory queue/state (`_analysis_queue`, `_analysis_jobs`, `_analysis_pair_jobs`) in `backend/app.py`.
- Job visibility can be lost on process restart.
- Multi-instance routing can return unknown job IDs if request and poll hit different instances.

## Decision Drivers
- Reliability for async API contract (`/api/market-analysis`, `/api/market-analysis/status/<job_id>`)
- Consistency across restarts and potential horizontal scale
- Better observability for queued/running/failed jobs

## Options Considered
1. Keep in-memory state with single-instance deployment guarantee
2. Persist only final results, keep queue in memory
3. Use durable queue and persistent job store (Redis or Mongo-backed)

## Decision
Choose option 3: move queue and job state to durable shared storage.

## Consequences
### Positive
- Polling contract remains valid across restarts.
- Enables future multi-instance deployment safely.
- Supports replay and forensic inspection of failed jobs.

### Negative
- More infrastructure and failure modes to manage.
- Requires schema and retention policy for job lifecycle.

## Follow-up
- Technical spike: `docs/spikes/architecture-analysis-job-durability-spike.md`
- Add queue depth and job age metrics to health and alerts.
