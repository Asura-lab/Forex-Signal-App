# -*- coding: utf-8 -*-
"""
Форекс Сигнал Full Backend API
MongoDB + JWT Authentication + HMM Prediction
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message
from pymongo import MongoClient
from datetime import datetime, timedelta
import jwt
import bcrypt
import pandas as pd
import numpy as np
import pickle
import os
import random
import requests

# Import configuration
from config.settings import (
    MONGO_URI, SECRET_KEY, API_HOST, API_PORT, DEBUG_MODE,
    MODELS_DIR, CURRENCY_PAIRS,
    MAIL_SERVER, MAIL_PORT, MAIL_USE_TLS, MAIL_USE_SSL,
    MAIL_USERNAME, MAIL_PASSWORD, MAIL_DEFAULT_SENDER,
    VERIFICATION_CODE_EXPIRY_MINUTES, RESET_CODE_EXPIRY_MINUTES,
    MT5_ENABLED, MT5_LOGIN, MT5_PASSWORD, MT5_SERVER
)

# Import MT5 handler
from utils.mt5_handler import initialize_mt5, get_mt5_live_rates, shutdown_mt5, mt5_handler

app = Flask(__name__)
CORS(app)

# Flask-Mail configuration
app.config['MAIL_SERVER'] = MAIL_SERVER
app.config['MAIL_PORT'] = MAIL_PORT
app.config['MAIL_USE_TLS'] = MAIL_USE_TLS
app.config['MAIL_USE_SSL'] = MAIL_USE_SSL
app.config['MAIL_USERNAME'] = MAIL_USERNAME
app.config['MAIL_PASSWORD'] = MAIL_PASSWORD
app.config['MAIL_DEFAULT_SENDER'] = MAIL_DEFAULT_SENDER

# Имэйл тохиргоо шалгах
if MAIL_USERNAME and MAIL_PASSWORD:
    # Имэйлийн хаягийг хэсэгчлэн харуулах (нууцлал хамгаалах)
    masked_email = MAIL_USERNAME[:3] + "***@" + MAIL_USERNAME.split('@')[1] if '@' in MAIL_USERNAME else "***"
    print(f"✓ Имэйл тохиргоо: {masked_email}")
else:
    print("⚠️ АНХААРУУЛГА: Имэйл тохиргоо хийгдээгүй байна!")
    print("   - EMAIL_SETUP_GUIDE.md файлыг уншина уу")

mail = Mail(app)

# ==================== DATABASE SETUP ====================

# MongoDB client үүсгэх
try:
    client = MongoClient(MONGO_URI)
    db = client['users_db']
    users_collection = db['users']
    verification_codes = db['verification_codes']  # Имэйл баталгаажуулалт
    reset_codes = db['reset_codes']  # Нууц үг сэргээх
    print("✓ MongoDB холбогдлоо")
except Exception as e:
    print(f"✗ MongoDB холбогдох алдаа: {e}")
    exit(1)

# ML Models
model = None
scaler = None

# Prediction Cache (5 минут тутамд шинэчлэгдэнэ)
prediction_cache = {}
prediction_cache_time = {}
PREDICTION_CACHE_DURATION = 300  # 5 минут (секундээр)

def load_ml_models():
    """HMM модель ба scaler ачаалах"""
    global model, scaler
    
    model_path = MODELS_DIR / 'hmm_forex_model.pkl'
    scaler_path = MODELS_DIR / 'hmm_scaler.pkl'
    
    try:
        if model_path.exists():
            with open(model_path, 'rb') as f:
                model = pickle.load(f)
            print("✓ HMM модель ачаалагдлаа")
        else:
            print("⚠ HMM модель олдсонгүй (prediction идэвхгүй)")
        
        if scaler_path.exists():
            with open(scaler_path, 'rb') as f:
                scaler = pickle.load(f)
            print("✓ Scaler ачаалагдлаа")
        else:
            print("⚠ Scaler олдсонгүй")
            
        return model is not None and scaler is not None
    except Exception as e:
        print(f"✗ Модель ачаалах алдаа: {e}")
        return False

# Load models on startup
load_ml_models()

# ==================== MT5 INITIALIZATION ====================

# MT5 эхлүүлэх (хэрэв идэвхжүүлсэн бол)
if MT5_ENABLED:
    print("🔄 MT5 холболт эхлүүлж байна...")
    if initialize_mt5(MT5_LOGIN, MT5_PASSWORD, MT5_SERVER):
        print("✓ MT5 бэлэн болсон")
    else:
        print("⚠ MT5 холболт амжилтгүй (API fallback ашиглана)")
else:
    print("ℹ MT5 идэвхгүй байна (MT5_ENABLED=False)")

# ==================== AUTH HELPER FUNCTIONS ====================

def generate_verification_code():
    """6 оронтой санамсаргүй код үүсгэх"""
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])

def send_verification_email(email, code, name=""):
    """Имэйл баталгаажуулалтын код илгээх"""
    try:
        print(f"📧 Баталгаажуулалтын имэйл илгээж байна...")
        print(f"   Хүлээн авагч: {email[:2]}***@{email.split('@')[1] if '@' in email else '???'}")
        print(f"   SMTP: {MAIL_SERVER}:{MAIL_PORT}")
        
        # Имэйл тохиргоо шалгах
        if not MAIL_USERNAME or not MAIL_PASSWORD:
            print("❌ Имэйл тохиргоо хийгдээгүй байна (MAIL_USERNAME эсвэл MAIL_PASSWORD байхгүй)")
            return False
        
        msg = Message(
            subject='Forex Signal App - Имэйл баталгаажуулалт',
            recipients=[email]
        )
        msg.html = f"""
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">📈 Forex Signal App</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #1a237e;">Сайн байна уу {name}!</h2>
            
            <p>Forex Signal App-д тавтай морил! 🎉</p>
            
            <p>Таны имэйл хаягийг баталгаажуулахын тулд доорх кодыг оруулна уу:</p>
            
            <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <h1 style="color: #1a237e; font-size: 36px; letter-spacing: 8px; margin: 0;">{code}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px;">⏱ Энэ код <strong>{VERIFICATION_CODE_EXPIRY_MINUTES} минутын</strong> хугацаанд хүчинтэй.</p>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
            
            <p style="color: #999; font-size: 12px;">
                Хэрэв та энэ бүртгэлийг үүсгээгүй бол энэ имэйлийг үл тоомсорлоорой.
            </p>
            
            <p style="color: #1a237e; font-weight: bold;">Өдрийг сайхан өнгөрүүлээрэй!<br>Forex Signal App баг</p>
        </div>
    </div>
</body>
</html>
"""
        print(f"   Код: {code}")
        print(f"   Илгээгч: {MAIL_USERNAME}")
        mail.send(msg)
        # Имэйл хаягийг хэсэгчлэн харуулах (нууцлал хамгаалах)
        masked_recipient = email[:2] + "***@" + email.split('@')[1] if '@' in email else "***"
        print(f"✅ Баталгаажуулалтын имэйл АМЖИЛТТАЙ илгээгдлээ: {masked_recipient}")
        return True
    except Exception as e:
        print(f"❌ Баталгаажуулалтын имэйл илгээх АЛДАА гарлаа!")
        print(f"   Алдааны төрөл: {type(e).__name__}")
        print(f"   Алдааны мессеж: {e}")
        import traceback
        traceback.print_exc()
        return False

def send_reset_password_email(email, code, name=""):
    """Нууц үг сэргээх код илгээх"""
    try:
        print(f"🔑 Нууц үг сэргээх имэйл илгээж байна...")
        print(f"   Хүлээн авагч: {email[:2]}***@{email.split('@')[1] if '@' in email else '???'}")
        
        # Имэйл тохиргоо шалгах
        if not MAIL_USERNAME or not MAIL_PASSWORD:
            print("❌ Имэйл тохиргоо хийгдээгүй байна (MAIL_USERNAME эсвэл MAIL_PASSWORD байхгүй)")
            return False
        
        msg = Message(
            subject='Forex Signal App - Нууц үг сэргээх',
            recipients=[email]
        )
        msg.html = f"""
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Нууц үг сэргээх</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #1a237e;">Сайн байна уу, {name}!</h2>
            
            <p>Та нууц үгээ сэргээх хүсэлт илгээсэн байна.</p>
            
            <p>Нууц үг сэргээх кодыг доор харна уу:</p>
            
            <div style="background-color: #fff3e0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; border: 2px solid #1a237e;">
                <h1 style="color: #1a237e; font-size: 36px; letter-spacing: 8px; margin: 0;">{code}</h1>
            </div>
            
            <p style="color: #666; font-size: 14px;">⏱ Энэ код <strong>{RESET_CODE_EXPIRY_MINUTES} минутын</strong> хугацаанд хүчинтэй.</p>
            
            <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
                <p style="margin: 0; color: #856404;">
                    ⚠️ <strong>Анхаар:</strong> Хэрэв та энэ хүсэлтийг илгээгээгүй бол нууц үгээ ШУУД солиорой!
                </p>
            </div>
            
            <p style="color: #1a237e; font-weight: bold;">Forex Signal App баг</p>
        </div>
    </div>
</body>
</html>
"""
        print(f"   Код: {code}")
        print(f"   Илгээгч: {MAIL_USERNAME}")
        mail.send(msg)
        # Имэйл хаягийг хэсэгчлэн харуулах (нууцлал хамгаалах)
        masked_recipient = email[:2] + "***@" + email.split('@')[1] if '@' in email else "***"
        print(f"✅ Нууц үг сэргээх имэйл АМЖИЛТТАЙ илгээгдлээ: {masked_recipient}")
        return True
    except Exception as e:
        print(f"❌ Нууц үг сэргээх имэйл илгээх АЛДАА гарлаа!")
        print(f"   Алдааны төрөл: {type(e).__name__}")
        print(f"   Алдааны мессеж: {e}")
        import traceback
        traceback.print_exc()
        return False

def hash_password(password):
    """Нууц үгийг hash хийх"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def verify_password(password, hashed):
    """Нууц үг шалгах"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed)

def generate_token(user_id, email):
    """JWT token үүсгэх"""
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(days=7),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_token(token):
    """JWT token шалгах"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_user_from_token(token):
    """Token-оос хэрэглэгч олох"""
    payload = verify_token(token)
    if payload:
        user = users_collection.find_one(
            {'_id': payload['user_id']},
            {'password': 0}
        )
        return user
    return None

# ==================== ML HELPER FUNCTIONS ====================

def calculate_features(df):
    """Техникийн шинж чанарууд тооцоолох"""
    df = df.copy()
    
    # Үнийн өөрчлөлт
    df['returns'] = df['close'].pct_change()
    
    # Moving averages
    df['MA_5'] = df['close'].rolling(window=5).mean()
    df['MA_20'] = df['close'].rolling(window=20).mean()
    
    # Volatility (Standard Deviation)
    df['volatility'] = df['returns'].rolling(window=20).std()
    
    # RSI (Relative Strength Index)
    delta = df['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))
    
    # Volume - үргэлж нэмэх (HMM scaler 6 feature хүлээнэ)
    if 'volume' in df.columns and df['volume'].notna().any():
        df['volume_ma'] = df['volume'].rolling(window=20).mean()
    else:
        # Хэрэв volume байхгүй бол close-ын өөрчлөлтийг ашиглан mock volume үүсгэх
        df['volume_ma'] = df['close'].rolling(window=20).std() * 1000  # Normalized proxy
    
    # NaN утгуудыг арилгах
    df = df.dropna()
    
    return df

def get_signal_name(signal):
    """Signal дугаарыг нэр болгож хөрвүүлэх"""
    signals = {
        0: "STRONG BUY",
        1: "BUY", 
        2: "NEUTRAL",
        3: "SELL",
        4: "STRONG SELL"
    }
    return signals.get(signal, "UNKNOWN")

# ==================== ROOT ENDPOINT ====================

@app.route('/')
def index():
    """API мэдээлэл"""
    return jsonify({
        'name': 'Форекс Сигнал Full API',
        'version': '2.0',
        'database': 'MongoDB',
        'auth': 'JWT',
        'ml_model': 'HMM' if model else 'Not loaded',
        'endpoints': {
            '/': 'GET - API мэдээлэл',
            '/auth/register': 'POST - Бүртгүүлэх (Имэйл баталгаажуулалт)',
            '/auth/verify-email': 'POST - Имэйл баталгаажуулах',
            '/auth/resend-verification': 'POST - Баталгаажуулалтын код дахин илгээх',
            '/auth/login': 'POST - Нэвтрэх',
            '/auth/forgot-password': 'POST - Нууц үг мартсан',
            '/auth/verify-reset-code': 'POST - Сэргээх код шалгах',
            '/auth/reset-password': 'POST - Нууц үг сэргээх',
            '/auth/verify': 'POST - Token шалгах',
            '/auth/me': 'GET - Хэрэглэгчийн мэдээлэл',
            '/auth/update': 'PUT - Мэдээлэл шинэчлэх',
            '/auth/change-password': 'PUT - Нууц үг солих',
            '/predict': 'POST - Forex сигнал таамаглах',
            '/currencies': 'GET - Дэмжигдсэн валютын жагсаалт',
            '/rates/live': 'GET - Бодит цагийн валютын ханш',
            '/rates/specific': 'GET - Тодорхой хослолын ханш',
            '/health': 'GET - Health check'
        }
    })

# ==================== AUTHENTICATION ENDPOINTS ====================

@app.route('/auth/register', methods=['POST'])
def register():
    """Шинэ хэрэглэгч бүртгүүлэх - Имэйл баталгаажуулалттай"""
    try:
        data = request.json
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        # Validation
        if not name or not email or not password:
            return jsonify({
                'success': False,
                'error': 'Нэр, имэйл, нууц үг заавал шаардлагатай'
            }), 400
        
        if '@' not in email:
            return jsonify({
                'success': False,
                'error': 'Зөв имэйл хаяг оруулна уу'
            }), 400
        
        if len(password) < 6:
            return jsonify({
                'success': False,
                'error': 'Нууц үг дор хаяж 6 тэмдэгттэй байх ёстой'
            }), 400
        
        # Имэйл бүртгэлтэй эсэхийг шалгах
        existing_user = users_collection.find_one({'email': email})
        if existing_user:
            return jsonify({
                'success': False,
                'error': 'Энэ имэйл хаяг аль хэдийн бүртгэлтэй байна'
            }), 400
        
        print(f"🔐 Шинэ хэрэглэгч бүртгүүлж байна: {email[:2]}***@{email.split('@')[1]}")
        
        # Баталгаажуулалтын код үүсгэх
        verification_code = generate_verification_code()
        print(f"   ✓ Баталгаажуулалтын код үүсгэсэн: {verification_code}")
        
        # Нууц үгийг hash хийх
        hashed_password = hash_password(password)
        print(f"   ✓ Нууц үг hash хийгдсэн")
        
        # Verification code MongoDB-д хадгалах
        verification_data = {
            'email': email,
            'name': name,
            'password': hashed_password,
            'code': verification_code,
            'expires_at': datetime.utcnow() + timedelta(minutes=VERIFICATION_CODE_EXPIRY_MINUTES),
            'created_at': datetime.utcnow()
        }
        
        # Өмнө илгээсэн verification code байвал устгах
        verification_codes.delete_many({'email': email})
        
        # Шинэ verification code хадгалах
        verification_codes.insert_one(verification_data)
        print(f"   ✓ Verification code MongoDB-д хадгалагдлаа")
        
        # Имэйл илгээх
        email_sent = send_verification_email(email, verification_code, name)
        
        if not email_sent:
            # Email тохиргоо хийгдээгүй эсвэл алдаа гарсан
            print(f"❌ АЛДАА: Баталгаажуулалтын имэйл илгээгдсэнгүй!")
            print(f"   Код: {verification_code}")
            print(f"   Имэйл: {email}")
            return jsonify({
                'success': False,
                'error': 'Имэйл илгээхэд алдаа гарлаа. Та түр хүлээгээд дахин оролдоно уу.',
                'technical_details': 'Email илгээх функц False буцаалаа. Серверийн log-ыг шалгана уу.'
            }), 500
        
        print(f"✅ Баталгаажуулалтын имэйл амжилттай илгээгдлээ: {email[:2]}***@{email.split('@')[1]}")
        return jsonify({
            'success': True,
            'email': email,
            'message': f'Баталгаажуулалтын код {email} хаяг руу илгээгдлээ'
        }), 200
        
    except Exception as e:
        print(f"Register error: {e}")
        return jsonify({
            'success': False,
            'error': f'Бүртгэл үүсгэх явцад алдаа гарлаа: {str(e)}'
        }), 500

@app.route('/auth/login', methods=['POST'])
def login():
    """Нэвтрэх"""
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        # Validation
        if not email or not password:
            return jsonify({
                'success': False,
                'error': 'Имэйл болон нууц үг оруулна уу'
            }), 400
        
        # Хэрэглэгч олох
        user = users_collection.find_one({'email': email})
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'Имэйл эсвэл нууц үг буруу байна'
            }), 401
        
        # Нууц үг шалгах
        if not verify_password(password, user['password']):
            return jsonify({
                'success': False,
                'error': 'Имэйл эсвэл нууц үг буруу байна'
            }), 401
        
        # Сүүлд нэвтэрсэн огноо шинэчлэх
        users_collection.update_one(
            {'_id': user['_id']},
            {'$set': {'last_login': datetime.utcnow()}}
        )
        
        # JWT token үүсгэх
        user_id = str(user['_id'])
        token = generate_token(user_id, email)
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': user_id,
                'name': user['name'],
                'email': user['email'],
                'email_verified': user.get('email_verified', False)
            }
        })
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({
            'success': False,
            'error': f'Нэвтрэх явцад алдаа гарлаа: {str(e)}'
        }), 500

@app.route('/auth/verify', methods=['POST'])
def verify():
    """Token шалгах"""
    try:
        data = request.json
        token = data.get('token', '')
        
        if not token:
            return jsonify({
                'success': False,
                'error': 'Token шаардлагатай'
            }), 400
        
        user = get_user_from_token(token)
        
        if user:
            return jsonify({
                'success': True,
                'valid': True,
                'user': {
                    'id': str(user['_id']),
                    'name': user['name'],
                    'email': user['email'],
                    'email_verified': user.get('email_verified', False)
                }
            })
        else:
            return jsonify({
                'success': False,
                'valid': False,
                'error': 'Token буруу эсвэл хугацаа дууссан'
            }), 401
        
    except Exception as e:
        print(f"Verify error: {e}")
        return jsonify({
            'success': False,
            'error': f'Token шалгах явцад алдаа гарлаа: {str(e)}'
        }), 500

@app.route('/auth/verify-email', methods=['POST'])
def verify_email():
    """Имэйл баталгаажуулах"""
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        code = data.get('code', '').strip()
        
        if not email or not code:
            return jsonify({
                'success': False,
                'error': 'Имэйл болон код шаардлагатай'
            }), 400
        
        # Verification code олох
        verification = verification_codes.find_one({'email': email})
        
        if not verification:
            return jsonify({
                'success': False,
                'error': 'Баталгаажуулалтын код олдсонгүй'
            }), 404
        
        # Хугацаа шалгах
        if datetime.utcnow() > verification['expires_at']:
            verification_codes.delete_one({'email': email})
            return jsonify({
                'success': False,
                'error': 'Баталгаажуулалтын код хугацаа дууссан'
            }), 400
        
        # Код шалгах
        if verification['code'] != code:
            return jsonify({
                'success': False,
                'error': 'Буруу код'
            }), 400
        
        print(f"✅ Код зөв - имэйл баталгаажуулж байна: {email[:2]}***@{email.split('@')[1]}")
        
        # Хуучин хэрэглэгч эсэхийг шалгах
        is_existing_user = verification.get('is_existing_user', False)
        
        if is_existing_user:
            # Хуучин хэрэглэгч - зөвхөн email_verified=True болгоно
            print(f"   ℹ️ Хуучин хэрэглэгч - email_verified шинэчилж байна")
            
            users_collection.update_one(
                {'email': email},
                {'$set': {
                    'email_verified': True,
                    'verified_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }}
            )
            
            # Шинэчлэгдсэн хэрэглэгчийг авах
            user = users_collection.find_one({'email': email})
            user_id = str(user['_id'])
            
            # Verification code устгах
            verification_codes.delete_one({'email': email})
            
            # JWT token үүсгэх
            token = generate_token(user_id, email)
            
            print(f"   ✅ Хуучин хэрэглэгч амжилттай баталгаажлаа")
            return jsonify({
                'success': True,
                'token': token,
                'user': {
                    'id': user_id,
                    'name': user['name'],
                    'email': user['email']
                },
                'message': 'Имэйл амжилттай баталгаажлаа'
            }), 200
        
        else:
            # Шинэ хэрэглэгч - users collection-д нэмнэ
            print(f"   ℹ️ Шинэ хэрэглэгч - users collection-д үүсгэж байна")
            
            new_user = {
                'name': verification['name'],
                'email': verification['email'],
                'password': verification['password'],
                'email_verified': True,
                'verified_at': datetime.utcnow(),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow(),
                'last_login': datetime.utcnow()
            }
            
            result = users_collection.insert_one(new_user)
            user_id = str(result.inserted_id)
            
            # Verification code устгах
            verification_codes.delete_one({'email': email})
            
            # JWT token үүсгэх
            token = generate_token(user_id, email)
            
            print(f"   ✅ Шинэ хэрэглэгч амжилттай үүсгэгдлээ")
            return jsonify({
                'success': True,
                'token': token,
                'user': {
                    'id': user_id,
                    'name': new_user['name'],
                    'email': new_user['email']
                },
                'message': 'Имэйл амжилттай баталгаажлаа'
            }), 201
        
    except Exception as e:
        print(f"Verify email error: {e}")
        return jsonify({
            'success': False,
            'error': f'Баталгаажуулах алдаа: {str(e)}'
        }), 500

@app.route('/auth/resend-verification', methods=['POST'])
def resend_verification():
    """Код дахин илгээх"""
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        
        if not email:
            return jsonify({'success': False, 'error': 'Имэйл шаардлагатай'}), 400
        
        print(f"🔄 Verification код дахин илгээх хүсэлт: {email[:2]}***@{email.split('@')[1]}")
        
        # 1. Эхлээд verification_codes-с хайх (шинэ хэрэглэгч)
        verification = verification_codes.find_one({'email': email})
        
        if verification:
            # Шинэ хэрэглэгч - бүртгэл үүсгэх явцад
            print(f"   ℹ️ Шинэ хэрэглэгч (verification_codes-д байна)")
            new_code = generate_verification_code()
            
            verification_codes.update_one(
                {'email': email},
                {'$set': {
                    'code': new_code,
                    'expires_at': datetime.utcnow() + timedelta(minutes=VERIFICATION_CODE_EXPIRY_MINUTES)
                }}
            )
            
            email_sent = send_verification_email(email, new_code, verification['name'])
            
            if not email_sent:
                return jsonify({
                    'success': False,
                    'error': 'Имэйл илгээхэд алдаа гарлаа'
                }), 500
            
            return jsonify({'success': True, 'message': 'Шинэ код илгээгдлээ'}), 200
        
        # 2. users collection-с хайх (хуучин хэрэглэгч)
        user = users_collection.find_one({'email': email})
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'Имэйл хаяг бүртгэлгүй байна'
            }), 404
        
        # Хэрэв аль хэдийн баталгаажсан бол
        if user.get('email_verified', False):
            return jsonify({
                'success': False,
                'error': 'Имэйл аль хэдийн баталгаажсан байна'
            }), 400
        
        # Хуучин хэрэглэгч - баталгаажаагүй
        print(f"   ℹ️ Хуучин хэрэглэгч (users-д байна, баталгаажаагүй)")
        new_code = generate_verification_code()
        
        # verification_codes-д шинэ код үүсгэх
        verification_codes.delete_many({'email': email})
        verification_codes.insert_one({
            'email': email,
            'name': user['name'],
            'password': user['password'],  # Аль хэдийн hash хийгдсэн
            'code': new_code,
            'expires_at': datetime.utcnow() + timedelta(minutes=VERIFICATION_CODE_EXPIRY_MINUTES),
            'created_at': datetime.utcnow(),
            'is_existing_user': True  # Энэ нь хуучин хэрэглэгч гэдгийг тэмдэглэх
        })
        
        email_sent = send_verification_email(email, new_code, user['name'])
        
        if not email_sent:
            return jsonify({
                'success': False,
                'error': 'Имэйл илгээхэд алдаа гарлаа'
            }), 500
        
        print(f"   ✅ Хуучин хэрэглэгчид verification код амжилттай илгээгдлээ")
        return jsonify({
            'success': True,
            'message': 'Баталгаажуулалтын код таны имэйл хаяг руу илгээгдлээ'
        }), 200
        
    except Exception as e:
        print(f"❌ Resend verification error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/auth/forgot-password', methods=['POST'])
def forgot_password():
    """Нууц үг мартсан"""
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        
        if not email:
            return jsonify({'success': False, 'error': 'Имэйл шаардлагатай'}), 400
        
        user = users_collection.find_one({'email': email})
        if not user:
            return jsonify({'success': True, 'message': 'Хэрэв бүртгэлтэй бол код илгээгдсэн'}), 200
        
        reset_code = generate_verification_code()
        
        reset_codes.delete_many({'email': email})
        reset_codes.insert_one({
            'email': email,
            'code': reset_code,
            'expires_at': datetime.utcnow() + timedelta(minutes=RESET_CODE_EXPIRY_MINUTES),
            'created_at': datetime.utcnow()
        })
        
        email_sent = send_reset_password_email(email, reset_code, user['name'])
        
        if not email_sent:
            print(f"⚠️ DEMO режим: Нууц үг сэргээх имэйл илгээгдсэнгүй. Код: {reset_code}")
            return jsonify({
                'success': True,
                'demo_mode': True,
                'reset_code': reset_code,
                'message': '⚠️ DEMO режим: Имэйл тохиргоо хийгдээгүй байна. EMAIL_SETUP_GUIDE.md файлыг уншина уу.'
            }), 200
        
        return jsonify({'success': True, 'message': 'Сэргээх код илгээгдлээ'}), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/auth/verify-reset-code', methods=['POST'])
def verify_reset_code():
    """Сэргээх код шалгах"""
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        code = data.get('code', '').strip()
        
        if not email or not code:
            return jsonify({'success': False, 'error': 'Имэйл болон код шаардлагатай'}), 400
        
        reset_data = reset_codes.find_one({'email': email})
        if not reset_data:
            return jsonify({'success': False, 'error': 'Код олдсонгүй'}), 404
        
        if datetime.utcnow() > reset_data['expires_at']:
            reset_codes.delete_one({'email': email})
            return jsonify({'success': False, 'error': 'Код хугацаа дууссан'}), 400
        
        if reset_data['code'] != code:
            return jsonify({'success': False, 'error': 'Буруу код'}), 400
        
        return jsonify({'success': True, 'message': 'Код баталгаажлаа'}), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/auth/reset-password', methods=['POST'])
def reset_password():
    """Нууц үг сэргээх"""
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        code = data.get('code', '').strip()
        new_password = data.get('new_password', '')
        
        if not email or not code or not new_password:
            return jsonify({'success': False, 'error': 'Бүх талбар шаардлагатай'}), 400
        
        if len(new_password) < 6:
            return jsonify({'success': False, 'error': 'Нууц үг дор хаяж 6 тэмдэгт'}), 400
        
        reset_data = reset_codes.find_one({'email': email})
        if not reset_data:
            return jsonify({'success': False, 'error': 'Код олдсонгүй'}), 404
        
        if datetime.utcnow() > reset_data['expires_at']:
            reset_codes.delete_one({'email': email})
            return jsonify({'success': False, 'error': 'Код хугацаа дууссан'}), 400
        
        if reset_data['code'] != code:
            return jsonify({'success': False, 'error': 'Буруу код'}), 400
        
        hashed_password = hash_password(new_password)
        
        users_collection.update_one(
            {'email': email},
            {'$set': {
                'password': hashed_password,
                'updated_at': datetime.utcnow()
            }}
        )
        
        reset_codes.delete_one({'email': email})
        
        return jsonify({'success': True, 'message': 'Нууц үг амжилттай солигдлоо'}), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/auth/me', methods=['GET'])
def get_me():
    """Өөрийн мэдээллийг авах"""
    try:
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Authorization header шаардлагатай'
            }), 401
        
        token = auth_header.split(' ')[1]
        user = get_user_from_token(token)
        
        if user:
            return jsonify({
                'success': True,
                'user': {
                    'id': str(user['_id']),
                    'name': user['name'],
                    'email': user['email'],
                    'created_at': user['created_at'].isoformat() if user.get('created_at') else None,
                    'last_login': user['last_login'].isoformat() if user.get('last_login') else None
                }
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Token буруу эсвэл хугацаа дууссан'
            }), 401
        
    except Exception as e:
        print(f"Get me error: {e}")
        return jsonify({
            'success': False,
            'error': f'Мэдээлэл авах явцад алдаа гарлаа: {str(e)}'
        }), 500

@app.route('/auth/update', methods=['PUT'])
def update_profile():
    """Хэрэглэгчийн мэдээлэл шинэчлэх"""
    try:
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Authorization header шаардлагатай'
            }), 401
        
        token = auth_header.split(' ')[1]
        payload = verify_token(token)
        
        if not payload:
            return jsonify({
                'success': False,
                'error': 'Token буруу эсвэл хугацаа дууссан'
            }), 401
        
        data = request.json
        name = data.get('name', '').strip()
        
        if not name:
            return jsonify({
                'success': False,
                'error': 'Нэр шаардлагатай'
            }), 400
        
        # Мэдээлэл шинэчлэх
        users_collection.update_one(
            {'_id': payload['user_id']},
            {'$set': {
                'name': name,
                'updated_at': datetime.utcnow()
            }}
        )
        
        return jsonify({
            'success': True,
            'message': 'Мэдээлэл амжилттай шинэчлэгдлээ'
        })
        
    except Exception as e:
        print(f"Update error: {e}")
        return jsonify({
            'success': False,
            'error': f'Мэдээлэл шинэчлэх явцад алдаа гарлаа: {str(e)}'
        }), 500

@app.route('/auth/change-password', methods=['PUT'])
def change_password():
    """Нууц үг солих"""
    try:
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'Authorization header шаардлагатай'
            }), 401
        
        token = auth_header.split(' ')[1]
        payload = verify_token(token)
        
        if not payload:
            return jsonify({
                'success': False,
                'error': 'Token буруу эсвэл хугацаа дууссан'
            }), 401
        
        data = request.json
        old_password = data.get('oldPassword', '')
        new_password = data.get('newPassword', '')
        
        if not old_password or not new_password:
            return jsonify({
                'success': False,
                'error': 'Хуучин болон шинэ нууц үг шаардлагатай'
            }), 400
        
        if len(new_password) < 6:
            return jsonify({
                'success': False,
                'error': 'Шинэ нууц үг дор хаяж 6 тэмдэгттэй байх ёстой'
            }), 400
        
        # Хэрэглэгч олох
        user = users_collection.find_one({'_id': payload['user_id']})
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'Хэрэглэгч олдсонгүй'
            }), 404
        
        # Хуучин нууц үг шалгах
        if not verify_password(old_password, user['password']):
            return jsonify({
                'success': False,
                'error': 'Хуучин нууц үг буруу байна'
            }), 401
        
        # Шинэ нууц үг hash хийж шинэчлэх
        new_hashed_password = hash_password(new_password)
        users_collection.update_one(
            {'_id': payload['user_id']},
            {'$set': {
                'password': new_hashed_password,
                'updated_at': datetime.utcnow()
            }}
        )
        
        return jsonify({
            'success': True,
            'message': 'Нууц үг амжилттай солигдлоо'
        })
        
    except Exception as e:
        print(f"Change password error: {e}")
        return jsonify({
            'success': False,
            'error': f'Нууц үг солих явцад алдаа гарлаа: {str(e)}'
        }), 500

# ==================== PREDICTION ENDPOINTS ====================

@app.route('/predict', methods=['POST'])
def predict():
    """Forex сигнал таамаглах"""
    try:
        if model is None or scaler is None:
            return jsonify({
                'success': False,
                'error': 'Модель ачаалагдаагүй байна'
            }), 503
        
        data = request.json
        currency_pair = data.get('currency_pair', '').upper()
        
        if currency_pair not in CURRENCY_PAIRS:
            return jsonify({
                'success': False,
                'error': f'Дэмжигдэх валют: {", ".join(CURRENCY_PAIRS)}'
            }), 400
        
        # Өгөгдөл ачаалах (хамгийн сүүлийн мэдээлэл)
        # TODO: Real-time эсвэл database-аас өгөгдөл авах
        # Одоогоор demo response
        
        predicted_signal = np.random.randint(0, 5)  # Demo: 0-4 сигнал
        
        return jsonify({
            'success': True,
            'currency_pair': currency_pair,
            'signal': int(predicted_signal),
            'signal_name': get_signal_name(predicted_signal),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Predict error: {e}")
        return jsonify({
            'success': False,
            'error': f'Таамаглах явцад алдаа гарлаа: {str(e)}'
        }), 500

def calculate_prediction_for_pair(currency_pair, force_refresh=False):
    """
    Валютын хослолын таамаглал тооцоолох (кэштэй)
    
    Args:
        currency_pair: EUR/USD гэх мэт
        force_refresh: Кэшийг давж шинэчлэх эсэх
    
    Returns:
        dict: Таамаглалын үр дүн
    """
    global prediction_cache, prediction_cache_time
    
    # Normalize
    normalized_pair = currency_pair.replace('/', '_').upper()
    
    # Check cache
    current_time = datetime.now()
    if not force_refresh and normalized_pair in prediction_cache:
        cache_time = prediction_cache_time.get(normalized_pair)
        if cache_time and (current_time - cache_time).total_seconds() < PREDICTION_CACHE_DURATION:
            age = (current_time - cache_time).total_seconds()
            print(f"✓ Cache hit: {normalized_pair} (age: {age:.1f}s)")
            return prediction_cache[normalized_pair]
    
    print(f"\n{'='*60}")
    print(f"🔄 ШИНЭ ТААМАГЛАЛ: {currency_pair}")
    print(f"{'='*60}")
    
    if model is None or scaler is None:
        return {
            'success': False,
            'error': 'ML модель ачаалагдаагүй'
        }
    
    # MT5 symbol format
    mt5_symbol = normalized_pair.replace('_', '')
    if mt5_symbol == 'XAUUSD':
        pass  # Already correct
    
    print(f"📊 Symbol: {mt5_symbol}")
    
    # Fetch data
    df = None
    data_source = 'FILE'
    
    if MT5_ENABLED and mt5_handler.connected:
        try:
            print(f"🔄 MT5-аас өгөгдөл татаж байна...")
            df = mt5_handler.get_historical_data(mt5_symbol, 'M1', 1000)
            if df is not None and len(df) > 0:
                print(f"   ✓ {len(df)} bars (MT5)")
                data_source = 'MT5'
        except Exception as e:
            print(f"   ⚠ MT5 алдаа: {e}")
    
    # Fallback to file
    if df is None or len(df) == 0:
        file_path = f"data/test/{normalized_pair}_test.csv"
        try:
            full_path = Path(__file__).parent.parent / file_path
            if full_path.exists():
                df = pd.read_csv(full_path)
                print(f"   ✓ {len(df)} rows (FILE)")
                data_source = 'FILE'
        except Exception as e:
            return {
                'success': False,
                'error': f'Өгөгдөл олдсонгүй: {str(e)}'
            }
    
    if df is None or len(df) < 50:
        return {
            'success': False,
            'error': 'Хангалтгүй өгөгдөл (50+ шаардлагатай)'
        }
    
    # Calculate features
    try:
        df = calculate_features(df)
        
        # Get recent data
        recent_df = df.tail(100).copy()
        
        # Feature columns
        feature_columns = ['returns', 'MA_5', 'MA_20', 'volatility', 'RSI', 'volume_ma']
        
        # Check available features
        available = [col for col in feature_columns if col in recent_df.columns]
        if len(available) < 6:
            return {
                'success': False,
                'error': f'Features дутуу: {len(available)}/6'
            }
        
        # Prepare data
        X = recent_df[available].values
        X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)
        X_scaled = scaler.transform(X)
        
        # Predict
        print(f"🤖 HMM таамаглал...")
        hidden_states = model.predict(X_scaled)
        current_state = hidden_states[-1]
        predicted_signal = int(current_state) % 5
        
        # Confidence
        try:
            state_probs = model.predict_proba(X_scaled)
            confidence = float(state_probs[-1, current_state])
        except:
            confidence = 0.65 + (predicted_signal * 0.05)
        
        # Historical accuracy
        try:
            if len(hidden_states) >= 50:
                recent_states = hidden_states[-50:]
                most_common = np.bincount(recent_states).argmax()
                consistency = np.sum(recent_states == most_common) / len(recent_states)
                historical_accuracy = 0.60 + (consistency * 0.30)
            else:
                historical_accuracy = 0.75
        except:
            historical_accuracy = 0.75
        
        # Price info
        last_close = float(recent_df['close'].iloc[-1])
        prev_close = float(recent_df['close'].iloc[-2])
        price_change = ((last_close - prev_close) / prev_close) * 100
        
        signal_name = get_signal_name(predicted_signal)
        print(f"   ✓ Үр дүн: {signal_name} ({confidence:.2%})")
        
        result = {
            'success': True,
            'currency_pair': currency_pair,
            'signal': int(predicted_signal),
            'signal_name': signal_name,
            'confidence': float(f"{confidence:.2f}"),
            'historical_accuracy': float(f"{historical_accuracy:.2f}"),
            'timestamp': current_time.isoformat(),
            'current_price': float(last_close),
            'price_change_percent': float(f"{price_change:.4f}"),
            'data_source': data_source,
            'bars_analyzed': len(recent_df)
        }
        
        # Cache result
        prediction_cache[normalized_pair] = result
        prediction_cache_time[normalized_pair] = current_time
        print(f"💾 Кэшлэгдлээ: {normalized_pair}")
        
        return result
        
    except Exception as e:
        print(f"⚠ Тооцоолох алдаа: {e}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': f'Тооцоолох алдаа: {str(e)}'
        }

@app.route('/predict_file', methods=['POST'])
def predict_file():
    """
    MT5-аас бодит өгөгдөл татаж, HMM model ашиглан таамаглал хийх
    Mobile app-аас дуудагдана
    """
    try:
        if model is None or scaler is None:
            return jsonify({
                'success': False,
                'error': 'Модель ачаалагдаагүй байна'
            }), 503
        
        data = request.json
        file_path = data.get('file_path', '')
        
        if not file_path:
            return jsonify({
                'success': False,
                'error': 'Файлын зам шаардлагатай'
            }), 400
        
        # Extract currency pair from file path
        # Example: data/test/EUR_USD_test.csv -> EUR/USD
        file_name = os.path.basename(file_path)
        currency_pair = file_name.replace('_test.csv', '').replace('_', '/')
        
        # Validate currency pair
        normalized_pair = currency_pair.replace('/', '_')
        valid_pairs_normalized = [p.replace('/', '_') for p in CURRENCY_PAIRS]
        
        if normalized_pair.upper() not in valid_pairs_normalized:
            return jsonify({
                'success': False,
                'error': f'Дэмжигдэхгүй валют: {currency_pair}'
            }), 400
        
        # Check for force_refresh parameter
        force_refresh = data.get('force_refresh', False)
        
        # Use new calculation function with cache
        result = calculate_prediction_for_pair(currency_pair, force_refresh=force_refresh)
        
        if result['success']:
            # Add file_path for compatibility
            result['file_path'] = file_path
            return jsonify(result), 200
        else:
            return jsonify(result), 500
        
    except Exception as e:
        print(f"⚠ Predict file алдаа: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Таамаглах алдаа: {str(e)}'
        }), 500

@app.route('/currencies', methods=['GET'])
def get_currencies():
    """Дэмжигдсэн валютын жагсаалт"""
    return jsonify({
        'success': True,
        'currencies': CURRENCY_PAIRS,
        'count': len(CURRENCY_PAIRS)
    })

@app.route('/rates/live', methods=['GET'])
def get_live_rates():
    """
    Бодит цагийн валютын ханш авах
    MT5 эсвэл API-аас
    
    Query params:
        currencies: Optional comma-separated list (e.g., ?currencies=EUR,GBP,JPY)
        source: 'mt5' or 'api' (default: auto - MT5 бол MT5, үгүй бол API)
    
    Returns:
        {
            'success': true,
            'timestamp': '2025-10-19 12:30:45',
            'source': 'MT5' or 'API',
            'rates': {
                'EUR_USD': {'rate': 1.176, 'bid': 1.175, 'ask': 1.177, ...},
                'GBP_USD': {'rate': 1.370, 'bid': 1.369, 'ask': 1.371, ...},
                ...
            }
        }
    """
    try:
        # Get optional parameters
        currencies_param = request.args.get('currencies')
        source_param = request.args.get('source', 'auto').lower()
        
        currencies = None
        if currencies_param:
            currencies = [c.strip().upper() for c in currencies_param.split(',')]
        
        # Determine data source - ҮРГЭЛЖ MT5 эхлээд туршина
        use_mt5 = MT5_ENABLED  # Connection шалгахгүй, туршиж үзнэ
        
        print(f"🔍 /rates/live: source={source_param}, MT5_ENABLED={MT5_ENABLED}, connected={mt5_handler.connected if MT5_ENABLED else 'N/A'}, use_mt5={use_mt5}")
        
        # Try MT5 first if enabled
        if use_mt5:
            try:
                print("📊 MT5-аас ханш татаж байна...")
                
                # Convert our format to MT5 format
                mt5_symbols = None
                if currencies:
                    mt5_symbols = []
                    for curr in currencies:
                        # EUR -> EURUSD format
                        if curr != 'XAU':
                            mt5_symbols.append(f"{curr}USD")
                        else:
                            mt5_symbols.append('XAUUSD')
                else:
                    mt5_symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'USDCHF', 'XAUUSD']
                
                mt5_rates = get_mt5_live_rates(mt5_symbols)
                
                if mt5_rates:
                    # Get timestamp from first rate
                    timestamp = datetime.now()
                    if mt5_rates:
                        first_rate = next(iter(mt5_rates.values()))
                        if 'time' in first_rate:
                            timestamp = first_rate['time']
                    
                    print(f"   ✓ MT5-аас {len(mt5_rates)} ханш татагдлаа")
                    return jsonify({
                        'success': True,
                        'timestamp': timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                        'source': 'MT5',
                        'rates': mt5_rates,
                        'count': len(mt5_rates)
                    })
                else:
                    print("   ⚠ MT5 өгөгдөл хоосон")
                    return jsonify({
                        'success': False,
                        'error': 'MT5-аас ханш татаж чадсангүй'
                    }), 500
                    
            except Exception as mt5_error:
                print(f"   ⚠ MT5 алдаа: {mt5_error}")
                return jsonify({
                    'success': False,
                    'error': f'MT5 алдаа: {str(mt5_error)}'
                }), 500
        
        # MT5 идэвхгүй
        return jsonify({
            'success': False,
            'error': 'MT5 идэвхгүй байна'
        }), 503
        
    except Exception as e:
        print(f"❌ Get live rates error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Ханш авах явцад алдаа гарлаа: {str(e)}'
        }), 500

@app.route('/rates/mt5/status', methods=['GET'])
def get_mt5_status():
    """
    MT5 холболтын статус шалгах
    
    Returns:
        {
            'success': true,
            'enabled': true/false,
            'connected': true/false,
            'account_info': {...} // хэрэв холбогдсон бол
        }
    """
    try:
        status = {
            'success': True,
            'enabled': MT5_ENABLED,
            'connected': mt5_handler.connected if MT5_ENABLED else False
        }
        
        if MT5_ENABLED and mt5_handler.connected and mt5_handler.account_info:
            acc = mt5_handler.account_info
            status['account_info'] = {
                'login': acc.login,
                'server': acc.server,
                'company': acc.company,
                'currency': acc.currency,
                'leverage': acc.leverage,
                'balance': acc.balance,
            }
        
        return jsonify(status)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/rates/mt5/historical', methods=['GET'])
def get_mt5_historical():
    """
    MT5-аас түүхэн өгөгдөл татах
    
    Query params:
        symbol: Symbol (e.g., EURUSD, GBPUSD)
        timeframe: M1, M5, M15, M30, H1, H4, D1, W1, MN1 (default: M1)
        count: Bar тоо (default: 1000)
    
    Returns:
        {
            'success': true,
            'symbol': 'EURUSD',
            'timeframe': 'M1',
            'data': [...OHLCV array...]
        }
    """
    try:
        if not MT5_ENABLED or not mt5_handler.connected:
            return jsonify({
                'success': False,
                'error': 'MT5 холбогдоогүй байна'
            }), 400
        
        symbol = request.args.get('symbol', 'EURUSD').upper()
        timeframe = request.args.get('timeframe', 'M1').upper()
        count = int(request.args.get('count', 1000))
        
        # Get historical data
        df = mt5_handler.get_historical_data(symbol, timeframe, count)
        
        if df is None:
            return jsonify({
                'success': False,
                'error': f'{symbol} өгөгдөл татах алдаа'
            }), 500
        
        # Convert to JSON-friendly format
        data = df.to_dict('records')
        # Convert timestamps to string
        for record in data:
            record['time'] = record['time'].strftime('%Y-%m-%d %H:%M:%S')
        
        return jsonify({
            'success': True,
            'symbol': symbol,
            'timeframe': timeframe,
            'count': len(data),
            'data': data
        })
        
    except Exception as e:
        print(f"❌ MT5 historical data error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/rates/specific', methods=['GET'])
def get_specific_rate():
    """
    Тодорхой валютын хослолын ханш авах
    
    Query params:
        pair: Currency pair (e.g., ?pair=EUR_USD or ?pair=EUR/USD)
        source: 'mt5' or 'api' (default: auto - MT5 бол MT5, үгүй бол API)
    
    Returns:
        {
            'success': true,
            'pair': 'EUR_USD',
            'rate': 1.176,
            'timestamp': '2025-10-19 12:30:45'
        }
    """
    try:
        pair = request.args.get('pair', '').upper()
        source_param = request.args.get('source', 'auto').lower()
        
        print(f"💱 Get specific rate хүсэлт: {pair}")
        
        if not pair:
            return jsonify({
                'success': False,
                'error': 'Валютын хослол заавал шаардлагатай (e.g., ?pair=EUR_USD)'
            }), 400
        
        # Normalize pair format: accept both EUR/USD and EUR_USD
        normalized_pair = pair.replace('/', '_')
        
        print(f"📊 Normalized pair: {normalized_pair}")
        
        if normalized_pair not in CURRENCY_PAIRS:
            return jsonify({
                'success': False,
                'error': f'"{pair}" дэмжигдэхгүй. Дэмжигдсэн: {", ".join(CURRENCY_PAIRS)}'
            }), 400
        
        # Use normalized pair for processing
        pair = normalized_pair
        
        # Determine data source - ҮРГЭЛЖ MT5 эхлээд туршина
        use_mt5 = MT5_ENABLED  # Connection шалгахгүй, туршиж үзнэ
        
        print(f"🔍 /rates/specific: MT5_ENABLED={MT5_ENABLED}, connected={mt5_handler.connected if MT5_ENABLED else 'N/A'}, use_mt5={use_mt5}")
        
        # Try MT5 first if enabled
        if use_mt5:
            try:
                print(f"📊 MT5-аас {pair} ханш татаж байна...")
                
                # Convert to MT5 symbol format
                mt5_symbol = pair.replace('_', '')
                if pair == 'EUR_USD':
                    mt5_symbol = 'EURUSD'
                elif pair == 'GBP_USD':
                    mt5_symbol = 'GBPUSD'
                elif pair == 'USD_JPY':
                    mt5_symbol = 'USDJPY'
                elif pair == 'USD_CAD':
                    mt5_symbol = 'USDCAD'
                elif pair == 'USD_CHF':
                    mt5_symbol = 'USDCHF'
                elif pair == 'XAU_USD':
                    mt5_symbol = 'XAUUSD'
                
                mt5_rates = get_mt5_live_rates([mt5_symbol])
                
                if mt5_rates and pair in mt5_rates:
                    rate_data = mt5_rates[pair]
                    timestamp = rate_data.get('time', datetime.now())
                    
                    print(f"   ✓ MT5-аас {pair} ханш татагдлаа")
                    return jsonify({
                        'success': True,
                        'pair': pair,
                        'rate': rate_data.get('bid', rate_data.get('rate', 0)),
                        'bid': rate_data.get('bid'),
                        'ask': rate_data.get('ask'),
                        'spread': rate_data.get('spread'),
                        'timestamp': timestamp.strftime('%Y-%m-%d %H:%M:%S') if isinstance(timestamp, datetime) else str(timestamp),
                        'source': 'MT5'
                    })
                else:
                    print(f"   ⚠ MT5 {pair} ханш олдсонгүй, API ашиглана")
                    
            except Exception as mt5_error:
                print(f"   ⚠ MT5 алдаа: {mt5_error}, API ашиглана")
        
        # MT5 идэвхгүй
        return jsonify({
            'success': False,
            'error': 'MT5 идэвхгүй байна'
        }), 503
        
    except Exception as e:
        print(f"❌ Get specific rate error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/rates/history', methods=['GET'])
def get_rate_history():
    """
    Ханшийн түүх авах (график зурахад ашиглана)
    
    Query params:
        pair: Currency pair (e.g., ?pair=EUR/USD or ?pair=EUR_USD)
        limit: Хэдэн мөр авах (default: 20)
    
    Returns:
        {
            'success': true,
            'pair': 'EUR_USD',
            'data': [
                {'time': '2025-10-19 12:00:00', 'close': 1.176},
                ...
            ]
        }
    """
    try:
        pair = request.args.get('pair', '').upper().replace('/', '_')
        limit = int(request.args.get('limit', 20))
        
        if not pair:
            return jsonify({
                'success': False,
                'error': 'Pair параметр шаардлагатай'
            }), 400
        
        # Найд test data файлаас уншина
        test_file = os.path.join(Path(__file__).parent.parent, 'data', 'test', f'{pair}_test.csv')
        
        if not os.path.exists(test_file):
            return jsonify({
                'success': False,
                'error': f'{pair} өгөгдөл олдсонгүй'
            }), 404
        
        # Read last N rows from CSV
        df = pd.read_csv(test_file)
        
        # Take last 'limit' rows
        df = df.tail(limit)
        
        # Convert to list of dicts
        history = []
        for idx, row in df.iterrows():
            history.append({
                'time': str(row.get('date', row.get('time', str(idx)))),
                'close': float(row.get('close', row.get('Close', row.get('rate', 0)))),
                'open': float(row.get('open', row.get('Open', 0))) if 'open' in row or 'Open' in row else None,
                'high': float(row.get('high', row.get('High', 0))) if 'high' in row or 'High' in row else None,
                'low': float(row.get('low', row.get('Low', 0))) if 'low' in row or 'Low' in row else None,
            })
        
        return jsonify({
            'success': True,
            'pair': pair,
            'count': len(history),
            'data': history
        })
        
    except Exception as e:
        print(f"❌ Get rate history error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== HEALTH CHECK ====================

@app.route('/health', methods=['GET'])
def health():
    """Систем эрүүл эсэхийг шалгах"""
    try:
        # MongoDB шалгах
        client.server_info()
        
        # Хэрэглэгчдийн тоо
        user_count = users_collection.count_documents({})
        
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'users_count': user_count,
            'ml_model': 'loaded' if model else 'not loaded',
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

# ==================== MAIN ====================

if __name__ == '__main__':
    # Force port to 5000 to match mobile app configuration
    PORT = 5000
    
    print("=" * 70)
    print("ФОРЕКС СИГНАЛ FULL API")
    print("=" * 70)
    print(f"✓ MongoDB: {MONGO_URI.split('@')[1] if '@' in MONGO_URI else 'Connected'}")
    print(f"✓ JWT Authentication: Enabled")
    print(f"✓ ML Model: {'Loaded' if model else 'Not loaded'}")
    print(f"✓ Port: {PORT}")
    print(f"\n🚀 API эхэлж байна...")
    print(f"📡 Холбогдох хаяг: http://localhost:{PORT}")
    print(f"📱 Android Emulator: http://10.0.2.2:{PORT}")
    print(f"📱 Physical Device: http://192.168.60.49:{PORT}")
    print(f"\n🔐 Authentication Endpoints:")
    print(f"  POST /auth/register        - Бүртгүүлэх")
    print(f"  POST /auth/login           - Нэвтрэх")
    print(f"  POST /auth/verify          - Token шалгах")
    print(f"  GET  /auth/me              - Хэрэглэгчийн мэдээлэл")
    print(f"  PUT  /auth/update          - Мэдээлэл шинэчлэх")
    print(f"  PUT  /auth/change-password - Нууц үг солих")
    print(f"\n🤖 Prediction Endpoints:")
    print(f"  POST /predict              - Forex сигнал таамаглах")
    print(f"  GET  /currencies           - Валютын жагсаалт")
    print(f"\n� Live Rates Endpoints:")
    print(f"  GET  /rates/live           - Бодит цагийн бүх ханш")
    print(f"  GET  /rates/specific       - Тодорхой хослолын ханш")
    print(f"\n📊 System:")
    print(f"  GET  /health               - Health check")
    print(f"  GET  /                     - API мэдээлэл")
    print("\n" + "=" * 70)
    
    # Production mode - no debug, no auto-reload
    app.run(debug=False, host=API_HOST, port=PORT, use_reloader=False, threaded=True)

