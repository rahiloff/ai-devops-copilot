"""Main FastAPI application module."""
import time
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from app.config import APP_NAME, VERSION
from app.api.routes import router
from app.models.schemas import ErrorResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

BANNER = r"""
    ___  ____  ___                      _____                 __ 
   /   |/  _/ |   \  ____ _   __ ____  / ___/  ____  ____    / / 
  / /| |/ /   | |\ \/ __ \ | / // __ \ \__ \  / __ \/ __ \  / /  
 / ___ / /    | |/ /  __/ |/ / / /_/ /___/ / / /_/ / /_/ / / /   
/_/  |___/    |___/\___/|___/  \____//____/  \____/\____/ /_/    
                                                                 
"""

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    print(BANNER)
    print(f"{APP_NAME} Started (Version: {VERSION})")
    logger.info(f"{APP_NAME} Started")
    yield
    logger.info(f"{APP_NAME} Shutting down")

# Initialize FastAPI App
app = FastAPI(
    title=APP_NAME,
    description="An AI-powered platform that analyzes server logs and provides actionable fix recommendations.",
    version=VERSION,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Middleware to log requests."""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.info(
        f"Method: {request.method} | Path: {request.url.path} | "
        f"Status: {response.status_code} | Time: {process_time:.4f}s"
    )
    return response

# Validation Exception Handler
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handler for Pydantic validation errors."""
    errors = exc.errors()
    error_msg = "; ".join([f"{'.'.join(str(loc) for loc in err['loc'])}: {err['msg']}" for err in errors])
    logger.warning(f"Validation error: {error_msg}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=jsonable_encoder(ErrorResponse(
            success=False,
            error="Validation Error",
            detail=error_msg
        ))
    )

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global handler for unhandled exceptions."""
    logger.exception(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=jsonable_encoder(ErrorResponse(
            success=False,
            error="Internal Server Error",
            detail="An unexpected error occurred."
        ))
    )

# Include Router
app.include_router(router, prefix="/api/v1")
