import os

# Default to an in-process sqlite for unit tests; integration tests should set
# POSTGRES_DSN to a real DB (e.g. via testcontainers in a follow-up).
os.environ.setdefault("POSTGRES_DSN", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("CELERY_BROKER_URL", "memory://")
os.environ.setdefault("CELERY_RESULT_BACKEND", "cache+memory://")
