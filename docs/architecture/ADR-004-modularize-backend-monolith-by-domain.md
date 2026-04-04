# ADR-004: Modularize Backend Monolith by Domain

Date: 2026-04-04
Status: Proposed

## Context
- `backend/app.py` currently holds routing, auth, data access, workers, and orchestration in one file (3437 LOC).
- Change risk and regression risk increase with concentrated ownership.

## Decision Drivers
- Maintainability and onboarding speed
- Testability by domain boundary
- Reduced merge conflicts and release risk

## Options Considered
1. Keep single-file monolith
2. Partial extraction of helpers only
3. Domain modularization with clear boundaries (auth, signals, analysis, notifications, health)

## Decision
Choose option 3: split backend into domain modules and a thin composition root.

## Consequences
### Positive
- Smaller blast radius per change.
- Domain-focused tests become easier and faster.
- Clearer ownership and review boundaries.

### Negative
- Requires phased migration plan and careful compatibility checks.
- Temporary dual-path complexity during transition.

## Follow-up
- Technical spike: `docs/spikes/architecture-backend-domain-modularization-spike.md`
- Keep API contract tests green during each extraction step.
