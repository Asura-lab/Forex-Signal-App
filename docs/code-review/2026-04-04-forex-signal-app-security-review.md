# Code Review: Forex-Signal-App Security & Compliance
**Date**: 2026-04-04
**Ready for Production**: No
**Critical Issues**: 5

## Priority 1 (Must Fix) 
- Exposed live secrets in local env file (DB URI, JWT secret, SMTP credentials, API keys) indicate immediate credential compromise risk if ever committed/shared.
  - Location: backend/config/.env
  - Fix: Rotate all credentials immediately and move to managed secrets (Fly/Azure). Remove file from repository/history.
- Mobile signing artifacts present in workspace (keystore + credentials file), creating release-signing takeover risk if leaked.
  - Location: mobile_app/predictrix.keystore, mobile_app/credentials.json
  - Fix: Rotate keystore/credentials, move to remote EAS secrets, ensure files never leave secure CI vault.
- LLM safety posture too permissive for externally supplied inputs; safety thresholds set to BLOCK_NONE and prompt-injection controls are weak.
  - Location: backend/utils/market_analyst.py
  - Fix: Restrict model safety thresholds, add strict schema validation and instruction/data boundary defenses, disable unsafe fallbacks for untrusted inputs.
- External fallback LLM endpoint may exfiltrate user-provided payloads and research data to a third-party service.
  - Location: backend/utils/market_analyst.py
  - Fix: Disable third-party fallback in production, require approved processor contracts and DPA before any transfer.
- Authentication hardening gap: password minimum length is only 6 characters.
  - Location: backend/app.py
  - Fix: Enforce >= 12 chars (or NIST-compliant entropy checks), breached-password screening, and lockout/step-up protections.

## High Priority
- Broad exception text returned to clients leaks internal state.
  - Location: backend/app.py, multiple endpoints with str(e)
- CORS defaults include localhost/expo origins by default; production should explicitly pin trusted origins.
  - Location: backend/app.py
- Rate limiting can fall back to per-instance memory; distributed bypass possible in multi-instance deployments.
  - Location: backend/app.py
- Python dependencies use open version ranges without a lockfile; non-deterministic supply-chain risk.
  - Location: backend/requirements.txt, requirements.txt

## Medium Priority
- Public endpoints for heavy analysis remain unauthenticated (with only IP rate limits), increasing abuse/DoS exposure.
  - Location: backend/app.py
- Policy-to-implementation mismatch risk (token lifetime, local storage behavior, stated compliance claims).
  - Location: docs/POLICY_SUMMARY.md, docs/PRIVACY_POLICY_EN.md, mobile_app/src/services/authTokenStorage.ts, backend/config/settings.py

## Key Strengths
- JWT includes issuer/audience/type claims and refresh-token rotation/revocation mechanisms.
- Refresh tokens stored hashed with revocation + TTL index support.
- Security contract tests exist for route protection and auth/session flows.
- Mobile token storage uses SecureStore with migration path.
- Runtime separation between API and worker processes exists for deployment hygiene.

## Recommended Immediate Hardening Checklist
1. Revoke and rotate all credentials observed in repository/workspace.
2. Enforce secret scanning in CI (gitleaks/trufflehog) and pre-commit hooks.
3. Disable unsafe LLM fallback and tighten model safety/validation controls.
4. Raise password policy baseline and add account lockout controls.
5. Replace open dependency ranges with pinned/locked versions and run vulnerability scans.
6. Replace verbose error responses with generic client-safe messages.
7. Lock CORS to production domains only and verify reverse-proxy trust settings.
8. Confirm data-retention and privacy-policy statements against real system behavior.
9. Add explicit research consent/ethics workflow for participant data and logging.

## Compliance Notes for Research Use
- Prepare IRB/ethics protocol with informed consent and risk disclosure for AI-generated signals.
- Apply data minimization and pseudonymization in logs/analytics.
- Document lawful basis, retention schedule, and cross-border transfer controls.
- Validate all public privacy/compliance claims (GDPR/CCPA/ISO/SOC2) with evidence and governance artifacts before publication.
