"""Local-disk storage. Single abstraction so we can later swap in S3/MinIO
without touching task code."""
from __future__ import annotations

import shutil
import tempfile
import uuid
from pathlib import Path

from app.core.config import settings


def ensure_dirs() -> None:
    for d in (
        settings.data_dir,
        settings.fasta_dir,
        settings.struct_dir,
        settings.index_dir,
        settings.blob_dir,
    ):
        Path(d).mkdir(parents=True, exist_ok=True)


def new_workdir(prefix: str = "job-") -> Path:
    ensure_dirs()
    p = Path(tempfile.mkdtemp(prefix=prefix, dir=settings.blob_dir))
    return p


def job_dir(job_id: uuid.UUID | str) -> Path:
    ensure_dirs()
    p = settings.blob_dir / str(job_id)
    p.mkdir(parents=True, exist_ok=True)
    return p


def write_fasta(path: Path, sequences: list[tuple[str, str]]) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w") as fh:
        for sid, seq in sequences:
            fh.write(f">{sid}\n")
            for i in range(0, len(seq), 60):
                fh.write(seq[i : i + 60] + "\n")
    return path


def rm_tree(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path, ignore_errors=True)
