# -*- coding: utf-8 -*-
"""
Форекс Сигнал Full Backend API
MongoDB + JWT Authentication + Multi-Timeframe Deep Learning Prediction ONLY
"""

import sys
from pathlib import Path

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

if MAIL_USERNAME and MAIL_PASSWORD:
    masked_email = MAIL_USERNAME[:3] + "***@" + MAIL_USERNAME.split('@')[1] if '@' in MAIL_USERNAME else "***"
    print(f"✓ Имэйл тохиргоо: {masked_email}")
else:
    print("⚠️ АНХААРУУЛГА: Имэйл тохиргоо хийгдээгүй байна!")

mail = Mail(app)

# ==================== DATABASE SETUP ====================

try:
    client = MongoClient(MONGO_URI)
    db = client['users_db']
    users_collection = db['users']
    verification_codes = db['verification_codes']
    reset_codes = db['reset_codes']
    print("✓ MongoDB холбогдлоо")
except Exception as e:
    print(f"✗ MongoDB холбогдох алдаа: {e}")
    exit(1)

# ==================== MULTI-TIMEFRAME MODELS ONLY ====================

models_multi_timeframe = {
    '15min': {'model': None, 'scaler': None, 'encoder': None, 'metadata': None},
    '30min': {'model': None, 'scaler': None, 'encoder': None, 'metadata': None},
    '60min': {'model': None, 'scaler': None, 'encoder': None, 'metadata': None}
}

# Prediction Cache
prediction_cache = {}
prediction_cache_time = {}
PREDICTION_CACHE_DURATION = 300  # 5 минут

def load_multi_timeframe_models():
    """15, 30, 60 минутын Deep Learning моделуудыг ачаалах"""
    global models_multi_timeframe
    
    try:
        import tensorflow as tf
        from tensorflow import keras
        import json
        print("\n🤖 Multi-Timeframe моделуудыг ачаалж байна...")
        try:
            print(f"🔎 TensorFlow version: {tf.__version__}")
            # keras may be the standalone package or tf.keras forwarding
            try:
                import importlib
                k_mod = importlib.import_module('keras')
                k_ver = getattr(k_mod, '__version__', None)
                print(f"🔎 Keras module: {k_mod.__name__}, version: {k_ver}")
            except Exception:
                # fallback to tf.keras
                print(f"🔎 Keras via tensorflow.keras, version: {getattr(keras, '__version__', 'unknown')}")
        except Exception:
            pass
        # Try to import model definitions that contain custom layers so they are
        # registered with Keras' serialization system before we call load_model.
        # This ensures classes like `TransformerBlock` are available.
        custom_objects = {}
        try:
            # Import the module where TransformerBlock (and any other custom
            # layers) live. Importing registers them because the file decorates
            # classes with keras.saving.register_keras_serializable.
            import importlib
            transformer_mod = importlib.import_module('backend.ml.models.transformer_lstm')
            # If the module exposes the TransformerBlock, add it to custom_objects
            if hasattr(transformer_mod, 'TransformerBlock'):
                custom_objects['TransformerBlock'] = getattr(transformer_mod, 'TransformerBlock')
        except Exception:
            # If import fails, continue — load_model will raise a helpful error.
            transformer_mod = None
    except ImportError as e:
        print(f"⚠ TensorFlow суулгагдаагүй байна: {e}")
        return False
    
    success_count = 0
    
    for timeframe in ['15min', '30min', '60min']:
        try:
            model_dir = MODELS_DIR / timeframe
            
            model_path = model_dir / f'multi_currency_{timeframe}_best.keras'
            scaler_path = model_dir / f'multi_currency_{timeframe}_scaler.pkl'
            encoder_path = model_dir / f'multi_currency_{timeframe}_encoder.pkl'
            metadata_path = model_dir / f'multi_currency_{timeframe}_metadata.json'
            
            if not model_path.exists():
                print(f"⚠ {timeframe} модель олдсонгүй: {model_path}")
                continue
            
            try:
                # Pass any discovered custom objects (e.g., TransformerBlock)
                loaded_model = keras.models.load_model(
                    str(model_path), compile=False, custom_objects=custom_objects
                )
                models_multi_timeframe[timeframe]['model'] = loaded_model
                print(f"✓ {timeframe} .keras модель амжилттай ачааллаа")
            except Exception as load_err:
                # Print more diagnostics and traceback to help debugging format/version issues
                import traceback
                print(f"⚠ {timeframe} .keras модель ачааллахад алдаа: {load_err}")
                traceback.print_exc()
                print("ℹ Suggestion: this error often means the model file format or Keras/TensorFlow versions are incompatible.\n" \
                      "If you have a standalone `keras` package installed, try removing it so `tf.keras` is used, or use a Python environment matching the versions used to save the models.\n" \
                      "You can also re-export the model in SavedModel format and place it under the *_saved_model directory as a fallback.")
                saved_model_dir = model_dir / f'multi_currency_{timeframe}_saved_model'
                if saved_model_dir.exists():
                    try:
                        loaded_model = keras.models.load_model(str(saved_model_dir))
                        models_multi_timeframe[timeframe]['model'] = loaded_model
                        print(f"✓ {timeframe} SavedModel форматаар амжилттай ачааллаа")
                    except Exception as saved_err:
                        print(f"✗ {timeframe} SavedModel ачаалах алдаа: {saved_err}")
                        continue
                else:
                    print(f"✗ {timeframe} модель ачаалагдсангүй")
                    continue
            
            def safe_load_pickle(path_obj):
                """Try to load a scaler/encoder file robustly and return (obj, error_message).
                Tries pickle.load, joblib.load (if available), and gzip+pickle as fallbacks.
                Logs file size and header bytes to help debugging corrupted/incorrect formats.
                """
                try:
                    p = Path(path_obj)
                    sz = p.stat().st_size
                    with open(p, 'rb') as fh:
                        head = fh.read(16)
                    head_hex = ' '.join([f"{b:02x}" for b in head])
                except Exception as e:
                    return None, f"Could not read file header: {e}"

                # Try pickle
                try:
                    with open(path_obj, 'rb') as f:
                        obj = pickle.load(f)
                    return obj, None
                except Exception as e_pickle:
                    pickle_err = str(e_pickle)

                # Try joblib if available
                try:
                    import joblib
                    try:
                        obj = joblib.load(path_obj)
                        return obj, None
                    except Exception as e_joblib:
                        joblib_err = str(e_joblib)
                except Exception:
                    joblib_err = 'joblib not available'

                # Try gzip + pickle
                try:
                    import gzip
                    with gzip.open(path_obj, 'rb') as gf:
                        obj = pickle.load(gf)
                    return obj, None
                except Exception as e_gzip:
                    gzip_err = str(e_gzip)

                # If reached here, all attempts failed — return combined message with header info
                err_msg = (
                    f"failed to load (size={sz} bytes, header={head_hex}). "
                    f"pickle_err={pickle_err}; joblib_err={joblib_err}; gzip_err={gzip_err}"
                )
                return None, err_msg

            # Load scaler with robust loader and log helpful diagnostics on failure
            if scaler_path.exists():
                obj, err = safe_load_pickle(scaler_path)
                if err:
                    print(f"⚠ {timeframe} scaler load failed: {err}")
                    models_multi_timeframe[timeframe]['scaler'] = None
                else:
                    models_multi_timeframe[timeframe]['scaler'] = obj

            # Load encoder with robust loader
            if encoder_path.exists():
                obj, err = safe_load_pickle(encoder_path)
                if err:
                    print(f"⚠ {timeframe} encoder load failed: {err}")
                    models_multi_timeframe[timeframe]['encoder'] = None
                else:
                    models_multi_timeframe[timeframe]['encoder'] = obj
            
            if metadata_path.exists():
                with open(metadata_path, 'r', encoding='utf-8') as f:
                    models_multi_timeframe[timeframe]['metadata'] = json.load(f)
            
            success_count += 1
            print(f"✓ {timeframe} модель бүрэн ачаалагдлаа")
            
        except Exception as e:
            print(f"✗ {timeframe} модель ачаалах алдаа: {e}")
            continue
    
    if success_count > 0:
        print(f"✓ {success_count}/3 multi-timeframe модель бэлэн")
        return True
    else:
        print("✗ Multi-timeframe модель нэг ч ачаалагдсангүй")
        return False

# Load models on startup
load_multi_timeframe_models()

# ==================== MT5 INITIALIZATION ====================

if MT5_ENABLED:
    print("🔄 MT5 холболт эхлүүлж байна...")
    if initialize_mt5(MT5_LOGIN, MT5_PASSWORD, MT5_SERVER):
        print("✓ MT5 бэлэн болсон")
    else:
        print("⚠ MT5 холболт амжилтгүй")
else:
    print("ℹ MT5 идэвхгүй байна")

# ==================== AUTH HELPER FUNCTIONS ====================

def generate_verification_code():
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])

def send_verification_email(email, code, name=""):
    try:
        if not MAIL_USERNAME or not MAIL_PASSWORD:
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
        </div>
    </div>
</body>
</html>
"""
        mail.send(msg)
        return True
    except Exception as e:
        print(f"❌ Email error: {e}")
        return False

def send_reset_password_email(email, code, name=""):
    try:
        if not MAIL_USERNAME or not MAIL_PASSWORD:
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
            <p>Нууц үг сэргээх кодыг доор харна уу:</p>
            <div style="background-color: #fff3e0; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; border: 2px solid #1a237e;">
                <h1 style="color: #1a237e; font-size: 36px; letter-spacing: 8px; margin: 0;">{code}</h1>
            </div>
            <p style="color: #666; font-size: 14px;">⏱ Энэ код <strong>{RESET_CODE_EXPIRY_MINUTES} минутын</strong> хугацаанд хүчинтэй.</p>
        </div>
    </div>
</body>
</html>
"""
        mail.send(msg)
        return True
    except Exception as e:
        print(f"❌ Reset email error: {e}")
        return False

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

def verify_password(password, hashed):
    return bcrypt.checkpw(password.encode('utf-8'), hashed)

def generate_token(user_id, email):
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(days=7),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except:
        return None

def get_user_from_token(token):
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
    """Compute a rich set of technical features expected by the models.

    The model metadata expects ~33 features (sma/ema, rsi, macd, bb, atr,
    stochastic, volume metrics, momentum, pair_* one-hot placeholders, etc.).
    This helper computes those names (lowercase) so `feature_columns` from
    metadata match the DataFrame columns.
    """
    df = df.copy()

    # Basic returns
    df['returns'] = df['close'].pct_change()
    df['log_returns'] = np.log(df['close']).diff()

    # High/low/open/close ratios
    if 'high' in df.columns and 'low' in df.columns:
        df['hl_ratio'] = (df['high'] - df['low']) / df['close']
    else:
        df['hl_ratio'] = 0.0

    if 'open' in df.columns:
        df['co_ratio'] = (df['close'] - df['open']) / (df['open'].replace(0, np.nan))
    else:
        df['co_ratio'] = 0.0

    # Moving averages and EMAs
    df['sma_5'] = df['close'].rolling(window=5).mean()
    df['ema_5'] = df['close'].ewm(span=5, adjust=False).mean()
    df['sma_10'] = df['close'].rolling(window=10).mean()
    df['ema_10'] = df['close'].ewm(span=10, adjust=False).mean()
    df['sma_20'] = df['close'].rolling(window=20).mean()
    df['ema_20'] = df['close'].ewm(span=20, adjust=False).mean()
    df['sma_50'] = df['close'].rolling(window=50).mean()
    df['ema_50'] = df['close'].ewm(span=50, adjust=False).mean()

    # Volatility (rolling std)
    df['volatility'] = df['returns'].rolling(window=20).std()

    # RSI (14)
    delta = df['close'].diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)
    avg_gain = gain.rolling(window=14).mean()
    avg_loss = loss.rolling(window=14).mean()
    rs = avg_gain / avg_loss.replace(0, np.nan)
    df['rsi'] = 100 - (100 / (1 + rs))

    # MACD (12,26) and signal(9)
    ema12 = df['close'].ewm(span=12, adjust=False).mean()
    ema26 = df['close'].ewm(span=26, adjust=False).mean()
    df['macd'] = ema12 - ema26
    df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()
    df['macd_hist'] = df['macd'] - df['macd_signal']

    # Bollinger Bands (20, 2std)
    bb_mid = df['sma_20']
    bb_std = df['close'].rolling(window=20).std()
    df['bb_middle'] = bb_mid
    df['bb_upper'] = bb_mid + 2 * bb_std
    df['bb_lower'] = bb_mid - 2 * bb_std
    df['bb_width'] = (df['bb_upper'] - df['bb_lower']) / bb_mid.replace(0, np.nan)

    # ATR (14)
    if {'high', 'low', 'close'}.issubset(df.columns):
        high_low = df['high'] - df['low']
        high_close = (df['high'] - df['close'].shift()).abs()
        low_close = (df['low'] - df['close'].shift()).abs()
        tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        df['atr'] = tr.rolling(window=14).mean()
    else:
        df['atr'] = 0.0

    # Stochastic oscillator (14,3)
    if {'high', 'low', 'close'}.issubset(df.columns):
        low14 = df['low'].rolling(window=14).min()
        high14 = df['high'].rolling(window=14).max()
        df['stoch_k'] = 100 * (df['close'] - low14) / (high14 - low14).replace(0, np.nan)
        df['stoch_d'] = df['stoch_k'].rolling(window=3).mean()
    else:
        df['stoch_k'] = 0.0
        df['stoch_d'] = 0.0

    # Volume metrics
    vol_col = 'volume' if 'volume' in df.columns else ('tick_volume' if 'tick_volume' in df.columns else None)
    if vol_col:
        df['volume_sma'] = df[vol_col].rolling(window=20).mean()
        df['volume_ratio'] = df[vol_col] / df['volume_sma'].replace(0, np.nan)
    else:
        df['volume_sma'] = df['close'].rolling(window=20).std() * 1000
        df['volume_ratio'] = 0.0

    # Momentum and ROC
    df['momentum'] = df['close'].diff(3)
    df['roc'] = 100 * (df['close'] / df['close'].shift(10) - 1)

    # Pair one-hot placeholders: pair_0 .. pair_5 (default zeros). Models expect these columns.
    for i in range(6):
        col = f'pair_{i}'
        if col not in df.columns:
            df[col] = 0.0

    # If volume_ma existed previously, keep compatibility name
    if 'volume_sma' in df.columns and 'volume_ma' not in df.columns:
        df['volume_ma'] = df['volume_sma']

    # Drop rows with NaN produced by rolling calculations
    df = df.dropna()

    return df

# ==================== ROOT ENDPOINT ====================

@app.route('/')
def index():
    """API мэдээлэл"""
    return jsonify({
        'name': 'Форекс Сигнал Full API',
        'version': '3.0 - Multi-Timeframe Only',
        'database': 'MongoDB',
        'auth': 'JWT',
        'ml_models': {
            '15min': 'loaded' if models_multi_timeframe['15min']['model'] else 'not loaded',
            '30min': 'loaded' if models_multi_timeframe['30min']['model'] else 'not loaded',
            '60min': 'loaded' if models_multi_timeframe['60min']['model'] else 'not loaded'
        },
        'endpoints': {
            '/': 'GET - API мэдээлэл',
            '/auth/*': 'POST/GET/PUT - Authentication endpoints',
            '/predict': 'POST - Multi-timeframe prediction (15, 30, 60 min)',
            '/currencies': 'GET - Дэмжигдсэн валютын жагсаалт',
            '/rates/live': 'GET - Бодит цагийн валютын ханш',
            '/rates/specific': 'GET - Тодорхой хослолын ханш',
            '/health': 'GET - Health check'
        }
    })

# ==================== AUTHENTICATION ENDPOINTS ====================

@app.route('/auth/register', methods=['POST'])
def register():
    try:
        data = request.json
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not name or not email or not password:
            return jsonify({'success': False, 'error': 'Нэр, имэйл, нууц үг заавал шаардлагатай'}), 400
        
        if '@' not in email:
            return jsonify({'success': False, 'error': 'Зөв имэйл хаяг оруулна уу'}), 400
        
        if len(password) < 6:
            return jsonify({'success': False, 'error': 'Нууц үг дор хаяж 6 тэмдэгттэй байх ёстой'}), 400
        
        existing_user = users_collection.find_one({'email': email})
        if existing_user:
            return jsonify({'success': False, 'error': 'Энэ имэйл хаяг аль хэдийн бүртгэлтэй байна'}), 400
        
        verification_code = generate_verification_code()
        hashed_password = hash_password(password)
        
        verification_data = {
            'email': email,
            'name': name,
            'password': hashed_password,
            'code': verification_code,
            'expires_at': datetime.utcnow() + timedelta(minutes=VERIFICATION_CODE_EXPIRY_MINUTES),
            'created_at': datetime.utcnow()
        }
        
        verification_codes.delete_many({'email': email})
        verification_codes.insert_one(verification_data)
        
        email_sent = send_verification_email(email, verification_code, name)
        
        if not email_sent:
            return jsonify({'success': False, 'error': 'Имэйл илгээхэд алдаа гарлаа'}), 500
        
        return jsonify({
            'success': True,
            'email': email,
            'message': f'Баталгаажуулалтын код {email} хаяг руу илгээгдлээ'
        }), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'success': False, 'error': 'Имэйл болон нууц үг оруулна уу'}), 400
        
        user = users_collection.find_one({'email': email})
        
        if not user or not verify_password(password, user['password']):
            return jsonify({'success': False, 'error': 'Имэйл эсвэл нууц үг буруу байна'}), 401
        
        users_collection.update_one(
            {'_id': user['_id']},
            {'$set': {'last_login': datetime.utcnow()}}
        )
        
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
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/auth/verify-email', methods=['POST'])
def verify_email():
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        code = data.get('code', '').strip()
        
        if not email or not code:
            return jsonify({'success': False, 'error': 'Имэйл болон код шаардлагатай'}), 400
        
        verification = verification_codes.find_one({'email': email})
        
        if not verification:
            return jsonify({'success': False, 'error': 'Баталгаажуулалтын код олдсонгүй'}), 404
        
        if datetime.utcnow() > verification['expires_at']:
            verification_codes.delete_one({'email': email})
            return jsonify({'success': False, 'error': 'Баталгаажуулалтын код хугацаа дууссан'}), 400
        
        if verification['code'] != code:
            return jsonify({'success': False, 'error': 'Буруу код'}), 400
        
        is_existing_user = verification.get('is_existing_user', False)
        
        if is_existing_user:
            users_collection.update_one(
                {'email': email},
                {'$set': {
                    'email_verified': True,
                    'verified_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow()
                }}
            )
            user = users_collection.find_one({'email': email})
            user_id = str(user['_id'])
        else:
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
        
        verification_codes.delete_one({'email': email})
        token = generate_token(user_id, email)
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': user_id,
                'name': verification['name'] if not is_existing_user else users_collection.find_one({'email': email})['name'],
                'email': email
            },
            'message': 'Имэйл амжилттай баталгаажлаа'
        }), 200 if is_existing_user else 201
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/auth/resend-verification', methods=['POST'])
def resend_verification():
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        
        if not email:
            return jsonify({'success': False, 'error': 'Имэйл шаардлагатай'}), 400
        
        verification = verification_codes.find_one({'email': email})
        
        if verification:
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
                return jsonify({'success': False, 'error': 'Имэйл илгээхэд алдаа гарлаа'}), 500
            return jsonify({'success': True, 'message': 'Шинэ код илгээгдлээ'}), 200
        
        user = users_collection.find_one({'email': email})
        
        if not user:
            return jsonify({'success': False, 'error': 'Имэйл хаяг бүртгэлгүй байна'}), 404
        
        if user.get('email_verified', False):
            return jsonify({'success': False, 'error': 'Имэйл аль хэдийн баталгаажсан байна'}), 400
        
        new_code = generate_verification_code()
        verification_codes.delete_many({'email': email})
        verification_codes.insert_one({
            'email': email,
            'name': user['name'],
            'password': user['password'],
            'code': new_code,
            'expires_at': datetime.utcnow() + timedelta(minutes=VERIFICATION_CODE_EXPIRY_MINUTES),
            'created_at': datetime.utcnow(),
            'is_existing_user': True
        })
        
        email_sent = send_verification_email(email, new_code, user['name'])
        if not email_sent:
            return jsonify({'success': False, 'error': 'Имэйл илгээхэд алдаа гарлаа'}), 500
        
        return jsonify({'success': True, 'message': 'Баталгаажуулалтын код таны имэйл хаяг руу илгээгдлээ'}), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/auth/forgot-password', methods=['POST'])
def forgot_password():
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
            return jsonify({'success': False, 'error': 'Имэйл илгээхэд алдаа гарлаа'}), 500
        
        return jsonify({'success': True, 'message': 'Сэргээх код илгээгдлээ'}), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/auth/verify-reset-code', methods=['POST'])
def verify_reset_code():
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
            {'$set': {'password': hashed_password, 'updated_at': datetime.utcnow()}}
        )
        
        reset_codes.delete_one({'email': email})
        return jsonify({'success': True, 'message': 'Нууц үг амжилттай солигдлоо'}), 200
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/auth/verify', methods=['POST'])
def verify():
    try:
        data = request.json
        token = data.get('token', '')
        
        if not token:
            return jsonify({'success': False, 'error': 'Token шаардлагатай'}), 400
        
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
            return jsonify({'success': False, 'valid': False, 'error': 'Token буруу эсвэл хугацаа дууссан'}), 401
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/auth/me', methods=['GET'])
def get_me():
    try:
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'Authorization header шаардлагатай'}), 401
        
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
            return jsonify({'success': False, 'error': 'Token буруу эсвэл хугацаа дууссан'}), 401
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/auth/update', methods=['PUT'])
def update_profile():
    try:
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'Authorization header шаардлагатай'}), 401
        
        token = auth_header.split(' ')[1]
        payload = verify_token(token)
        
        if not payload:
            return jsonify({'success': False, 'error': 'Token буруу эсвэл хугацаа дууссан'}), 401
        
        data = request.json
        name = data.get('name', '').strip()
        
        if not name:
            return jsonify({'success': False, 'error': 'Нэр шаардлагатай'}), 400
        
        users_collection.update_one(
            {'_id': payload['user_id']},
            {'$set': {'name': name, 'updated_at': datetime.utcnow()}}
        )
        
        return jsonify({'success': True, 'message': 'Мэдээлэл амжилттай шинэчлэгдлээ'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/auth/change-password', methods=['PUT'])
def change_password():
    try:
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'Authorization header шаардлагатай'}), 401
        
        token = auth_header.split(' ')[1]
        payload = verify_token(token)
        
        if not payload:
            return jsonify({'success': False, 'error': 'Token буруу эсвэл хугацаа дууссан'}), 401
        
        data = request.json
        old_password = data.get('oldPassword', '')
        new_password = data.get('newPassword', '')
        
        if not old_password or not new_password:
            return jsonify({'success': False, 'error': 'Хуучин болон шинэ нууц үг шаардлагатай'}), 400
        
        if len(new_password) < 6:
            return jsonify({'success': False, 'error': 'Шинэ нууц үг дор хаяж 6 тэмдэгттэй байх ёстой'}), 400
        
        user = users_collection.find_one({'_id': payload['user_id']})
        
        if not user:
            return jsonify({'success': False, 'error': 'Хэрэглэгч олдсонгүй'}), 404
        
        if not verify_password(old_password, user['password']):
            return jsonify({'success': False, 'error': 'Хуучин нууц үг буруу байна'}), 401
        
        new_hashed_password = hash_password(new_password)
        users_collection.update_one(
            {'_id': payload['user_id']},
            {'$set': {'password': new_hashed_password, 'updated_at': datetime.utcnow()}}
        )
        
        return jsonify({'success': True, 'message': 'Нууц үг амжилттай солигдлоо'})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== PREDICTION ENDPOINTS (MULTI-TIMEFRAME ONLY) ====================

@app.route('/predict_multi_timeframe', methods=['POST'])
@app.route('/predict/multi-timeframe', methods=['POST'])
@app.route('/predict', methods=['POST'])
def predict():
    """
    Multi-timeframe prediction - 15, 30, 60 минутын моделуудыг ашиглана
    
    Request body:
        {
            "currency_pair": "EUR/USD",
            "force_refresh": false (optional)
        }
    
    Response:
        {
            "success": true,
            "currency_pair": "EUR/USD",
            "predictions": {
                "15min": {...},
                "30min": {...},
                "60min": {...}
            },
            "timestamp": "2025-10-26T..."
        }
    """
    try:
        import tensorflow as tf
        
        data = request.json
        currency_pair = data.get('currency_pair', '').strip()
        force_refresh = data.get('force_refresh', False)
        
        if not currency_pair:
            return jsonify({'success': False, 'error': 'Валютын хослол шаардлагатай'}), 400
        
        # Normalize
        normalized_pair = currency_pair.replace('/', '_').upper()
        valid_pairs_normalized = [p.replace('/', '_') for p in CURRENCY_PAIRS]
        
        if normalized_pair not in valid_pairs_normalized:
            return jsonify({'success': False, 'error': f'Дэмжигдэхгүй валют: {currency_pair}'}), 400
        
        print(f"\n{'='*60}")
        print(f"🔮 MULTI-TIMEFRAME PREDICTION: {currency_pair}")
        print(f"{'='*60}")
        
        # Get data
        df = None
        data_source = 'FILE'
        
        # Fetch historical data
        mt5_symbol = normalized_pair.replace('_', '')
        if MT5_ENABLED and mt5_handler.connected:
            try:
                print(f"📊 MT5-аас өгөгдөл татаж байна...")
                df = mt5_handler.get_historical_data(mt5_symbol, 'M1', 5000)
                if df is not None and len(df) > 0:
                    data_source = 'MT5'
                    print(f"   ✓ MT5: {len(df)} bars")
            except Exception as e:
                print(f"   ⚠ MT5 алдаа: {e}")
        
        # Fallback to file
        if df is None or len(df) == 0:
            file_path = f"data/train/{normalized_pair}_1min.csv"
            try:
                full_path = Path(__file__).parent.parent / file_path
                if full_path.exists():
                    df = pd.read_csv(full_path)
                    data_source = 'FILE'
                    print(f"   ✓ FILE: {len(df)} rows")
                else:
                    file_path = f"data/test/{normalized_pair}_test.csv"
                    full_path = Path(__file__).parent.parent / file_path
                    if full_path.exists():
                        df = pd.read_csv(full_path)
                        data_source = 'FILE'
                        print(f"   ✓ FILE (test): {len(df)} rows")
            except Exception as e:
                return jsonify({'success': False, 'error': f'Өгөгдөл олдсонгүй: {str(e)}'}), 404
        
        if df is None or len(df) < 100:
            return jsonify({'success': False, 'error': 'Хангалтгүй өгөгдөл'}), 400
        
        # Calculate features
        df = calculate_features(df)
        
        # Predictions for each timeframe
        predictions = {}
        
        for timeframe in ['15min', '30min', '60min']:
            try:
                model_data = models_multi_timeframe[timeframe]
                
                if model_data['model'] is None:
                    predictions[timeframe] = {
                        'success': False,
                        'error': f'{timeframe} модель ачаалагдаагүй'
                    }
                    print(f"   ⚠ {timeframe}: модель байхгүй")
                    continue
                
                keras_model = model_data['model']
                scaler = model_data['scaler']
                encoder = model_data['encoder']
                metadata = model_data['metadata']
                
                # Get feature columns from metadata (preserve order)
                feature_cols = metadata['feature_columns'] if metadata else []

                # Ensure all expected feature columns exist in df (fill missing with 0s)
                for col in feature_cols:
                    if col not in df.columns:
                        df[col] = 0.0

                # Ensure pair one-hot columns reflect the current currency_pair
                try:
                    if metadata and 'pairs' in metadata and currency_pair in metadata['pairs']:
                        pair_idx = metadata['pairs'].index(currency_pair)
                        pair_col_name = f'pair_{pair_idx}'
                        df[pair_col_name] = 1.0
                except Exception:
                    pass

                # Get sequence length
                seq_length = metadata.get('sequence_length', 60) if metadata else 60

                # Use the ordered feature list for model input
                available_features = feature_cols
                
                # Get recent data
                recent_df = df.tail(seq_length + 10).copy()
                
                # Extract features
                X = recent_df[available_features].values
                X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)
                
                # Scale
                if scaler:
                    X_scaled = scaler.transform(X)
                else:
                    X_scaled = X
                
                # Create sequences
                if len(X_scaled) >= seq_length:
                    X_seq = X_scaled[-seq_length:]
                    X_seq = X_seq.reshape(1, seq_length, len(available_features))
                    
                    # Predict
                    y_pred = keras_model.predict(X_seq, verbose=0)

                    # Normalize outputs: many models return a list [direction, confidence]
                    try:
                        if isinstance(y_pred, (list, tuple)):
                            dir_out = np.array(y_pred[0])
                            conf_out = np.array(y_pred[1]) if len(y_pred) > 1 else None
                        else:
                            arr = np.array(y_pred)
                            # If model returned list-like with shape (1, n_classes)
                            dir_out = arr
                            conf_out = None

                        # direction probabilities as 1D array
                        if dir_out.ndim == 2 and dir_out.shape[0] == 1:
                            probs = dir_out[0]
                        else:
                            probs = dir_out.ravel()

                        predicted_class = int(np.argmax(probs))

                        if conf_out is not None:
                            if conf_out.ndim == 2 and conf_out.shape[0] == 1:
                                confidence = float(conf_out[0][0])
                            else:
                                confidence = float(np.array(conf_out).ravel()[0])
                        else:
                            confidence = float(probs[predicted_class])
                    except Exception as e:
                        # Fallback: try previous behavior but guard errors
                        try:
                            predicted_class = int(np.argmax(y_pred[0]))
                            confidence = float(np.array(y_pred[0]).ravel()[predicted_class])
                        except Exception:
                            predicted_class = int(np.argmax(y_pred))
                            confidence = float(np.array(y_pred).ravel()[predicted_class])
                    
                    # Decode signal
                    if encoder:
                        try:
                            signal_name = encoder.inverse_transform([predicted_class])[0]
                        except:
                            signal_name = ['STRONG_SELL', 'SELL', 'NEUTRAL', 'BUY', 'STRONG_BUY'][predicted_class % 5]
                    else:
                        signal_name = ['STRONG_SELL', 'SELL', 'NEUTRAL', 'BUY', 'STRONG_BUY'][predicted_class % 5]
                    
                    # Get current price
                    last_close = float(recent_df['close'].iloc[-1])
                    prev_close = float(recent_df['close'].iloc[-2])
                    price_change = ((last_close - prev_close) / prev_close) * 100
                    
                    predictions[timeframe] = {
                        'success': True,
                        'signal': int(predicted_class),
                        'signal_name': signal_name,
                        'confidence': float(f"{confidence:.4f}"),
                        'current_price': float(last_close),
                        'price_change_percent': float(f"{price_change:.4f}"),
                        'accuracy': metadata.get('weighted_accuracy', 0.0) if metadata else 0.0
                    }
                    
                    print(f"   ✓ {timeframe}: {signal_name} ({confidence:.2%})")
                else:
                    predictions[timeframe] = {
                        'success': False,
                        'error': f'Sequence хангалтгүй ({len(X_scaled)}/{seq_length})'
                    }
                    print(f"   ⚠ {timeframe}: sequence дутуу")
                    
            except Exception as e:
                print(f"   ✗ {timeframe} prediction error: {e}")
                import traceback
                traceback.print_exc()
                predictions[timeframe] = {
                    'success': False,
                    'error': str(e)
                }
        
        print(f"{'='*60}\n")
        
        return jsonify({
            'success': True,
            'currency_pair': currency_pair,
            'predictions': predictions,
            'data_source': data_source,
            'timestamp': datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        print(f"⚠ Multi-timeframe prediction error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/predict_file', methods=['POST'])
def predict_file():
    """Predict using a CSV file path provided in the request JSON.

    Expected JSON body:
      { "file_path": "data/test/EUR_USD_test.csv", "force_refresh": false }

    This handler loads the CSV, computes features and runs the same
    multi-timeframe prediction loop as `/predict`.
    """
    try:
        data = request.json or {}
        file_path = data.get('file_path', '').strip()
        force_refresh = data.get('force_refresh', False)

        if not file_path:
            return jsonify({'success': False, 'error': 'file_path шаардлагатай'}), 400

        # Resolve file relative to project root
        full_path = Path(__file__).parent.parent / file_path
        if not full_path.exists():
            return jsonify({'success': False, 'error': f'Файл олдсонгүй: {file_path}'}), 404

        try:
            df = pd.read_csv(full_path)
        except Exception as e:
            return jsonify({'success': False, 'error': f'CSV унших алдаа: {e}'}), 500

        if df is None or len(df) < 10:
            return jsonify({'success': False, 'error': 'Хангалтгүй өгөгдөл файлаас'}), 400

        # Attempt to infer currency_pair from filename if possible
        fname = Path(file_path).stem
        # Expected forms: EUR_USD_test or EUR_USD_1min
        inferred_pair = None
        parts = fname.split('_')
        if len(parts) >= 2:
            inferred_pair = f"{parts[0]}/{parts[1]}"

        currency_pair = inferred_pair or data.get('currency_pair', '')
        if not currency_pair:
            currency_pair = ''

        # Compute features
        df = calculate_features(df)

        # Now run the same per-timeframe prediction loop
        predictions = {}

        for timeframe in ['15min', '30min', '60min']:
            try:
                model_data = models_multi_timeframe[timeframe]

                if model_data['model'] is None:
                    predictions[timeframe] = {
                        'success': False,
                        'error': f'{timeframe} модель ачаалагдаагүй'
                    }
                    continue

                keras_model = model_data['model']
                scaler = model_data['scaler']
                encoder = model_data['encoder']
                metadata = model_data['metadata']

                feature_cols = metadata['feature_columns'] if metadata else []

                # Ensure all expected feature columns exist in df (fill missing with 0s)
                for col in feature_cols:
                    if col not in df.columns:
                        df[col] = 0.0

                # Ensure pair one-hot columns reflect the current currency_pair (if available)
                try:
                    if metadata and 'pairs' in metadata and currency_pair in metadata['pairs']:
                        pair_idx = metadata['pairs'].index(currency_pair)
                        pair_col_name = f'pair_{pair_idx}'
                        df[pair_col_name] = 1.0
                except Exception:
                    pass

                seq_length = metadata.get('sequence_length', 60) if metadata else 60

                available_features = feature_cols

                recent_df = df.tail(seq_length + 10).copy()
                X = recent_df[available_features].values
                X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)

                if scaler:
                    try:
                        X_scaled = scaler.transform(X)
                    except Exception:
                        X_scaled = X
                else:
                    X_scaled = X

                if len(X_scaled) >= seq_length:
                    X_seq = X_scaled[-seq_length:]
                    X_seq = X_seq.reshape(1, seq_length, len(available_features))

                    y_pred = keras_model.predict(X_seq, verbose=0)

                    # Normalize outputs for single- and multi-output models
                    try:
                        if isinstance(y_pred, (list, tuple)):
                            dir_out = np.array(y_pred[0])
                            conf_out = np.array(y_pred[1]) if len(y_pred) > 1 else None
                        else:
                            arr = np.array(y_pred)
                            dir_out = arr
                            conf_out = None

                        if dir_out.ndim == 2 and dir_out.shape[0] == 1:
                            probs = dir_out[0]
                        else:
                            probs = dir_out.ravel()

                        predicted_class = int(np.argmax(probs))

                        if conf_out is not None:
                            if conf_out.ndim == 2 and conf_out.shape[0] == 1:
                                confidence = float(conf_out[0][0])
                            else:
                                confidence = float(np.array(conf_out).ravel()[0])
                        else:
                            confidence = float(probs[predicted_class])
                    except Exception:
                        # Last-resort fallback
                        dir_probs = np.array(y_pred[0]) if isinstance(y_pred, (list, tuple)) else np.array(y_pred)
                        dir_probs = dir_probs.ravel()
                        predicted_class = int(np.argmax(dir_probs))
                        confidence = float(dir_probs[predicted_class])

                    if encoder:
                        try:
                            signal_name = encoder.inverse_transform([predicted_class])[0]
                        except Exception:
                            signal_name = ['STRONG_SELL', 'SELL', 'NEUTRAL', 'BUY', 'STRONG_BUY'][predicted_class % 5]
                    else:
                        signal_name = ['STRONG_SELL', 'SELL', 'NEUTRAL', 'BUY', 'STRONG_BUY'][predicted_class % 5]

                    last_close = float(recent_df['close'].iloc[-1]) if 'close' in recent_df.columns else float(recent_df.iloc[-1][available_features.index(available_features[0])])
                    prev_close = float(recent_df['close'].iloc[-2]) if 'close' in recent_df.columns else last_close
                    price_change = ((last_close - prev_close) / prev_close) * 100 if prev_close != 0 else 0.0

                    predictions[timeframe] = {
                        'success': True,
                        'signal': int(predicted_class),
                        'signal_name': signal_name,
                        'confidence': float(f"{confidence:.4f}"),
                        'current_price': float(last_close),
                        'price_change_percent': float(f"{price_change:.4f}"),
                        'accuracy': metadata.get('weighted_accuracy', 0.0) if metadata else 0.0
                    }
                else:
                    predictions[timeframe] = {
                        'success': False,
                        'error': f'Sequence хангалтгүй ({len(X_scaled)}/{seq_length})'
                    }

            except Exception as e:
                print(f"   ✗ {timeframe} prediction error (file): {e}")
                import traceback
                traceback.print_exc()
                predictions[timeframe] = {
                    'success': False,
                    'error': str(e)
                }

        return jsonify({'success': True, 'file_path': file_path, 'predictions': predictions}), 200

    except Exception as e:
        print(f"⚠ predict_file error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/currencies', methods=['GET'])
def get_currencies():
    """Дэмжигдсэн валютын жагсаалт"""
    return jsonify({
        'success': True,
        'currencies': CURRENCY_PAIRS,
        'count': len(CURRENCY_PAIRS)
    })

# ==================== LIVE RATES ENDPOINTS ====================

@app.route('/rates/live', methods=['GET'])
def get_live_rates():
    """
    Бодит цагийн валютын ханш авах (MT5)
    
    Query params:
        currencies: Optional comma-separated list
        source: 'mt5' (default)
    """
    try:
        currencies_param = request.args.get('currencies')
        
        currencies = None
        if currencies_param:
            currencies = [c.strip().upper() for c in currencies_param.split(',')]
        
        use_mt5 = MT5_ENABLED
        
        print(f"🔍 /rates/live: MT5_ENABLED={MT5_ENABLED}, connected={mt5_handler.connected if MT5_ENABLED else 'N/A'}")
        
        if use_mt5:
            try:
                print("📊 MT5-аас ханш татаж байна...")
                
                mt5_symbols = None
                if currencies:
                    mt5_symbols = []
                    for curr in currencies:
                        if curr != 'XAU':
                            mt5_symbols.append(f"{curr}USD")
                        else:
                            mt5_symbols.append('XAUUSD')
                else:
                    mt5_symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'USDCHF', 'XAUUSD']
                
                mt5_rates = get_mt5_live_rates(mt5_symbols)
                
                if mt5_rates:
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
                    return jsonify({'success': False, 'error': 'MT5-аас ханш татаж чадсангүй'}), 500
                    
            except Exception as mt5_error:
                print(f"   ⚠ MT5 алдаа: {mt5_error}")
                return jsonify({'success': False, 'error': f'MT5 алдаа: {str(mt5_error)}'}), 500
        
        return jsonify({'success': False, 'error': 'MT5 идэвхгүй байна'}), 503
        
    except Exception as e:
        print(f"❌ Get live rates error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/rates/specific', methods=['GET'])
def get_specific_rate():
    """
    Тодорхой валютын хослолын ханш авах
    
    Query params:
        pair: Currency pair (e.g., ?pair=EUR_USD or ?pair=EUR/USD)
        source: 'mt5' (default)
    """
    try:
        pair = request.args.get('pair', '').upper()
        
        print(f"💱 Get specific rate хүсэлт: {pair}")
        
        if not pair:
            return jsonify({'success': False, 'error': 'Валютын хослол заавал шаардлагатай'}), 400
        
        normalized_pair = pair.replace('/', '_')
        
        if normalized_pair not in CURRENCY_PAIRS:
            return jsonify({'success': False, 'error': f'"{pair}" дэмжигдэхгүй'}), 400
        
        pair = normalized_pair
        use_mt5 = MT5_ENABLED
        
        if use_mt5:
            try:
                print(f"📊 MT5-аас {pair} ханш татаж байна...")
                
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
                    print(f"   ⚠ MT5 {pair} ханш олдсонгүй")
                    
            except Exception as mt5_error:
                print(f"   ⚠ MT5 алдаа: {mt5_error}")
        
        return jsonify({'success': False, 'error': 'MT5 идэвхгүй байна'}), 503
        
    except Exception as e:
        print(f"❌ Get specific rate error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/rates/mt5/historical', methods=['GET'])
def get_mt5_historical():
    """Return MT5 historical rates for a given symbol and timeframe.

    Query params:
      symbol: e.g., EURUSD
      timeframe: M1, M5, M15, M30, H1, etc. (default M1)
      count: number of bars (default 100)
    """
    try:
        symbol = request.args.get('symbol', '').strip()
        timeframe = request.args.get('timeframe', 'M1').strip()
        count = int(request.args.get('count', 100))

        if not symbol:
            return jsonify({'success': False, 'error': 'symbol параметр шаардлагатай'}), 400

        if not MT5_ENABLED or not mt5_handler.connected:
            return jsonify({'success': False, 'error': 'MT5 идэвхгүй байна'}), 503

        try:
            df = mt5_handler.get_historical_data(symbol, timeframe, count)
        except Exception as e:
            return jsonify({'success': False, 'error': f'MT5 түүх татах алдаа: {e}'}), 500

        if df is None:
            return jsonify({'success': False, 'error': 'MT5 өгөгдөл олдсонгүй'}), 404

        # Convert DataFrame to serializable list
        data = []
        for _, row in df.iterrows():
            data.append({
                'time': str(row['time']),
                'open': float(row.get('open', row.get('open', 0))) if 'open' in row else None,
                'high': float(row.get('high', row.get('high', 0))) if 'high' in row else None,
                'low': float(row.get('low', row.get('low', 0))) if 'low' in row else None,
                'close': float(row.get('close', row.get('close', row.get('close', 0)))) if 'close' in row else None,
                'volume': float(row.get('tick_volume', row.get('volume', 0)))
            })

        return jsonify({'success': True, 'symbol': symbol, 'timeframe': timeframe, 'count': len(data), 'data': data}), 200

    except Exception as e:
        print(f"❌ get_mt5_historical error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/rates/mt5/status', methods=['GET'])
def get_mt5_status():
    """Return a simple MT5 connection/status check used by the mobile client.

    Mobile app expects GET /rates/mt5/status and currently receives 404.
    This endpoint mirrors the MT5 status field from /health but returns
    a compact JSON so the client can show connection status quickly.
    """
    try:
        enabled = bool(MT5_ENABLED)
        connected = bool(getattr(mt5_handler, 'connected', False)) if enabled else False
        status = 'connected' if (enabled and connected) else ('enabled_but_disconnected' if enabled else 'disabled')

        return jsonify({
            'success': True,
            'mt5_enabled': enabled,
            'mt5_connected': connected,
            'status': status
        }), 200
    except Exception as e:
        print(f"❌ get_mt5_status error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/rates/history', methods=['GET'])
def get_rate_history():
    """
    Ханшийн түүх авах
    
    Query params:
        pair: Currency pair
        limit: Хэдэн мөр авах (default: 20)
    """
    try:
        pair = request.args.get('pair', '').upper().replace('/', '_')
        limit = int(request.args.get('limit', 20))
        
        if not pair:
            return jsonify({'success': False, 'error': 'Pair параметр шаардлагатай'}), 400
        
        test_file = os.path.join(Path(__file__).parent.parent, 'data', 'test', f'{pair}_test.csv')
        
        if not os.path.exists(test_file):
            return jsonify({'success': False, 'error': f'{pair} өгөгдөл олдсонгүй'}), 404
        
        df = pd.read_csv(test_file)
        df = df.tail(limit)
        
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
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== HEALTH CHECK ====================

@app.route('/health', methods=['GET'])
def health():
    """Систем эрүүл эсэхийг шалгах"""
    try:
        client.server_info()
        user_count = users_collection.count_documents({})
        
        models_status = {
            '15min': 'loaded' if models_multi_timeframe['15min']['model'] else 'not loaded',
            '30min': 'loaded' if models_multi_timeframe['30min']['model'] else 'not loaded',
            '60min': 'loaded' if models_multi_timeframe['60min']['model'] else 'not loaded'
        }
        
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'users_count': user_count,
            'ml_models': models_status,
            'mt5_status': 'connected' if (MT5_ENABLED and mt5_handler.connected) else 'disabled',
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

# ==================== MAIN ====================

if __name__ == '__main__':
    PORT = 5000
    
    print("=" * 70)
    print("ФОРЕКС СИГНАЛ FULL API v3.0 - MULTI-TIMEFRAME ONLY")
    print("=" * 70)
    print(f"✓ MongoDB: Connected")
    print(f"✓ JWT Authentication: Enabled")
    print(f"✓ ML Models (Multi-Timeframe):")
    print(f"  - 15min: {'✓ Loaded' if models_multi_timeframe['15min']['model'] else '✗ Not loaded'}")
    print(f"  - 30min: {'✓ Loaded' if models_multi_timeframe['30min']['model'] else '✗ Not loaded'}")
    print(f"  - 60min: {'✓ Loaded' if models_multi_timeframe['60min']['model'] else '✗ Not loaded'}")
    print(f"✓ MT5: {'Connected' if (MT5_ENABLED and mt5_handler.connected) else 'Disabled'}")
    print(f"✓ Port: {PORT}")
    print(f"\n🚀 API эхэлж байна...")
    print(f"📡 Холбогдох хаяг: http://localhost:{PORT}")
    print(f"📱 Android Emulator: http://10.0.2.2:{PORT}")
    print(f"\n🔐 Authentication Endpoints:")
    print(f"  POST /auth/register")
    print(f"  POST /auth/login")
    print(f"  POST /auth/verify")
    print(f"  GET  /auth/me")
    print(f"\n🤖 Prediction Endpoint:")
    print(f"  POST /predict - Multi-timeframe (15, 30, 60 min)")
    print(f"\n💱 Live Rates Endpoints:")
    print(f"  GET  /rates/live")
    print(f"  GET  /rates/specific")
    print(f"\n📊 System:")
    print(f"  GET  /health")
    print(f"  GET  /")
    print("\n" + "=" * 70)
    
    app.run(debug=False, host=API_HOST, port=PORT, use_reloader=False, threaded=True)