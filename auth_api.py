# -*- coding: utf-8 -*-
"""
Форекс Сигнал Authentication Backend API
MongoDB + JWT ашиглан хэрэглэгч бүртгэл, нэвтрэх
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime, timedelta
import jwt
import bcrypt
import os
from dotenv import load_dotenv

# .env файл ачаалах
load_dotenv()

app = Flask(__name__)
CORS(app)

# MongoDB холболт
MONGO_URI = os.getenv('MONGO_URI')
SECRET_KEY = os.getenv('SECRET_KEY')

if not MONGO_URI or not SECRET_KEY:
    raise ValueError("MONGO_URI болон SECRET_KEY .env файлд байх ёстой!")

# MongoDB client үүсгэх
try:
    client = MongoClient(MONGO_URI)
    db = client['users_db']
    users_collection = db['users']
    print("✓ MongoDB холбогдлоо")
except Exception as e:
    print(f"✗ MongoDB холбогдох алдаа: {e}")
    exit(1)

# ==================== HELPER FUNCTIONS ====================

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
        'exp': datetime.utcnow() + timedelta(days=7),  # 7 хоног
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
            {'password': 0}  # Нууц үгийг буцаахгүй
        )
        return user
    return None

# ==================== AUTH ENDPOINTS ====================

@app.route('/')
def index():
    """API мэдээлэл"""
    return jsonify({
        'name': 'Форекс Сигнал Auth API',
        'version': '2.0',
        'database': 'MongoDB',
        'auth': 'JWT',
        'endpoints': {
            '/': 'GET - API мэдээлэл',
            '/auth/register': 'POST - Бүртгүүлэх',
            '/auth/login': 'POST - Нэвтрэх',
            '/auth/verify': 'POST - Token шалгах',
            '/auth/me': 'GET - Хэрэглэгчийн мэдээлэл',
            '/auth/update': 'PUT - Мэдээлэл шинэчлэх'
        }
    })

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
    """Өөрийн мэдээллийг авах (Token шаардлагатай)"""
    try:
        # Authorization header-өөс token авах
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
        # Authorization header-өөс token авах
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
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("=" * 60)
    print("ФОРЕКС СИГНАЛ AUTHENTICATION API")
    print("=" * 60)
    print(f"✓ MongoDB: {MONGO_URI.split('@')[1] if '@' in MONGO_URI else 'Connected'}")
    print(f"✓ JWT Authentication: Enabled")
    print("\n🚀 API эхэлж байна...")
    print("📡 Холбогдох хаяг: http://localhost:5001")
    print("\nEndpoints:")
    print("  POST /auth/register  - Бүртгүүлэх")
    print("  POST /auth/login     - Нэвтрэх")
    print("  POST /auth/verify    - Token шалгах")
    print("  GET  /auth/me        - Хэрэглэгчийн мэдээлэл")
    print("  PUT  /auth/update    - Мэдээлэл шинэчлэх")
    print("  GET  /health         - Health check")
    print("\n" + "=" * 60)
    
    app.run(debug=True, host='0.0.0.0', port=5001)
