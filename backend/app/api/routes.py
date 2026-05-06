"""API Routes."""
from datetime import datetime, timezone
import logging
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from app.models.schemas import (
    LogAnalyzeRequest, LogAnalyzeResponse, ErrorResponse, 
    CostAnalyzeRequest, CostAnalyzeResponse, ServiceCost,
    ServerMonitorRequest, ServerMonitorResponse
)
from app.services.log_analyzer import analyze_log
from app.services.cost_analyzer import fetch_aws_costs, analyze_costs_with_ai
from app.services.server_monitor import (
    fetch_ec2_metrics, 
    analyze_server_health,
    fetch_metrics_only,
    full_analysis
)
from app.services.node_exporter import fetch_node_exporter_metrics
from app.config import APP_NAME, VERSION, NODE_EXPORTER_URL

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

@router.post(
    "/analyze-costs",
    response_model=CostAnalyzeResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="Analyze Cloud Costs"
)
async def analyze_costs_endpoint(request: CostAnalyzeRequest):
    """
    Endpoint to analyze cloud costs using AWS Cost Explorer and AI.
    """
    try:
        period = f"{request.start_date} to {request.end_date}"
        
        # 1. Fetch costs from AWS
        services_data, total_cost, currency = fetch_aws_costs(request.start_date, request.end_date)
        
        # 2. Analyze costs with AI
        ai_analysis = analyze_costs_with_ai(services_data, total_cost, currency, period)
        
        # 3. Format response
        service_breakdown = [
            ServiceCost(**service) for service in services_data
        ]
        
        return CostAnalyzeResponse(
            success=True,
            period=period,
            total_cost=total_cost,
            currency=currency,
            service_breakdown=service_breakdown,
            ai_summary=ai_analysis.get("ai_summary", "No summary provided"),
            waste_detected=ai_analysis.get("waste_detected", []),
            saving_recommendations=ai_analysis.get("saving_recommendations", []),
            estimated_monthly_savings=float(ai_analysis.get("estimated_monthly_savings", 0.0)),
            severity=ai_analysis.get("severity", "low")
        )
        
    except Exception as e:
        logger.exception("Error analyzing costs")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=jsonable_encoder(ErrorResponse(
                success=False,
                error="Internal Server Error",
                detail=str(e)
            ))
        )

from datetime import timedelta
@router.get(
    "/cost-summary",
    summary="Get basic cost summary"
)
async def cost_summary_endpoint():
    try:
        now = datetime.now()
        start_date = now.replace(day=1).strftime('%Y-%m-%d')
        end_date = (now + timedelta(days=1)).strftime('%Y-%m-%d')
        
        services_data, total_cost, currency = fetch_aws_costs(start_date, end_date)
        
        return {
            "success": True,
            "total_cost": total_cost,
            "currency": currency,
            "period": f"{start_date} to {now.strftime('%Y-%m-%d')}"
        }
    except Exception as e:
        logger.exception("Error getting cost summary")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=jsonable_encoder(ErrorResponse(
                success=False,
                error="Cost Summary Error",
                detail=str(e)
            ))
        )

@router.post(
    "/cost-summary",
    summary="Quick Cost Summary"
)
async def cost_summary_endpoint():
    """
    Quick endpoint to fetch last 3 months costs without AI analysis.
    """
    try:
        from datetime import timedelta
        
        now = datetime.now(timezone.utc)
        end_date = now.strftime('%Y-%m-%d')
        start_date = (now - timedelta(days=90)).strftime('%Y-%m-%d')
        
        services_data, total_cost, currency = fetch_aws_costs(start_date, end_date)
        
        return {
            "success": True,
            "period": f"{start_date} to {end_date}",
            "total_cost": total_cost,
            "currency": currency,
            "services": services_data
        }
        
    except Exception as e:
        logger.exception("Error getting cost summary")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=jsonable_encoder(ErrorResponse(
                success=False,
                error="Internal Server Error",
                detail=str(e)
            ))
        )

@router.post(
    "/monitor-server",
    response_model=ServerMonitorResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
    summary="Analyze Server Health"
)
async def monitor_server_endpoint(request: ServerMonitorRequest):
    """
    Endpoint to fetch EC2 metrics and analyze server health with AI.
    """
    try:
        analysis = await full_analysis(request.instance_id, request.region, request.hours)
        return ServerMonitorResponse(**analysis)
        
    except Exception as e:
        logger.exception("Error monitoring server")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=jsonable_encoder(ErrorResponse(
                success=False,
                error="Internal Server Error",
                detail=str(e)
            ))
        )

@router.get(
    "/metrics-only/{instance_id}",
    summary="Metrics Only (No AI)"
)
async def metrics_only_endpoint(instance_id: str, region: str = "ap-south-1", hours: int = 1):
    """
    Endpoint to fetch CloudWatch metrics without AI analysis.
    """
    try:
        result = fetch_metrics_only(instance_id, region, hours)
        return result
    except Exception as e:
        logger.exception("Error getting metrics only")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=jsonable_encoder(ErrorResponse(
                success=False,
                error="Internal Server Error",
                detail=str(e)
            ))
        )

@router.get(
    "/node-metrics",
    summary="Get raw Node Exporter metrics"
)
async def node_metrics_endpoint():
    """
    Endpoint to fetch raw metrics from Node Exporter.
    """
    try:
        metrics = await fetch_node_exporter_metrics(NODE_EXPORTER_URL)
        return {"success": True, **metrics}
    except Exception as e:
        logger.exception("Error getting node metrics")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=jsonable_encoder(ErrorResponse(
                success=False,
                error="Node Exporter Error",
                detail=str(e)
            ))
        )

@router.get(
    "/quick-health/{instance_id}",
    summary="Quick Health Check"
)
async def quick_health_endpoint(instance_id: str, region: str = "ap-south-1"):
    """
    Quick endpoint to fetch last 1 hour CPU and return basic health status.
    """
    try:
        metrics = fetch_ec2_metrics(instance_id, region, 1)
        
        cpu_values = [m.value for m in metrics.cpu_usage]
        cpu_avg = sum(cpu_values) / len(cpu_values) if cpu_values else 0.0
        
        if cpu_avg > 90:
            status = "critical"
        elif cpu_avg > 70:
            status = "warning"
        else:
            status = "healthy"
            
        return {
            "success": True,
            "instance_id": instance_id,
            "status": status,
            "cpu_avg": cpu_avg
        }
        
    except Exception as e:
        logger.exception("Error checking quick health")
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
            "/api/v1/analyze-costs",
            "/api/v1/cost-summary",
            "/api/v1/monitor-server",
            "/api/v1/health"
        ]
    }
