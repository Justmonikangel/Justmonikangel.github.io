"""UniProt REST/Stream client.

Streams FASTA + JSON metadata for proteins matching a taxonomy filter.
Default query: taxonomy_id:2 (Bacteria) AND reviewed:true.
"""
from __future__ import annotations

import hashlib
import json
from collections.abc import Iterator
from dataclasses import dataclass
from pathlib import Path

import httpx

from app.core.config import settings


@dataclass(slots=True)
class UniProtRecord:
    accession: str
    name: str | None
    organism_id: int | None
    organism_name: str | None
    sequence: str
    length: int
    md5: str
    ec: list[str]
    gene_names: list[str]
    function: str | None
    pdb_xrefs: list[str]
    alphafold_id: str | None


def _build_query(taxon: int, reviewed: bool) -> str:
    parts = [f"taxonomy_id:{taxon}"]
    if reviewed:
        parts.append("reviewed:true")
    return " AND ".join(parts)


def stream_json(taxon: int, *, reviewed: bool = True, limit: int | None = None) -> Iterator[dict]:
    url = f"{settings.uniprot_base}/uniprotkb/stream"
    params = {
        "query": _build_query(taxon, reviewed),
        "format": "json",
    }
    if limit:
        params["size"] = str(limit)
    with httpx.Client(timeout=httpx.Timeout(60.0, read=600.0)) as client:
        with client.stream("GET", url, params=params) as resp:
            resp.raise_for_status()
            buf = b""
            for chunk in resp.iter_bytes():
                buf += chunk
            # UniProt stream returns a single JSON document {"results": [...]}
            doc = json.loads(buf)
            for entry in doc.get("results", []):
                yield entry


def parse_entry(entry: dict) -> UniProtRecord:
    accession = entry["primaryAccession"]
    seq = entry["sequence"]["value"]
    md5 = hashlib.md5(seq.encode()).hexdigest()  # noqa: S324 — md5 for content hash, not auth
    organism = entry.get("organism") or {}
    name = None
    if (pd := entry.get("proteinDescription")):
        rec = pd.get("recommendedName") or {}
        if "fullName" in rec:
            name = rec["fullName"].get("value")
    ec: list[str] = []
    for x in (entry.get("proteinDescription") or {}).get("recommendedName", {}).get("ecNumbers", []) or []:
        if "value" in x:
            ec.append(x["value"])
    genes = [g["geneName"]["value"] for g in entry.get("genes", []) if "geneName" in g]
    function = None
    for c in entry.get("comments", []) or []:
        if c.get("commentType") == "FUNCTION":
            texts = [t["value"] for t in c.get("texts", []) if "value" in t]
            if texts:
                function = " ".join(texts)
                break
    pdb_xrefs = [
        x["id"] for x in entry.get("uniProtKBCrossReferences", []) or [] if x.get("database") == "PDB"
    ]
    alphafold_id = None
    for x in entry.get("uniProtKBCrossReferences", []) or []:
        if x.get("database") == "AlphaFoldDB":
            alphafold_id = x.get("id")
            break
    return UniProtRecord(
        accession=accession,
        name=name,
        organism_id=organism.get("taxonId"),
        organism_name=organism.get("scientificName"),
        sequence=seq,
        length=len(seq),
        md5=md5,
        ec=ec,
        gene_names=genes,
        function=function,
        pdb_xrefs=pdb_xrefs,
        alphafold_id=alphafold_id,
    )


def stream_fasta_to_file(taxon: int, out_path: Path, *, reviewed: bool = True) -> Path:
    url = f"{settings.uniprot_base}/uniprotkb/stream"
    params = {"query": _build_query(taxon, reviewed), "format": "fasta"}
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with httpx.Client(timeout=httpx.Timeout(60.0, read=None)) as client:
        with client.stream("GET", url, params=params) as resp:
            resp.raise_for_status()
            with out_path.open("wb") as fh:
                for chunk in resp.iter_bytes():
                    fh.write(chunk)
    return out_path
