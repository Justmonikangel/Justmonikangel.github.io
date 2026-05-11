"""HMMER / Pfam scan — used for ERAST-style pre-retrieval segmentation.

Splits a query protein into Pfam domain windows so that downstream embedding
and FAISS lookup happen at domain granularity (this matches ERAST's
pre-retrieval optimization).
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from app.core.config import settings
from app.services._subprocess import assert_binary, run


@dataclass(slots=True)
class PfamHit:
    query_id: str
    pfam_acc: str
    pfam_name: str
    evalue: float
    start: int  # 1-based inclusive
    end: int


def hmmscan(query_fasta: Path, workdir: Path, *, threads: int = 4) -> list[PfamHit]:
    bin_path = assert_binary(settings.hmmer_bin)
    if not settings.pfam_hmm.exists():
        # No Pfam DB available; caller will fall back to whole-sequence chunks.
        return []
    domtbl = workdir / "pfam.domtbl"
    workdir.mkdir(parents=True, exist_ok=True)
    run(
        [
            bin_path,
            "--cpu", str(threads),
            "--domtblout", str(domtbl),
            "--noali",
            str(settings.pfam_hmm),
            str(query_fasta),
        ],
        workdir=workdir,
    )
    return list(_parse_domtbl(domtbl))


def _parse_domtbl(path: Path):
    if not path.exists():
        return
    with path.open() as fh:
        for line in fh:
            if line.startswith("#") or not line.strip():
                continue
            parts = line.split()
            # hmmscan --domtblout columns:
            # target_name acc tlen query_name acc qlen E-value score bias #
            # of c-Evalue i-Evalue score bias from to from to from to acc desc
            if len(parts) < 23:
                continue
            try:
                yield PfamHit(
                    query_id=parts[3],
                    pfam_acc=parts[1],
                    pfam_name=parts[0],
                    evalue=float(parts[6]),
                    start=int(parts[17]),
                    end=int(parts[18]),
                )
            except (ValueError, IndexError):
                continue


def segment(query_id: str, seq: str, hits: list[PfamHit], *, min_chunk: int = 30) -> list[dict]:
    """Turn Pfam hits into chunk descriptors. Falls back to whole sequence if no hits."""
    chunks: list[dict] = []
    own = [h for h in hits if h.query_id == query_id]
    if not own:
        chunks.append(
            {"query_id": query_id, "kind": "whole", "start": 1, "end": len(seq), "seq": seq, "pfam_acc": None}
        )
        return chunks
    for h in own:
        sub = seq[h.start - 1 : h.end]
        if len(sub) < min_chunk:
            continue
        chunks.append(
            {
                "query_id": query_id,
                "kind": "pfam",
                "start": h.start,
                "end": h.end,
                "seq": sub,
                "pfam_acc": h.pfam_acc,
            }
        )
    if not chunks:
        chunks.append(
            {"query_id": query_id, "kind": "whole", "start": 1, "end": len(seq), "seq": seq, "pfam_acc": None}
        )
    return chunks
