"""GET /api/health — service + model availability probe."""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from ..config import settings
from ..services.artifacts import registry

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Service and model health check")
def health():
    ready = registry.is_ready
    body = {
        "status": "ok" if ready else "degraded",
        "service": settings.app_name,
        "version": settings.version,
        "model_loaded": ready,
        "best_model": registry.metrics.get("best_model") if registry.metrics else None,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    # 503 while the ML artifacts are unavailable so orchestrators/monitors can
    # detect a degraded (but running) service.
    return JSONResponse(status_code=200 if ready else 503, content=body)
