# Predictrix Improvement TODO

_Last updated: 2026-04-03_

## Scope Lock
- This improvement cycle keeps the trading model scope fixed to **EUR/USD only**.
- No multi-pair model expansion is included in this cycle.

## Completed In This Cycle
- [x] Auth API compatibility routes added in backend:
  - `/auth/verify-reset-code`
  - `/auth/update`
  - `/auth/change-password`
  - File: `backend/app.py`
- [x] Demo OTP/code leakage hardened:
  - Verification/reset codes are not returned by default.
  - Optional dev-only override: `ALLOW_DEMO_AUTH_CODES=true`
  - File: `backend/app.py`
- [x] Profile local storage key mismatch fixed:
  - Read fallback for `userData` and `@user_data`
  - Save both keys to keep compatibility
  - File: `mobile_app/src/screens/ProfileScreen.tsx`
- [x] Mobile Jest coverage compatibility fix:
  - `minimatch` override changed to a Jest-compatible version
  - File: `mobile_app/package.json`
- [x] Auth endpoint дээр lightweight rate-limiting нэмсэн:
  - Register, verify, resend, login, forgot, verify-reset, reset
  - Env config: `AUTH_RATE_LIMIT_MAX_REQUESTS`, `AUTH_RATE_LIMIT_WINDOW_SECONDS`
  - File: `backend/app.py`

## Next Priority TODO
- [x] Add strict CORS allowlist per environment
  - `CORS_ALLOWED_ORIGINS` env allowlist (fallback to localhost + production domains)
  - File: `backend/app.py`
- [x] Add CI quality gates (test + lint + basic security scan)
  - Added `quality-gates` job before deploy:
    - Python lint/syntax checks (`ruff`, `compileall`)
    - API contract check (`tests/test_api_contract.py`)
    - Dependency audit (`pip-audit`)
    - Mobile unit tests (`npm test -- --watch=false`)
  - File: `.github/workflows/azure-deploy.yml`
- [x] Add structured logging + alerting for background jobs
  - Standard logging setup (`logging.basicConfig`) with timestamp/level format
  - Background jobs now publish state to health payload (`ok/error/age`)
  - File: `backend/app.py`
- [x] Add API contract tests between mobile client and backend routes
  - Added endpoint contract test for mobile-used routes
  - File: `tests/test_api_contract.py`
- [x] Add Responsible AI labels in UI (real/cached/stale/fallback)
  - Source badge + generated time label in signal analysis card
  - Files: `mobile_app/src/services/api.ts`, `mobile_app/src/screens/SignalScreen.tsx`

## Validation Checklist
- [x] Backend error check passed
- [x] Mobile error check passed
- [x] Jest coverage run passed after override change
- [x] API contract test passed locally (`python tests/test_api_contract.py`)
- [x] Auth flows manually verified on app (update profile/change password/forgot flow)

## Phase 2 Audit-Driven TODO (2026-04-03)

### Completed In This Session
- [x] Secret management P0 hardening (local plaintext exposure closure)
  - `backend/config/.env`-ийг sanitized template болгож plaintext credential-үүдийг устгасан
  - `backend/config/settings.py` дээр secret manager-first policy (`ALLOW_LOCAL_DOTENV`, `STRICT_RUNTIME_SECRETS`) нэмсэн
  - `backend/deploy_fly.ps1` дээр local `.env` import-ийг бүрэн унтрааж Fly secret manager preflight check нэмсэн
  - `mobile_app/eas.json` preview profile-г remote credentials болгосон
  - `mobile_app/credentials.json` plaintext утгуудыг placeholder болгож цэвэрлэсэн
  - Files: `backend/config/settings.py`, `backend/config/.env`, `backend/config/.env.example`, `backend/deploy_fly.ps1`, `mobile_app/eas.json`, `mobile_app/credentials.json`
- [x] Auth/session lifecycle-г production-grade болгосон
  - Access + refresh token strategy нэвтрүүлсэн (`/auth/refresh`, `/auth/logout`)
  - JWT claim hardening: `iss`, `aud`, `jti`, `type`, `iat`, `nbf`, `exp`
  - Refresh token rotation + revoke flow + password change/reset үед session revoke
  - Files: `backend/app.py`, `backend/config/settings.py`, `mobile_app/src/services/api.ts`, `mobile_app/src/services/authTokenStorage.ts`
- [x] Distributed rate-limit P0
  - Redis-backed limiter + memory fallback
  - Trusted proxy-safe client IP resolution (`ProxyFix`, `TRUSTED_PROXY_COUNT`)
  - Endpoint-specific public quota нэмсэн (`/rates/live`, `/signal`, `/predict`, `/signals/*`)
  - Files: `backend/app.py`, `backend/requirements.txt`, `requirements.txt`
- [x] Legacy API drift цэвэрлэсэн
  - Deprecated/unused `auth.ts`, `predictionService.ts` файлуудыг устгасан
  - `mobile_app/src/config/api.ts` endpoint constants-ийг backend contract-тэй нийцүүлсэн
  - Files: `mobile_app/src/services/auth.ts`, `mobile_app/src/services/predictionService.ts`, `mobile_app/src/config/api.ts`
- [x] Auth token verification + Bearer parsing hardening
  - `verify_token` дээр bare-except-ийг JWT-specific exception handling болгосон
  - `Authorization` header parsing-г helper-р нэгтгэж notification endpoint-уудад ижил хамгаалалт хэрэглэсэн
  - File: `backend/app.py`
- [x] Mobile app auth bootstrap-г SecureStore accessor-той нийцүүлсэн
  - `App.tsx` дээрх `AsyncStorage.getItem("userToken")` дуудлагуудыг `getAuthToken()` болгосон
  - Foreground sync болон startup auth check хоёул нэг storage contract ашигладаг болсон
  - File: `mobile_app/App.tsx`
- [x] EUR/USD-only scope-г API boundary дээр enforce хийсэн
  - Endpoints: `/signal`, `/predict`, `/signal/check`, `/signal/save`, `/signals/history`, `/signals/stats`, `/signals/latest`, `/rates/specific`
  - Unsupported pair үед `400` + `supported_pairs` буцаана
  - File: `backend/app.py`
- [x] Security hardening нэмсэн
  - `/signal/save` endpoint-д token required болгосон
  - `/api/news/analyze`, `/api/market-analysis` дээр public rate-limit нэмсэн
  - `/notifications/test` endpoint production default-д хаалттай болгосон (`ALLOW_TEST_NOTIFICATION_ENDPOINT`-оор зөвшөөрнө)
  - File: `backend/app.py`
- [x] News/Rates API contract зөрүү зассан
  - Mobile `past` type-ийг backend canonical `history` болгон normalize хийсэн
  - Backend талд мөн `past -> history` backward compatibility нэмсэн
  - File: `backend/app.py`, `mobile_app/src/services/api.ts`
- [x] EUR/USD scope regression хамгаалах тест өргөтгөсөн
  - `TRADING_SCOPE_PAIR`, `SIGNAL_PAIRS`, `PRELOADED_ANALYSIS_PAIRS` lock шалгалт
  - File: `tests/test_scope_lock.py`
- [x] Security contract regression тест нэмсэн
  - `/signal/save` token guard, AI endpoint rate-limit, production push-test guard, market-analysis scope lock
  - File: `tests/test_security_contract.py`
- [x] SecureStore token migration хийсэн
  - Auth token storage-г `expo-secure-store` + legacy AsyncStorage fallback/migration болгосон
  - Files: `mobile_app/src/services/authTokenStorage.ts`, `mobile_app/src/services/api.ts`, `mobile_app/src/services/notificationService.ts`, `mobile_app/package.json`
  - Regression test: `mobile_app/src/services/__tests__/authTokenStorage.test.ts`
- [x] Mongo index hardening хийсэн
  - `users.email` unique index
  - `verification_codes` болон `reset_codes` дээр email unique + expires_at TTL index
  - Mongo client timeout/pool тохиргоо нэмсэн
  - Files: `backend/app.py`, `backend/utils/push_notifications.py`, `tests/test_mongo_index_contract.py`
- [x] PR gate + mobile audit алхам нэмсэн
  - `pull_request -> main` trigger нэмсэн
  - Mobile dependency audit (`npm audit --omit=dev --audit-level=high`) advisory алхам нэмсэн
  - File: `.github/workflows/azure-deploy.yml`
- [x] Deployment source-of-truth нэгтгэсэн (Fly current, Azure release)
  - PR/push дээр зөвхөн quality gates ажиллана
  - Azure deploy-г `workflow_dispatch` + `DEPLOY_AZURE` explicit confirmation-оор manual болгосон
  - Mobile production URL-г `EXPO_PUBLIC_API_BASE_URL` env-ээр Azure руу амархан шилжүүлэхээр бэлдсэн
  - Files: `.github/workflows/azure-deploy.yml`, `mobile_app/src/config/api.ts`, `README.md`

### Next Priority
- [x] MongoDB reliability hardening (users email unique index, verification/reset TTL index)
- [x] Mobile token storage-г SecureStore руу migrate хийх
- [x] CI дээр PR trigger + mobile security audit алхам нэмэх
- [x] Deployment source-of-truth нэгтгэх (Azure vs Fly)

### Next Priority QA Strategy (Global Team)
- [ ] P0: SecureStore migration test gates
  - TOKEN-01: Login/verify үед token зөв accessor-оор хадгалагдах
  - TOKEN-02: Legacy AsyncStorage -> SecureStore автоматаар migrate болох
  - TOKEN-03: Logout/401 дээр token бүрэн цэвэрлэгдэх
  - TOKEN-04: Push notification auth flow migration дараа эвдрэхгүй байх
- [ ] P0: Mongo reliability test gates
  - MONGO-01: users.email unique + verification/reset TTL index bootstrap баталгаажих
  - MONGO-02: Давхардсан email бүртгэл deterministic conflict буцаах
  - MONGO-03: Expired code verify/reset үед deterministic reject хийх
- [ ] P1: CI PR + security gates
  - `pull_request -> main` trigger идэвхжүүлэх
  - `npm audit --audit-level=high` gate нэмэх
  - PR дээр lint/tests/audit бүгд гүйж merge block хийх
- [ ] P1: Deployment source-of-truth gates
  - Нэг deploy authority сонгож нөгөөг auto горимоос гаргах (✅ done)
  - Post-deploy smoke: `/health` болон background status талбарууд шалгах
