from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.models import Job, JobKind, JobStatus
from app.db.session import get_db
from app.schemas.common import JobRef
from app.schemas.search import AnnotateRequest
from app.workers.tasks import annotate as annotate_task

router = APIRouter(prefix="/annotate", tags=["annotate"])


@router.post("/rast", status_code=status.HTTP_202_ACCEPTED, response_model=JobRef)
def annotate_rast(req: AnnotateRequest, db: Session = Depends(get_db)) -> JobRef:
    job = Job(kind=JobKind.ANNOTATE.value, status=JobStatus.PENDING.value, params=req.model_dump())
    db.add(job)
    db.commit()
    db.refresh(job)
    annotate_task.delay(str(job.id), [s.model_dump() for s in req.sequences], req.engine)
    return JobRef(job_id=job.id, status=job.status, kind=job.kind)
