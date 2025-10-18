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

# Import configuration
from config.settings import (
    MONGO_URI, SECRET_KEY, API_HOST, API_PORT, DEBUG_MODE,
    MODELS_DIR, CURRENCY_PAIRS,
    MAIL_SERVER, MAIL_PORT, MAIL_USE_TLS, MAIL_USE_SSL,
    MAIL_USERNAME, MAIL_PASSWORD, MAIL_DEFAULT_SENDER,
    VERIFICATION_CODE_EXPIRY_MINUTES, RESET_CODE_EXPIRY_MINUTES
)

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

# ==================== AUTH HELPER FUNCTIONS ====================

def generate_verification_code():
    """6 оронтой санамсаргүй код үүсгэх"""
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])

def send_verification_email(email, code, name=""):
    """Имэйл баталгаажуулалтын код илгээх"""
    try:
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
        mail.send(msg)
        return True
    except Exception as e:
        print(f"❌ Email илгээх алдаа: {e}")
        return False

def send_reset_password_email(email, code, name=""):
    """Нууц үг сэргээх код илгээх"""
    try:
        msg = Message(
            subject='Forex Signal App - Нууц үг сэргээх',
            recipients=[email]
        )
        msg.html = f"""
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🔐 Нууц үг сэргээх</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #1a237e;">Сайн байна уу {name}!</h2>
            
            <p>Та нууц үгээ сэргээх хүсэлт илгээсэн байна.</p>
            
            <p>Нууц үг сэргээх кодыг доор харна уу:</p>
            
            <div style="background-color: #fff3e0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; border: 2px solid #ff9800;">
                <h1 style="color: #ff6f00; font-size: 36px; letter-spacing: 8px; margin: 0;">{code}</h1>
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
        mail.send(msg)
        return True
    except Exception as e:
        print(f"❌ Email илгээх алдаа: {e}")
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
    
    # Volume
    if 'volume' in df.columns:
        df['volume_ma'] = df['volume'].rolling(window=20).mean()
    
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
        
        # Баталгаажуулалтын код үүсгэх
        verification_code = generate_verification_code()
        
        # Нууц үгийг hash хийх
        hashed_password = hash_password(password)
        
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
        
        # Имэйл илгээх
        email_sent = send_verification_email(email, verification_code, name)
        
        if not email_sent:
            # Email тохиргоо хийгдээгүй бол DEMO режим
            return jsonify({
                'success': True,
                'demo_mode': True,
                'verification_code': verification_code,
                'email': email,
                'message': 'DEMO режим: Имэйл тохиргоо хийгдээгүй байна'
            }), 200
        
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
        
        # Имэйл баталгаажсан эсэх шалгах
        if not user.get('email_verified', False):
            return jsonify({
                'success': False,
                'error': 'Имэйл хаягаа баталгаажуулна уу',
                'requires_verification': True
            }), 403
        
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
                'email': user['email']
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
                    'email': user['email']
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
        
        # Хэрэглэгч үүсгэх
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
        
        verification = verification_codes.find_one({'email': email})
        if not verification:
            return jsonify({'success': False, 'error': 'Бүртгэл олдсонгүй'}), 404
        
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
                'success': True,
                'demo_mode': True,
                'verification_code': new_code
            }), 200
        
        return jsonify({'success': True, 'message': 'Шинэ код илгээгдлээ'}), 200
        
    except Exception as e:
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
            return jsonify({
                'success': True,
                'demo_mode': True,
                'reset_code': reset_code
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

@app.route('/currencies', methods=['GET'])
def get_currencies():
    """Дэмжигдсэн валютын жагсаалт"""
    return jsonify({
        'success': True,
        'currencies': CURRENCY_PAIRS,
        'count': len(CURRENCY_PAIRS)
    })

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
    print(f"📱 Physical Device: http://192.168.1.44:{PORT}")
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
    print(f"\n📊 System:")
    print(f"  GET  /health               - Health check")
    print(f"  GET  /                     - API мэдээлэл")
    print("\n" + "=" * 70)
    
    app.run(debug=DEBUG_MODE, host=API_HOST, port=PORT)

