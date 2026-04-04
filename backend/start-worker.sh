#!/usr/bin/env sh
set -eu

export APP_PROCESS_ROLE="worker"
export BACKGROUND_WORKERS_ENABLED="true"
export STRICT_RUNTIME_SECRETS="${STRICT_RUNTIME_SECRETS:-true}"
export ALLOW_LOCAL_DOTENV="false"

exec python worker.py
