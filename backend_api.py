# -*- coding: utf-8 -*-
"""
Форекс Сигнал Таамаглах Backend API
Flask ашиглан REST API үүсгэх
React Native аппликейшнаас дуудагдана
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import pickle
import os
from datetime import datetime, timedelta
import hashlib
import secrets
import json

app = Flask(__name__)
CORS(app)  # React Native-аас дуудаж болохоор CORS идэвхжүүлэх

# Модель ба scaler ачаалах
MODEL_PATH = 'models/hmm_forex_model.pkl'
SCALER_PATH = 'models/hmm_scaler.pkl'

# Глобал хувьсагчууд
model = None
scaler = None

# Хэрэглэгчдийн мэдээлэл хадгалах (JSON файлд)
USERS_FILE = 'users_data.json'
SESSIONS_FILE = 'sessions_data.json'

def load_users():
    """Хэрэглэгчдийн мэдээллийг ачаалах"""
    if os.path.exists(USERS_FILE):
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_users(users):
    """Хэрэглэгчдийн мэдээллийг хадгалах"""
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=2)

def load_sessions():
    """Session мэдээллийг ачаалах"""
    if os.path.exists(SESSIONS_FILE):
        with open(SESSIONS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_sessions(sessions):
    """Session мэдээллийг хадгалах"""
    with open(SESSIONS_FILE, 'w', encoding='utf-8') as f:
        json.dump(sessions, f, ensure_ascii=False, indent=2)

def hash_password(password):
    """Нууц үгийг hash хийх"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token():
    """Санамсаргүй token үүсгэх"""
    return secrets.token_urlsafe(32)

def verify_token(token):
    """Token шалгаж хэрэглэгчийн мэдээллийг буцаах"""
    sessions = load_sessions()
    if token in sessions:
        session = sessions[token]
        # Token хүчинтэй эсэхийг шалгах (24 цаг)
        expires_at = datetime.fromisoformat(session['expires_at'])
        if datetime.now() < expires_at:
            return session['email']
    return None

def load_models():
    """Модель ба scaler ачаалах"""
    global model, scaler
    
    try:
        with open(MODEL_PATH, 'rb') as f:
            model = pickle.load(f)
        
        with open(SCALER_PATH, 'rb') as f:
            scaler = pickle.load(f)
        
        print("✓ Модель амжилттай ачаалагдлаа")
        return True
    except Exception as e:
        print(f"✗ Модель ачаалах алдаа: {e}")
        return False

def calculate_features(df):
    """Техникийн шинж чанарууд тооцоолох"""
    df = df.copy()
    
    # Үнийн өөрчлөлт
    df['returns'] = df['close'].pct_change()
    
    # Volatility
    df['volatility'] = (df['high'] - df['low']) / df['close']
    
    # ATR
    df['true_range'] = np.maximum(
        df['high'] - df['low'],
        np.maximum(
            abs(df['high'] - df['close'].shift(1)),
            abs(df['low'] - df['close'].shift(1))
        )
    )
    df['atr'] = df['true_range'].rolling(window=14).mean()
    
    # Moving Averages
    df['ma_5'] = df['close'].rolling(window=5).mean()
    df['ma_20'] = df['close'].rolling(window=20).mean()
    df['ma_50'] = df['close'].rolling(window=50).mean()
    df['ma_cross'] = (df['ma_5'] - df['ma_20']) / df['close']
    
    # RSI
    delta = df['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['rsi'] = 100 - (100 / (1 + rs))
    
    # Volume өөрчлөлт
    df['volume_change'] = df['volume'].pct_change()
    
    # NaN устгах
    df.dropna(inplace=True)
    
    return df

@app.route('/')
def home():
    """API мэдээлэл"""
    return jsonify({
        'name': 'Forex Signal Prediction API',
        'version': '1.0',
        'status': 'active',
        'model_loaded': model is not None,
        'endpoints': {
            '/predict': 'POST - Форекс хөдөлгөөн таамаглах',
            '/predict_file': 'POST - CSV файлаас таамаглал хийх',
            '/model_info': 'GET - Моделийн мэдээлэл'
        }
    })

@app.route('/model_info', methods=['GET'])
def model_info():
    """Моделийн мэдээлэл харуулах"""
    if model is None:
        return jsonify({'error': 'Модель ачаалагдаагүй байна'}), 500
    
    return jsonify({
        'n_components': model.n_components,
        'covariance_type': model.covariance_type,
        'features': ['returns', 'volatility', 'atr', 'ma_cross', 'rsi', 'volume_change'],
        'labels': {
            '0': 'High volatility down',
            '1': 'Medium volatility down',
            '2': 'No trend',
            '3': 'Medium volatility up',
            '4': 'High volatility up'
        }
    })

@app.route('/predict', methods=['POST'])
def predict():
    """
    Шинэ OHLCV дата дээр таамаглал хийх
    
    Request body (JSON):
    {
        "data": [
            {"time": "2024-01-01 00:00", "open": 1.1000, "high": 1.1010, "low": 1.0990, "close": 1.1005, "volume": 1000},
            ...
        ]
    }
    """
    if model is None:
        return jsonify({'error': 'Модель ачаалагдаагүй байна'}), 500
    
    try:
        # JSON дата авах
        data = request.json.get('data')
        
        if not data or len(data) < 50:
            return jsonify({'error': 'Хангалттай дата байхгүй (хамгийн багадаа 50 мөр шаардлагатай)'}), 400
        
        # DataFrame үүсгэх
        df = pd.DataFrame(data)
        df['time'] = pd.to_datetime(df['time'])
        df.set_index('time', inplace=True)
        
        # Шинж чанарууд тооцоолох
        df = calculate_features(df)
        
        if len(df) == 0:
            return jsonify({'error': 'Шинж чанарууд тооцоолсны дараа дата хоосон байна'}), 400
        
        # Таамаглал хийх
        feature_columns = ['returns', 'volatility', 'atr', 'ma_cross', 'rsi', 'volume_change']
        X = scaler.transform(df[feature_columns].values)
        predictions = model.predict(X)
        
        # Ангилалын нэрс
        label_names = {
            0: 'High volatility down',
            1: 'Medium volatility down',
            2: 'No trend',
            3: 'Medium volatility up',
            4: 'High volatility up'
        }
        
        # Сүүлчийн таамаглал (хамгийн сүүлийн үр дүн)
        latest_prediction = int(predictions[-1])
        latest_trend = label_names[latest_prediction]
        
        # Магадлал тооцоолох (сүүлийн 20 мөрийн таамаглалын хуваарилалт)
        recent_predictions = predictions[-20:] if len(predictions) >= 20 else predictions
        probabilities = {}
        for label, name in label_names.items():
            count = np.sum(recent_predictions == label)
            probabilities[name] = float(count / len(recent_predictions) * 100)
        
        # Үр дүн буцаах
        result = {
            'success': True,
            'timestamp': datetime.now().isoformat(),
            'latest_prediction': {
                'label': latest_prediction,
                'trend': latest_trend,
                'confidence': probabilities[latest_trend]
            },
            'probabilities': probabilities,
            'recent_trends': [
                {
                    'label': int(p),
                    'trend': label_names[int(p)]
                }
                for p in predictions[-10:]  # Сүүлийн 10 таамаглал
            ],
            'data_points_analyzed': len(predictions)
        }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': f'Таамаглал хийх явцад алдаа гарлаа: {str(e)}'}), 500

@app.route('/predict_file', methods=['POST'])
def predict_file():
    """
    CSV файлаас дата уншиж таамаглал хийх
    
    Request body (JSON):
    {
        "file_path": "data/test/EUR_USD_test.csv"
    }
    """
    if model is None:
        return jsonify({'error': 'Модель ачаалагдаагүй байна'}), 500
    
    try:
        file_path = request.json.get('file_path')
        
        if not file_path or not os.path.exists(file_path):
            return jsonify({'error': 'Файл олдсонгүй'}), 400
        
        # Дата уншиж боловсруулах
        df = pd.read_csv(file_path)
        df.columns = ['time', 'open', 'high', 'low', 'close', 'volume']
        df['time'] = pd.to_datetime(df['time'])
        df.set_index('time', inplace=True)
        
        # Шинж чанарууд тооцоолох
        df = calculate_features(df)
        
        # Таамаглал хийх
        feature_columns = ['returns', 'volatility', 'atr', 'ma_cross', 'rsi', 'volume_change']
        X = scaler.transform(df[feature_columns].values)
        predictions = model.predict(X)
        
        # Ангилалын статистик
        label_names = {
            0: 'High volatility down',
            1: 'Medium volatility down',
            2: 'No trend',
            3: 'Medium volatility up',
            4: 'High volatility up'
        }
        
        statistics = {}
        for label, name in label_names.items():
            count = np.sum(predictions == label)
            statistics[name] = {
                'count': int(count),
                'percentage': float(count / len(predictions) * 100)
            }
        
        result = {
            'success': True,
            'file': os.path.basename(file_path),
            'total_predictions': len(predictions),
            'statistics': statistics,
            'latest_prediction': {
                'label': int(predictions[-1]),
                'trend': label_names[int(predictions[-1])]
            }
        }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': f'Файл боловсруулах явцад алдаа гарлаа: {str(e)}'}), 500

if __name__ == '__main__':
    print("="*60)
    print("ФОРЕКС СИГНАЛ ТААМАГЛАХ API")
    print("="*60)
    
    # Модель ачаалах
    if load_models():
        print("\n🚀 API эхэлж байна...")
        print("📡 Холбогдох хаяг: http://localhost:5000")
        print("\nEndpoints:")
        print("  GET  /           - API мэдээлэл")
        print("  GET  /model_info - Моделийн мэдээлэл")
        print("  POST /predict    - Таамаглал хийх")
        print("  POST /predict_file - Файлаас таамаглал")
        print("\n" + "="*60)
        
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        print("\n✗ Модель ачаалагдаагүй тул API эхэлж чадсангүй")
        print("  Эхлээд HMM_machine_learning.ipynb-г ажиллуулж модель сургаарай")
