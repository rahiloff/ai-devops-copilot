import os
from dotenv import load_dotenv
import google.generativeai as genai
import time
import logging

load_dotenv()
logger = logging.getLogger(__name__)

class GeminiKeyRotator:
    def __init__(self):
        self.keys = []
        
        key1 = os.getenv("GEMINI_API_KEY", "").strip()
        key2 = os.getenv("GEMINI_API_KEY_2", "").strip()
        
        if key1:
            self.keys.append(key1)
        if key2:
            self.keys.append(key2)
            
        if not self.keys:
            raise ValueError("No Gemini API keys found in .env")
        
        logger.info(f"Loaded {len(self.keys)} Gemini API key(s)")
        self.current_index = 0

    def generate_with_rotation(self, prompt: str, system_prompt: str = "") -> str:
        last_error = None
        attempts = len(self.keys)
        
        for attempt in range(attempts):
            current_key = self.keys[self.current_index]
            logger.info(f"Using Gemini key {self.current_index + 1} of {len(self.keys)}")
            
            try:
                genai.configure(api_key=current_key)
                model = genai.GenerativeModel(
                    model_name="gemini-2.0-flash",
                    system_instruction=system_prompt if system_prompt else None
                )
                response = model.generate_content(prompt)
                return response.text
                
            except Exception as e:
                error_str = str(e)
                logger.warning(f"Key {self.current_index + 1} failed: {error_str[:100]}")
                last_error = e
                
                if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str or "quota" in error_str.lower():
                    logger.info(f"Quota exceeded on key {self.current_index + 1}, rotating...")
                    self.current_index = (self.current_index + 1) % len(self.keys)
                    time.sleep(1)
                else:
                    raise e
        
        raise Exception(f"All {len(self.keys)} Gemini API keys quota exceeded. Last error: {last_error}")


# Global singleton
rotator = GeminiKeyRotator()


def generate_content(prompt: str, system_prompt: str = "") -> str:
    return rotator.generate_with_rotation(prompt, system_prompt)
