"""AlphaFold DB client. Downloads predicted structure CIFs for UniProt accessions."""
from __future__ import annotations

import asyncio
from pathlib import Path

import httpx

from app.core.config import settings


def cif_url(accession: str) -> str:
    return f"{settings.alphafold_base}/AF-{accession}-F1-model_v4.cif"


async def _download_one(client: httpx.AsyncClient, accession: str, out_dir: Path) -> Path | None:
    url = cif_url(accession)
    out = out_dir / f"AF-{accession}-F1-model_v4.cif"
    if out.exists():
        return out
    try:
        resp = await client.get(url, timeout=60.0)
    except httpx.HTTPError:
        return None
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(resp.content)
    return out


async def download_many(accessions: list[str], out_dir: Path) -> list[Path]:
    sem = asyncio.Semaphore(settings.alphafold_concurrency)
    paths: list[Path] = []

    async def _wrap(client: httpx.AsyncClient, acc: str) -> None:
        async with sem:
            p = await _download_one(client, acc, out_dir)
            if p is not None:
                paths.append(p)

    async with httpx.AsyncClient() as client:
        await asyncio.gather(*[_wrap(client, a) for a in accessions])
    return paths
