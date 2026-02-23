# -*- coding: utf-8 -*-
"""
Forex Signal API
- MongoDB + JWT Authentication
- Twelve Data API for live rates
- GBDT Signal Generator (Multi-Timeframe Ensemble)
"""

import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message
from pymongo import MongoClient
from datetime import datetime, timedelta, timezone
import jwt
import bcrypt
import os
import random
import re

# Import configuration
from config.settings import (
    MONGO_URI, SECRET_KEY, API_HOST, API_PORT,
    MAIL_SERVER, MAIL_PORT, MAIL_USE_TLS, MAIL_USE_SSL,
    MAIL_USERNAME, MAIL_PASSWORD, MAIL_DEFAULT_SENDER,
    VERIFICATION_CODE_EXPIRY_MINUTES, RESET_CODE_EXPIRY_MINUTES
)
import threading
import time

# Import Twelve Data handler (real-time + historical forex data)
from utils.twelvedata_handler import (
    get_twelvedata_live_rate, 
    get_twelvedata_historical, 
    get_twelvedata_dataframe,
    get_twelvedata_multitf,
    get_all_forex_rates
)

# Import Market Analyst (News & AI)
from utils.market_analyst import market_analyst

# Import GBDT Signal Generator (trained multi-timeframe model)
from ml.signal_generator_gbdt import get_signal_generator_gbdt

# Import Push Notification Service
from utils.push_notifications import push_service

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
app.config['MAIL_TIMEOUT'] = 10  # 10s SMTP connection timeout to prevent worker hangs

mail = Mail(app)

# ==================== DATABASE SETUP ====================

try:
    client = MongoClient(MONGO_URI)
    db = client['users_db']
    users_collection = db['users']
    verification_codes = db['verification_codes']
    reset_codes = db['reset_codes']
    signals_collection = db['signals']  # Таамгууд хадгалах collection
    print("✓ MongoDB холбогдлоо")
except Exception as e:
    print(f"✗ MongoDB холбогдох алдаа: {e}")
    exit(1)

# ==================== SIGNAL GENERATORS ====================

signal_generator = None  # GBDT trained model

def load_signal_generator():
    global signal_generator
    
    try:
        signal_generator = get_signal_generator_gbdt()
        if signal_generator.is_loaded:
            print("✓ GBDT Signal Generator ачаалагдлаа (Trained Multi-TF Ensemble)")
            return True
        else:
            print("⚠ GBDT model file олдсонгүй")
            signal_generator = None
            return False
    except Exception as e:
        print(f"⚠ GBDT Signal Generator алдаа: {e}")
        signal_generator = None
        return False

# Load on startup in background thread (avoid blocking gunicorn bind)
threading.Thread(target=load_signal_generator, daemon=True).start()

# ==================== PRELOAD HISTORICAL DATA ====================

def preload_historical_data():
    """Backend эхлэхэд historical data урьдчилан татах"""
    try:
        print("📥 Preloading historical data...")
        df = get_twelvedata_dataframe(interval="1min", outputsize=500)
        if df is not None and len(df) >= 200:
            print(f"[OK] Historical data preloaded: {len(df)} bars")
            return True
        else:
            print(f"[WARN] Historical data preload: got {len(df) if df is not None else 0} bars")
    except Exception as e:
        print(f"[WARN] Historical data preload failed: {e}")
    return False

# Preload on startup in background thread (avoid blocking gunicorn bind)
threading.Thread(target=preload_historical_data, daemon=True).start()

# ==================== NEWS CACHE SYSTEM ====================

class NewsCache:
    def __init__(self):
        self.cache = {
            'history': None,
            'upcoming': None,
            'outlook': None,
            'latest': None
        }
        self.last_updated = None
        self.lock = threading.Lock()

    def update(self):
        """Update all news categories in cache"""
        print("[INFO] Updating news cache...")
        try:
            # Fetch latest data
            history = market_analyst.get_news_history()
            upcoming = market_analyst.get_upcoming_news()
            outlook = market_analyst.get_market_outlook()
            latest = market_analyst.get_latest_news()

            # Detect high-impact upcoming news and send push notifications
            try:
                self._check_and_notify_news(upcoming)
            except Exception as notif_err:
                print(f"[WARN] News notification error: {notif_err}")

            with self.lock:
                old_upcoming = self.cache.get('upcoming')
                self.cache['history'] = history
                self.cache['upcoming'] = upcoming
                self.cache['outlook'] = outlook
                self.cache['latest'] = latest
                self.last_updated = datetime.now()
            print("[OK] News cache updated successfully")
        except Exception as e:
            print(f"[ERROR] News cache update failed: {e}")

    def _check_and_notify_news(self, upcoming):
        """Томоохон мэдээ илэрвэл push notification илгээх"""
        if not upcoming:
            return
        
        # upcoming нь dict эсвэл list байж болно
        events = []
        if isinstance(upcoming, dict):
            events = upcoming.get('events', upcoming.get('data', []))
        elif isinstance(upcoming, list):
            events = upcoming
        
        if not events or not isinstance(events, list):
            return
        
        for event in events:
            if not isinstance(event, dict):
                continue
            impact = str(event.get('impact', '')).lower()
            # Only notify for high impact events
            if impact in ('high', 'red', '3', 'critical'):
                threading.Thread(
                    target=push_service.send_news_notification,
                    args=({
                        'title': event.get('title', event.get('event', 'High Impact News')),
                        'impact': 'high',
                        'currency': event.get('currency', event.get('country', 'USD')),
                        'description': event.get('forecast', event.get('description', '')),
                    },),
                    daemon=True
                ).start()

    def get(self, key):
        """Get data from cache"""
        with self.lock:
            return self.cache.get(key)
        
    def is_ready(self):
        with self.lock:
            return self.last_updated is not None

news_cache = NewsCache()

def news_updater_task():
    """Background task to update news every 30 minutes"""
    print("[INFO] Starting background news updater...")
    # Initial update
    news_cache.update()
    
    while True:
        # Sleep for 30 minutes (1800 seconds)
        time.sleep(1800)
        news_cache.update()

# Start background updater
threading.Thread(target=news_updater_task, daemon=True).start()

# ==================== AUTH HELPERS ====================

def generate_token(user_id, email):
    payload = {
        'user_id': str(user_id),
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except:
        return None

def token_required(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Token шаардлагатай'}), 401
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Token хүчингүй'}), 401
        return f(payload, *args, **kwargs)
    return decorated

def generate_verification_code():
    return str(random.randint(100000, 999999))

def send_verification_email(email, code, name=""):
    try:
        msg = Message(
            'Predictrix - Баталгаажуулах код',
            recipients=[email]
        )
        msg.html = f"""
        <h2>Сайн байна уу{', ' + name if name else ''}!</h2>
        <p>Таны баталгаажуулах код: <strong style="font-size: 24px; color: #1a237e;">{code}</strong></p>
        <p>Код {VERIFICATION_CODE_EXPIRY_MINUTES} минутын дотор хүчинтэй.</p>
        """
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Email илгээх алдаа: {e}")
        return False

def send_verification_email_async(email, code, name=""):
    """Send verification email in a background thread to avoid blocking the worker."""
    def _send():
        with app.app_context():
            send_verification_email(email, code, name)
    t = threading.Thread(target=_send, daemon=True)
    t.start()

# ==================== AUTH ENDPOINTS ====================

@app.route('/auth/register', methods=['POST'])
def register():
    data = request.json
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    if not all([name, email, password]):
        return jsonify({'error': 'Бүх талбарыг бөглөнө үү'}), 400
    
    if not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email):
        return jsonify({'error': 'Имэйл хаяг буруу байна'}), 400
    
    if len(password) < 6:
        return jsonify({'error': 'Нууц үг хамгийн багадаа 6 тэмдэгт'}), 400
    
    if users_collection.find_one({'email': email}):
        return jsonify({'error': 'Энэ имэйл бүртгэлтэй байна'}), 400
    
    # Generate verification code
    code = generate_verification_code()
    
    # Save to verification_codes collection
    verification_codes.delete_many({'email': email})
    verification_codes.insert_one({
        'email': email,
        'code': code,
        'name': name,
        'password': bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode(),
        'created_at': datetime.now(timezone.utc),
        'expires_at': datetime.now(timezone.utc) + timedelta(minutes=VERIFICATION_CODE_EXPIRY_MINUTES)
    })
    
    # Send email in background thread so the request doesn't block/timeout
    send_verification_email_async(email, code, name)
    return jsonify({
        'success': True,
        'message': 'Баталгаажуулах код илгээлээ',
        'email': email
    })

@app.route('/auth/verify-email', methods=['POST'])
def verify_email():
    data = request.json
    email = data.get('email', '').strip().lower()
    code = data.get('code', '').strip()
    
    record = verification_codes.find_one({
        'email': email,
        'code': code,
        'expires_at': {'$gt': datetime.now(timezone.utc)}
    })
    
    if not record:
        return jsonify({'error': 'Код буруу эсвэл хугацаа дууссан'}), 400
    
    # Create user
    user = {
        'name': record['name'],
        'email': email,
        'password': record['password'],
        'email_verified': True,
        'created_at': datetime.now(timezone.utc)
    }
    result = users_collection.insert_one(user)
    
    # Clean up
    verification_codes.delete_many({'email': email})
    
    # Generate token
    token = generate_token(result.inserted_id, email)
    
    return jsonify({
        'success': True,
        'token': token,
        'user': {
            'name': user['name'],
            'email': user['email'],
            'email_verified': True
        }
    })

@app.route('/auth/resend-verification', methods=['POST'])
def resend_verification():
    data = request.json
    email = data.get('email', '').strip().lower()
    
    record = verification_codes.find_one({'email': email})
    if not record:
        return jsonify({'error': 'Бүртгэл олдсонгүй'}), 404
    
    code = generate_verification_code()
    verification_codes.update_one(
        {'email': email},
        {'$set': {
            'code': code,
            'created_at': datetime.now(timezone.utc),
            'expires_at': datetime.now(timezone.utc) + timedelta(minutes=VERIFICATION_CODE_EXPIRY_MINUTES)
        }}
    )
    
    send_verification_email_async(email, code, record.get('name', ''))
    return jsonify({'success': True, 'message': 'Код дахин илгээлээ'})

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    user = users_collection.find_one({'email': email})
    if not user:
        return jsonify({'error': 'Имэйл эсвэл нууц үг буруу'}), 401
    
    # Password bytes эсвэл string байж болно
    stored_password = user['password']
    if isinstance(stored_password, str):
        stored_password = stored_password.encode()
    
    if not bcrypt.checkpw(password.encode(), stored_password):
        return jsonify({'error': 'Имэйл эсвэл нууц үг буруу'}), 401
    
    token = generate_token(user['_id'], email)
    
    return jsonify({
        'success': True,
        'token': token,
        'user': {
            'name': user['name'],
            'email': user['email'],
            'email_verified': user.get('email_verified', False)
        }
    })

@app.route('/auth/me', methods=['GET'])
@token_required
def get_me(payload):
    user = users_collection.find_one({'email': payload['email']})
    if not user:
        return jsonify({'error': 'Хэрэглэгч олдсонгүй'}), 404
    
    return jsonify({
        'success': True,
        'user': {
            'name': user['name'],
            'email': user['email'],
            'email_verified': user.get('email_verified', False)
        }
    })

@app.route('/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    email = data.get('email', '').strip().lower()
    
    user = users_collection.find_one({'email': email})
    if not user:
        return jsonify({'success': True, 'message': 'Хэрэв бүртгэлтэй бол код илгээлээ'})
    
    code = generate_verification_code()
    reset_codes.delete_many({'email': email})
    reset_codes.insert_one({
        'email': email,
        'code': code,
        'created_at': datetime.now(timezone.utc),
        'expires_at': datetime.now(timezone.utc) + timedelta(minutes=RESET_CODE_EXPIRY_MINUTES)
    })
    
    try:
        msg = Message('Predictrix - Нууц үг сэргээх', recipients=[email])
        msg.html = f"""
        <h2>Нууц үг сэргээх</h2>
        <p>Код: <strong style="font-size: 24px;">{code}</strong></p>
        <p>Код {RESET_CODE_EXPIRY_MINUTES} минутын дотор хүчинтэй.</p>
        """
        mail.send(msg)
    except:
        pass
    
    return jsonify({'success': True, 'message': 'Код илгээлээ'})

@app.route('/auth/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    email = data.get('email', '').strip().lower()
    code = data.get('code', '').strip()
    new_password = data.get('new_password', '')
    
    if len(new_password) < 6:
        return jsonify({'error': 'Нууц үг хамгийн багадаа 6 тэмдэгт'}), 400
    
    record = reset_codes.find_one({
        'email': email,
        'code': code,
        'expires_at': {'$gt': datetime.now(timezone.utc)}
    })
    
    if not record:
        return jsonify({'error': 'Код буруу эсвэл хугацаа дууссан'}), 400
    
    hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    users_collection.update_one({'email': email}, {'$set': {'password': hashed}})
    reset_codes.delete_many({'email': email})
    
    return jsonify({'success': True, 'message': 'Нууц үг амжилттай солигдлоо'})

# ==================== PUSH NOTIFICATION ENDPOINTS ====================

@app.route('/notifications/register', methods=['POST'])
def register_push_token():
    """Push notification token бүртгэх"""
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return jsonify({'error': 'Token шаардлагатай'}), 401
    
    payload = verify_token(auth.split(' ')[1])
    if not payload:
        return jsonify({'error': 'Token буруу'}), 401
    
    data = request.json or {}
    push_token = data.get('push_token', '').strip()
    platform = data.get('platform', 'unknown')
    
    if not push_token:
        return jsonify({'error': 'Push token шаардлагатай'}), 400
    
    success = push_service.register_token(payload['user_id'], push_token, platform)
    
    if success:
        return jsonify({'success': True, 'message': 'Push token бүртгэгдлээ'})
    return jsonify({'error': 'Push token бүртгэж чадсангүй'}), 500

@app.route('/notifications/unregister', methods=['POST'])
def unregister_push_token():
    """Push notification token устгах"""
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return jsonify({'error': 'Token шаардлагатай'}), 401
    
    payload = verify_token(auth.split(' ')[1])
    if not payload:
        return jsonify({'error': 'Token буруу'}), 401
    
    push_service.unregister_token(payload['user_id'])
    return jsonify({'success': True, 'message': 'Push token устгагдлаа'})

@app.route('/notifications/preferences', methods=['GET'])
def get_notification_preferences():
    """Мэдэгдлийн тохиргоо авах"""
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return jsonify({'error': 'Token шаардлагатай'}), 401
    
    payload = verify_token(auth.split(' ')[1])
    if not payload:
        return jsonify({'error': 'Token буруу'}), 401
    
    prefs = push_service.get_preferences(payload['user_id'])
    return jsonify({'success': True, 'preferences': prefs})

@app.route('/notifications/preferences', methods=['PUT'])
def update_notification_preferences():
    """Мэдэгдлийн тохиргоо шинэчлэх"""
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return jsonify({'error': 'Token шаардлагатай'}), 401
    
    payload = verify_token(auth.split(' ')[1])
    if not payload:
        return jsonify({'error': 'Token буруу'}), 401
    
    data = request.json or {}
    success = push_service.update_preferences(payload['user_id'], data)
    
    if success:
        return jsonify({'success': True, 'message': 'Тохиргоо хадгалагдлаа'})
    return jsonify({'error': 'Тохиргоо хадгалж чадсангүй'}), 500

@app.route('/notifications/test', methods=['POST'])
def test_push_notification():
    """Тест мэдэгдэл илгээх (debug зорилгоор)"""
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return jsonify({'error': 'Token шаардлагатай'}), 401
    
    payload = verify_token(auth.split(' ')[1])
    if not payload:
        return jsonify({'error': 'Token буруу'}), 401
    
    # Send a test notification to this user only
    doc = push_service.push_tokens.find_one({"user_id": payload['user_id']})
    if not doc or not doc.get('push_token'):
        return jsonify({'error': 'Push token бүртгэгдээгүй'}), 404
    
    from utils.push_notifications import EXPO_PUSH_URL
    import requests as req
    result = req.post(
        EXPO_PUSH_URL,
        json=[{
            "to": doc['push_token'],
            "title": "🔔 Predictrix Test",
            "body": "Push notification амжилттай ажиллаж байна!",
            "sound": "default",
            "data": {"type": "test"}
        }],
        headers={"Content-Type": "application/json"},
        timeout=10
    )
    
    return jsonify({
        'success': True,
        'message': 'Тест мэдэгдэл илгээгдлээ',
        'expo_response': result.json() if result.status_code == 200 else result.text
    })

# ==================== LIVE RATES (Twelve Data) ====================

@app.route('/rates/live', methods=['GET'])
def get_live_rates():
    """
    Get live rates for all 20 forex pairs from Twelve Data API
    Returns rate, change, and change_percent for each pair
    """
    try:
        result = get_all_forex_rates()
        
        if result and result.get('success'):
            return jsonify({
                'success': True,
                'source': 'twelvedata',
                'rates': result.get('rates', {}),
                'timestamp': result.get('time', datetime.now(timezone.utc).isoformat()),
                'cached': result.get('cached', False),
                'count': result.get('count', 0)
            })
        elif result.get('error') == 'rate_limited':
            return jsonify({
                'success': False,
                'error': 'rate_limited',
                'message': 'Rate limited. Please try again later.',
                'next_update_in': result.get('next_update_in', 60)
            }), 429
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'Failed to fetch rates')
            }), 503
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/rates/specific', methods=['GET'])
def get_specific_rate():
    """Get specific currency pair rate"""
    pair = request.args.get('pair', 'EUR_USD')
    
    try:
        result = get_twelvedata_live_rate()
        
        if result and result.get('success'):
            return jsonify({
                'success': True,
                'pair': pair,
                'rate': result.get('rate', 0),
                'bid': result.get('bid'),
                'ask': result.get('ask'),
                'timestamp': result.get('time')
            })
        else:
            return jsonify({'success': False, 'error': 'Rate олдсонгүй'}), 404
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== SIGNAL GENERATOR ENDPOINTS ====================

@app.route('/signal', methods=['GET'])
def get_signal():
    """
    Signal Generator Endpoint (GBDT Multi-Timeframe Ensemble)
    Query params:
        min_confidence: Minimum confidence threshold (default: 60)
        pair: Currency pair (default: EUR/USD)
    """
    try:
        if signal_generator is None or not signal_generator.is_loaded:
            return jsonify({
                'success': False,
                'error': 'Signal Generator ачаалагдаагүй'
            }), 500

        min_confidence = float(request.args.get('min_confidence', 60))
        pair = request.args.get('pair', 'EUR/USD').replace('_', '/')

        multi_tf = get_twelvedata_multitf(symbol=pair, base_bars=5000)

        if multi_tf is None or "1min" not in multi_tf:
            return jsonify({
                'success': False,
                'error': 'rate_limited',
                'message': f'Rate limited or no data for {pair}.',
                'data_count': 0,
                'required': 100
            }), 429

        df = multi_tf["1min"]

        if len(df) < 100:
            return jsonify({
                'success': False,
                'error': 'rate_limited',
                'message': f'Not enough data: {len(df)} bars (need 100+)',
                'data_count': len(df),
                'required': 100
            }), 429

        data_from = df['time'].iloc[0].isoformat() if hasattr(df['time'].iloc[0], 'isoformat') else str(df['time'].iloc[0])
        data_to   = df['time'].iloc[-1].isoformat() if hasattr(df['time'].iloc[-1], 'isoformat') else str(df['time'].iloc[-1])

        now = datetime.now()
        market_closed = now.weekday() >= 5 or (now.weekday() == 0 and now.hour < 8)

        conf_threshold = min_confidence / 100.0 if min_confidence > 1 else min_confidence
        signal = signal_generator.generate_signal(
            df_1min=df,
            multi_tf_data=multi_tf,
            min_confidence=conf_threshold,
            symbol=pair.replace('/', '')
        )

        # Push notification for high-confidence signals
        try:
            sig_type = signal.get('signal', 'HOLD').upper()
            sig_conf = signal.get('confidence', 0)
            if sig_type in ('BUY', 'SELL') and sig_conf >= 70:
                threading.Thread(
                    target=push_service.send_signal_notification,
                    args=({'signal_type': sig_type, 'pair': pair,
                           'confidence': sig_conf,
                           'entry_price': signal.get('entry_price'),
                           'sl': signal.get('stop_loss'),
                           'tp': signal.get('take_profit')},),
                    daemon=True
                ).start()
        except Exception as notif_err:
            print(f"[WARN] Signal notification error: {notif_err}")

        tf_info = {tf: len(tf_df) for tf, tf_df in multi_tf.items()}

        return jsonify({
            'success': True,
            'pair': pair.replace('/', '_'),
            'data_info': {
                'from': data_from,
                'to': data_to,
                'bars': len(df),
                'timeframes': tf_info,
                'market_closed': market_closed,
                'note': 'Market хаалттай үед сүүлийн арилжааны дата' if market_closed else None
            },
            **signal
        })

    except Exception as e:
        print(f"Signal error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/signal/demo', methods=['GET'])
def get_signal_demo():
    """Demo signal with test data"""
    try:
        if signal_generator is None or not signal_generator.is_loaded:
            return jsonify({
                'success': False,
                'error': 'Signal Generator ачаалагдаагүй'
            }), 500
        
        min_confidence = float(request.args.get('min_confidence', 85))
        
        import pandas as pd
        test_file = Path(__file__).parent.parent / 'data' / 'EUR_USD_test.csv'
        
        if not test_file.exists():
            return jsonify({'success': False, 'error': 'Test data олдсонгүй'}), 404
        
        df = pd.read_csv(test_file)
        df.columns = df.columns.str.lower()
        df = df.tail(500).reset_index(drop=True)
        
        signal = signal_generator.generate_signal(df, min_confidence)
        
        return jsonify({
            'success': True,
            'pair': 'EUR_USD',
            'demo': True,
            **signal
        })
        
    except Exception as e:
        print(f"Signal V2 demo error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== PREDICT (Signal wrapper) ====================

@app.route('/predict', methods=['POST'])
def predict():
    """Main prediction endpoint - GBDT Multi-Timeframe Ensemble"""
    try:
        data = request.json or {}
        pair = data.get('pair', 'EUR_USD').replace('_', '/')

        if signal_generator is None or not signal_generator.is_loaded:
            return jsonify({
                'success': False,
                'error': 'Signal Generator ачаалагдаагүй'
            }), 500

        multi_tf = get_twelvedata_multitf(symbol=pair, base_bars=5000)

        if multi_tf is None or "1min" not in multi_tf or len(multi_tf["1min"]) < 100:
            return jsonify({
                'success': False,
                'predictions': {pair: {'signal': 'HOLD', 'confidence': 0}}
            })

        signal = signal_generator.generate_signal(
            df_1min=multi_tf["1min"],
            multi_tf_data=multi_tf,
            min_confidence=0.60,
            symbol=pair.replace('/', '')
        )

        return jsonify({
            'success': True,
            'predictions': {
                pair: {
                    'signal': signal.get('signal', 'HOLD'),
                    'confidence': signal.get('confidence', 0),
                    'entry_price': signal.get('entry_price'),
                    'stop_loss': signal.get('stop_loss'),
                    'take_profit': signal.get('take_profit'),
                    'sl_pips': signal.get('sl_pips'),
                    'tp_pips': signal.get('tp_pips'),
                    'risk_reward': signal.get('risk_reward')
                }
            }
        })

    except Exception as e:
        print(f"Predict error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== DATA COMPATIBILITY CHECK ====================

@app.route('/signal/check', methods=['GET'])
def check_signal_data():
    """
    Check if API data is compatible with the loaded GBDT model.
    Returns feature compatibility info and data quality metrics.
    """
    try:
        result = {
            'model_type': 'GBDT (Multi-TF Ensemble)',
            'model_loaded': signal_generator is not None and signal_generator.is_loaded,
        }

        if not result['model_loaded']:
            result['error'] = 'Model not loaded'
            return jsonify(result)

        result['expected_features'] = signal_generator.feature_cols
        result['feature_count'] = len(signal_generator.feature_cols)
        result['models'] = list(signal_generator.models.keys())
        result['has_calibrator'] = signal_generator.calibrator is not None

        pair = request.args.get('pair', 'EUR/USD').replace('_', '/')
        multi_tf = get_twelvedata_multitf(symbol=pair, base_bars=5000)

        if multi_tf is not None and "1min" in multi_tf:
            from ml.signal_generator_gbdt import build_features_from_data

            tf_info = {tf: len(df) for tf, df in multi_tf.items()}
            result['data_available'] = True
            result['timeframe_bars'] = tf_info

            try:
                df_features = build_features_from_data(multi_tf)
                compat = signal_generator.check_features(df_features)
                result['feature_check'] = compat
                result['data_rows_after_features'] = len(df_features)

                if compat['compatible']:
                    result['status'] = 'COMPATIBLE'
                    result['message'] = 'API data is fully compatible with the model'
                else:
                    result['status'] = 'INCOMPATIBLE'
                    result['message'] = f"Missing {len(compat['missing_features'])} features"
            except Exception as e:
                result['feature_check_error'] = str(e)
                result['status'] = 'ERROR'
        else:
            result['data_available'] = False
            result['status'] = 'NO_DATA'
            result['message'] = 'Could not fetch API data (rate limited?)'

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== SIGNAL STORAGE ====================

@app.route('/signal/save', methods=['POST'])
def save_signal():
    """
    Таамаг хадгалах endpoint
    Request body:
        - pair: Валютын хослол (EUR_USD)
        - signal: BUY/SELL/HOLD
        - confidence: Итгэлцэл (0-100)
        - entry_price: Орох үнэ
        - stop_loss: Stop loss үнэ
        - take_profit: Take profit үнэ
        - sl_pips, tp_pips: Pip утгууд
        - risk_reward: Risk/Reward ratio
        - model_probabilities: Модел бүрийн таамаг
        - models_agree: Модел санал нийлсэн эсэх
        - atr_pips: ATR volatility
    """
    try:
        data = request.json
        
        if not data:
            return jsonify({'success': False, 'error': 'Data шаардлагатай'}), 400
        
        # Required fields
        signal_type = data.get('signal')
        confidence = data.get('confidence')
        pair = data.get('pair', 'EUR_USD')
        
        if not signal_type or confidence is None:
            return jsonify({'success': False, 'error': 'signal, confidence шаардлагатай'}), 400
        
        # Create signal document
        signal_doc = {
            'pair': pair,
            'signal': signal_type,
            'confidence': float(confidence),
            'entry_price': data.get('entry_price'),
            'stop_loss': data.get('stop_loss'),
            'take_profit': data.get('take_profit'),
            'sl_pips': data.get('sl_pips'),
            'tp_pips': data.get('tp_pips'),
            'risk_reward': data.get('risk_reward'),
            'model_probabilities': data.get('model_probabilities'),
            'models_agree': data.get('models_agree'),
            'atr_pips': data.get('atr_pips'),
            'reason': data.get('reason'),
            'created_at': datetime.now(timezone.utc),
            'status': 'active'  # active, closed, expired
        }
        
        # Insert to MongoDB
        result = signals_collection.insert_one(signal_doc)
        
        print(f"✓ Signal хадгалагдлаа: {signal_type} @ {confidence}% (ID: {result.inserted_id})")
        
        return jsonify({
            'success': True,
            'message': 'Signal амжилттай хадгалагдлаа',
            'signal_id': str(result.inserted_id)
        })
        
    except Exception as e:
        print(f"Signal хадгалах алдаа: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/signals/history', methods=['GET'])
def get_signals_history():
    """
    Таамгийн түүх авах endpoint
    Query params:
        - pair: Валютын хослол (optional, default: EUR_USD)
        - limit: Хэдэн signal авах (optional, default: 50)
        - signal_type: BUY/SELL/HOLD (optional)
        - min_confidence: Хамгийн бага итгэлцэл (optional)
    """
    try:
        pair = request.args.get('pair', 'EUR_USD')
        limit = int(request.args.get('limit', 50))
        signal_type = request.args.get('signal_type')
        min_confidence = request.args.get('min_confidence')
        
        # Build query
        query = {'pair': pair}
        
        if signal_type:
            query['signal'] = signal_type
        
        if min_confidence:
            query['confidence'] = {'$gte': float(min_confidence)}
        
        # Get signals sorted by created_at (newest first)
        signals = list(signals_collection.find(query)
                      .sort('created_at', -1)
                      .limit(limit))
        
        # Convert ObjectId to string and datetime to ISO string
        for sig in signals:
            sig['_id'] = str(sig['_id'])
            if sig.get('created_at'):
                sig['created_at'] = sig['created_at'].isoformat()
        
        return jsonify({
            'success': True,
            'count': len(signals),
            'signals': signals
        })
        
    except Exception as e:
        print(f"Signal history алдаа: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/signals/stats', methods=['GET'])
def get_signals_stats():
    """
    Таамгийн статистик
    """
    try:
        pair = request.args.get('pair', 'EUR_USD')
        
        # Count by signal type
        buy_count = signals_collection.count_documents({'pair': pair, 'signal': 'BUY'})
        sell_count = signals_collection.count_documents({'pair': pair, 'signal': 'SELL'})
        hold_count = signals_collection.count_documents({'pair': pair, 'signal': 'HOLD'})
        total_count = buy_count + sell_count + hold_count
        
        # Average confidence
        pipeline = [
            {'$match': {'pair': pair}},
            {'$group': {
                '_id': None,
                'avg_confidence': {'$avg': '$confidence'},
                'max_confidence': {'$max': '$confidence'},
                'min_confidence': {'$min': '$confidence'}
            }}
        ]
        
        stats_result = list(signals_collection.aggregate(pipeline))
        avg_stats = stats_result[0] if stats_result else {}
        
        # Last signal
        last_signal = signals_collection.find_one(
            {'pair': pair},
            sort=[('created_at', -1)]
        )
        
        if last_signal:
            last_signal['_id'] = str(last_signal['_id'])
            if last_signal.get('created_at'):
                last_signal['created_at'] = last_signal['created_at'].isoformat()
        
        return jsonify({
            'success': True,
            'pair': pair,
            'stats': {
                'total_signals': total_count,
                'buy_count': buy_count,
                'sell_count': sell_count,
                'hold_count': hold_count,
                'avg_confidence': round(avg_stats.get('avg_confidence', 0), 2),
                'max_confidence': round(avg_stats.get('max_confidence', 0), 2),
                'min_confidence': round(avg_stats.get('min_confidence', 0), 2)
            },
            'last_signal': last_signal
        })
        
    except Exception as e:
        print(f"Signal stats алдаа: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ==================== NEWS & AI ANALYSIS ====================

@app.route('/api/news', methods=['GET'])
def get_news():
    """Мэдээний жагсаалт авах (History, Upcoming, Outlook) - Cached"""
    try:
        news_type = request.args.get('type', 'latest')
        
        # Determine cache key
        cache_key = 'latest'
        if news_type in ['history', 'upcoming', 'outlook']:
            cache_key = news_type
            
        # Try to get from cache
        cached_data = news_cache.get(cache_key)
        
        if cached_data:
            return jsonify({
                "status": "success",
                "data": cached_data,
                "cached": True
            }), 200
            
        # Fallback to direct fetch if cache is empty
        if news_type == 'history':
            data = market_analyst.get_news_history()
        elif news_type == 'upcoming':
            data = market_analyst.get_upcoming_news()
        elif news_type == 'outlook':
            data = market_analyst.get_market_outlook()
        else:
            # Default to latest
            data = market_analyst.get_latest_news()
        
        return jsonify({
            "status": "success",
            "data": data,
            "cached": False
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/news/analyze', methods=['POST'])
def analyze_news_event():
    """Specific news event analysis using AI"""
    try:
        event_data = request.json
        if not event_data:
            return jsonify({"status": "error", "message": "No data provided"}), 400
            
        analysis = market_analyst.analyze_specific_event(event_data)
        
        return jsonify({
            "status": "success",
            "analysis": analysis
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

import traceback

@app.route('/api/market-analysis', methods=['GET'])
def get_market_analysis():
    """AI зах зээлийн дүгнэлт авах"""
    try:
        pair = request.args.get('pair', 'EUR/USD')
        print(f"Analyzing pair: {pair}")
        
        mock_signal = {
            "signal": "NEUTRAL",
            "confidence": 50.0
        }
        
        if pair != "MARKET":
            # 1. Одоогийн ханш болон дохиог авах
            try:
                df = get_twelvedata_dataframe(symbol=pair, interval="15min", outputsize=100)
                
                if df is not None and not df.empty:
                    # Simple trend check for demo
                    close = df['close'].iloc[-1]
                    open_p = df['open'].iloc[-1]
                    mock_signal["signal"] = "BUY" if close > open_p else "SELL"
                    mock_signal["confidence"] = 75.0
            except Exception as e:
                print(f"Error fetching data for {pair}: {e}")
                traceback.print_exc()
                # Continue with mock signal if data fetch fails
        
        insight = market_analyst.generate_ai_insight(mock_signal, pair=pair)
        
        return jsonify({
            "status": "success",
            "data": insight
        }), 200
    except Exception as e:
        print(f"Error in analysis: {e}")
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


# ==================== HEALTH CHECK ====================

@app.route('/health', methods=['GET'])
def health():
    try:
        client.server_info()
        user_count = users_collection.count_documents({})
        
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'users_count': user_count,
            'signal_generator': 'GBDT loaded' if (signal_generator and signal_generator.is_loaded) else 'not loaded',
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'name': 'Predictrix API',
        'version': '1.0',
        'model': 'GBDT (Multi-TF Ensemble)',
        'status': 'running',
        'endpoints': {
            'auth': ['/auth/register', '/auth/login', '/auth/verify-email', '/auth/me'],
            'notifications': ['/notifications/register', '/notifications/unregister', '/notifications/preferences', '/notifications/test'],
            'rates': ['/rates/live', '/rates/specific'],
            'signal': ['/signal', '/signal/demo', '/predict'],
            'system': ['/health']
        }
    })

# ==================== MAIN ====================

if __name__ == '__main__':
    PORT = 5000
    
    print("=" * 60)
    print("PREDICTRIX API v1.0")
    print("=" * 60)
    print(f"✓ MongoDB: Connected")
    print(f"✓ GBDT Signal Generator: {'Loaded (Multi-TF Ensemble)' if (signal_generator and signal_generator.is_loaded) else 'Not loaded'}")
    print(f"✓ Twelve Data API: Enabled")
    print(f"✓ Port: {PORT}")
    print(f"\n[+] API Endpoints:")
    print(f"  POST /auth/register, /auth/login")
    print(f"  GET  /rates/live, /rates/specific")
    print(f"  GET  /signal, /signal/demo")
    print(f"  POST /predict")
    print(f"  GET  /health")
    print("=" * 60)
    
    # Use waitress for production-ready server (more stable on Windows)
    from waitress import serve
    print(f"\n[+] Server starting with Waitress on http://0.0.0.0:{PORT}")
    serve(app, host='0.0.0.0', port=PORT, threads=4)
