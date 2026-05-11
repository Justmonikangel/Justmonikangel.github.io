"""Celery tasks. Each task wraps an entire job (ingest / build_index / search /
annotate). Tasks write their final state back to the `jobs` table."""
from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID

from celery import shared_task
from sqlalchemy import select

from app.core.config import settings
from app.db.models import (
    Annotation,
    Embedding,
    Hit,
    IngestJob,
    Job,
    JobStatus,
    Protein,
)
from app.db.session import SessionLocal
from app.schemas.search import QuerySequence
from app.services import alphafold, blast, diamond, foldseek, pipeline, rast, uniprot
from app.storage.local import job_dir, write_fasta
from app.workers.celery_app import celery_app


def _mark_running(job_id: UUID) -> None:
    with SessionLocal() as db:
        job = db.get(Job, job_id)
        if job:
            job.status = JobStatus.RUNNING.value
            job.started_at = datetime.now(timezone.utc)
            db.commit()


def _finish(job_id: UUID, *, ok: bool, error: str | None = None, result_path: str | None = None) -> None:
    with SessionLocal() as db:
        job = db.get(Job, job_id)
        if not job:
            return
        job.status = (JobStatus.SUCCESS if ok else JobStatus.FAILED).value
        job.finished_at = datetime.now(timezone.utc)
        job.error = error
        job.result_path = result_path
        db.commit()


@shared_task(name="ingest_uniprot")
def ingest_uniprot(ingest_id: int) -> None:
    with SessionLocal() as db:
        ij = db.get(IngestJob, ingest_id)
        if not ij:
            return
        ij.status = JobStatus.RUNNING.value
        db.commit()
        fetched = 0
        accessions: list[str] = []
        try:
            for entry in uniprot.stream_json(ij.taxon, reviewed=ij.reviewed_only, limit=ij.limit):
                rec = uniprot.parse_entry(entry)
                existing = db.execute(
                    select(Protein).where(Protein.accession == rec.accession)
                ).scalar_one_or_none()
                if existing is None:
                    db.add(
                        Protein(
                            accession=rec.accession,
                            organism_id=rec.organism_id,
                            organism_name=rec.organism_name,
                            name=rec.name,
                            sequence=rec.sequence,
                            length=rec.length,
                            md5=rec.md5,
                            alphafold_id=rec.alphafold_id,
                            ec=rec.ec,
                            gene_names=rec.gene_names,
                            function=rec.function,
                            pdb_xrefs=rec.pdb_xrefs,
                        )
                    )
                fetched += 1
                accessions.append(rec.accession)
                if fetched % 1000 == 0:
                    db.commit()
                    ij.fetched_count = fetched
                    db.commit()
            db.commit()
            ij.fetched_count = fetched
            db.commit()
        except Exception as exc:  # noqa: BLE001
            ij.status = JobStatus.FAILED.value
            ij.last_error = str(exc)[:2000]
            db.commit()
            return

        # Dump fasta for downstream index building.
        fasta = settings.fasta_dir / f"uniprot_taxon_{ij.taxon}.fasta"
        rows = db.execute(select(Protein.accession, Protein.sequence)).all()
        write_fasta(fasta, [(a, s) for a, s in rows])

        ij.status = JobStatus.SUCCESS.value
        db.commit()

    # Kick off the structure fetch + index build as follow-up tasks.
    fetch_structures.delay(ingest_id, accessions)
    build_indexes.delay(ingest_id)


@shared_task(name="fetch_structures")
def fetch_structures(ingest_id: int, accessions: list[str]) -> None:
    paths = asyncio.run(alphafold.download_many(accessions, settings.struct_dir))
    with SessionLocal() as db:
        ij = db.get(IngestJob, ingest_id)
        if ij:
            ij.structures_count = len(paths)
            db.commit()


@shared_task(name="build_indexes")
def build_indexes(ingest_id: int) -> None:
    """Build BLAST, DIAMOND, and Foldseek indexes. FAISS is built by
    build_faiss_index once embeddings are computed."""
    with SessionLocal() as db:
        ij = db.get(IngestJob, ingest_id)
        if not ij:
            return
        fasta = settings.fasta_dir / f"uniprot_taxon_{ij.taxon}.fasta"
        try:
            blast.makeblastdb(fasta, settings.index_dir / "blast" / "proteins")
            diamond.makedb(fasta, settings.index_dir / "diamond" / "proteins")
            foldseek.createdb(
                settings.struct_dir, settings.index_dir / "foldseek" / "bact_struct"
            )
            ij.indexed_count = ij.fetched_count
            db.commit()
        except Exception as exc:  # noqa: BLE001
            ij.last_error = str(exc)[:2000]
            db.commit()


@shared_task(name="search_similar")
def search_similar(job_id: str, payload: dict) -> None:
    job_id_u = UUID(job_id)
    _mark_running(job_id_u)
    try:
        queries = [QuerySequence(**q) for q in payload["sequences"]]
        wd = job_dir(job_id_u)
        with SessionLocal() as db:
            hits = pipeline.run_similar(
                queries,
                db,
                wd,
                use_pfam=payload.get("use_pfam_segmentation", True),
                top_k_retrieval=payload.get("top_k_retrieval", 500),
                top_k_final=payload.get("top_k_final", 50),
                rerank_blast=payload.get("rerank_with_blast", True),
                rerank_foldseek=payload.get("rerank_with_foldseek", False),
            )
            for h in hits:
                db.add(
                    Hit(
                        job_id=job_id_u,
                        query_id=h.query_id,
                        target_accession=h.target_accession,
                        tool="erast_combined",
                        evalue=h.evalue,
                        bit_score=h.bit_score,
                        identity=h.identity,
                        coverage=h.coverage,
                        embed_score=h.embed_score,
                        struct_tmscore=h.struct_tmscore,
                        lddt=h.lddt,
                        rank=h.rank,
                    )
                )
            db.commit()

        if payload.get("annotate_with_rast"):
            annotate.delay(job_id, [q.model_dump() for q in queries], "rasttk")

        result_path = wd / "hits.json"
        result_path.write_text(
            json.dumps([h.__dict__ for h in hits], default=str, indent=2)
        )
        _finish(job_id_u, ok=True, result_path=str(result_path))
    except Exception as exc:  # noqa: BLE001
        _finish(job_id_u, ok=False, error=str(exc)[:2000])
        raise


@shared_task(name="search_sequence")
def search_sequence(job_id: str, payload: dict) -> None:
    job_id_u = UUID(job_id)
    _mark_running(job_id_u)
    try:
        queries = [QuerySequence(**q) for q in payload["sequences"]]
        wd = job_dir(job_id_u)
        q_fasta = write_fasta(wd / "query.fasta", [(q.id, q.seq) for q in queries])
        tool = payload.get("tool", "diamond")
        if tool == "blastp":
            rows = blast.blastp(
                q_fasta, settings.index_dir / "blast" / "proteins", wd,
                evalue=payload["evalue"], max_targets=payload["max_targets"],
            )
        else:
            rows = diamond.blastp(
                q_fasta, settings.index_dir / "diamond" / "proteins", wd,
                evalue=payload["evalue"], max_targets=payload["max_targets"],
            )
        with SessionLocal() as db:
            for i, r in enumerate(rows, start=1):
                db.add(
                    Hit(
                        job_id=job_id_u,
                        query_id=r["query_id"],
                        target_accession=r["target"],
                        tool=tool,
                        evalue=r["evalue"],
                        bit_score=r["bit_score"],
                        identity=r["identity"],
                        coverage=r["qcov"],
                        rank=i,
                        raw=r,
                    )
                )
            db.commit()
        _finish(job_id_u, ok=True, result_path=str(wd))
    except Exception as exc:  # noqa: BLE001
        _finish(job_id_u, ok=False, error=str(exc)[:2000])
        raise


@shared_task(name="search_structure")
def search_structure(job_id: str, payload: dict) -> None:
    job_id_u = UUID(job_id)
    _mark_running(job_id_u)
    try:
        wd = job_dir(job_id_u)
        qstruct = Path(payload["structure_path"])
        rows = foldseek.easy_search(
            qstruct,
            settings.index_dir / "foldseek" / "bact_struct",
            wd,
            max_targets=payload["max_targets"],
        )
        with SessionLocal() as db:
            for i, r in enumerate(rows, start=1):
                db.add(
                    Hit(
                        job_id=job_id_u,
                        query_id=payload.get("query_id", "query"),
                        target_accession=r["target"],
                        tool="foldseek",
                        evalue=r.get("evalue"),
                        struct_tmscore=r.get("alntmscore"),
                        lddt=r.get("lddt"),
                        rank=i,
                        raw=r,
                    )
                )
            db.commit()
        _finish(job_id_u, ok=True, result_path=str(wd))
    except Exception as exc:  # noqa: BLE001
        _finish(job_id_u, ok=False, error=str(exc)[:2000])
        raise


@shared_task(name="annotate")
def annotate(job_id: str, sequences: list[dict], engine: str) -> None:
    job_id_u = UUID(job_id)
    _mark_running(job_id_u)
    try:
        queries = [QuerySequence(**q) for q in sequences]
        wd = job_dir(job_id_u) / "annotate"
        q_fasta = write_fasta(wd / "query.fasta", [(q.id, q.seq) for q in queries])
        rows = rast.annotate(q_fasta, wd, engine=engine)
        with SessionLocal() as db:
            for r in rows:
                db.add(
                    Annotation(
                        job_id=job_id_u,
                        query_id=r.query_id,
                        source=r.source,
                        subsystem=r.subsystem,
                        role=r.role,
                        ec=r.ec,
                    )
                )
            db.commit()
        _finish(job_id_u, ok=True, result_path=str(wd))
    except Exception as exc:  # noqa: BLE001
        _finish(job_id_u, ok=False, error=str(exc)[:2000])
        raise


# Re-export for celery's autodiscovery
__all__ = [
    "ingest_uniprot",
    "fetch_structures",
    "build_indexes",
    "search_similar",
    "search_sequence",
    "search_structure",
    "annotate",
]
_ = celery_app
