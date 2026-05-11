#!/usr/bin/env bash
set -euo pipefail

# Wait for Postgres, then run migrations, then start uvicorn.
python - <<'PY'
import os, time, sys
import psycopg
dsn = os.environ.get("POSTGRES_DSN", "").replace("postgresql+psycopg://", "postgresql://")
for i in range(60):
    try:
        psycopg.connect(dsn).close()
        sys.exit(0)
    except Exception as e:
        print(f"waiting for postgres: {e}", file=sys.stderr)
        time.sleep(1)
sys.exit(1)
PY

alembic upgrade head
exec uvicorn app.main:app --host "${API_HOST:-0.0.0.0}" --port "${API_PORT:-8000}"
