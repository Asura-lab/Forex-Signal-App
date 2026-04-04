# Code Review: Forex-Signal-App Security
**Date:** 2026-04-04  
**Ready for Production:** No  
**Critical Issues:** 1

## Review Method
- Security-first audit of backend + mobile code paths.
- Explicitly applied `ai-prompt-engineering-safety-review` to AI prompt surfaces in `backend/utils/market_analyst.py`.
- Explicitly applied `doublecheck` pipeline:
  - Layer 1: claim extraction from code and configs.
  - Layer 2: evidence validation via file-level references and Git tracking checks.
  - Layer 3: adversarial review for abuse, injection, and misconfiguration paths.

## Priority 1 (Must Fix) ⛔

### 1) CRITICAL — Local plaintext secrets contain production-grade credentials
- Evidence:
  - `backend/config/.env:1`
  - `backend/config/.env:2`
  - `backend/config/.env:8`
  - `backend/config/.env:11`
- Risk/Exploit:
  - File contains JWT secret, MongoDB URI with credentials, SMTP password, and API keys.
  - If copied, leaked, or accidentally committed/shared, attacker can mint tokens, access DB, and abuse paid APIs.
- Fix:
  - Rotate all exposed credentials immediately.
  - Enforce secret-manager-only runtime and prohibit local real credentials.
  - Add CI secret scanning gate.

### 2) HIGH — Secret policy allows insecure fallback key and non-strict runtime defaults
- Evidence:
  - `backend/config/settings.py:29`
  - `backend/config/settings.py:44`
  - `backend/config/settings.py:36`
- Risk/Exploit:
  - If runtime secrets are missing, backend starts with known static JWT key (`dev-insecure-secret-key-change-me`) and localhost Mongo fallback.
  - This creates broken-auth conditions and potential token forgery in misconfigured environments.
- Fix:
  - Default `STRICT_RUNTIME_SECRETS=true` in all non-test environments.
  - Remove static fallback key entirely.

### 3) HIGH — Rate-limit identity can be bypassed via forwarded-IP trust misconfiguration
- Evidence:
  - `backend/app.py:82`
  - `backend/app.py:87`
  - `backend/app.py:89`
  - `backend/app.py:370`
- Risk/Exploit:
  - Rate limit keys are IP-based and derive from `request.access_route`.
  - With wrong proxy topology or direct exposure, spoofed forwarding headers can evade throttling.
- Fix:
  - Trust forwarding headers only from known ingress.
  - Prefer edge/WAF rate limit and signed client identity for auth endpoints.

### 4) HIGH — Public endpoints with no throttle increase abuse and scraping risk
- Evidence:
  - `backend/app.py:2121` (`/rates/specific`)
  - `backend/app.py:2244` (`/signal/demo`)
  - `backend/app.py:2337` (`/signal/check`)
  - `backend/app.py:3129` (`/api/news`)
  - Contrast with protected endpoints: `backend/app.py:2089`, `backend/app.py:2156`, `backend/app.py:3176`
- Risk/Exploit:
  - Attackers can generate high request volumes against external-provider-backed flows and expensive computations.
- Fix:
  - Add `enforce_public_rate_limit(...)` consistently to all public data/analysis routes.

### 5) HIGH — Mobile Android app allows cleartext traffic and backup
- Evidence:
  - `mobile_app/android/app/src/main/AndroidManifest.xml:14`
- Risk/Exploit:
  - `usesCleartextTraffic=true` permits plaintext HTTP.
  - `allowBackup=true` can expose app data through backup extraction paths on compromised/debug contexts.
- Fix:
  - Set `usesCleartextTraffic=false` for release.
  - Set `allowBackup=false` for release.
  - Use network security config with strict TLS policy.

## Priority 2 (Should Fix)

### 6) MEDIUM — Unbounded history query size enables expensive DB responses
- Evidence:
  - `backend/app.py:2529`
- Risk/Exploit:
  - `limit` is user-controlled and unbounded for `/signals/history`.
  - Can drive memory-heavy responses and DB load spikes.
- Fix:
  - Clamp limit (for example 1..200) and return 400 for invalid values.

### 7) MEDIUM — Access token lifecycle is not revocation-aware
- Evidence:
  - `backend/app.py:1215`
  - `backend/app.py:1220`
  - `backend/app.py:1606`
  - `backend/app.py:1615`
  - `backend/app.py:1617`
  - `backend/app.py:1745`
  - `backend/app.py:1803`
- Risk/Exploit:
  - Logout/password changes revoke refresh tokens, but issued access tokens remain valid until expiry.
- Fix:
  - Add jti denylist or token versioning check on access tokens.

### 8) MEDIUM — Refresh token sent in request body increases log-leak surface
- Evidence:
  - `backend/app.py:1581`
  - `mobile_app/src/services/api.ts:78`
  - `mobile_app/src/services/api.ts:342`
- Risk/Exploit:
  - Refresh token may be captured by middleware, request logging, traces, or crash tooling.
- Fix:
  - Move refresh token to secure HttpOnly cookie pattern where feasible, or enforce explicit redaction at all logs/APM layers.

### 9) MEDIUM — Token storage can fall back to AsyncStorage
- Evidence:
  - `mobile_app/src/services/authTokenStorage.ts:15`
  - `mobile_app/src/services/authTokenStorage.ts:61`
  - `mobile_app/src/services/authTokenStorage.ts:87`
- Risk/Exploit:
  - On devices/runtime where SecureStore is unavailable, auth/refresh tokens are persisted in less secure storage.
- Fix:
  - Fail closed for auth token persistence when SecureStore unavailable (or encrypt with hardware-backed key management).

### 10) HIGH — LLM prompt injection and poisoning surface via unsanitized inputs
- Evidence:
  - `backend/utils/market_analyst.py:523`
  - `backend/utils/market_analyst.py:528`
  - `backend/utils/market_analyst.py:597`
  - `backend/utils/market_analyst.py:602`
  - `backend/utils/market_analyst.py:687`
  - `backend/utils/market_analyst.py:692`
- Risk/Exploit:
  - User/event/external-news strings are interpolated directly into prompts.
  - Malicious content can alter model behavior, leak system constraints, or skew analysis outputs.
- Fix:
  - Introduce structured prompt template with strict input delimiting and sanitization.
  - Add allow-list normalization for event fields and max-length limits.

### 11) MEDIUM — LLM output handling is permissive and resilient to malformed data, but not strict
- Evidence:
  - `backend/utils/market_analyst.py:792`
  - `backend/utils/market_analyst.py:798`
- Risk/Exploit:
  - Regex extraction + `ast.literal_eval` acceptance path may parse non-canonical outputs.
  - This increases ambiguity and can allow malformed or policy-violating data into downstream logic.
- Fix:
  - Enforce strict JSON schema validation and reject non-compliant model outputs.

### 12) MEDIUM — Internal exception details are returned to clients
- Evidence:
  - `backend/app.py:2023`
  - `backend/app.py:2392`
  - `backend/app.py:3170`
  - `backend/app.py:3395`
- Risk/Exploit:
  - Raw error strings expose internals useful for reconnaissance.
- Fix:
  - Return generic user-safe errors and log detailed exception metadata server-side only.

## Recommended Security Tests to Add
- Contract test: non-rate-limited public routes must fail CI unless explicitly allowlisted.
- Auth lifecycle test: logout/password-reset invalidates both refresh and active access sessions.
- Input fuzz tests: `/signals/history` rejects extreme/non-numeric limit values deterministically.
- LLM prompt safety tests: injected instructions in event titles/news do not override system constraints.
- LLM output schema tests: invalid/extra fields are rejected and never returned downstream.
- Mobile config test: release manifest enforces `allowBackup=false` and `usesCleartextTraffic=false`.

## Monitoring & Residual Risk Controls
- Add auth anomaly alerts: refresh rotation failures, burst 401/429 ratios, unusual IP churn.
- Log redaction policy: never store token/secret-bearing fields in API logs and APM traces.
- Add provider budget/usage alerts for AI/news endpoints to detect abuse spikes early.
- Maintain secret rotation runbook and quarterly key-rotation drill.

## Concrete Fix Snippets

### Enforce strict runtime secrets (backend/config/settings.py)
```python
STRICT_RUNTIME_SECRETS = _as_bool(os.getenv('STRICT_RUNTIME_SECRETS', 'true'))

SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    raise ValueError('SECRET_KEY must be set via secret manager')
```

### Clamp history limit (backend/app.py)
```python
raw_limit = request.args.get('limit', '50')
try:
    limit = int(raw_limit)
except ValueError:
    return jsonify({'success': False, 'error': 'limit must be integer'}), 400

limit = max(1, min(limit, 200))
```

### Harden Android release manifest
```xml
<application
    android:allowBackup="false"
    android:usesCleartextTraffic="false" />
```
