"""Log analysis service using Gemini AI."""
import json
import logging
import time
from typing import Optional
import google.generativeai as genai
from app.config import GEMINI_API_KEY
from app.models.schemas import LogAnalyzeResponse

logger = logging.getLogger(__name__)

# Initialize Gemini Client
genai.configure(api_key=GEMINI_API_KEY)

def analyze_log(log_text: str, log_type: str, context: Optional[str] = None) -> LogAnalyzeResponse:
    """
    Analyzes a given log using Gemini AI.
    
    Args:
        log_text (str): The raw log text.
        log_type (str): The type of log.
        context (Optional[str]): Additional context about the server.
        
    Returns:
        LogAnalyzeResponse: Structured response with analysis.
    """
    system_prompt = (
        "You are a senior DevOps engineer with 10 years experience. "
        "Analyze the provided server log and detect issues. "
        "Respond ONLY in valid JSON format. The JSON must match this schema exactly: \n"
        "{\n"
        '  "summary": "One line plain English summary",\n'
        '  "what_happened": "Detailed plain English explanation",\n'
        '  "root_cause": "Why this happened",\n'
        '  "fix_steps": ["step 1", "step 2"],\n'
        '  "severity": "low or medium or high or critical",\n'
        '  "estimated_fix_time": "e.g. 5 minutes",\n'
        '  "prevention_tips": ["tip 1", "tip 2"]\n'
        "}"
    )
    
    prompt = f"Log Type: {log_type}\n"
    if context:
        prompt += f"Context: {context}\n"
    prompt += f"Log Text:\n{log_text}"
    
    model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_prompt)
    
    max_retries = 3
    last_error = None
    
    for attempt in range(max_retries):
        try:
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json"
                )
            )
            
            result_json = json.loads(response.text)
            
            return LogAnalyzeResponse(
                success=True,
                log_type=log_type,
                summary=result_json.get("summary", "No summary provided"),
                what_happened=result_json.get("what_happened", "No details provided"),
                root_cause=result_json.get("root_cause", "Unknown"),
                fix_steps=result_json.get("fix_steps", []),
                severity=result_json.get("severity", "medium"),
                estimated_fix_time=result_json.get("estimated_fix_time", "Unknown"),
                prevention_tips=result_json.get("prevention_tips", [])
            )
        except Exception as e:
            logger.warning(f"Attempt {attempt + 1} failed: {e}")
            last_error = e
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt) # Exponential backoff
            else:
                logger.error("Max retries reached. Failing.")
                raise last_error
    
    raise Exception("Log analysis failed unexpectedly.")
