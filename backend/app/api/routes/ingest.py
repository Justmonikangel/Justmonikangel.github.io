from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.models import IngestJob, JobStatus
from app.db.session import get_db
from app.schemas.ingest import IngestRequest
from app.workers.tasks import ingest_uniprot

router = APIRouter(prefix="/ingest", tags=["ingest"])


@router.post("", status_code=status.HTTP_202_ACCEPTED)
def start_ingest(req: IngestRequest, db: Session = Depends(get_db)) -> dict:
    ij = IngestJob(
        taxon=req.taxon,
        reviewed_only=req.reviewed,
        limit=req.limit,
        status=JobStatus.PENDING.value,
    )
    db.add(ij)
    db.commit()
    db.refresh(ij)
    ingest_uniprot.delay(ij.id)
    return {"ingest_id": ij.id, "status": ij.status}


@router.get("/{ingest_id}")
def get_ingest(ingest_id: int, db: Session = Depends(get_db)) -> dict:
    ij = db.get(IngestJob, ingest_id)
    if not ij:
        return {"error": "not found"}
    return {
        "id": ij.id,
        "taxon": ij.taxon,
        "status": ij.status,
        "fetched_count": ij.fetched_count,
        "indexed_count": ij.indexed_count,
        "structures_count": ij.structures_count,
        "last_error": ij.last_error,
    }
