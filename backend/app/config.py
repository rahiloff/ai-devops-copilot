"""Application configuration."""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

APP_NAME = "AI DevOps Copilot"
VERSION = "1.0.0"

# Gemini Config
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# AWS Configs
AWS_CLIENT_ACCESS_KEY = os.getenv("AWS_CLIENT_ACCESS_KEY")
AWS_CLIENT_SECRET_KEY = os.getenv("AWS_CLIENT_SECRET_KEY")
AWS_CLIENT_REGION = os.getenv("AWS_CLIENT_REGION")

AWS_COPILOT_ACCESS_KEY = os.getenv("AWS_COPILOT_ACCESS_KEY")
AWS_COPILOT_SECRET_KEY = os.getenv("AWS_COPILOT_SECRET_KEY")
AWS_COPILOT_REGION = os.getenv("AWS_COPILOT_REGION")

# Validate GEMINI_API_KEY
if not GEMINI_API_KEY:
    raise ValueError("CRITICAL ERROR: GEMINI_API_KEY is missing from environment variables.")
