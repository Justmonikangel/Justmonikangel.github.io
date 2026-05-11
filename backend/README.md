# Bacterial Protein Homology Search (ERAST-style backend)

ERAST-style three-stage homology search for bacterial proteins, plus the
classical UniProt/BLAST/Foldseek/RAST stack. Backend only — no UI; FastAPI's
auto-generated `/docs` is the only "front end".

## Core skill (mirrors ERAST, Nat Biotechnol 2026)

1. **Pre-retrieval — segment.** `hmmscan` against Pfam-A splits each query into
   domain-level chunks (`services/hmmer.py`). Falls back to whole-sequence if
   no Pfam DB is mounted.
2. **Retrieval — embed + ANN.** ESM-2 (`facebook/esm2_t33_650M_UR50D`, mean-
   pooled, L2-normalised) encodes each chunk; FAISS IVF+PQ over inner product
   gives sub-second top-K over billion-scale libraries
   (`services/esm_encoder.py`, `services/faiss_index.py`).
3. **Post-retrieval — rerank.** ANN candidates are rescored with DIAMOND
   (always) and Foldseek (optional, if a query structure exists). An optional
   learned cross-encoder slot (`RERANKER_CKPT`) mirrors ERAST's EHSM stage
   (`services/reranker.py`).

Plus, on top of ERAST's core:

- **UniProt ingest** (`services/uniprot.py`) — stream all reviewed bacterial
  proteins (taxonomy id 2 by default).
- **AlphaFold structure fetch** (`services/alphafold.py`).
- **RAST / RASTtk / Prokka annotation** (`services/rast.py`) — `engine=rasttk`
  by default, auto-falls back to Prokka if RAST CLI is missing.

## Layout

```
backend/
├── app/
│   ├── api/routes/    # health, ingest, jobs, search, annotate
│   ├── core/          # config, logging, exceptions
│   ├── db/            # SQLAlchemy models + session
│   ├── schemas/       # Pydantic
│   ├── services/      # tool wrappers + pipeline orchestrator
│   ├── storage/       # local-disk blob abstraction
│   └── workers/       # Celery app + tasks
├── alembic/           # migrations
├── docker/            # Dockerfiles
├── tests/
├── docker-compose.yml
└── pyproject.toml
```

## Running

```bash
cd backend
cp .env.example .env
docker compose up --build
```

Once healthy:

```bash
curl http://localhost:8000/healthz
open http://localhost:8000/docs
```

## End-to-end example — "search all similar proteins"

```bash
# 1) Ingest a small bacterial subset (1k reviewed bacterial proteins).
curl -X POST localhost:8000/ingest \
  -H 'content-type: application/json' \
  -d '{"taxon": 2, "reviewed": true, "limit": 1000}'

# 2) (One-time) build the ESM-2 embeddings + FAISS index for the ingested set.
#    This is wired through the worker; trigger from a Celery shell or via a
#    follow-up endpoint once embeddings are populated.

# 3) Submit a query — the three-stage ERAST-style pipeline.
JOB=$(curl -s -X POST localhost:8000/search/similar \
  -H 'content-type: application/json' \
  -d '{
        "sequences": [{"id": "ecoli_recA", "seq": "MAIDENKQKAL..."}],
        "top_k_retrieval": 500,
        "top_k_final": 50,
        "use_pfam_segmentation": true,
        "rerank_with_blast": true,
        "rerank_with_foldseek": false
      }' | jq -r .job_id)

# 4) Poll until SUCCESS.
curl localhost:8000/jobs/$JOB

# 5) Fetch hits / download.
curl localhost:8000/jobs/$JOB/hits | jq .
curl -OJ "localhost:8000/jobs/$JOB/download?fmt=tsv"
```

## Key endpoints

| Method | Path                       | What                                          |
|--------|----------------------------|-----------------------------------------------|
| GET    | `/healthz`                 | DB, Redis, and tool binary check              |
| POST   | `/ingest`                  | Stream UniProt → DB → AlphaFold → build indices |
| POST   | `/search/similar`          | **ERAST-style combined search** (main entry)  |
| POST   | `/search/sequence`         | BLASTp / DIAMOND only                         |
| POST   | `/search/structure`        | Foldseek (accession or uploaded PDB/CIF)      |
| POST   | `/annotate/rast`           | RASTtk / Prokka annotation                    |
| GET    | `/jobs/{id}`               | Status                                        |
| GET    | `/jobs/{id}/hits`          | Hits JSON                                     |
| GET    | `/jobs/{id}/download`      | TSV/JSON download                             |

## Tests

```bash
cd backend
pip install -e ".[dev]"
pytest
```

The included unit tests don't require any external tools or databases
(`test_schemas.py`, `test_pfam_segmentation.py`, `test_blast_parser.py`).
Integration tests against real BLAST/Foldseek live in `docker compose run worker pytest`.

## License & references

- ERAST: Scalable homology detection with ERAST, *Nat Biotechnol* (2026),
  doi:10.1038/s41587-026-03051-1.
- Code skeleton MIT.
