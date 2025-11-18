"""
Backend Configuration
Environment тохиргоо болон database холболт
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

# MT5 Configuration - Зөвхөн MT5 ашиглана
MT5_ENABLED = os.getenv('MT5_ENABLED', 'True').lower() == 'true'  # Default True
MT5_LOGIN = int(os.getenv('MT5_LOGIN')) if os.getenv('MT5_LOGIN') else None  # MT5 account number (int)
MT5_PASSWORD = os.getenv('MT5_PASSWORD')  # MT5 password
MT5_SERVER = os.getenv('MT5_SERVER')  # MT5 server name

# API Configuration
API_HOST = os.getenv('API_HOST', '0.0.0.0')
API_PORT = int(os.getenv('API_PORT', 5000))
DEBUG_MODE = os.getenv('DEBUG', 'True').lower() == 'true'

# Data directories
DATA_DIR = BASE_DIR / 'data'
TRAIN_DATA_DIR = DATA_DIR / 'train'
TEST_DATA_DIR = DATA_DIR / 'test'
MODELS_DIR = BASE_DIR / 'models'

# Supported currency pairs
CURRENCY_PAIRS = [
    'EUR_USD'  # Single pair focus for optimal model training
]

# Disable MT5 (using UniRate API only)
MT5_ENABLED = False
print(f"✓ Configuration loaded from: {ENV_PATH}")
print(f"ℹ️  MT5 disabled - Using UniRate API for EUR/USD")
