from typing import Literal

from pydantic import BaseModel, Field, field_validator

AA_ALPHABET = set("ACDEFGHIKLMNPQRSTVWYBXZJUO*")


class QuerySequence(BaseModel):
    id: str = Field(min_length=1, max_length=128)
    seq: str = Field(min_length=10, max_length=50_000)

    @field_validator("seq")
    @classmethod
    def _validate_alphabet(cls, v: str) -> str:
        upper = v.strip().upper().replace("\n", "").replace(" ", "")
        bad = set(upper) - AA_ALPHABET
        if bad:
            raise ValueError(f"unexpected amino acid symbols: {sorted(bad)}")
        return upper


class SequenceSearchRequest(BaseModel):
    sequences: list[QuerySequence] = Field(min_length=1, max_length=100)
    tool: Literal["blastp", "diamond", "mmseqs2"] = "diamond"
    evalue: float = Field(default=1e-5, gt=0)
    max_targets: int = Field(default=50, ge=1, le=1000)


class StructureSearchRequest(BaseModel):
    accession: str | None = None  # AlphaFold accession; or upload via multipart
    max_targets: int = Field(default=50, ge=1, le=1000)


class SimilarSearchRequest(BaseModel):
    """ERAST-style combined search: pre-retrieval segmentation, FAISS retrieval,
    BLAST / Foldseek / reranker post-retrieval."""

    sequences: list[QuerySequence] = Field(min_length=1, max_length=20)
    top_k_retrieval: int = Field(default=500, ge=1, le=10_000)
    top_k_final: int = Field(default=50, ge=1, le=1000)
    use_pfam_segmentation: bool = True
    rerank_with_blast: bool = True
    rerank_with_foldseek: bool = False
    annotate_with_rast: bool = False


class AnnotateRequest(BaseModel):
    sequences: list[QuerySequence] = Field(min_length=1, max_length=100)
    engine: Literal["rast", "rasttk", "prokka"] = "rasttk"


class HitOut(BaseModel):
    query_id: str
    target_accession: str
    tool: str
    rank: int | None = None
    evalue: float | None = None
    bit_score: float | None = None
    identity: float | None = None
    coverage: float | None = None
    embed_score: float | None = None
    struct_tmscore: float | None = None
    lddt: float | None = None
