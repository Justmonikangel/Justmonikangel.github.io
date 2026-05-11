"""Post-retrieval reranker — ERAST's third stage.

Two backends:
  - "ehsm": calls a learned cross-encoder checkpoint (if RERANKER_CKPT set);
            otherwise a no-op pass-through.
  - "blast": rescores ANN candidates by running blastp/diamond on just those
            candidates (fast because the set is small).
"""
from __future__ import annotations

from pathlib import Path

from app.core.config import settings
from app.services import diamond
from app.storage.local import write_fasta


def rerank_with_blast(
    query_id: str,
    query_seq: str,
    candidates: list[dict],
    workdir: Path,
    *,
    evalue: float = 1e-3,
    max_targets: int | None = None,
) -> list[dict]:
    """Build a tiny DIAMOND db over `candidates` (each must have `target_accession`
    and `target_seq`) and run blastp. Returns candidates sorted by bit_score."""
    if not candidates:
        return []
    db_fasta = workdir / "candidates.fasta"
    write_fasta(db_fasta, [(c["target_accession"], c["target_seq"]) for c in candidates])
    db_prefix = workdir / "candidates_db"
    diamond.makedb(db_fasta, db_prefix)
    q_fasta = workdir / "query.fasta"
    write_fasta(q_fasta, [(query_id, query_seq)])
    rows = diamond.blastp(
        q_fasta, db_prefix, workdir, evalue=evalue, max_targets=max_targets or len(candidates)
    )
    by_target = {r["target"]: r for r in rows}
    out = []
    for c in candidates:
        r = by_target.get(c["target_accession"])
        if not r:
            continue
        out.append(
            {
                **c,
                "evalue": r["evalue"],
                "bit_score": r["bit_score"],
                "identity": r["identity"],
                "coverage": r["qcov"],
            }
        )
    out.sort(key=lambda r: -r["bit_score"])
    for i, r in enumerate(out, start=1):
        r["rank"] = i
    return out


def rerank_with_ehsm(query_seq: str, candidates: list[dict]) -> list[dict]:
    """Optional learned cross-encoder rerank. No-op when no checkpoint is set."""
    if not settings.reranker_ckpt:
        return candidates
    # Placeholder: load and apply a saved torch cross-encoder. Kept as a hook so
    # the production pipeline can plug in EHSM-style weights without touching
    # callers.
    return candidates
