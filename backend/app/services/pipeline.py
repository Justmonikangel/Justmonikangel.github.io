"""ERAST-style three-stage homology pipeline:

  1. Pre-retrieval — segment the query (optionally by Pfam domains via HMMER)
     so embeddings are taken at fine granularity.
  2. Retrieval — ESM-2 encode each chunk, query FAISS (IVF+PQ).
  3. Post-retrieval — rerank the ANN candidates with sequence (BLAST/DIAMOND)
     and optionally structure (Foldseek) alignments, plus an optional learned
     cross-encoder (EHSM-style).

This is the "search all similar proteins" endpoint's core.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Embedding, Protein
from app.schemas.search import QuerySequence
from app.services import esm_encoder, faiss_index, foldseek, hmmer, reranker
from app.storage.local import write_fasta


@dataclass(slots=True)
class FinalHit:
    query_id: str
    target_accession: str
    embed_score: float | None
    evalue: float | None
    bit_score: float | None
    identity: float | None
    coverage: float | None
    struct_tmscore: float | None
    lddt: float | None
    rank: int


def _pre_retrieval(queries: list[QuerySequence], workdir: Path, use_pfam: bool) -> list[dict]:
    """Stage 1: segment queries into chunks. Falls back to whole-sequence chunks
    if Pfam DB unavailable or `use_pfam=False`."""
    fasta = workdir / "query.fasta"
    write_fasta(fasta, [(q.id, q.seq) for q in queries])
    pfam_hits: list[hmmer.PfamHit] = []
    if use_pfam:
        try:
            pfam_hits = hmmer.hmmscan(fasta, workdir / "hmmer")
        except Exception:  # noqa: BLE001 — fall back to whole-seq if pfam fails
            pfam_hits = []
    chunks: list[dict] = []
    for q in queries:
        chunks.extend(hmmer.segment(q.id, q.seq, pfam_hits))
    return chunks


def _retrieval(chunks: list[dict], top_k: int, db: Session) -> dict[str, list[dict]]:
    """Stage 2: ESM-2 encode + FAISS ANN search; map faiss_ids back to proteins."""
    encoded = esm_encoder.encode(chunks)
    if not encoded:
        return {}
    vectors = np.stack([e.vector for e in encoded]).astype(np.float32)
    index = faiss_index.load()
    scores, ids = faiss_index.search(index, vectors, top_k)

    # Resolve faiss_id -> (protein accession, seq)
    flat_ids = [int(i) for row in ids for i in row if i >= 0]
    rows = db.execute(
        select(Embedding.faiss_id, Protein.accession, Protein.sequence)
        .join(Protein, Protein.id == Embedding.protein_id)
        .where(Embedding.faiss_id.in_(flat_ids))
    ).all()
    lookup = {r[0]: (r[1], r[2]) for r in rows}

    by_query: dict[str, dict[str, dict]] = {}
    for chunk, srow, irow in zip(encoded, scores, ids, strict=True):
        bucket = by_query.setdefault(chunk.query_id, {})
        for score, fid in zip(srow, irow, strict=True):
            if fid < 0:
                continue
            hit = lookup.get(int(fid))
            if not hit:
                continue
            acc, seq = hit
            prev = bucket.get(acc)
            s = float(score)
            if prev is None or prev["embed_score"] < s:
                bucket[acc] = {
                    "target_accession": acc,
                    "target_seq": seq,
                    "embed_score": s,
                }
    return {qid: list(d.values()) for qid, d in by_query.items()}


def _post_retrieval(
    queries: list[QuerySequence],
    retrieved: dict[str, list[dict]],
    workdir: Path,
    *,
    rerank_blast: bool,
    rerank_foldseek: bool,
    top_k_final: int,
) -> list[FinalHit]:
    """Stage 3: rerank ANN candidates with BLAST/DIAMOND and optionally
    structural Foldseek, then keep the best top_k_final per query."""
    out: list[FinalHit] = []
    for q in queries:
        cands = retrieved.get(q.id, [])
        if not cands:
            continue
        if rerank_blast:
            cands = reranker.rerank_with_blast(
                q.id, q.seq, cands, workdir / f"rerank_{q.id}"
            )
        cands = reranker.rerank_with_ehsm(q.seq, cands)

        if rerank_foldseek:
            cands = _add_foldseek_scores(q.id, cands, workdir / f"foldseek_{q.id}")

        # Final ranking: prefer bit_score if present, otherwise embed_score.
        def _key(c: dict) -> float:
            return -(c.get("bit_score") or c.get("embed_score") or 0.0)

        cands.sort(key=_key)
        for i, c in enumerate(cands[:top_k_final], start=1):
            out.append(
                FinalHit(
                    query_id=q.id,
                    target_accession=c["target_accession"],
                    embed_score=c.get("embed_score"),
                    evalue=c.get("evalue"),
                    bit_score=c.get("bit_score"),
                    identity=c.get("identity"),
                    coverage=c.get("coverage"),
                    struct_tmscore=c.get("struct_tmscore"),
                    lddt=c.get("lddt"),
                    rank=i,
                )
            )
    return out


def _add_foldseek_scores(query_id: str, candidates: list[dict], workdir: Path) -> list[dict]:
    """If a query structure is available, run foldseek easy-search and join."""
    qstruct = settings.struct_dir / f"AF-{query_id}-F1-model_v4.cif"
    if not qstruct.exists():
        return candidates
    try:
        rows = foldseek.easy_search(
            qstruct, settings.index_dir / "foldseek" / "bact_struct", workdir,
            max_targets=len(candidates),
        )
    except Exception:  # noqa: BLE001 — structural rerank is best-effort
        return candidates
    by_target = {r["target"]: r for r in rows}
    for c in candidates:
        r = by_target.get(c["target_accession"])
        if r:
            c["struct_tmscore"] = r.get("alntmscore")
            c["lddt"] = r.get("lddt")
    return candidates


def run_similar(
    queries: list[QuerySequence],
    db: Session,
    workdir: Path,
    *,
    use_pfam: bool = True,
    top_k_retrieval: int = 500,
    top_k_final: int = 50,
    rerank_blast: bool = True,
    rerank_foldseek: bool = False,
) -> list[FinalHit]:
    chunks = _pre_retrieval(queries, workdir, use_pfam=use_pfam)
    retrieved = _retrieval(chunks, top_k_retrieval, db)
    return _post_retrieval(
        queries, retrieved, workdir,
        rerank_blast=rerank_blast,
        rerank_foldseek=rerank_foldseek,
        top_k_final=top_k_final,
    )
