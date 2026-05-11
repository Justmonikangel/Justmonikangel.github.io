"""Search endpoints.

Main one is POST /search/similar — the ERAST-style combined pipeline that
returns "all similar proteins" for a given query (sequence embedding ANN
+ BLAST/Foldseek rerank + optional RAST annotation).
"""
from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Job, JobKind, JobStatus
from app.db.session import get_db
from app.schemas.common import JobRef
from app.schemas.search import (
    SequenceSearchRequest,
    SimilarSearchRequest,
    StructureSearchRequest,
)
from app.workers.tasks import search_sequence, search_similar, search_structure

router = APIRouter(prefix="/search", tags=["search"])


def _create_job(db: Session, kind: JobKind, params: dict) -> Job:
    job = Job(kind=kind.value, status=JobStatus.PENDING.value, params=params)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


@router.post(
    "/similar",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=JobRef,
    summary="ERAST-style combined homology search — returns all similar proteins",
)
def search_similar_route(req: SimilarSearchRequest, db: Session = Depends(get_db)) -> JobRef:
    job = _create_job(db, JobKind.SEARCH_COMBINED, req.model_dump())
    search_similar.delay(str(job.id), req.model_dump())
    return JobRef(job_id=job.id, status=job.status, kind=job.kind)


@router.post(
    "/sequence",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=JobRef,
    summary="BLASTp / DIAMOND sequence search only",
)
def search_sequence_route(req: SequenceSearchRequest, db: Session = Depends(get_db)) -> JobRef:
    job = _create_job(db, JobKind.SEARCH_SEQUENCE, req.model_dump())
    search_sequence.delay(str(job.id), req.model_dump())
    return JobRef(job_id=job.id, status=job.status, kind=job.kind)


@router.post(
    "/structure",
    status_code=status.HTTP_202_ACCEPTED,
    response_model=JobRef,
    summary="Foldseek structural homology search",
)
async def search_structure_route(
    accession: str | None = Form(default=None),
    max_targets: int = Form(default=50),
    structure: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
) -> JobRef:
    if not accession and not structure:
        raise HTTPException(400, "provide either accession or structure file")
    payload: dict = {"max_targets": max_targets}
    if accession:
        path = settings.struct_dir / f"AF-{accession}-F1-model_v4.cif"
        if not path.exists():
            raise HTTPException(404, f"structure for {accession} not found locally")
        payload["structure_path"] = str(path)
        payload["query_id"] = accession
    else:
        assert structure is not None
        upload_dir = settings.blob_dir / "uploads"
        upload_dir.mkdir(parents=True, exist_ok=True)
        dest = upload_dir / f"{uuid4()}_{Path(structure.filename or 'q.pdb').name}"
        dest.write_bytes(await structure.read())
        payload["structure_path"] = str(dest)
        payload["query_id"] = structure.filename or "query"
    req_model = StructureSearchRequest(accession=accession, max_targets=max_targets)
    job = _create_job(db, JobKind.SEARCH_STRUCTURE, {**req_model.model_dump(), **payload})
    search_structure.delay(str(job.id), payload)
    return JobRef(job_id=job.id, status=job.status, kind=job.kind)
