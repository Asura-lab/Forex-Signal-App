"""
Backend Configuration - V2 (Simplified)
UniRate API + V2 Signal Generator only
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Project root directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load environment variables from config/.env
ENV_PATH = Path(__file__).resolve().parent / '.env'
load_dotenv(ENV_PATH)

# MongoDB Configuration
MONGO_URI = os.getenv('MONGO_URI')
if not MONGO_URI:
    raise ValueError("MONGO_URI байхгүй байна! backend/config/.env файлыг шалгана уу.")

# JWT Configuration
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    raise ValueError("SECRET_KEY байхгүй байна! backend/config/.env файлыг шалгана уу.")

JWT_EXPIRATION_DAYS = 7

# Email Configuration (Flask-Mail)
MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True').lower() == 'true'
MAIL_USE_SSL = os.getenv('MAIL_USE_SSL', 'False').lower() == 'true'
MAIL_USERNAME = os.getenv('MAIL_USERNAME')
MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', MAIL_USERNAME)

# Email verification settings
VERIFICATION_CODE_EXPIRY_MINUTES = 10
RESET_CODE_EXPIRY_MINUTES = 10

# AI Configuration - All 21 Gemini API keys
GEMINI_API_KEYS = [
    os.getenv('GEMINI_API_KEY_1'),
    os.getenv('GEMINI_API_KEY_2'),
    os.getenv('GEMINI_API_KEY_3'),
    os.getenv('GEMINI_API_KEY_4'),
    os.getenv('GEMINI_API_KEY_5'),
    os.getenv('GEMINI_API_KEY_6'),
    os.getenv('GEMINI_API_KEY_7'),
    os.getenv('GEMINI_API_KEY_8'),
    os.getenv('GEMINI_API_KEY_9'),
    os.getenv('GEMINI_API_KEY_10'),
    os.getenv('GEMINI_API_KEY_11'),
    os.getenv('GEMINI_API_KEY_12'),
    os.getenv('GEMINI_API_KEY_13'),
    os.getenv('GEMINI_API_KEY_14'),
    os.getenv('GEMINI_API_KEY_15'),
    os.getenv('GEMINI_API_KEY_16'),
    os.getenv('GEMINI_API_KEY_17'),
    os.getenv('GEMINI_API_KEY_18'),
    os.getenv('GEMINI_API_KEY_19'),
    os.getenv('GEMINI_API_KEY_20'),
    os.getenv('GEMINI_API_KEY_21'),
]
# Filter out None values
GEMINI_API_KEYS = [key for key in GEMINI_API_KEYS if key]

# API Configuration
API_HOST = os.getenv('API_HOST', '0.0.0.0')
API_PORT = int(os.getenv('API_PORT', 5000))
DEBUG_MODE = os.getenv('DEBUG', 'True').lower() == 'true'

# Data directories
DATA_DIR = BASE_DIR / 'data'
MODELS_DIR = BASE_DIR / 'models'

# Data source: Yahoo Finance (yfinance) — no API key required

SUPPORTED_PAIR = "EUR_USD"

print(f"[OK] Configuration V2 loaded from: {ENV_PATH}")
print(f"[INFO] Using Yahoo Finance (yfinance) for forex data — no API key required")
