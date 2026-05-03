"""Pydantic models for the application."""
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field

def get_current_time():
    return datetime.now(timezone.utc)

class LogAnalyzeRequest(BaseModel):
    """Request model for log analysis."""
    log_text: str = Field(..., description="The raw log content", min_length=1, max_length=10000)
    log_type: str = Field(..., description="Type of log (nginx, apache, system, docker, kubernetes, custom)")
    context: Optional[str] = Field(None, description="Extra info about the server")

class LogAnalyzeResponse(BaseModel):
    """Response model for log analysis."""
    success: bool = Field(..., description="Whether the analysis was successful")
    analyzed_at: datetime = Field(default_factory=get_current_time, description="Timestamp of analysis")
    log_type: str = Field(..., description="Type of log analyzed")
    summary: str = Field(..., description="One line plain English summary")
    what_happened: str = Field(..., description="Detailed plain English explanation")
    root_cause: str = Field(..., description="Why this happened")
    fix_steps: List[str] = Field(..., description="Numbered actionable steps to fix")
    severity: str = Field(..., description="Severity level: low / medium / high / critical")
    estimated_fix_time: str = Field(..., description="Estimated time to fix, e.g., '5 minutes', '1 hour'")
    prevention_tips: List[str] = Field(..., description="How to prevent this in the future")

class ErrorResponse(BaseModel):
    """Error response model."""
    success: bool = Field(False, description="Whether the request was successful")
    error: str = Field(..., description="Error type or title")
    detail: str = Field(..., description="Detailed error message")
