"""FAISS index — IVF+PQ, billion-scale-friendly. Mirrors ERAST's vector DB layer.

We use IndexIVFPQ over normalized vectors with inner product (cosine).
For very small libraries (<10k) we transparently fall back to IndexFlatIP.
"""
from __future__ import annotations

from pathlib import Path

import numpy as np

from app.core.config import settings


def _faiss():  # pragma: no cover — import guard
    import faiss  # type: ignore

    return faiss


def build(vectors: np.ndarray, ids: np.ndarray, out_path: Path | None = None):
    """Train + populate an IVFPQ index from (N, dim) float32 normalized vectors."""
    faiss = _faiss()
    n, dim = vectors.shape
    if dim != settings.embed_dim:
        raise ValueError(f"expected dim={settings.embed_dim}, got {dim}")

    if n < 10_000:
        index = faiss.IndexFlatIP(dim)
        index = faiss.IndexIDMap2(index)
        index.add_with_ids(vectors, ids)
    else:
        nlist = min(settings.faiss_nlist, max(64, int(np.sqrt(n))))
        m = 64  # PQ subquantizers; divides 1280 (ESM2-650M) cleanly
        nbits = 8
        quantizer = faiss.IndexFlatIP(dim)
        index = faiss.IndexIVFPQ(quantizer, dim, nlist, m, nbits, faiss.METRIC_INNER_PRODUCT)
        index.train(vectors)
        index = faiss.IndexIDMap2(index)
        index.add_with_ids(vectors, ids)

    if out_path is not None:
        out_path.parent.mkdir(parents=True, exist_ok=True)
        faiss.write_index(index, str(out_path))
    return index


def load(path: Path | None = None):
    faiss = _faiss()
    p = path or settings.faiss_index_path
    return faiss.read_index(str(p))


def search(index, query_vectors: np.ndarray, top_k: int) -> tuple[np.ndarray, np.ndarray]:
    """Return (scores, ids). Higher score == more similar (cosine on normalized)."""
    if hasattr(index, "nprobe"):
        index.nprobe = settings.faiss_nprobe
    scores, ids = index.search(query_vectors, top_k)
    return scores, ids
