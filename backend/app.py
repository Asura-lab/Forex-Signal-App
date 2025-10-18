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
from pymongo import MongoClient
from datetime import datetime, timedelta
import jwt
import bcrypt
import pandas as pd
import numpy as np
import pickle
import os

# Import configuration
from config.settings import (
    MONGO_URI, SECRET_KEY, API_HOST, API_PORT, DEBUG_MODE,
    MODELS_DIR, CURRENCY_PAIRS
)

app = Flask(__name__)
CORS(app)

# ==================== DATABASE SETUP ====================

# MongoDB client үүсгэх
try:
    client = MongoClient(MONGO_URI)
    db = client['users_db']
    users_collection = db['users']
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
            '/auth/register': 'POST - Бүртгүүлэх',
            '/auth/login': 'POST - Нэвтрэх',
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
    """Шинэ хэрэглэгч бүртгүүлэх"""
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
        
        # Нууц үгийг hash хийх
        hashed_password = hash_password(password)
        
        # Шинэ хэрэглэгч үүсгэх
        new_user = {
            'name': name,
            'email': email,
            'password': hashed_password,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'last_login': None
        }
        
        result = users_collection.insert_one(new_user)
        user_id = str(result.inserted_id)
        
        # JWT token үүсгэх
        token = generate_token(user_id, email)
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': user_id,
                'name': name,
                'email': email
            }
        }), 201
        
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

