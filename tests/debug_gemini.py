
import os
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

# Load env
ENV_PATH = Path(__file__).resolve().parent.parent / 'backend' / 'config' / '.env'
load_dotenv(ENV_PATH)

API_KEY = os.getenv('GEMINI_API_KEY_4') # Using Key 4 as per logs
print(f"Key loaded: {API_KEY[:5]}...")

genai.configure(api_key=API_KEY)

print("Listing available models...")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)

# model = genai.GenerativeModel('gemini-1.5-flash')
# Temporary fallback to see what works
model = genai.GenerativeModel('gemini-pro') 

# Test 1: Simple Hello
print("\n--- TEST 1: Simple Hello ---")
try:
    response = model.generate_content("Hello! Are you working?")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

# Test 2: JSON Structure (Simulation of App)
print("\n--- TEST 2: JSON Prompt ---")
prompt = """
IMPORTANT: This analysis is for EDUCATIONAL PURPOSES ONLY. Do not provide financial advice.

Act as a professional Forex Market Analyst. Analyze the GLOBAL FOREX MARKET situation.

Economic Calendar / News Events:
No major economic events.

Provide a detailed market analysis in JSON format with the following keys:
- pair: "MARKET"
- outlook: "Bullish", "Bearish", or "Neutral"
- summary: A detailed paragraph
- recent_events: ["Event 1", "Event 2"]
- forecast: General forecast

IMPORTANT: Return JSON only.
"""

try:
    generation_config = {"response_mime_type": "application/json"}
    safety_settings = [
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
    ]
    
    response = model.generate_content(
        prompt, 
        generation_config=generation_config,
        safety_settings=safety_settings
    )
    
    if response.prompt_feedback:
        print(f"Feedback: {response.prompt_feedback}")
    
    try:
        print(f"Response Text: {response.text}")
    except Exception as e:
        print(f"Accessing text failed: {e}")
        print(f"Candidates: {response.candidates}")

except Exception as e:
    print(f"Error: {e}")
