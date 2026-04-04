#!/usr/bin/env sh
set -eu

export APP_PROCESS_ROLE="api"
export BACKGROUND_WORKERS_ENABLED="false"
export STRICT_RUNTIME_SECRETS="${STRICT_RUNTIME_SECRETS:-true}"
export ALLOW_LOCAL_DOTENV="false"

exec gunicorn app:app --bind 0.0.0.0:8080 --workers 1 --threads 4 --timeout 180
