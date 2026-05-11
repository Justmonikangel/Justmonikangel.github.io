from uuid import UUID

from pydantic import BaseModel, Field


class JobRef(BaseModel):
    job_id: UUID
    status: str
    kind: str


class JobStatusOut(BaseModel):
    job_id: UUID
    kind: str
    status: str
    params: dict = Field(default_factory=dict)
    error: str | None = None
    result_path: str | None = None
