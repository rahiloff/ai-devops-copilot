"""Server Monitoring service using boto3 and Gemini AI."""
import json
import logging
import time
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List

import boto3
from botocore.exceptions import ClientError
from app.config import (
    AWS_CLIENT_ACCESS_KEY, 
    AWS_CLIENT_SECRET_KEY
)
from app.models.schemas import (
    ServerMetrics, 
    MetricPoint, 
    MetricsSummary,
    LogAnalyzeResponse,
    CostAnalyzeResponse,
    ServerMonitorResponse
)
from app.services.gemini_client import generate_content

logger = logging.getLogger(__name__)

def fetch_ec2_metrics(instance_id: str, region: str, hours: int) -> ServerMetrics:
    """
    Fetches EC2 metrics from AWS CloudWatch.
    
    Args:
        instance_id (str): The EC2 instance ID.
        region (str): AWS region.
        hours (int): Number of hours of data to fetch.
        
    Returns:
        ServerMetrics: The fetched metrics.
    """
    try:
        client = boto3.client(
            'cloudwatch',
            region_name=region,
            aws_access_key_id=AWS_CLIENT_ACCESS_KEY,
            aws_secret_access_key=AWS_CLIENT_SECRET_KEY
        )
        
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(hours=hours)
        
        metrics_to_fetch = {
            'cpu_usage': 'CPUUtilization',
            'network_in': 'NetworkIn',
            'network_out': 'NetworkOut',
            'disk_read': 'DiskReadBytes',
            'disk_write': 'DiskWriteBytes'
        }
        
        results = {
            'cpu_usage': [],
            'memory_available': [], # Note: Default EC2 doesn't have Memory, left empty
            'disk_read': [],
            'disk_write': [],
            'network_in': [],
            'network_out': []
        }
        
        for key, metric_name in metrics_to_fetch.items():
            response = client.get_metric_statistics(
                Namespace='AWS/EC2',
                MetricName=metric_name,
                Dimensions=[{'Name': 'InstanceId', 'Value': instance_id}],
                StartTime=start_time,
                EndTime=end_time,
                Period=300, # 5 min intervals
                Statistics=['Average']
            )
            
            datapoints = response.get('Datapoints', [])
            # Sort by timestamp
            datapoints.sort(key=lambda x: x['Timestamp'])
            
            for dp in datapoints:
                results[key].append(
                    MetricPoint(
                        timestamp=dp['Timestamp'].isoformat(),
                        value=float(dp['Average'])
                    )
                )
                
        return ServerMetrics(**results)
        
    except ClientError as e:
        logger.error(f"AWS ClientError fetching metrics: {e}")
        raise Exception(f"Failed to fetch CloudWatch metrics: {str(e)}")
    except Exception as e:
        logger.exception("Error fetching CloudWatch metrics")
        raise

def analyze_server_health(metrics: ServerMetrics, instance_id: str) -> Dict[str, Any]:
    """
    Analyzes server metrics using Gemini AI.
    
    Args:
        metrics (ServerMetrics): The metrics data.
        instance_id (str): EC2 instance ID.
        
    Returns:
        Dict: Parsed JSON containing analysis details.
    """
    # Calculate simple summaries for the prompt
    cpu_values = [m.value for m in metrics.cpu_usage]
    disk_read_values = [m.value for m in metrics.disk_read]
    network_in_values = [m.value for m in metrics.network_in]
    
    cpu_avg = sum(cpu_values) / len(cpu_values) if cpu_values else 0.0
    cpu_max = max(cpu_values) if cpu_values else 0.0
    disk_read_avg = sum(disk_read_values) / len(disk_read_values) if disk_read_values else 0.0
    network_in_total = sum(network_in_values) if network_in_values else 0.0
    
    summary = MetricsSummary(
        cpu_avg=cpu_avg,
        cpu_max=cpu_max,
        memory_avg=0.0, # Placeholder
        disk_read_avg=disk_read_avg,
        network_in_total=network_in_total
    )
    
    system_prompt = (
        "You are a senior DevOps engineer specializing in server performance analysis. "
        "Analyze the provided server metrics summary for an EC2 instance. "
        "Detect current issues, predict future problems, give specific recommendations, "
        "and assign a health status (healthy, warning, critical) and alert level (none, low, medium, high, critical). "
        "Respond ONLY in valid JSON format matching this exact schema: \n"
        "{\n"
        '  "ai_analysis": "Detailed analysis string",\n'
        '  "health_status": "healthy or warning or critical",\n'
        '  "issues_detected": ["issue 1", "issue 2"],\n'
        '  "recommendations": ["rec 1", "rec 2"],\n'
        '  "predicted_problems": ["prob 1", "prob 2"],\n'
        '  "alert_level": "none or low or medium or high or critical"\n'
        "}"
    )
    
    prompt = (
        f"Instance ID: {instance_id}\n"
        f"Metrics Summary:\n"
        f"CPU Avg: {cpu_avg}%\n"
        f"CPU Max: {cpu_max}%\n"
        f"Disk Read Avg: {disk_read_avg} bytes\n"
        f"Network In Total: {network_in_total} bytes\n"
    )
    
    try:
        result_text = generate_content(prompt, system_prompt)
        
        if result_text.startswith("```json"):
            result_text = result_text[7:-3]
        elif result_text.startswith("```"):
            result_text = result_text[3:-3]
            
        result_json = json.loads(result_text.strip())
        
        return {
            "metrics_summary": summary,
            "ai_analysis": result_json.get("ai_analysis", "Analysis failed."),
            "health_status": result_json.get("health_status", "warning"),
            "issues_detected": result_json.get("issues_detected", []),
            "recommendations": result_json.get("recommendations", []),
            "predicted_problems": result_json.get("predicted_problems", []),
            "alert_level": result_json.get("alert_level", "medium")
        }
    except Exception as e:
        logger.error(f"Health AI analysis failed: {e}")
        raise e

def fetch_metrics_only(instance_id: str, region: str, hours: int) -> Dict[str, Any]:
    metrics = fetch_ec2_metrics(instance_id, region, hours)
    
    cpu_values = [m.value for m in metrics.cpu_usage]
    disk_read_values = [m.value for m in metrics.disk_read]
    network_in_values = [m.value for m in metrics.network_in]
    
    cpu_avg = sum(cpu_values) / len(cpu_values) if cpu_values else 0.0
    cpu_max = max(cpu_values) if cpu_values else 0.0
    disk_read_avg = sum(disk_read_values) / len(disk_read_values) if disk_read_values else 0.0
    network_in_total = sum(network_in_values) if network_in_values else 0.0
    
    summary = MetricsSummary(
        cpu_avg=cpu_avg,
        cpu_max=cpu_max,
        memory_avg=0.0,
        disk_read_avg=disk_read_avg,
        network_in_total=network_in_total
    )
    
    if cpu_avg > 90.0:
        health_status = "critical"
    elif cpu_avg > 70.0:
        health_status = "warning"
    else:
        health_status = "healthy"
        
    return {
        "success": True,
        "instance_id": instance_id,
        "metrics_summary": summary,
        "health_status": health_status
    }

def rule_based_analyzer(metrics_summary: dict, instance_id: str) -> dict:
    
    cpu_avg = metrics_summary.get("cpu_avg", 0)
    cpu_max = metrics_summary.get("cpu_max", 0)
    network_in = metrics_summary.get("network_in_total", 0)
    disk_read = metrics_summary.get("disk_read_avg", 0)
    
    issues = []
    recommendations = []
    predicted_problems = []
    
    # CPU Rules
    if cpu_avg > 90:
        issues.append("CRITICAL: CPU averaging above 90% — server severely overloaded")
        recommendations.append("Immediately scale up instance or add load balancer")
        recommendations.append("Check for runaway processes: run 'top' or 'htop'")
        predicted_problems.append("Server crash or complete unresponsiveness within hours")
        health_status = "critical"
        alert_level = "critical"
        score = 10
        
    elif cpu_avg > 80:
        issues.append("HIGH: CPU averaging above 80% — performance degraded")
        recommendations.append("Scale up to a larger instance type")
        recommendations.append("Review and optimize heavy processes")
        predicted_problems.append("Response times will increase, possible timeouts")
        health_status = "critical"
        alert_level = "high"
        score = 30
        
    elif cpu_avg > 70:
        issues.append("WARNING: CPU above 70% — approaching high usage")
        recommendations.append("Monitor closely, plan for scaling")
        recommendations.append("Identify CPU-heavy processes and optimize")
        predicted_problems.append("Performance issues under peak load")
        health_status = "warning"
        alert_level = "medium"
        score = 50
        
    elif cpu_avg > 50:
        issues.append("NOTICE: Moderate CPU usage detected")
        recommendations.append("Current load is manageable, continue monitoring")
        health_status = "warning"
        alert_level = "low"
        score = 70
        
    else:
        recommendations.append("CPU usage is healthy — server running efficiently")
        health_status = "healthy"
        alert_level = "none"
        score = 90

    # CPU Spike Rules
    if cpu_max > 95 and cpu_avg < 70:
        issues.append("CPU spike detected — brief but extreme load occurred")
        recommendations.append("Check application logs for the spike timeframe")
        predicted_problems.append("Recurring spikes may indicate memory leaks or cron jobs")

    # Network Rules
    network_mb = network_in / (1024 * 1024) if network_in > 0 else 0
    if network_mb > 1000:
        issues.append(f"HIGH: Large network ingress detected ({network_mb:.1f} MB)")
        recommendations.append("Check for unusual traffic — possible DDoS or large file transfers")
        predicted_problems.append("Bandwidth costs may increase significantly")
    elif network_mb > 500:
        issues.append(f"NOTICE: Elevated network traffic ({network_mb:.1f} MB)")
        recommendations.append("Monitor traffic patterns for anomalies")

    # Disk Rules
    if disk_read == 0:
        issues.append("WARNING: Zero disk read activity — possible misconfigured monitoring or idle disk")
        recommendations.append("Verify CloudWatch agent is installed and configured")
        recommendations.append("Check if application is actually reading from disk")

    # Score adjustment based on issues count
    score = max(0, score - (len(issues) * 5))

    # AI Summary (rule-based)
    if health_status == "healthy":
        ai_analysis = (f"Instance {instance_id} is operating normally. "
                      f"CPU averaging {cpu_avg:.1f}% with peak at {cpu_max:.1f}%. "
                      f"No critical issues detected. Server is stable.")
    elif health_status == "warning":
        ai_analysis = (f"Instance {instance_id} shows elevated resource usage. "
                      f"CPU averaging {cpu_avg:.1f}% (peak {cpu_max:.1f}%). "
                      f"Action recommended to prevent performance degradation.")
    else:
        ai_analysis = (f"CRITICAL: Instance {instance_id} is under severe load. "
                      f"CPU averaging {cpu_avg:.1f}% (peak {cpu_max:.1f}%). "
                      f"Immediate action required to prevent outage.")

    return {
        "health_status": health_status,
        "alert_level": alert_level,
        "issues_detected": issues,
        "recommendations": recommendations,
        "predicted_problems": predicted_problems,
        "ai_analysis": ai_analysis,
        "score": score,
        "analysis_type": "rule_based"
    }

async def full_analysis(instance_id: str, region: str, hours: int) -> Dict[str, Any]:
    from app.services.node_exporter import fetch_node_exporter_metrics
    from app.config import NODE_EXPORTER_URL
    
    data_source = "cloudwatch"
    
    try:
        # Try Node Exporter first
        node_metrics = await fetch_node_exporter_metrics(NODE_EXPORTER_URL)
        summary_dict = {
            "cpu_avg": node_metrics["cpu_usage_percent"],
            "cpu_max": node_metrics["cpu_usage_percent"],
            "disk_read_avg": node_metrics["disk_read_bytes"],
            "network_in_total": node_metrics["network_receive_mb"] * 1024 * 1024,
            "memory_avg": node_metrics["memory_used_percent"]
        }
        data_source = "node_exporter"
        
        # When using node exporter, skip Gemini and use rule-based directly
        analysis = rule_based_analyzer(summary_dict, instance_id)
        analysis["metrics_summary"] = MetricsSummary(**summary_dict)
        has_ai_analysis = False
        analysis_type = "rule_based"
        
        extra_fields = {
            "uptime_hours": node_metrics["uptime_hours"],
            "load_avg_1m": node_metrics["load_avg_1m"],
            "load_avg_5m": node_metrics["load_avg_5m"],
            "load_avg_15m": node_metrics["load_avg_15m"],
            "memory_used_gb": node_metrics["memory_used_gb"],
            "memory_total_gb": node_metrics["memory_total_gb"],
            "network_receive_mb": node_metrics["network_receive_mb"],
            "network_transmit_mb": node_metrics["network_transmit_mb"]
        }
        
    except Exception as e:
        logger.warning(f"Node exporter failed: {e}. Falling back to CloudWatch.")
        metrics = fetch_ec2_metrics(instance_id, region, hours)
        
        # Extract summary for fallback
        cpu_values = [m.value for m in metrics.cpu_usage]
        disk_read_values = [m.value for m in metrics.disk_read]
        network_in_values = [m.value for m in metrics.network_in]
        
        summary_dict = {
            "cpu_avg": sum(cpu_values) / len(cpu_values) if cpu_values else 0.0,
            "cpu_max": max(cpu_values) if cpu_values else 0.0,
            "disk_read_avg": sum(disk_read_values) / len(disk_read_values) if disk_read_values else 0.0,
            "network_in_total": sum(network_in_values) if network_in_values else 0.0,
            "memory_avg": 0.0
        }
        
        try:
            analysis = analyze_server_health(metrics, instance_id)
            has_ai_analysis = True
            analysis_type = "ai"
        except Exception as ai_err:
            error_str = str(ai_err).lower()
            if "429" in error_str or "quota" in error_str or "resource_exhausted" in error_str:
                logger.info("Gemini quota exceeded. Falling back to rule-based analysis.")
                analysis = rule_based_analyzer(summary_dict, instance_id)
                analysis["metrics_summary"] = MetricsSummary(**summary_dict)
                has_ai_analysis = False
                analysis_type = "rule_based"
            else:
                raise ai_err
        extra_fields = {}
    
    return {
        "success": True,
        "instance_id": instance_id,
        "region": region,
        "period_hours": hours,
        "metrics_summary": analysis["metrics_summary"],
        "ai_analysis": analysis["ai_analysis"],
        "health_status": analysis["health_status"],
        "issues_detected": analysis["issues_detected"],
        "recommendations": analysis["recommendations"],
        "predicted_problems": analysis["predicted_problems"],
        "alert_level": analysis["alert_level"],
        "has_ai_analysis": has_ai_analysis,
        "analysis_type": analysis_type,
        "data_source": data_source,
        **extra_fields
    }
