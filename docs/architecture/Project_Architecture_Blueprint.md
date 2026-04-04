# Project Architecture Blueprint

Generated: 2026-04-04
Repository: Forex-Signal-App

## 1. Architecture Detection

### Detected Technology Stack
- Backend API: Python Flask (`backend/app.py`)
- Data store: MongoDB (`pymongo` in `backend/app.py`)
- Auth: JWT + bcrypt (`backend/app.py`)
- Background processing: In-process daemon threads + in-memory queue (`backend/app.py`)
- Market data: Yahoo Finance wrapper (compatibility naming kept from TwelveData) (`backend/utils/yfinance_handler.py`)
- AI analysis: Google GenAI with Pollinations fallback (`backend/utils/market_analyst.py`)
- Mobile app: React Native + Expo + React Navigation + React Query (`mobile_app/App.tsx`)
- Mobile API client: Axios + interceptor-based token refresh (`mobile_app/src/services/api.ts`)
- Push notifications: Expo push pipeline (backend + mobile)
- CI/CD: GitHub Actions quality gates + manual Azure release deploy (`.github/workflows/azure-deploy.yml`)
- Active hosting runtime: Fly.io config in backend (`backend/fly.toml`)

### Dominant Architecture Pattern
- Current pattern is a layered monolith with mixed responsibilities.
- Backend behavior is centralized in a single composition root and runtime module (`backend/app.py`, 3437 LOC).
- Mobile app is a feature-screen based client with a shared service layer.
- ML lifecycle is split across multiple project zones (`backend/ml`, `model & backtest result`, `Protrader`) with manual artifact handoff.

## 2. Architectural Overview

### High-Level Topology

```text
Mobile App (Expo)
  -> REST API (Flask app.py)
     -> MongoDB (users_db)
     -> External Market Data (Yahoo Finance)
     -> External AI Services (Gemini -> Pollinations fallback)
     -> Expo Push API

Background jobs run inside the same Flask process:
- signal model loader
- historical preload
- news updater
- news scheduler
- signal generator loop
- pair analysis worker + preloader
```

### Runtime Process Model
- Single-process deployment is intentionally enforced in container commands (`backend/Dockerfile`, `backend/Procfile`) because app startup triggers background thread orchestration.
- Process role controls (`APP_PROCESS_ROLE`, `BACKGROUND_WORKERS_ENABLED`) exist but worker logic still lives inside API runtime module.

## 3. Core Components

### Backend Core
- `backend/app.py`
  - API routing, auth, rate limiting, Mongo initialization, index management, background loops, health endpoints.
  - Also owns async analysis job state via in-memory structures.
- `backend/config/settings.py`
  - Runtime configuration and env loading strategy.
  - Includes strict mode toggle and fallback defaults.
- `backend/ml/signal_generator_gbdt.py`
  - Model loading, feature engineering, signal generation, confidence and ATR gating.
- `backend/utils/yfinance_handler.py`
  - Live and multi-timeframe price retrieval with cache.
- `backend/utils/market_analyst.py`
  - AI insight generation, fallback logic, news/source integrations, local caches.
- `backend/utils/push_notifications.py`
  - Push token registry, preference filtering, Expo dispatch.

### Mobile Core
- `mobile_app/App.tsx`
  - Root providers, navigation stack, auth bootstrap, push listener setup.
- `mobile_app/src/services/api.ts`
  - API abstractions and auth refresh flow.
- `mobile_app/src/services/notificationService.ts`
  - Push permission/token registration and preference APIs.
- `mobile_app/src/navigation/MainTabs.tsx`
  - Bottom tab composition.
- `mobile_app/src/screens/*`
  - Feature screens with direct service calls and UI state handling.

### ML and Research Zones
- `backend/ml/models/*` for runtime inference artifacts.
- `model & backtest result/code/*` for one training/backtest pipeline.
- `Protrader/scripts/*` for another training/backtest pipeline.

## 4. Layering and Dependencies

### Backend Dependency Flow (Current)

```text
app.py
  -> config.settings
  -> utils.yfinance_handler
  -> utils.market_analyst
  -> ml.signal_generator_gbdt
  -> utils.push_notifications
  -> Mongo collections and indexes
  -> background thread orchestration
```

Observations:
- Dependency direction is mostly inward but orchestration and domain logic are not separated by module boundaries.
- Startup side effects happen during import/runtime initialization.

### Mobile Dependency Flow (Current)

```text
Screens
  -> services/api.ts
      -> axios client + token refresh
      -> config/api.ts
  -> context providers (theme, alert)
  -> navigation
```

Observations:
- Service boundary exists and is reused, but screens still hold significant API-specific error branching and data transformation.

## 5. Data Architecture

### Primary Mongo Collections
- `users`
- `verification_codes` (TTL on `expires_at`)
- `reset_codes` (TTL on `expires_at`)
- `refresh_tokens` (hash-based token tracking + TTL)
- `signals`
- `in_app_notifications` (TTL via `expires_at`)
- `job_locks` (TTL lock documents)
- push collections in push service (`push_tokens`, `notified_events`)

### Data Access Pattern
- Direct collection operations in route handlers and utility classes.
- No repository abstraction layer.
- Query policies for trusted signal reads are encoded in helper functions in `app.py`.

## 6. Cross-Cutting Concerns

### Security
- JWT includes issuer/audience/type/jti checks.
- Passwords hashed with bcrypt.
- Auth and public endpoint rate limiting exists with Redis optional backend.
- Production guard exists for test notification endpoint.

### Reliability
- Background worker locking with Mongo-based lease docs.
- Health endpoints expose background job status snapshot.
- Analysis circuit breaker exists for repeated failures.

### Configuration
- Environment-driven toggles are implemented but distributed between settings and runtime module.
- Fallback credentials/defaults still possible when strict secret mode is disabled.

### Observability
- Logging exists, but mostly plain logs and print statements.
- No durable metrics/tracing pipeline in repository.

## 7. Service Communication Patterns

- Mobile to backend is synchronous REST over HTTP.
- Backend to external providers is synchronous request/response.
- Internal async work uses in-process thread loops and in-memory queue.
- Async analysis API pattern is queue + poll endpoint, but queue/job state is memory-resident.

## 8. Deployment Architecture

### Backend
- Fly.io config present with health checks and always-on machine settings.
- Container image includes model artifacts from backend directory.
- Single worker process configured due in-process scheduler threads.

### CI/CD
- Quality gates run on PR/push/main.
- Azure deployment is explicit manual workflow with confirmation gate.

## 9. Testing Architecture

- Contract and security tests for backend endpoints in `tests/`.
- Mobile unit tests for core helpers/components/token storage.
- Gaps: limited integration testing for background worker behavior and queue durability across restarts.

## 10. Extension/Evolution Guidance

### Safe Extension Points
- New API routes should be isolated in blueprints/modules before adding behavior.
- New data providers should implement explicit adapter interface instead of direct utility calls.
- New model artifacts should follow versioned metadata contract and loading policy.

### Current Hotspots
- `backend/app.py` is a change-risk hotspot due to concentration.
- `mobile_app/src/screens/ProfileScreen.tsx` mixes policy content, settings orchestration, and account flows.
- AI analysis and signal paths have duplicated shaping logic across backend + mobile.

## 11. Identified Architecture Decisions To Track

Related ADRs created in this repository:
- `docs/architecture/ADR-001-separate-api-and-background-workers.md`
- `docs/architecture/ADR-002-persist-analysis-job-state.md`
- `docs/architecture/ADR-003-unify-training-serving-model-contract.md`
- `docs/architecture/ADR-004-modularize-backend-monolith-by-domain.md`

## 12. Blueprint Summary For New Development

When implementing a new capability:
1. Add API contract in mobile service layer first.
2. Add backend handler in modular domain package (target pattern), not directly into monolith root.
3. Add collection/index contract and test coverage.
4. Add rate-limit policy and failure-mode behavior.
5. Add observability fields to health/status if long-running or async.

Current architecture can support incremental extension, but scaling and reliability risk is dominated by monolithic runtime composition and in-process worker coupling.
