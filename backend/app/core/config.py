from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    api_host: str = "0.0.0.0"
    api_port: int = 8000
    log_level: str = "INFO"

    postgres_dsn: str = "postgresql+psycopg://bact:bact@localhost:5432/bact"

    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    data_dir: Path = Path("/data")
    fasta_dir: Path = Path("/data/fasta")
    struct_dir: Path = Path("/data/structures")
    index_dir: Path = Path("/data/indexes")
    blob_dir: Path = Path("/data/blob")

    blast_bin: str = "blastp"
    diamond_bin: str = "diamond"
    foldseek_bin: str = "foldseek"
    hmmer_bin: str = "hmmscan"
    pfam_hmm: Path = Path("/data/pfam/Pfam-A.hmm")
    rast_bin: str = "rast2-submit-genome"
    prokka_bin: str = "prokka"

    esm_model: str = "facebook/esm2_t33_650M_UR50D"
    esm_device: str = "cpu"
    esm_batch: int = 8
    faiss_index_path: Path = Path("/data/indexes/faiss/proteins.index")
    faiss_nlist: int = 4096
    faiss_nprobe: int = 32
    reranker_ckpt: str = ""
    embed_dim: int = 1280

    uniprot_base: str = "https://rest.uniprot.org"
    alphafold_base: str = "https://alphafold.ebi.ac.uk/files"
    alphafold_concurrency: int = Field(default=5, ge=1, le=20)


settings = Settings()
