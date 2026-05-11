"""init schema

Revision ID: 0001
Revises:
Create Date: 2026-05-11

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "proteins",
        sa.Column("id", sa.BigInteger(), autoincrement=True, primary_key=True),
        sa.Column("accession", sa.String(length=32), nullable=False),
        sa.Column("organism_id", sa.Integer(), nullable=True),
        sa.Column("organism_name", sa.String(length=255), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=True),
        sa.Column("sequence", sa.Text(), nullable=False),
        sa.Column("length", sa.Integer(), nullable=False),
        sa.Column("md5", sa.String(length=32), nullable=False),
        sa.Column("alphafold_id", sa.String(length=64), nullable=True),
        sa.Column("ec", postgresql.JSONB(), nullable=True),
        sa.Column("gene_names", postgresql.JSONB(), nullable=True),
        sa.Column("function", sa.Text(), nullable=True),
        sa.Column("pdb_xrefs", postgresql.JSONB(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("accession"),
    )
    op.create_index("ix_proteins_accession", "proteins", ["accession"], unique=True)
    op.create_index("ix_proteins_organism_id", "proteins", ["organism_id"])
    op.create_index("ix_proteins_md5", "proteins", ["md5"])

    op.create_table(
        "embeddings",
        sa.Column("id", sa.BigInteger(), autoincrement=True, primary_key=True),
        sa.Column("protein_id", sa.BigInteger(), sa.ForeignKey("proteins.id", ondelete="CASCADE")),
        sa.Column("faiss_id", sa.BigInteger(), nullable=False),
        sa.Column("model", sa.String(length=128), nullable=False),
        sa.Column("dim", sa.Integer(), nullable=False),
        sa.Column("chunk_kind", sa.String(length=32), nullable=False),
        sa.Column("chunk_start", sa.Integer(), nullable=True),
        sa.Column("chunk_end", sa.Integer(), nullable=True),
        sa.Column("pfam_acc", sa.String(length=32), nullable=True),
        sa.UniqueConstraint("faiss_id"),
    )
    op.create_index("ix_embeddings_protein_id", "embeddings", ["protein_id"])
    op.create_index("ix_embeddings_faiss_id", "embeddings", ["faiss_id"], unique=True)
    op.create_index("ix_embeddings_protein_chunk", "embeddings", ["protein_id", "chunk_kind"])

    op.create_table(
        "jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("params", postgresql.JSONB(), nullable=True),
        sa.Column("result_path", sa.String(length=512), nullable=True),
        sa.Column("error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_jobs_kind", "jobs", ["kind"])
    op.create_index("ix_jobs_status", "jobs", ["status"])

    op.create_table(
        "hits",
        sa.Column("id", sa.BigInteger(), autoincrement=True, primary_key=True),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("jobs.id", ondelete="CASCADE")),
        sa.Column("query_id", sa.String(length=128), nullable=False),
        sa.Column("target_accession", sa.String(length=64), nullable=False),
        sa.Column("tool", sa.String(length=32), nullable=False),
        sa.Column("evalue", sa.Float(), nullable=True),
        sa.Column("bit_score", sa.Float(), nullable=True),
        sa.Column("identity", sa.Float(), nullable=True),
        sa.Column("coverage", sa.Float(), nullable=True),
        sa.Column("embed_score", sa.Float(), nullable=True),
        sa.Column("struct_tmscore", sa.Float(), nullable=True),
        sa.Column("lddt", sa.Float(), nullable=True),
        sa.Column("rank", sa.Integer(), nullable=True),
        sa.Column("raw", sa.JSON(), nullable=True),
    )
    op.create_index("ix_hits_job_id", "hits", ["job_id"])
    op.create_index("ix_hits_query_id", "hits", ["query_id"])
    op.create_index("ix_hits_target_accession", "hits", ["target_accession"])
    op.create_index("ix_hits_tool", "hits", ["tool"])

    op.create_table(
        "annotations",
        sa.Column("id", sa.BigInteger(), autoincrement=True, primary_key=True),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("jobs.id", ondelete="CASCADE")),
        sa.Column("query_id", sa.String(length=128), nullable=False),
        sa.Column("source", sa.String(length=32), nullable=False),
        sa.Column("subsystem", sa.String(length=255), nullable=True),
        sa.Column("role", sa.String(length=255), nullable=True),
        sa.Column("ec", sa.String(length=64), nullable=True),
        sa.Column("pfam_acc", sa.String(length=32), nullable=True),
        sa.Column("raw", sa.JSON(), nullable=True),
    )
    op.create_index("ix_annotations_job_id", "annotations", ["job_id"])
    op.create_index("ix_annotations_query_id", "annotations", ["query_id"])

    op.create_table(
        "ingest_jobs",
        sa.Column("id", sa.BigInteger(), autoincrement=True, primary_key=True),
        sa.Column("taxon", sa.Integer(), nullable=False),
        sa.Column("reviewed_only", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("limit", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=16), nullable=False, server_default="pending"),
        sa.Column("fetched_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("indexed_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("structures_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_ingest_jobs_taxon", "ingest_jobs", ["taxon"])
    op.create_index("ix_ingest_jobs_status", "ingest_jobs", ["status"])


def downgrade() -> None:
    op.drop_table("ingest_jobs")
    op.drop_table("annotations")
    op.drop_table("hits")
    op.drop_table("jobs")
    op.drop_table("embeddings")
    op.drop_table("proteins")
