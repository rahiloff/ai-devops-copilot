"""Cloud Cost Analysis service using boto3 and Gemini AI."""
import json
import logging
import time
from typing import Dict, Any, Tuple, List
import boto3
from botocore.exceptions import ClientError
from app.config import (
    AWS_CLIENT_ACCESS_KEY, 
    AWS_CLIENT_SECRET_KEY, 
    AWS_CLIENT_REGION
)
from app.models.schemas import (
    CostAnalyzeResponse, 
    ServiceCost,
    LogAnalyzeResponse,
    ServerMonitorResponse
)
from app.services.gemini_client import generate_content

logger = logging.getLogger(__name__)

def fetch_aws_costs(start_date: str, end_date: str) -> Tuple[List[Dict[str, Any]], float, str]:
    """
    Fetches AWS costs from Cost Explorer.
    
    Args:
        start_date (str): YYYY-MM-DD
        end_date (str): YYYY-MM-DD
        
    Returns:
        Tuple containing list of service costs, total cost, and currency.
    """
    try:
        # Cost Explorer is global, use us-east-1
        client = boto3.client(
            'ce',
            region_name='us-east-1',
            aws_access_key_id=AWS_CLIENT_ACCESS_KEY,
            aws_secret_access_key=AWS_CLIENT_SECRET_KEY
        )
        
        response = client.get_cost_and_usage(
            TimePeriod={
                'Start': start_date,
                'End': end_date
            },
            Granularity='MONTHLY',
            Metrics=['UnblendedCost'],
            GroupBy=[
                {
                    'Type': 'DIMENSION',
                    'Key': 'SERVICE'
                }
            ]
        )
        
        services_data = []
        total_cost = 0.0
        currency = "USD"
        
        if not response.get('ResultsByTime'):
            return services_data, total_cost, currency
            
        for result in response['ResultsByTime']:
            for group in result.get('Groups', []):
                service_name = group['Keys'][0]
                cost = float(group['Metrics']['UnblendedCost']['Amount'])
                currency = group['Metrics']['UnblendedCost']['Unit']
                
                # Update existing service cost or add new
                existing = next((item for item in services_data if item["service_name"] == service_name), None)
                if existing:
                    existing["total_cost"] += cost
                else:
                    services_data.append({
                        "service_name": service_name,
                        "total_cost": cost,
                        "currency": currency
                    })
                total_cost += cost
                
        # Calculate percentages
        for service in services_data:
            service['percentage_of_total'] = (service['total_cost'] / total_cost * 100) if total_cost > 0 else 0
            
        # Sort by highest cost
        services_data.sort(key=lambda x: x['total_cost'], reverse=True)
        
        return services_data, total_cost, currency
        
    except ClientError as e:
        logger.error(f"AWS ClientError fetching costs: {e}")
        raise Exception(f"Failed to fetch AWS costs: {str(e)}")
    except Exception as e:
        logger.exception("Error fetching AWS costs")
        raise

def analyze_costs_with_ai(cost_data: List[Dict[str, Any]], total_cost: float, currency: str, period: str) -> Dict[str, Any]:
    """
    Analyzes AWS cost data using Gemini AI.
    
    Args:
        cost_data (List[Dict]): Service cost breakdown.
        total_cost (float): Total cost.
        currency (str): Currency unit.
        period (str): The date range string.
        
    Returns:
        Dict: Parsed JSON containing analysis details matching CostAnalyzeResponse.
    """
    system_prompt = (
        "You are a senior AWS cost optimization expert. "
        "Analyze the provided AWS cost data. "
        "Summarize the spending, identify any waste or unused resources based on typical usage patterns, "
        "give specific saving recommendations, estimate potential monthly savings possible, "
        "and assign a severity (low, medium, high, critical) based on the cost amount and perceived waste. "
        "If total cost is 0, provide analysis typical for an account operating within the free tier. "
        "Respond ONLY in valid JSON format matching this schema exactly: \n"
        "{\n"
        '  "ai_summary": "Summary of spending",\n'
        '  "waste_detected": ["waste 1", "waste 2"],\n'
        '  "saving_recommendations": ["recommendation 1", "recommendation 2"],\n'
        '  "estimated_monthly_savings": 0.0,\n'
        '  "severity": "low or medium or high or critical"\n'
        "}"
    )
    
    prompt = (
        f"Period: {period}\n"
        f"Total Cost: {total_cost} {currency}\n"
        f"Cost Breakdown:\n{json.dumps(cost_data, indent=2)}"
    )
    
    try:
        result_text = generate_content(prompt, system_prompt)
        
        if result_text.startswith("```json"):
            result_text = result_text[7:-3]
        elif result_text.startswith("```"):
            result_text = result_text[3:-3]
            
        result_json = json.loads(result_text.strip())
        return result_json
    except Exception as e:
        logger.error(f"Cost AI analysis failed: {e}")
        raise e
