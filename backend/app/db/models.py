import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import (
    JSON,
    BigInteger,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class JobKind(StrEnum):
    INGEST = "ingest"
    BUILD_INDEX = "build_index"
    SEARCH_SEQUENCE = "search_sequence"
    SEARCH_STRUCTURE = "search_structure"
    SEARCH_EMBEDDING = "search_embedding"
    SEARCH_COMBINED = "search_combined"
    ANNOTATE = "annotate"


class JobStatus(StrEnum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"


class Protein(Base):
    __tablename__ = "proteins"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    accession: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    organism_id: Mapped[int | None] = mapped_column(Integer, index=True)
    organism_name: Mapped[str | None] = mapped_column(String(255))
    name: Mapped[str | None] = mapped_column(String(255))
    sequence: Mapped[str] = mapped_column(Text)
    length: Mapped[int] = mapped_column(Integer)
    md5: Mapped[str] = mapped_column(String(32), index=True)
    alphafold_id: Mapped[str | None] = mapped_column(String(64))
    ec: Mapped[list | None] = mapped_column(JSONB, default=list)
    gene_names: Mapped[list | None] = mapped_column(JSONB, default=list)
    function: Mapped[str | None] = mapped_column(Text)
    pdb_xrefs: Mapped[list | None] = mapped_column(JSONB, default=list)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    embeddings: Mapped[list["Embedding"]] = relationship(back_populates="protein")


class Embedding(Base):
    """Stores ESM2 (or similar PLM) embedding per protein.

    Vector itself lives in FAISS; this table maps faiss_id <-> protein and
    keeps the chunking metadata used by the ERAST-style pre-retrieval step.
    """

    __tablename__ = "embeddings"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    protein_id: Mapped[int] = mapped_column(ForeignKey("proteins.id", ondelete="CASCADE"), index=True)
    faiss_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True)
    model: Mapped[str] = mapped_column(String(128))
    dim: Mapped[int] = mapped_column(Integer)
    chunk_kind: Mapped[str] = mapped_column(String(32))  # "whole" | "pfam" | "window"
    chunk_start: Mapped[int | None] = mapped_column(Integer)
    chunk_end: Mapped[int | None] = mapped_column(Integer)
    pfam_acc: Mapped[str | None] = mapped_column(String(32))

    protein: Mapped[Protein] = relationship(back_populates="embeddings")

    __table_args__ = (
        Index("ix_embeddings_protein_chunk", "protein_id", "chunk_kind"),
    )


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    kind: Mapped[str] = mapped_column(String(32), index=True)
    status: Mapped[str] = mapped_column(String(16), index=True, default=JobStatus.PENDING.value)
    params: Mapped[dict] = mapped_column(JSONB, default=dict)
    result_path: Mapped[str | None] = mapped_column(String(512))
    error: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    hits: Mapped[list["Hit"]] = relationship(back_populates="job", cascade="all, delete-orphan")
    annotations: Mapped[list["Annotation"]] = relationship(
        back_populates="job", cascade="all, delete-orphan"
    )


class Hit(Base):
    __tablename__ = "hits"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), index=True
    )
    query_id: Mapped[str] = mapped_column(String(128), index=True)
    target_accession: Mapped[str] = mapped_column(String(64), index=True)
    tool: Mapped[str] = mapped_column(String(32), index=True)
    evalue: Mapped[float | None] = mapped_column(Float)
    bit_score: Mapped[float | None] = mapped_column(Float)
    identity: Mapped[float | None] = mapped_column(Float)
    coverage: Mapped[float | None] = mapped_column(Float)
    embed_score: Mapped[float | None] = mapped_column(Float)
    struct_tmscore: Mapped[float | None] = mapped_column(Float)
    lddt: Mapped[float | None] = mapped_column(Float)
    rank: Mapped[int | None] = mapped_column(Integer)
    raw: Mapped[dict | None] = mapped_column(JSON)

    job: Mapped[Job] = relationship(back_populates="hits")


class Annotation(Base):
    __tablename__ = "annotations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), index=True
    )
    query_id: Mapped[str] = mapped_column(String(128), index=True)
    source: Mapped[str] = mapped_column(String(32))  # rast | rasttk | prokka | pfam
    subsystem: Mapped[str | None] = mapped_column(String(255))
    role: Mapped[str | None] = mapped_column(String(255))
    ec: Mapped[str | None] = mapped_column(String(64))
    pfam_acc: Mapped[str | None] = mapped_column(String(32))
    raw: Mapped[dict | None] = mapped_column(JSON)

    job: Mapped[Job] = relationship(back_populates="annotations")


class IngestJob(Base):
    __tablename__ = "ingest_jobs"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    taxon: Mapped[int] = mapped_column(Integer, index=True)
    reviewed_only: Mapped[bool] = mapped_column(default=True)
    limit: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(16), default=JobStatus.PENDING.value, index=True)
    fetched_count: Mapped[int] = mapped_column(Integer, default=0)
    indexed_count: Mapped[int] = mapped_column(Integer, default=0)
    structures_count: Mapped[int] = mapped_column(Integer, default=0)
    last_error: Mapped[str | None] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
