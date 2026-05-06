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

class CostAnalyzeRequest(BaseModel):
    """Request model for cost analysis."""
    start_date: str = Field(..., description="Start date (YYYY-MM-DD)")
    end_date: str = Field(..., description="End date (YYYY-MM-DD)")
    account_label: str = Field("AWS Account", description="Account label")

class ServiceCost(BaseModel):
    """Model for individual service cost."""
    service_name: str = Field(..., description="Name of the service")
    total_cost: float = Field(..., description="Total cost of the service")
    currency: str = Field(..., description="Currency (e.g., USD)")
    percentage_of_total: float = Field(..., description="Percentage of total cost")

class CostAnalyzeResponse(BaseModel):
    """Response model for cost analysis."""
    success: bool = Field(..., description="Whether the analysis was successful")
    analyzed_at: datetime = Field(default_factory=get_current_time, description="Timestamp of analysis")
    period: str = Field(..., description="Period analyzed (e.g., '2023-01-01 to 2023-01-31')")
    total_cost: float = Field(..., description="Total cost across all services")
    currency: str = Field(..., description="Currency (e.g., USD)")
    service_breakdown: List[ServiceCost] = Field(..., description="List of service costs")
    ai_summary: str = Field(..., description="AI generated summary of the spending")
    waste_detected: List[str] = Field(..., description="List of detected waste or unused resources")
    saving_recommendations: List[str] = Field(..., description="List of specific saving recommendations")
    estimated_monthly_savings: float = Field(..., description="Estimated monthly savings possible")
    severity: str = Field(..., description="Severity level: low / medium / high / critical")

class ServerMonitorRequest(BaseModel):
    """Request model for server monitoring."""
    instance_id: str = Field(..., description="EC2 instance ID")
    region: str = Field("ap-south-1", description="AWS Region")
    hours: int = Field(24, description="How many hours of metrics to fetch")

class MetricPoint(BaseModel):
    """Data point for a metric."""
    timestamp: str = Field(..., description="ISO 8601 timestamp")
    value: float = Field(..., description="Metric value")

class ServerMetrics(BaseModel):
    """Metrics for a server."""
    cpu_usage: List[MetricPoint] = Field(default_factory=list)
    memory_available: List[MetricPoint] = Field(default_factory=list)
    disk_read: List[MetricPoint] = Field(default_factory=list)
    disk_write: List[MetricPoint] = Field(default_factory=list)
    network_in: List[MetricPoint] = Field(default_factory=list)
    network_out: List[MetricPoint] = Field(default_factory=list)

class MetricsSummary(BaseModel):
    """Summary of the metrics."""
    cpu_avg: float = Field(..., description="Average CPU usage")
    cpu_max: float = Field(..., description="Max CPU usage")
    memory_avg: float = Field(..., description="Average memory available")
    disk_read_avg: float = Field(..., description="Average disk read")
    network_in_total: float = Field(..., description="Total network in")

class ServerMonitorResponse(BaseModel):
    """Response model for server monitoring analysis."""
    success: bool = Field(..., description="Whether the analysis was successful")
    analyzed_at: datetime = Field(default_factory=get_current_time, description="Timestamp of analysis")
    instance_id: str = Field(..., description="EC2 instance ID")
    region: str = Field(..., description="AWS Region")
    period_hours: int = Field(..., description="Hours of data analyzed")
    metrics_summary: MetricsSummary = Field(..., description="Summary of metrics")
    ai_analysis: str = Field(..., description="AI generated analysis")
    health_status: str = Field(..., description="Health status (healthy/warning/critical)")
    issues_detected: List[str] = Field(..., description="List of detected issues")
    recommendations: List[str] = Field(..., description="List of recommendations")
    predicted_problems: List[str] = Field(..., description="List of predicted problems")
    alert_level: str = Field(..., description="Alert level (none/low/medium/high/critical)")
    analysis_type: str = Field("ai", description="Type of analysis (ai/rule_based)")
    has_ai_analysis: bool = Field(True, description="Whether AI analysis was successful")
    score: Optional[int] = Field(None, description="Score if rule-based")
    data_source: str = Field("cloudwatch", description="Source of metrics data")
    uptime_hours: Optional[float] = None
    load_avg_1m: Optional[float] = None
    load_avg_5m: Optional[float] = None
    load_avg_15m: Optional[float] = None
    memory_used_gb: Optional[float] = None
    memory_total_gb: Optional[float] = None
    network_receive_mb: Optional[float] = None
    network_transmit_mb: Optional[float] = None
