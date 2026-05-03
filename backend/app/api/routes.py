"""API Routes."""
from datetime import datetime, timezone
import logging
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from app.models.schemas import LogAnalyzeRequest, LogAnalyzeResponse, ErrorResponse
from app.services.log_analyzer import analyze_log
from app.config import APP_NAME, VERSION

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post(
    "/analyze-logs",
    response_model=LogAnalyzeResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="Analyze Server Logs"
)
async def analyze_logs_endpoint(request: LogAnalyzeRequest):
    """
    Endpoint to analyze server logs using AI.
    """
    if not request.log_text.strip():
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=jsonable_encoder(ErrorResponse(
                success=False,
                error="Validation Error",
                detail="log_text cannot be empty."
            ))
        )

    try:
        response = analyze_log(
            log_text=request.log_text,
            log_type=request.log_type,
            context=request.context
        )
        return response
    except Exception as e:
        logger.exception("Error analyzing logs")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=jsonable_encoder(ErrorResponse(
                success=False,
                error="Internal Server Error",
                detail=str(e)
            ))
        )

@router.get("/health", summary="Health Check")
async def health_check():
    """
    Returns API health status.
    """
    return {
        "app": APP_NAME,
        "version": VERSION,
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.get("/", summary="Root Endpoint")
async def root():
    """
    Returns welcome message.
    """
    return {
        "message": f"Welcome to {APP_NAME} API",
        "endpoints": [
            "/api/v1/analyze-logs",
            "/api/v1/health"
        ]
    }
