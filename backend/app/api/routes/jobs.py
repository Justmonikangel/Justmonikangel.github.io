import csv
import io
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Hit, Job
from app.db.session import get_db
from app.schemas.common import JobStatusOut

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/{job_id}", response_model=JobStatusOut)
def get_job(job_id: UUID, db: Session = Depends(get_db)) -> JobStatusOut:
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(404, "job not found")
    return JobStatusOut(
        job_id=job.id,
        kind=job.kind,
        status=job.status,
        params=job.params or {},
        error=job.error,
        result_path=job.result_path,
    )


@router.get("/{job_id}/hits")
def get_hits(job_id: UUID, limit: int = Query(default=500, le=10_000), db: Session = Depends(get_db)):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(404, "job not found")
    rows = db.execute(
        select(Hit).where(Hit.job_id == job_id).order_by(Hit.rank.asc().nulls_last()).limit(limit)
    ).scalars().all()
    return [
        {
            "query_id": h.query_id,
            "target_accession": h.target_accession,
            "tool": h.tool,
            "rank": h.rank,
            "evalue": h.evalue,
            "bit_score": h.bit_score,
            "identity": h.identity,
            "coverage": h.coverage,
            "embed_score": h.embed_score,
            "struct_tmscore": h.struct_tmscore,
            "lddt": h.lddt,
        }
        for h in rows
    ]


@router.get("/{job_id}/download")
def download(
    job_id: UUID,
    fmt: str = Query(default="tsv", pattern="^(tsv|json)$"),
    db: Session = Depends(get_db),
):
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(404, "job not found")
    rows = db.execute(
        select(Hit).where(Hit.job_id == job_id).order_by(Hit.rank.asc().nulls_last())
    ).scalars().all()
    fields = [
        "query_id", "target_accession", "tool", "rank", "evalue", "bit_score",
        "identity", "coverage", "embed_score", "struct_tmscore", "lddt",
    ]
    if fmt == "json":
        payload = [{f: getattr(h, f) for f in fields} for h in rows]
        return payload

    buf = io.StringIO()
    w = csv.writer(buf, delimiter="\t")
    w.writerow(fields)
    for h in rows:
        w.writerow([getattr(h, f) for f in fields])
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/tab-separated-values",
        headers={"Content-Disposition": f'attachment; filename="hits_{job_id}.tsv"'},
    )
