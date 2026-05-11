"""ESM-2 encoder — produces fixed-dim embeddings used for FAISS retrieval
(the core of the ERAST-style pipeline).

Heavy ML deps (torch, transformers) are imported lazily so the API container
can run without them; only the worker container needs them.
"""
from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

import numpy as np

from app.core.config import settings


@dataclass(slots=True)
class EncodedChunk:
    query_id: str
    chunk_kind: str
    chunk_start: int
    chunk_end: int
    pfam_acc: str | None
    vector: np.ndarray  # shape (embed_dim,), L2-normalized float32


@lru_cache(maxsize=1)
def _load_model():  # pragma: no cover — exercised in worker container only
    import torch
    from transformers import AutoModel, AutoTokenizer

    tokenizer = AutoTokenizer.from_pretrained(settings.esm_model)
    model = AutoModel.from_pretrained(settings.esm_model)
    model.eval()
    device = torch.device(settings.esm_device)
    model.to(device)
    return tokenizer, model, device


def encode(chunks: list[dict]) -> list[EncodedChunk]:
    """Encode a batch of chunks (dicts produced by hmmer.segment) into vectors.

    Pooling: masked-mean over residue token embeddings (matches the common
    ESM2-for-retrieval recipe used in ERAST/PLMSearch).
    """
    if not chunks:
        return []
    import torch

    tokenizer, model, device = _load_model()
    results: list[EncodedChunk] = []
    batch = settings.esm_batch
    with torch.inference_mode():
        for i in range(0, len(chunks), batch):
            sub = chunks[i : i + batch]
            seqs = [c["seq"] for c in sub]
            tok = tokenizer(seqs, padding=True, return_tensors="pt", add_special_tokens=True)
            tok = {k: v.to(device) for k, v in tok.items()}
            out = model(**tok)
            hidden = out.last_hidden_state  # (B, L, D)
            mask = tok["attention_mask"].unsqueeze(-1).float()
            summed = (hidden * mask).sum(dim=1)
            counts = mask.sum(dim=1).clamp(min=1)
            pooled = summed / counts
            pooled = torch.nn.functional.normalize(pooled, p=2, dim=1)
            vectors = pooled.cpu().numpy().astype(np.float32)
            for c, v in zip(sub, vectors, strict=True):
                results.append(
                    EncodedChunk(
                        query_id=c["query_id"],
                        chunk_kind=c["kind"],
                        chunk_start=c["start"],
                        chunk_end=c["end"],
                        pfam_acc=c.get("pfam_acc"),
                        vector=v,
                    )
                )
    return results
