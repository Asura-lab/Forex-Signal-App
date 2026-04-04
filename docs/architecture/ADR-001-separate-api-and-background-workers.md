# ADR-001: Separate API Runtime and Background Workers

Date: 2026-04-04
Status: Proposed

## Context
- `backend/app.py` runs HTTP APIs and multiple long-running worker loops in the same process.
- Deployment is pinned to one worker process to avoid duplicate background execution.
- Current design reduces horizontal scaling flexibility and raises blast radius for failures.

## Decision Drivers
- Reliability under scale and restarts
- Independent scaling of API latency paths vs background throughput
- Operational simplicity for incident response

## Options Considered
1. Keep in-process workers inside API runtime
2. Keep current structure but split by `APP_PROCESS_ROLE` deployments
3. Move background jobs to dedicated worker service/process entrypoint

## Decision
Choose option 3: isolate background jobs into dedicated worker process(es), while API process remains request/response only.

## Consequences
### Positive
- API scale can increase without duplicating long-running loops.
- Worker crash does not directly impact HTTP serving path.
- Deployment and rollback can target API/worker independently.

### Negative
- Requires new process bootstrap and operational runbooks.
- Requires durable/shared queue contracts for jobs currently kept in memory.

## Follow-up
- Technical spike: `docs/spikes/architecture-worker-runtime-separation-spike.md`
- Define worker health contract and alerting thresholds.
