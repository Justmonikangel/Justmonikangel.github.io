from fastapi import FastAPI

from app.api.routes import annotate, health, ingest, jobs, search
from app.core.logging import configure_logging
from app.storage.local import ensure_dirs

configure_logging()
ensure_dirs()

app = FastAPI(
    title="Bacterial Protein Homology Search API",
    description=(
        "ERAST-style three-stage pipeline (Pfam segmentation + ESM-2/FAISS retrieval "
        "+ BLAST/Foldseek rerank) for bacterial protein similarity search. "
        "Includes UniProt ingest, AlphaFold structure fetch, and RAST/Prokka annotation."
    ),
    version="0.1.0",
)

app.include_router(health.router)
app.include_router(ingest.router)
app.include_router(jobs.router)
app.include_router(search.router)
app.include_router(annotate.router)


@app.get("/", include_in_schema=False)
def root() -> dict:
    return {
        "name": "bact-protein-search",
        "docs": "/docs",
        "health": "/healthz",
    }
