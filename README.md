# 📈 Forex Signal App

**EUR/USD BUY Signal Generator** | **Ensemble ML** | **React Native** | **MongoDB + JWT**

> XGBoost + LightGBM + Random Forest ensemble ашиглан EUR/USD валютын хосын BUY дохио таамаглах систем

---

## 🎯 Тойм

Энэ систем нь **Ensemble Machine Learning** ашиглан Forex зах зээл дээр BUY дохио таамаглах production-level аппликейшн юм.

### Гол үзүүлэлтүүд:

| Confidence | Signals | Win Rate | Total Pips | Profit Factor |
|------------|---------|----------|------------|---------------|
| ≥75% | 279 | 48.4% | +937 | 1.76 |
| ≥80% | 105 | **61.9%** | +671 | **3.10** |
| ≥85% | 48 | 68.8% | +387 | 4.82 |
| ≥90% | 9 | 100.0% | +120 | ∞ |

### Онцлог:

- 🎯 **BUY-Only Strategy**: SELL сигнал хассан (28% accuracy), зөвхөн BUY (80% accuracy)
- 📊 **Ensemble Model**: XGBoost (40%) + LightGBM (35%) + Random Forest (25%)
- 📈 **70 Technical Indicators**: RSI, MACD, Bollinger, ATR, SMA, EMA гэх мэт
- 🔐 **JWT Authentication**: MongoDB + secure token-based auth
- 📱 **Mobile App**: React Native + Expo (iOS & Android)
- ⚡ **Real-time Data**: Twelve Data API integration

---

## 🏗️ Архитектур

```
┌─────────────────────────────────────────────────────────────┐
│                 📱 REACT NATIVE MOBILE APP                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Login/     │  │    Signal    │  │   Profile    │      │
│  │   Register   │  │    Screen    │  │   Settings   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕ REST API (JWT)
┌─────────────────────────────────────────────────────────────┐
│              🐍 FLASK + WAITRESS BACKEND                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Authentication      Signal V2         Market Data   │   │
│  │  - /auth/register    - /signal/v2      - /rates/live │   │
│  │  - /auth/login       - /signal/save    - /health     │   │
│  │  - /auth/me          - /signals/stats                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                  🤖 ENSEMBLE ML ENGINE                       │
│  ┌─────────────┬─────────────────┬──────────────────┐      │
│  │   XGBoost   │    LightGBM     │  Random Forest   │      │
│  │    (40%)    │      (35%)      │      (25%)       │      │
│  └─────────────┴─────────────────┴──────────────────┘      │
│              70 Technical Indicators                        │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      💾 DATA LAYER                           │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  MongoDB Atlas   │  │  Twelve Data API │                │
│  │  - users         │  │  - Live rates    │                │
│  │  - signals       │  │  - OHLCV data    │                │
│  │  - verification  │  │  - Real-time     │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Технологи

### Backend:
- **Python 3.11+**
- **Flask 3.0+** - REST API
- **Waitress** - Production WSGI server
- **XGBoost, LightGBM, scikit-learn** - ML models
- **pandas, numpy** - Data processing
- **PyJWT, bcrypt** - Authentication
- **pymongo** - MongoDB driver

### Mobile App:
- **React Native + Expo**
- **React Navigation**
- **Axios** - HTTP client
- **AsyncStorage** - Local storage

### Database & APIs:
- **MongoDB Atlas** - User data, signals
- **Twelve Data API** - Real-time forex data

---

## 📁 Файлын бүтэц

```
Forex-Signal-App/
│
├── 📂 backend/                    # Flask Backend API
│   ├── app.py                     # Main application (17 endpoints)
│   ├── config/
│   │   ├── .env                   # Environment variables
│   │   └── settings.py            # Configuration
│   ├── ml/
│   │   └── signal_generator_v2.py # V2 Signal Generator class
│   └── utils/
│       └── twelvedata_handler.py  # Twelve Data API integration
│
├── 📂 mobile_app/                 # React Native Mobile App
│   ├── App.js                     # Main entry
│   ├── src/
│   │   ├── screens/               # LoginScreen, SignalScreen, etc.
│   │   ├── components/            # Reusable UI components
│   │   ├── services/api.js        # API integration
│   │   └── context/AuthContext.js # Auth state management
│   └── android/                   # Android build files
│
├── 📂 models/                     # Trained ML Models
│   └── signal_generator_v2/
│       ├── xgboost_v2.joblib      # XGBoost model
│       ├── lightgbm_v2.joblib     # LightGBM model
│       ├── rf_v2.joblib           # Random Forest model
│       ├── scaler_v2.joblib       # StandardScaler
│       └── feature_cols_v2.joblib # Feature columns
│
├── 📂 data/                       # Training Data
│   ├── EUR_USD_1min.csv           # Train: 1,859,492 rows (2019-2024)
│   └── EUR_USD_test.csv           # Test: 296,778 rows (2024-2025)
│
├── 📂 docs/                       # Documentation
│   └── *.md                       # Various docs
│
├── 📂 diplom/                     # Diploma thesis (LaTeX)
│
├── forex_signal_v2.ipynb          # 🔥 Model training notebook
├── requirements.txt               # Python dependencies
└── README.md                      # This file
```

---

## 🚀 Суулгах

### Backend:

```bash
# 1. Clone
git clone https://github.com/Asura-lab/Forex-Signal-App.git
cd Forex-Signal-App

# 2. Virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows

# 3. Dependencies
pip install -r requirements.txt

# 4. Environment variables
# backend/config/.env файлд:
# MONGO_URI=mongodb+srv://...
# SECRET_KEY=your-secret-key
# TWELVEDATA_API_KEY=your-api-key

# 5. Run
python backend/app.py
```

Backend: `http://localhost:5000`

### Mobile App:

```bash
cd mobile_app
npm install
npx expo start
```

---

## 📡 API Endpoints

### Authentication:
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Бүртгүүлэх |
| POST | `/auth/verify-email` | Имэйл баталгаажуулах |
| POST | `/auth/login` | Нэвтрэх |
| GET | `/auth/me` | Хэрэглэгчийн мэдээлэл |
| POST | `/auth/forgot-password` | Нууц үг мартсан |
| POST | `/auth/reset-password` | Нууц үг сэргээх |

### Signal:
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/signal/v2` | BUY сигнал авах |
| GET | `/signal/v2/demo` | Demo сигнал |
| POST | `/signal/save` | Сигнал хадгалах |
| GET | `/signals/history` | Сигналын түүх |
| GET | `/signals/stats` | Статистик |

### Market Data:
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/rates/live` | Бодит цагийн ханш |
| GET | `/health` | Health check |

### Example Request:

```bash
curl "http://localhost:5000/signal/v2?min_confidence=80"
```

### Example Response:

```json
{
  "success": true,
  "signal": "BUY",
  "confidence": 85.2,
  "entry_price": 1.08234,
  "stop_loss": 1.08134,
  "take_profit": 1.08434,
  "sl_pips": 10.0,
  "tp_pips": 20.0,
  "risk_reward": "1:2.0",
  "atr_pips": 8.5,
  "models_agree": true,
  "model_probs": {
    "xgboost": 87.3,
    "lightgbm": 84.1,
    "random_forest": 82.5
  }
}
```

---

## 🤖 Model Training

### Notebook: `forex_signal_v2.ipynb`

```python
# 1. Data: 2+ million rows EUR/USD 1-min
# 2. Features: 70 technical indicators
# 3. Labels: BUY vs NOT_BUY (binary)
# 4. Models: XGBoost, LightGBM, Random Forest
# 5. Ensemble: Weighted average (40%, 35%, 25%)
# 6. Backtest: 61.9% WR at 80% confidence
```

### Dynamic SL/TP (ATR-based):
- **Stop Loss**: 1.5 × ATR (10-20 pips)
- **Take Profit**: 2.5 × ATR (20-40 pips)
- **Risk:Reward**: 1:1.5 - 1:2

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| Training Data | 1,859,492 rows |
| Test Data | 296,778 rows |
| Features | 70 |
| Win Rate (80%+ conf) | 61.9% |
| Profit Factor | 3.10 |
| Signals/day | ~1.9 |

---

## 🔒 Security

- ✅ Bcrypt password hashing
- ✅ JWT token authentication
- ✅ Email verification (6-digit code)
- ✅ CORS protection
- ✅ Environment variables for secrets

---

## 📄 License

Educational and research purposes only.

---

## 👨‍💻 Author

**Asura-lab**
- GitHub: [@Asura-lab](https://github.com/Asura-lab)

---

**⚠️ Disclaimer**: Энэ систем нь зөвхөн боловсрол, судалгааны зорилгоор хийгдсэн. Бодит арилжаанд ашиглахдаа өөрийн эрсдэлээр хэрэглэнэ үү!

---

**Made with ❤️ in Mongolia 🇲🇳**
