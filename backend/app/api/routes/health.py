"""Health check endpoint. Verifies DB, Redis, and tool binaries on PATH."""
from __future__ import annotations

import shutil

import redis
from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import settings
from app.db.session import engine

router = APIRouter(tags=["health"])

TOOL_BINS = ["blast_bin", "diamond_bin", "foldseek_bin", "hmmer_bin"]


@router.get("/healthz")
def healthz() -> dict:
    status: dict[str, object] = {"status": "ok"}

    # DB
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        status["db"] = "ok"
    except Exception as exc:  # noqa: BLE001
        status["db"] = f"fail: {exc!s}"
        status["status"] = "degraded"

    # Redis
    try:
        r = redis.Redis.from_url(settings.redis_url)
        r.ping()
        status["redis"] = "ok"
    except Exception as exc:  # noqa: BLE001
        status["redis"] = f"fail: {exc!s}"
        status["status"] = "degraded"

    # Tools
    tools: dict[str, str] = {}
    for attr in TOOL_BINS:
        name = getattr(settings, attr)
        tools[name] = "ok" if shutil.which(name) else "missing"
    status["tools"] = tools

    # Optional: RAST + Prokka + ESM
    status["optional"] = {
        settings.rast_bin: "ok" if shutil.which(settings.rast_bin) else "missing",
        settings.prokka_bin: "ok" if shutil.which(settings.prokka_bin) else "missing",
        "faiss_index": "ok" if settings.faiss_index_path.exists() else "missing",
        "pfam_hmm": "ok" if settings.pfam_hmm.exists() else "missing",
    }

    return status
