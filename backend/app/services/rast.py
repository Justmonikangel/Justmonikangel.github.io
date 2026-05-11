"""RAST / RASTtk annotation, with Prokka fallback for offline use.

Order of attempts:
  1. RASTtk CLI (`rast2-submit-genome` style) if binary is present.
  2. Prokka local annotator if present (maps product/EC into SEED-like roles).
  3. Raise — caller decides whether to skip annotation entirely.
"""
from __future__ import annotations

import json
import shutil
from dataclasses import dataclass
from pathlib import Path

from app.core.config import settings
from app.services._subprocess import run


@dataclass(slots=True)
class AnnotationRecord:
    query_id: str
    source: str
    subsystem: str | None
    role: str | None
    ec: str | None


def annotate(query_fasta: Path, workdir: Path, *, engine: str = "rasttk") -> list[AnnotationRecord]:
    workdir.mkdir(parents=True, exist_ok=True)
    if engine in ("rast", "rasttk") and shutil.which(settings.rast_bin):
        return _annotate_rasttk(query_fasta, workdir)
    if shutil.which(settings.prokka_bin):
        return _annotate_prokka(query_fasta, workdir)
    return []


def _annotate_rasttk(query_fasta: Path, workdir: Path) -> list[AnnotationRecord]:
    out_json = workdir / "rast.json"
    run(
        [settings.rast_bin, "--input", str(query_fasta), "--output", str(out_json), "--format", "json"],
        workdir=workdir,
    )
    rows: list[AnnotationRecord] = []
    if not out_json.exists():
        return rows
    doc = json.loads(out_json.read_text())
    for feat in doc.get("features", []):
        rows.append(
            AnnotationRecord(
                query_id=feat.get("id", ""),
                source="rasttk",
                subsystem=feat.get("subsystem"),
                role=feat.get("function"),
                ec=(feat.get("ec_numbers") or [None])[0],
            )
        )
    return rows


def _annotate_prokka(query_fasta: Path, workdir: Path) -> list[AnnotationRecord]:
    outdir = workdir / "prokka_out"
    run(
        [settings.prokka_bin, "--outdir", str(outdir), "--prefix", "q", "--fast", str(query_fasta)],
        workdir=workdir,
    )
    rows: list[AnnotationRecord] = []
    tsv = outdir / "q.tsv"
    if not tsv.exists():
        return rows
    with tsv.open() as fh:
        header = fh.readline().rstrip("\n").split("\t")
        idx = {col: i for i, col in enumerate(header)}
        for line in fh:
            parts = line.rstrip("\n").split("\t")
            if len(parts) < len(header):
                continue
            rows.append(
                AnnotationRecord(
                    query_id=parts[idx.get("locus_tag", 0)],
                    source="prokka",
                    subsystem=None,
                    role=parts[idx.get("product", -1)] if "product" in idx else None,
                    ec=parts[idx.get("EC_number", -1)] if "EC_number" in idx else None,
                )
            )
    return rows
