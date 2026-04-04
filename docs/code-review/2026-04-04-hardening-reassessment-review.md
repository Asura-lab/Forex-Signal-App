# Code Review: Hardening Reassessment (Forex-Signal-App)
**Date**: 2026-04-04
**Ready for Production/Public Demo**: No
**Critical Issues**: 1

## Priority 1 (Must Fix) ⛔
- Live secrets are still present in local env file, including JWT secret, DB credentials, SMTP password, and third-party API keys.
  - Location: `backend/config/.env`
  - Risk: Immediate account/session compromise, data exfiltration, and paid API abuse if file is copied, logged, shared, or accidentally committed.
  - Fix: Rotate all exposed secrets now; revoke old keys; replace with placeholder-only local files; enforce secrets from managed vault only in demo/prod runtime.

## Priority 2 (High) ⚠️
- Mobile dependency audit reports multiple high vulnerabilities in production dependency graph.
  - Evidence: `npm audit --omit=dev --audit-level=high --json` (19 total, 18 high)
  - Key packages: `expo`, `expo-notifications`, `expo-splash-screen`, `@expo/*`, `fast-xml-parser`, `lodash`, `node-forge`, `tar`
  - Fix: Plan Expo SDK major upgrade path (recommended fix points to Expo 55.x), regenerate lockfile, re-run audit gate until high=0.

- Weak password policy baseline still allows 6-character passwords.
  - Location: `backend/app.py` (`/auth/register`, `/auth/reset-password`, `/auth/change-password`)
  - Risk: Credential stuffing/bruteforce success probability remains high for public demo accounts.
  - Fix: Enforce >=12 chars (or entropy policy), breached password screening, and lockout/backoff for repeated failures.

- Security claims in policy documents are not fully aligned with implementation details.
  - Location: `docs/PRIVACY_POLICY_EN.md`, `docs/POLICY_SUMMARY.md` versus `backend/config/settings.py`, `mobile_app/src/services/authTokenStorage.ts`
  - Risk: Compliance and publication credibility risk (misrepresentation).
  - Fix: Update legal/policy text to exactly match implementation and deployment mode used in thesis demo.

## Security Gains Verified ✅
- Secret-manager-first runtime controls exist (`STRICT_RUNTIME_SECRETS`, production checks) and Fly deploy preflight validates required secrets.
- Access+refresh token lifecycle hardened: issuer/audience/type/jti claims, refresh token hashing, rotation, per-token and per-user revocation.
- Rate limiting expanded to auth and public AI endpoints; protected endpoints (`/signal/save`, `/health/details`) require token.
- Contract/security tests pass (scope lock, auth/session, API contract, security guards).
- CI quality gate includes gitleaks and dependency audits.

## Recommended Changes (Focused)
```python
# Password policy hardening example
if len(password) < 12:
    return jsonify({'error': 'Password must be at least 12 characters'}), 400
```

```bash
# Immediate operational sequence
1) Rotate/revoke all keys currently present in backend/config/.env
2) Remove any historic secret exposure from git history if previously committed
3) Upgrade Expo dependency chain to remove high-severity advisories
4) Re-run: npm audit --omit=dev --audit-level=high
```
