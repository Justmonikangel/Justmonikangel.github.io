"""Foldseek wrapper for structural homology search."""
from __future__ import annotations

from pathlib import Path

from app.core.config import settings
from app.services._subprocess import assert_binary, run


OUTPUT_COLUMNS = "query,target,evalue,prob,alntmscore,lddt,pident,bits"


def createdb(structures_dir: Path, db_prefix: Path) -> Path:
    """Build a Foldseek structure database from a directory of .pdb/.cif files."""
    bin_path = assert_binary(settings.foldseek_bin)
    db_prefix.parent.mkdir(parents=True, exist_ok=True)
    run(
        [bin_path, "createdb", str(structures_dir), str(db_prefix)],
        workdir=db_prefix.parent,
    )
    return db_prefix


def easy_search(
    query_struct: Path,
    db_prefix: Path,
    workdir: Path,
    *,
    max_targets: int = 50,
    threads: int = 4,
) -> list[dict]:
    bin_path = assert_binary(settings.foldseek_bin)
    out = workdir / "foldseek.tsv"
    tmpdir = workdir / "tmp"
    tmpdir.mkdir(parents=True, exist_ok=True)
    run(
        [
            bin_path, "easy-search",
            str(query_struct),
            str(db_prefix),
            str(out),
            str(tmpdir),
            "--format-output", OUTPUT_COLUMNS,
            "--max-seqs", str(max_targets),
            "--threads", str(threads),
        ],
        workdir=workdir,
    )
    return _parse(out)


def _parse(path: Path) -> list[dict]:
    cols = OUTPUT_COLUMNS.split(",")
    rows: list[dict] = []
    if not path.exists():
        return rows
    with path.open() as fh:
        for line in fh:
            parts = line.rstrip("\n").split("\t")
            if len(parts) != len(cols):
                continue
            row = dict(zip(cols, parts, strict=True))
            for k in ("evalue", "prob", "alntmscore", "lddt", "pident", "bits"):
                try:
                    row[k] = float(row[k])
                except ValueError:
                    row[k] = None
            rows.append(row)
    return rows
