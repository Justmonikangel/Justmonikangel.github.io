"""DIAMOND wrapper. Faster drop-in alternative to blastp."""
from __future__ import annotations

from pathlib import Path

from app.core.config import settings
from app.services._subprocess import assert_binary, run
from app.services.blast import OUTFMT, _parse_outfmt6


def makedb(fasta: Path, out_path: Path) -> Path:
    bin_path = assert_binary(settings.diamond_bin)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    run(
        [bin_path, "makedb", "--in", str(fasta), "-d", str(out_path)],
        workdir=out_path.parent,
    )
    return out_path


def blastp(
    query_fasta: Path,
    db: Path,
    workdir: Path,
    *,
    evalue: float = 1e-5,
    max_targets: int = 50,
    threads: int = 4,
    sensitivity: str = "--more-sensitive",
) -> list[dict]:
    bin_path = assert_binary(settings.diamond_bin)
    out = workdir / "diamond.tsv"
    workdir.mkdir(parents=True, exist_ok=True)
    fmt_args = OUTFMT.split()
    run(
        [
            bin_path, "blastp",
            sensitivity,
            "-q", str(query_fasta),
            "-d", str(db),
            "-e", str(evalue),
            "-k", str(max_targets),
            "-p", str(threads),
            "-f", *fmt_args,
            "-o", str(out),
        ],
        workdir=workdir,
    )
    return _parse_outfmt6(out)
