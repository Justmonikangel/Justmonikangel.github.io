from pydantic import BaseModel, Field


class IngestRequest(BaseModel):
    taxon: int = Field(default=2, description="NCBI taxonomy id; 2 = Bacteria")
    reviewed: bool = True
    limit: int | None = Field(default=None, ge=1, le=10_000_000)
    fetch_structures: bool = True
    build_indexes: bool = True
