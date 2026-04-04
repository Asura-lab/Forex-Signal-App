# RAI-ADR-001: Trading AI Safety Baseline Audit

- Status: Accepted
- Date: 2026-04-04
- Owners: Backend + Mobile + Product

## Context
Predictrix provides AI-assisted forex analysis and signal information in a high-risk trading domain. The system is user-facing, uses automated model outputs, and includes fallback behaviors across AI providers and cached responses.

## Decision
Adopt a Responsible AI safety baseline focused on:

1. User harm prevention in trading-risk communication.
2. Model transparency and provenance communication in user-facing flows.
3. Fallback behavior disclosure and uncertainty signaling.
4. Human oversight prompts at decision-critical moments.
5. Bias/representativeness controls for market and pair coverage.
6. Governance evidence: policy-to-product traceability and monitoring KPIs.

## Mandatory Safeguards

1. Add a trading-risk guardrail banner before first signal interaction and after prolonged inactivity.
2. Expose model provenance fields in UI: model_version, generated_at, data freshness, source (fresh/stale/fallback).
3. Add structured fallback payload fields for /signal and /api/news/analyze:
   - analysis_source
   - stale
   - generated_at
   - uncertainty_level
   - actionability (advisory-only)
4. Add a human-oversight step for high-confidence calls:
   - "Double-check with independent sources"
   - "Set max loss before any execution"
5. Replace permissive LLM safety settings with safer defaults and add output policy post-filtering.
6. Add prompt-injection hardening for externally sourced text.
7. Implement consent logging for Terms/Privacy acceptance (versioned + timestamped + locale).
8. Add representativeness statement and pair-scope disclosure in all relevant screens.
9. Add monitoring and alerting for risky UX outcomes (see KPI section).
10. Create responsible AI test suites (contract + integration + copy checks).

## Alternatives Considered

- Keep current disclaimers only: rejected; insufficient for high-risk context.
- Rely on legal terms only: rejected; does not ensure in-flow user safety.
- Delay changes until model retraining: rejected; immediate UI and API controls are feasible.

## Consequences

Positive:
- Lower user harm risk from over-trust in AI outputs.
- Better transparency of model/fallback behavior.
- Improved auditability and policy alignment.

Trade-offs:
- Slightly longer user flows.
- Additional implementation and testing overhead.

## Verification

- Add Responsible AI contract tests for API payload fields.
- Add UI tests for visibility of risk and provenance labels.
- Add regression checks ensuring fallback states are explicitly communicated.

## References

- docs/TERMS_OF_SERVICE_EN.md
- docs/POLICY_SUMMARY.md
- backend/utils/market_analyst.py
- backend/ml/signal_generator_gbdt.py
- backend/app.py
- mobile_app/src/screens/PredictionScreen.tsx
- mobile_app/src/screens/SignalScreen.tsx
