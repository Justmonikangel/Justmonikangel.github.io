from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "bact_protein_search",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    task_time_limit=60 * 60 * 6,
    task_soft_time_limit=60 * 60 * 5,
)
