# Predictrix Forex Signal App

Predictrix is an AI-assisted EUR/USD signal platform with:
- React Native mobile app (Expo)
- Flask backend API
- GBDT-based signal generation pipeline
- MongoDB persistence
- Push notifications for signal events

This repository contains production app/backend code and research outputs used in the graduation project.

## 1. Repository Structure

- `backend/` Flask API, signal generation, integrations, notifications
- `mobile_app/` React Native app (Expo)
- `docs/` policy and legal docs
- `mt5/` MetaTrader 5 backtest EA
- `model & backtest result/` experiment reports, results, and training/backtest artifacts
- `tests/` local debug and test scripts
- `diplom/` thesis repository linked from this workspace

## 2. Backend Overview

Main entry:
- `backend/app.py`

Signal model runtime:
- `backend/ml/signal_generator_gbdt.py`

Model artifacts:
- `backend/ml/models/EURUSD_gbdt.pkl` (baseline)
- `backend/ml/models/EURUSD_gbdt_experimental.pkl` (experimental)

Model selection priority at runtime:
1. `GBDT_MODEL_PATH` (explicit absolute/relative path)
2. `GBDT_MODEL_VARIANT` (`baseline` or `experimental`)
3. Default auto selection: experimental if available, otherwise baseline

Optional confidence save threshold:
- `SAVE_CONFIDENCE_THRESHOLD` (float in [0, 1], clamped)

## 3. Mobile App Overview

Main entry:
- `mobile_app/App.tsx`

Key modules:
- Authentication flow and persisted session
- Signal list/details with market outlook labels
- Push notification registration and token handling

## 4. Local Setup

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Mobile (Expo)

```bash
cd mobile_app
npm install
npm start
```

## 5. Production Model Activation

Use these environment variables in backend deployment:

```bash
# Recommended: keep experimental active
GBDT_MODEL_VARIANT=experimental
SAVE_CONFIDENCE_THRESHOLD=0.90
```

Force a specific file:

```bash
GBDT_MODEL_PATH=backend/ml/models/EURUSD_gbdt_experimental.pkl
```

Rollback to baseline without code change:

```bash
GBDT_MODEL_VARIANT=baseline
```

## 6. Deployment Notes

- Ensure backend can read model file path configured by env.
- Verify startup logs print active model file and model version.
- Validate health endpoint and at least one signal generation cycle after deploy.
- Keep `Protrader/` as local-only research workspace (ignored in this repo).

## 7. Data and Large File Policy

- Large datasets and temporary training artifacts should stay out of git.
- Keep only deploy-required model artifacts in `backend/ml/models/`.
- Experimental notebooks/scripts should remain in local workspace or dedicated research repos.

## 8. Changelog (Recent)

### v0.4.5 (2026-03-29)
- Ignored local `Protrader/` workspace from root repository.
- Updated repository documentation and deployment guidance.
- Pushed thesis (`diplom`) repository updates first, then synchronized root repo.

### v0.4.4 (2026-03-29)
- Activated experimental GBDT model as runtime default if present.
- Added env-based model switching (`GBDT_MODEL_PATH`, `GBDT_MODEL_VARIANT`).
- Exposed dynamic runtime `model_version` in logs/response.

## 9. License and Disclaimer

This project is for educational and research purposes.
Trading financial markets involves risk. Past performance does not guarantee future results.
