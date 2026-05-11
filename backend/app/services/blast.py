"""BLASTp wrapper (NCBI BLAST+)."""
from __future__ import annotations

from pathlib import Path

from app.core.config import settings
from app.services._subprocess import assert_binary, run

OUTFMT = "6 qseqid sseqid pident length mismatch gapopen qstart qend sstart send evalue bitscore qcovs"


def makeblastdb(fasta: Path, out_prefix: Path) -> Path:
    """Build a protein BLAST database from a FASTA file."""
    bin_path = assert_binary("makeblastdb")
    out_prefix.parent.mkdir(parents=True, exist_ok=True)
    run(
        [bin_path, "-dbtype", "prot", "-in", str(fasta), "-out", str(out_prefix)],
        workdir=out_prefix.parent,
    )
    return out_prefix


def blastp(
    query_fasta: Path,
    db_prefix: Path,
    workdir: Path,
    *,
    evalue: float = 1e-5,
    max_targets: int = 50,
    threads: int = 4,
) -> list[dict]:
    bin_path = assert_binary(settings.blast_bin)
    out = workdir / "blastp.tsv"
    workdir.mkdir(parents=True, exist_ok=True)
    run(
        [
            bin_path,
            "-query", str(query_fasta),
            "-db", str(db_prefix),
            "-evalue", str(evalue),
            "-max_target_seqs", str(max_targets),
            "-num_threads", str(threads),
            "-outfmt", OUTFMT,
            "-out", str(out),
        ],
        workdir=workdir,
    )
    return _parse_outfmt6(out)


def _parse_outfmt6(path: Path) -> list[dict]:
    cols = [
        "query_id", "target", "identity", "length", "mismatch", "gapopen",
        "qstart", "qend", "sstart", "send", "evalue", "bit_score", "qcov",
    ]
    rows: list[dict] = []
    if not path.exists():
        return rows
    with path.open() as fh:
        for line in fh:
            parts = line.rstrip("\n").split("\t")
            if len(parts) != len(cols):
                continue
            row = dict(zip(cols, parts, strict=True))
            for k in ("identity", "evalue", "bit_score", "qcov"):
                row[k] = float(row[k])
            for k in ("length", "mismatch", "gapopen", "qstart", "qend", "sstart", "send"):
                row[k] = int(row[k])
            rows.append(row)
    return rows
