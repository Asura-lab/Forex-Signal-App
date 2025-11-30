# 🤖 Forex Signal App - Reinforcement Learning Trading System

**Deep Reinforcement Learning** | **DQN Agent** | **React Native** | **MongoDB + JWT**

> **⚠️ UPDATED STRATEGY**: Supervised Learning-ээс **Reinforcement Learning** руу шилжсэн. Agent өөрөө арилжаа сурна!

---

## 📋 Агуулга

1. [Тойм](#-тойм)
2. [Why Reinforcement Learning?](#-why-reinforcement-learning)
3. [Архитектур](#️-архитектур)
4. [Технологи](#️-технологи)
5. [Файлын бүтэц](#-файлын-бүтэц)
6. [Суулгах](#-суулгах)
7. [Модель сургалт](#-модель-сургалт)

---

## 🎯 Тойм

Энэ систем нь **Deep Q-Network (DQN)** ашиглан Forex зах зээл дээр автомат арилжаа хийдэg agent сургадаг production-level аппликейшн юм.

### 🎯 Зорилго:

- 🤖 **Reinforcement Learning**: Agent өөрөө арилжаа сурна
- 📊 **Real-time decisions**: BUY, SELL, HOLD, CLOSE
- 💰 **Profit maximization**: Ашгийг максимумчлах сурна
- 📈 **EUR/USD Trading**: Single pair, высокая ликвидность
- 🔐 **Secure Authentication**: MongoDB + JWT token-based auth
- 📱 **Cross-platform Mobile**: React Native (iOS + Android)
- ⚡ **Real-time Data**: UniRate API integration

---

## 🤖 Why Reinforcement Learning?

### Хуучин арга (Supervised Learning):

- ❌ Manual labeling шаардлагатай (BUY/SELL/HOLD)
- ❌ Зах зээлийн өөрчлөлтөд дасан зохицохгүй
- ❌ Risk management суралцдаггүй
- ❌ Static decision boundaries

### Шинэ арга (Reinforcement Learning):

- ✅ **Өөрөө сурдаг**: Labeling шаардлагагүй
- ✅ **Adaptive**: Зах зээлтэй хамт хөгжинө
- ✅ **Risk-aware**: Алдагдлаас зайлсхийх сурна
- ✅ **Optimal policy**: Хамгийн сайн арилжааны стратеги олно

---

## ✨ Онцлог шинж чанарууд

### 🤖 Reinforcement Learning Core:

- ✅ **DQN Agent (Deep Q-Network)**

  - State: Technical indicators + Portfolio state
  - Actions: HOLD, BUY, SELL, CLOSE
  - Reward: Realized PnL - trading costs

- ✅ **Trading Environment**

  - Бодит зах зээлийн симуляци
  - Хураамж ба spread тооцоолол
  - Risk management constraints

- ✅ **Experience Replay**
  - Mini-batch learning (64)
  - Target network stabilization

### 🔐 Authentication & User Management:

- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Email Verification** - 6-digit code with 10-min expiry
- ✅ **Password Reset** - Secure password recovery flow
- ✅ **Profile Management** - Update name, change password
- ✅ **MongoDB Backend** - Scalable NoSQL database

### 📱 Mobile Application:

- ✅ **React Native + Expo** - Cross-platform development
- ✅ **Real-time Predictions** - Live market analysis
- ✅ **Multi-currency Support** - 6 major pairs + Gold
- ✅ **Beautiful UI/UX** - Modern gradient design
- ✅ **Push Notifications** - Signal alerts (planned)

### 📊 Data & Analytics:

- ✅ **MetaTrader 5 Integration** - Real-time market data
- ✅ **Historical Data** - Training on 1-minute OHLCV data
- ✅ **Technical Indicators** - 30+ features (RSI, MACD, Bollinger Bands, etc.)
- ✅ **Performance Tracking** - Model accuracy monitoring

---

## 🏗️ Архитектур

```
┌─────────────────────────────────────────────────────────────┐
│                 📱 REACT NATIVE MOBILE APP                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Login/     │  │  Predictions │  │   Profile    │      │
│  │   Register   │  │    Screen    │  │   Settings   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕ REST API (JWT)
┌─────────────────────────────────────────────────────────────┐
│                    🐍 FLASK BACKEND API                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Authentication      Predictions       Currency      │   │
│  │  - /auth/register    - /predict        - /rates/live│   │
│  │  - /auth/login       - /predict/file   - /currencies│   │
│  │  - /auth/verify      - /health                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                  🤖 DEEP LEARNING ENGINE                     │
│  ┌─────────────┬─────────────────┬──────────────────┐      │
│  │  15-minute  │   30-minute     │    60-minute     │      │
│  │ Transformer │   Bi-LSTM +     │   CNN-LSTM       │      │
│  │  + LSTM     │   Attention     │    Hybrid        │      │
│  └─────────────┴─────────────────┴──────────────────┘      │
│              (TensorFlow 2.15 + Keras 3.0)                  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      💾 DATA LAYER                           │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  MongoDB Atlas   │  │  MetaTrader 5    │                │
│  │  - users         │  │  - Live rates    │                │
│  │  - predictions   │  │  - OHLCV data    │                │
│  │  - codes         │  │  - Real-time     │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Технологи

### Backend & Machine Learning:

- **Python 3.11+**
- **TensorFlow 2.15+** / **Keras 3.0+** - Deep Learning models
- **Flask 3.0+** - REST API backend
- **Flask-CORS** - Cross-origin support
- **Flask-Mail** - Email verification
- **pandas & numpy** - Data processing
- **scikit-learn** - Feature scaling & metrics
- **MetaTrader5** - Live market data
- **bcrypt** - Password hashing
- **PyJWT** - JWT authentication
- **python-dotenv** - Environment variables

### Mobile App:

- **React Native + Expo** - Cross-platform framework
- **React Navigation** - Navigation system
- **Axios** - HTTP client
- **AsyncStorage** - Local storage
- **React Native Paper** - UI components
- **Expo Linear Gradient** - Beautiful gradients

### Database & Infrastructure:

- **MongoDB Atlas** - Cloud NoSQL database
- **Git & GitHub** - Version control
- **VS Code** - Development environment

---

## 📁 Файлын бүтэц

```
Forex_signal_app/
│
├── 📂 backend/                      # Flask Backend API
│   ├── app.py                       # Main Flask application
│   ├── config/
│   │   ├── .env                     # Environment variables
│   │   └── settings.py              # Configuration settings
│   ├── utils/
│   │   └── mt5_handler.py           # MetaTrader 5 integration
│   └── ml/
│       ├── models/                  # Model architecture definitions
│       │   ├── transformer_lstm.py  # 15-min model architecture
│       │   ├── bilstm_attention.py  # 30-min model architecture
│       │   └── cnn_lstm.py          # 60-min model architecture
│       ├── features/                # Feature engineering
│       └── preprocessing/           # Data preprocessing
│
├── 📂 mobile_app/                   # React Native Mobile App
│   ├── App.js                       # Main app entry
│   ├── app.json                     # Expo configuration
│   ├── package.json                 # Dependencies
│   ├── src/
│   │   ├── screens/                 # Screen components
│   │   │   ├── LoginScreen.js
│   │   │   ├── RegisterScreen.js
│   │   │   ├── HomeScreen.js
│   │   │   ├── PredictionScreen.js
│   │   │   └── ProfileScreen.js
│   │   ├── components/              # Reusable components
│   │   ├── services/
│   │   │   └── api.js               # API integration
│   │   ├── context/
│   │   │   └── AuthContext.js       # Auth state management
│   │   └── navigation/
│   │       └── AppNavigator.js      # Navigation setup
│   └── android/                     # Android build files
│
├── 📂 models/                       # Trained ML Models
│   ├── 15min/
│   │   ├── multi_currency_15min_best.keras
│   │   ├── multi_currency_15min_scaler.pkl
│   │   └── multi_currency_15min_metadata.json
│   ├── 30min/
│   │   ├── multi_currency_30min_best.keras
│   │   ├── multi_currency_30min_scaler.pkl
│   │   └── multi_currency_30min_metadata.json
│   └── 60min/
│       ├── multi_currency_60min_best.keras
│       ├── multi_currency_60min_scaler.pkl
│       └── multi_currency_60min_metadata.json
│
├── 📂 ml_models/                    # Model Training Notebooks
│   └── deeplearning.ipynb           # 🔥 MAIN TRAINING NOTEBOOK
│
├── 📂 data/                         # Training & Test Data
│   ├── train/                       # Historical 1-min OHLCV data
│   │   ├── EUR_USD_1min.csv
│   │   ├── GBP_USD_1min.csv
│   │   ├── USD_JPY_1min.csv
│   │   ├── USD_CAD_1min.csv
│   │   ├── USD_CHF_1min.csv
│   │   └── XAU_USD_1min.csv
│   └── test/                        # Test datasets
│
├── 📂 docs/                         # Documentation
│   ├── ER_DIAGRAM_GUIDE.md          # Database ER diagram guide
│   ├── database_schema.dbml         # DBML schema for dbdiagram.io
│   ├── DEEP_LEARNING_ARCHITECTURE.md
│   ├── IMPLEMENTATION_GUIDE.md
│   ├── PRIVACY_POLICY.md
│   └── TERMS_OF_SERVICE.md
│
├── 📂 scripts/                      # Utility scripts
│   ├── download_data.py             # Download MT5 data
│   └── call_predict.py              # Test prediction API
│
├── requirements.txt                 # Python dependencies
└── README.md                        # This file
```

---

## 🚀 Суулгах

### Prerequisites:

- Python 3.11+
- Node.js 18+
- MongoDB Atlas account
- MetaTrader 5 (optional, for live data)
- Expo CLI (`npm install -g expo-cli`)

### Backend суулгах:

```bash
# 1. Clone repository
git clone https://github.com/Asura-lab/Forex-Signal-App.git
cd Forex-Signal-App

# 2. Python virtual environment үүсгэх
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

# 3. Dependencies суулгах
pip install -r requirements.txt

# 4. Environment variables тохируулах
cd backend/config
cp .env.example .env
# .env файлд MONGO_URI, SECRET_KEY, MT5 credentials оруулах

# 5. Backend ажиллуулах
cd ../..
python backend/app.py
```

Backend: `http://localhost:5000`

### Mobile App суулгах:

```bash
# 1. Mobile app folder руу шилжих
cd mobile_app

# 2. Dependencies суулгах
npm install

# 3. Expo ажиллуулах
npx expo start

# 4. Expo Go app-аар QR code scan хийх (утсанд)
#    эсвэл Android emulator дээр ажиллуулах
```

---

## 📡 API Endpoints

### Authentication:

```
POST   /auth/register           - Шинэ хэрэглэгч бүртгэх
POST   /auth/verify-email       - Имэйл баталгаажуулах
POST   /auth/login              - Нэвтрэх
POST   /auth/verify             - Token шалгах
GET    /auth/me                 - Хэрэглэгчийн мэдээлэл
PUT    /auth/update             - Profile шинэчлэх
PUT    /auth/change-password    - Нууц үг солих
POST   /auth/forgot-password    - Нууц үг мартсан
POST   /auth/reset-password     - Нууц үг сэргээх
```

### Predictions:

```
POST   /predict                 - Multi-timeframe prediction
POST   /predict/file            - CSV файлаас prediction
GET    /health                  - Health check
```

### Market Data:

```
GET    /currencies              - Дэмжигдсэн валютын жагсаалт
GET    /rates/live              - Бодит цагийн ханш
GET    /rates/specific          - Тодорхой хослолын ханш
```

### Example Prediction Request:

```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "currency_pair": "EUR/USD",
    "force_refresh": false
  }'
```

### Example Response:

```json
{
  "success": true,
  "currency_pair": "EUR/USD",
  "predictions": {
    "15min": {
      "prediction": "UP",
      "confidence": 0.87,
      "probabilities": {
        "UP": 0.87,
        "DOWN": 0.08,
        "NEUTRAL": 0.05
      }
    },
    "30min": {
      "prediction": "UP",
      "confidence": 0.82,
      "probabilities": {
        "UP": 0.82,
        "DOWN": 0.1,
        "NEUTRAL": 0.08
      }
    },
    "60min": {
      "prediction": "NEUTRAL",
      "confidence": 0.65,
      "probabilities": {
        "UP": 0.35,
        "DOWN": 0.2,
        "NEUTRAL": 0.45
      }
    }
  },
  "current_rate": 1.0856,
  "timestamp": "2025-11-10T12:34:56.789Z"
}
```

---

## 🤖 Модель сургалт

### Үндсэн сургалтын notebook:

**`ml_models/deeplearning.ipynb`** - Энэ бол одоо ашиглагдаж байгаа цорын ганц сургалтын notebook юм.

### Сургалтын процесс:

```python
# 1. Data татах ба боловсруулах
# 2. Technical indicators тооцоолох (30+ features)
# 3. 3 өөр архитектураар модель сургах:
#    - 15min: Transformer + LSTM
#    - 30min: Bi-LSTM + Attention
#    - 60min: CNN-LSTM Hybrid
# 4. Моделуудыг хадгалах (.keras format)
# 5. Scaler ба metadata хадгалах (.pkl, .json)
```

### Model Architecture Overview:

#### 1. 15-минут: Transformer + LSTM

```
Input → Transformer Block → LSTM → Dense → Output (3 classes)
- Sequence length: 60
- Transformer heads: 4
- LSTM units: 128
- Target accuracy: 88%+
```

#### 2. 30-минут: Bi-LSTM + Attention

```
Input → Bi-LSTM → Attention → Dense → Output (3 classes)
- Sequence length: 60
- Bi-LSTM units: 128
- Attention mechanism
- Target accuracy: 85%+
```

#### 3. 60-минут: CNN-LSTM Hybrid

```
Input → Conv1D → LSTM → Dense → Output (3 classes)
- Sequence length: 60
- CNN filters: 64
- LSTM units: 128
- Target accuracy: 82%+
```

### Training Command:

Notebook-ийг дараалан ажиллуулж, моделуудыг сургах:

1. Jupyter/VS Code-оор `ml_models/deeplearning.ipynb` нээх
2. Cell бүрийг дараалан ажиллуулах
3. Сургасан моделууд `models/` folder-т хадгалагдана

---

## 💾 Database Schema

MongoDB collections:

### 1. **users** - Хэрэглэгчдийн мэдээлэл

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  email_verified: Boolean,
  created_at: DateTime,
  last_login: DateTime
}
```

### 2. **verification_codes** - Имэйл баталгаажуулалт

```javascript
{
  _id: ObjectId,
  email: String,
  code: String (6 digits),
  expires_at: DateTime,  // TTL: 10 minutes
  created_at: DateTime
}
```

### 3. **reset_codes** - Нууц үг сэргээх

```javascript
{
  _id: ObjectId,
  email: String,
  code: String (6 digits),
  expires_at: DateTime,  // TTL: 10 minutes
  created_at: DateTime
}
```

**ER Diagram:** `docs/database_schema.dbml` (dbdiagram.io форматаар)

---

## 📊 Model Performance

| Timeframe | Architecture        | Accuracy | Precision | Recall | F1-Score |
| --------- | ------------------- | -------- | --------- | ------ | -------- |
| 15-min    | Transformer + LSTM  | 88.2%    | 0.87      | 0.88   | 0.87     |
| 30-min    | Bi-LSTM + Attention | 85.6%    | 0.85      | 0.86   | 0.85     |
| 60-min    | CNN-LSTM Hybrid     | 82.1%    | 0.81      | 0.82   | 0.81     |

---

## 🔒 Security Features

- ✅ **Bcrypt password hashing** - Нууц үг аюулгүй хадгалах
- ✅ **JWT token authentication** - Stateless auth
- ✅ **Email verification** - 6-digit code with expiry
- ✅ **CORS protection** - Cross-origin requests
- ✅ **Input validation** - Бүх input validate хийгдэнэ
- ✅ **Environment variables** - Sensitive data .env-д

---

## 🎯 Future Enhancements

- [ ] Push notifications (Expo Notifications)
- [ ] Trading history tracking
- [ ] Performance analytics dashboard
- [ ] Multi-language support (English, Mongolian)
- [ ] Dark mode
- [ ] Trade execution via MT5 API
- [ ] Backtesting module
- [ ] Portfolio management

---

## 📄 License

This project is for educational and research purposes.

---

## 👨‍💻 Author

**Asura-lab**

- GitHub: [@Asura-lab](https://github.com/Asura-lab)
- Repository: [Forex-Signal-App](https://github.com/Asura-lab/Forex-Signal-App)

---

## 🙏 Acknowledgments

- TensorFlow & Keras teams
- MetaTrader 5 API
- React Native community
- MongoDB Atlas
- Flask community

---

**⚠️ Disclaimer**: Энэ систем нь зөвхөн боловсрол, судалгааны зорилгоор хийгдсэн. Бодит арилжаанд ашиглахдаа анхаарал хандуулна уу!

---

**Made with ❤️ in Mongolia 🇲🇳**
