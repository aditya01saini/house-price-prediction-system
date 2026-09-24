"""HousePredict AI — FastAPI application entry point.

Run from the ``backend`` directory:

    uvicorn app.main:app --reload

The trained ML pipeline is loaded once at startup. If artifacts are missing
the API still boots in a degraded state: /api/health reports it and every
model-dependent endpoint returns HTTP 503 with a friendly message — clients
never see stack traces.
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .routes import ai, analytics, health, metrics, model_info, prediction
from .services.artifacts import ArtifactError, registry

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-7s %(name)s — %(message)s",
)
logger = logging.getLogger("app")


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        registry.load()
    except ArtifactError as exc:
        logger.error("Starting in DEGRADED mode: %s", exc)
    yield


app = FastAPI(
    title=settings.app_name,
    description=settings.description,
    version=settings.version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")
app.include_router(model_info.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(prediction.router, prefix="/api")
app.include_router(ai.router, prefix="/api")


# --------------------------------------------------------------------------- #
# Consistent, user-friendly error envelopes (no raw tracebacks)               #
# --------------------------------------------------------------------------- #
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    """Turn Pydantic validation noise into a clean, field-level 422 payload."""
    field_errors = []
    for error in exc.errors():
        location = ".".join(str(part) for part in error.get("loc", ()) if part != "body")
        message = error.get("msg", "Invalid value.")
        if message.startswith("Value error, "):
            message = message[len("Value error, "):]
        field_errors.append({"field": location or "body", "message": message})
    return JSONResponse(
        status_code=422,
        content={
            "message": "Please correct the highlighted fields and try again.",
            "errors": field_errors,
        },
    )


@app.exception_handler(ArtifactError)
async def artifact_exception_handler(_: Request, exc: ArtifactError):
    logger.error("Artifact error on %s: %s", _.url.path, exc)
    return JSONResponse(
        status_code=503,
        content={
            "message": "The ML model is not available right now. "
                       "Train it with `python -m ml.train`, then restart the API."
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={"message": "Something went wrong on our side. Please try again in a moment."},
    )


@app.get("/", include_in_schema=False)
def root():
    return {
        "service": settings.app_name,
        "version": settings.version,
        "tagline": settings.description,
        "docs": "/docs",
        "endpoints": [
            "/api/health", "/api/model-info", "/api/metrics", "/api/predict", "/api/analytics",
            "/api/ai/analyze", "/api/ai/explain", "/api/ai/chat",
        ],
    }
