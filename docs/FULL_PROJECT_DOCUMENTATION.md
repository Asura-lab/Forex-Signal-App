# 📊 Forex Signal App - Бүрэн Төслийн Баримт Бичиг

## 📑 Агуулга

1. [Төслийн Тойм](#төслийн-тойм)
2. [Технологийн Стек](#технологийн-стек)
3. [Системийн Архитектур](#системийн-архитектур)
4. [Өгөгдлийн Урсгал](#өгөгдлийн-урсгал)
5. [Backend Architecture](#backend-architecture)
6. [Mobile App Architecture](#mobile-app-architecture)
7. [Machine Learning Model](#machine-learning-model)
8. [MT5 Integration](#mt5-integration)
9. [API Endpoints](#api-endpoints)
10. [Database Schema](#database-schema)
11. [Security & Authentication](#security--authentication)
12. [Installation & Setup](#installation--setup)
13. [Deployment](#deployment)
14. [Troubleshooting](#troubleshooting)

---

## 🎯 Төслийн Тойм

### Танилцуулга

**Forex Signal App** нь форекс валютын хослолуудын ханшийн хөдөлгөөнийг машин сургалтын HMM (Hidden Markov Model) модель ашиглан таамаглаж, хэрэглэгчдэд бодит цагийн сигнал өгдөг мобайл аппликейшн юм.

### Үндсэн Онцлогууд

- ✅ **Бодит цагийн ханш**: MetaTrader 5 (MT5)-аас шууд бодит цагийн валютын ханш авах
- 🤖 **Machine Learning Таамаглал**: HMM модель ашиглан худалдааны сигнал үүсгэх
- 📱 **Cross-Platform Mobile App**: React Native Expo ашиглан iOS/Android дэмждэг
- 🔐 **Аюулгүй Authentication**: JWT token ба имэйл баталгаажуулалт
- 📊 **6 Валютын Хос**: EUR/USD, GBP/USD, USD/CAD, USD/CHF, USD/JPY, XAU/USD
- 📈 **5 Төрлийн Сигнал**: STRONG BUY, BUY, NEUTRAL, SELL, STRONG SELL

### Дэмжигдэх Валютын Хослолууд

| Хос     | Тайлбар                       |
| ------- | ----------------------------- |
| EUR/USD | Евро / АНУ Доллар             |
| GBP/USD | Английн Фунт / АНУ Доллар     |
| USD/CAD | АНУ Доллар / Канад Доллар     |
| USD/CHF | АНУ Доллар / Швейцарийн Франк |
| USD/JPY | АНУ Доллар / Японы Иен        |
| XAU/USD | Алт / АНУ Доллар              |

---

## 🛠 Технологийн Стек

### Backend (Python)

```
├── Python 3.13
├── Flask (REST API Framework)
├── MongoDB (Database)
├── MetaTrader5 (MT5 Python Library)
├── scikit-learn (Machine Learning)
├── pandas & numpy (Data Processing)
├── JWT (Authentication)
├── bcrypt (Password Hashing)
└── Flask-Mail (Email Service)
```

### Mobile App (JavaScript/React Native)

```
├── React Native
├── Expo SDK
├── React Navigation
├── Axios (HTTP Client)
├── AsyncStorage (Local Storage)
├── React Native Paper (UI Components)
└── Victory Native (Charts)
```

### Machine Learning

```
├── Hidden Markov Model (HMM)
├── StandardScaler (Feature Scaling)
├── Technical Indicators:
│   ├── Moving Averages (MA_5, MA_20)
│   ├── RSI (Relative Strength Index)
│   ├── Volatility
│   ├── Returns
│   └── Volume Moving Average
```

### External Services

```
├── MongoDB Atlas (Cloud Database)
├── MetaTrader 5 Demo Account
├── Gmail SMTP (Email Service)
└── Expo Go (Mobile Testing)
```

---

## 🏗 Системийн Архитектур

### Өндөр Түвшний Архитектур

```
┌────────────────────────────────────────────────────────────┐
│                     MOBILE APPLICATION                     │
│                     (React Native Expo)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Login   │  │   Home   │  │ Signal   │  │ Profile  │    │
│  │  Screen  │  │  Screen  │  │  Screen  │  │  Screen  │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                      │ HTTP/REST
                      │ (Axios)
        ┌─────────────▼─────────────────────────┐
        │        BACKEND API SERVER             │
        │        (Flask + Python)               │
        │  ┌────────────────────────────────┐   │
        │  │    Authentication Layer        │   │
        │  │    (JWT + bcrypt)              │   │
        │  └────────────┬───────────────────┘   │
        │  ┌────────────▼───────────────────┐   │
        │  │    Business Logic Layer        │   │
        │  │  ┌──────────┐  ┌────────────┐  │   │
        │  │  │  Rates   │  │ Prediction │  │   │
        │  │  │ Service  │  │  Service   │  │   │
        │  │  └─────┬────┘  └───────┬────┘  │   │
        │  └────────┼───────────────┼───────┘   │
        └───────────┼───────────────┼───────────┘
                    │               │
        ┌───────────▼───┐   ┌───────▼──────────┐
        │  MT5 Handler  │   │   HMM Model      │
        │  (Live Rates) │   │  (Predictions)   │
        └───────┬───────┘   └─────────┬────────┘
                │                     │
        ┌───────▼───────┐    ┌────────▼────────┐
        │  MetaTrader 5 │    │  Trained Model  │
        │  Demo Server  │    │   (.pkl files)  │
        └───────────────┘    └─────────────────┘
                │
        ┌───────▼──────────────────────┐
        │      MongoDB Atlas           │
        │  ┌─────────┐  ┌───────────┐  │
        │  │  Users  │  │   Codes   │  │
        │  │  Coll.  │  │   Coll.   │  │
        │  └─────────┘  └───────────┘  │
        └──────────────────────────────┘
```

### Үйлдлийн Урсгал

```
Хэрэглэгч → Mobile App → Backend API → MT5/Database → Хариу
    │          │            │              │             │
    │          │            │              │             │
   [1]        [2]          [3]            [4]           [5]
```

1. **Хэрэглэгч үйлдэл**: Нэвтрэх, ханш шалгах, таамаглал үзэх
2. **Mobile App**: HTTP request илгээх (JWT token-тэй)
3. **Backend API**: Баталгаажуулалт → Бизнес логик
4. **External Services**: MT5-аас ханш, Database-с өгөгдөл
5. **Хариу**: JSON форматаар хариу буцаах

---

## 🔄 Өгөгдлийн Урсгал

### 1. Нэвтрэх Урсгал (Authentication Flow)

```
┌─────────────┐
│  User Input │
│ Email/Pass  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│  POST /auth/login       │
│  {email, password}      │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐     ┌──────────────┐
│  Find User in MongoDB   │────►│  User Found? │
│  users_collection       │     └──────┬───────┘
└─────────────────────────┘            │
                                       │ Yes
                                       ▼
                            ┌──────────────────┐
                            │ Verify Password  │
                            │  (bcrypt.check)  │
                            └────────┬─────────┘
                                     │ Match
                                     ▼
                            ┌──────────────────┐
                            │ Generate JWT     │
                            │ Token (7 days)   │
                            └────────┬─────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │ Return Token +   │
                            │ User Info        │
                            └────────┬─────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │ Store in         │
                            │ AsyncStorage     │
                            └──────────────────┘
```

### 2. Бодит Цагийн Ханш Авах (Live Rates Flow)

```
┌──────────────────┐
│ Mobile App Timer │
│  (30 sec poll)   │
└────────┬─────────┘
         │
         ▼
┌────────────────────────────┐
│ GET /rates/live?source=mt5 │
└────────┬───────────────────┘
         │
         ▼
┌────────────────────────┐
│ Check MT5_ENABLED &    │
│ mt5_handler.connected  │
└────────┬───────────────┘
         │ True
         ▼
┌────────────────────────────────────┐
│ MT5Handler.get_live_rates()        │
│ - Get symbols: EURUSD, GBPUSD, ... │
│ - mt5.symbol_info_tick(symbol)     │
│ - Extract bid, ask, spread, time   │
└────────┬───────────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Convert to App Format          │
│ EURUSD → EUR_USD               │
│ {bid, ask, spread, time, rate} │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Return JSON Response           │
│ {success: true,                │
│  source: 'MT5',                │
│  rates: {...},                 │
│  timestamp: '...'}             │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Mobile App Updates UI          │
│ - Display bid/ask/spread       │
│ - Show MT5 badge               │
│ - Update timestamp             │
└────────────────────────────────┘
```

### 3. Таамаглал Үүсгэх (Prediction Flow)

```
┌──────────────────┐
│ User Refreshes   │
│ Home Screen      │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Loop through all pairs:          │
│ EUR/USD, GBP/USD, USD/CAD, ...   │
└────────┬─────────────────────────┘
         │
         ▼ (For each pair)
┌──────────────────────────────────┐
│ POST /predict_file               │
│ {file_path: "data/test/EUR_..."}│
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Extract currency pair from path  │
│ EUR_USD_test.csv → EUR/USD       │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Fetch Historical Data            │
│ - MT5: get_historical_data()     │
│   (1000 bars, M1 timeframe)      │
│ - Fallback: Read from CSV file   │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Calculate Technical Features     │
│ - returns (price change)         │
│ - MA_5 (5-period moving avg)    │
│ - MA_20 (20-period moving avg)  │
│ - volatility (20-period std)    │
│ - RSI (Relative Strength Index) │
│ - volume_ma (volume proxy)      │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Prepare Feature Matrix           │
│ - Take last 100 bars             │
│ - Extract 6 features             │
│ - Handle NaN values (→ 0)        │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Scale Features                   │
│ X_scaled = scaler.transform(X)   │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ HMM Model Prediction             │
│ hidden_states = model.predict()  │
│ current_state = states[-1]       │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Convert State → Signal           │
│ state % 5 → 0-4                  │
│ 0: STRONG BUY                    │
│ 1: BUY                           │
│ 2: NEUTRAL                       │
│ 3: SELL                          │
│ 4: STRONG SELL                   │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Calculate Confidence             │
│ - predict_proba() if available   │
│ - Fallback: 0.65 + signal*0.05  │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Calculate Historical Accuracy    │
│ - Last 50 bars consistency       │
│ - 60-90% range                   │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Return Prediction Response       │
│ {signal, signal_name,            │
│  confidence, accuracy,           │
│  current_price, price_change}    │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Mobile App Displays Result       │
│ - Signal icon (📈/➡️/📉)        │
│ - Confidence percentage          │
│ - Current price & change         │
└──────────────────────────────────┘
```

---

## 🖥 Backend Architecture

### Файлын Бүтэц

```
backend/
├── app.py                      # Main Flask application
├── config/
│   ├── __init__.py
│   ├── settings.py             # Configuration management
│   └── .env                    # Environment variables
├── utils/
│   ├── __init__.py
│   └── mt5_handler.py          # MT5 integration handler
├── models/
│   ├── hmm_forex_model.pkl     # Trained HMM model
│   └── hmm_scaler.pkl          # Feature scaler
└── requirements.txt            # Python dependencies
```

### Үндсэн Модулууд

#### 1. app.py - Main Application

```python
# Үндсэн бүтэц:
- Flask app initialization
- MongoDB connection
- ML model loading
- MT5 initialization
- Route handlers:
  ├── Authentication routes (/auth/*)
  ├── Prediction routes (/predict*)
  ├── Live rates routes (/rates/*)
  └── Health check (/health)
```

#### 2. config/settings.py - Configuration

```python
# Тохиргооны утгууд:
- Database: MONGO_URI
- Security: SECRET_KEY, JWT_EXPIRATION_DAYS
- Email: MAIL_SERVER, MAIL_USERNAME, MAIL_PASSWORD
- MT5: MT5_ENABLED, MT5_LOGIN, MT5_PASSWORD, MT5_SERVER
- API: API_HOST, API_PORT, DEBUG_MODE
- Data: MODELS_DIR, CURRENCY_PAIRS
```

#### 3. utils/mt5_handler.py - MT5 Integration

```python
class MT5Handler:
    - connect(): MT5 терминалд холбогдох
    - disconnect(): Холболт салгах
    - get_symbol_info(): Symbol-ын мэдээлэл
    - get_current_tick(): Одоогийн tick авах
    - get_live_rates(): Олон symbol-ын ханш авах
    - get_historical_data(): Түүхэн OHLCV өгөгдөл
    - convert_to_pair_format(): MT5 → App формат
```

### Database Schema (MongoDB)

#### Users Collection

```javascript
{
  _id: ObjectId,
  name: String,                 // Хэрэглэгчийн нэр
  email: String (unique),       // Имэйл хаяг
  password: String,             // bcrypt hash
  email_verified: Boolean,      // Имэйл баталгаажсан эсэх
  verified_at: DateTime,        // Баталгаажсан огноо
  created_at: DateTime,         // Үүсгэсэн огноо
  updated_at: DateTime,         // Шинэчилсэн огноо
  last_login: DateTime          // Сүүлд нэвтэрсэн огноо
}
```

#### Verification Codes Collection

```javascript
{
  _id: ObjectId,
  email: String,                // Имэйл хаяг
  name: String,                 // Хэрэглэгчийн нэр
  password: String,             // Hashed password
  code: String,                 // 6-digit code
  expires_at: DateTime,         // Хугацаа дуусах огноо
  created_at: DateTime,         // Үүсгэсэн огноо
  is_existing_user: Boolean     // Хуучин хэрэглэгч эсэх
}
```

#### Reset Codes Collection

```javascript
{
  _id: ObjectId,
  email: String,                // Имэйл хаяг
  code: String,                 // 6-digit reset code
  expires_at: DateTime,         // Хугацаа дуусах огноо
  created_at: DateTime          // Үүсгэсэн огноо
}
```

---

## 📱 Mobile App Architecture

### Файлын Бүтэц

```
mobile_app/
├── App.js                      # Root component
├── app.json                    # Expo configuration
├── src/
│   ├── navigation/
│   │   └── MainTabs.js         # Bottom tab navigation
│   ├── screens/
│   │   ├── LoginScreen.js      # Нэвтрэх
│   │   ├── SignUpScreen.js     # Бүртгүүлэх
│   │   ├── EmailVerificationScreen.js
│   │   ├── ForgotPasswordScreen.js
│   │   ├── HomeScreen.js       # Үндсэн дэлгэц
│   │   ├── SignalScreen.js     # Дэлгэрэнгүй сигнал
│   │   └── ProfileScreen.js    # Хэрэглэгчийн профайл
│   ├── components/
│   │   ├── CurrencyCard.js     # Валютын карт
│   │   ├── SignalCard.js       # Сигналын карт
│   │   └── StatisticsChart.js  # График
│   ├── services/
│   │   ├── api.js              # API client
│   │   └── auth.js             # Auth service
│   ├── config/
│   │   ├── api.js              # API configuration
│   │   └── theme.js            # UI theme
│   └── utils/
│       └── helpers.js          # Helper functions
└── package.json
```

### Дэлгэцийн Урсгал

```
┌─────────────────────────────────────────┐
│         App Start / Check Token         │
└────────────┬────────────────────────────┘
             │
      ┌──────▼──────┐
      │ Token Valid?│
      └──────┬──────┘
             │
      ┌──────┴──────┐
      │             │
   No │             │ Yes
      │             │
┌─────▼─────┐   ┌───▼────────┐
│  Login    │   │    Home    │
│  Screen   │   │   Screen   │
└─────┬─────┘   └───┬────────┘
      │             │
      │   Success   │
      └──────┬──────┘
             │
      ┌──────▼────────────────────┐
      │   Bottom Tab Navigation   │
      │  ┌────┬────┬─────┬─────┐  │
      │  │Home│Sig │Chart│Prof │  │
      │  └────┴────┴─────┴─────┘  │
      └───────────────────────────┘
```

### Component Хоорондын Харилцаа

```
App.js
  │
  ├─→ MainTabs (Navigation)
  │     │
  │     ├─→ HomeScreen
  │     │     ├─→ CurrencyCard (x6)
  │     │     │     └─→ Display: bid/ask/spread/signal
  │     │     │
  │     │     └─→ Pull-to-Refresh
  │     │           ├─→ fetchLiveRates()
  │     │           └─→ getAllPredictions()
  │     │
  │     ├─→ SignalScreen
  │     │     ├─→ SignalCard
  │     │     └─→ StatisticsChart
  │     │
  │     └─→ ProfileScreen
  │           ├─→ User Info
  │           └─→ Change Password
  │
  └─→ Auth Flow
        ├─→ LoginScreen
        ├─→ SignUpScreen
        ├─→ EmailVerificationScreen
        └─→ ForgotPasswordScreen
```

### State Management

```javascript
HomeScreen State:
├── loading: boolean           // Ачаалж байгаа эсэх
├── refreshing: boolean        // Refresh хийж байгаа эсэх
├── liveRates: object         // Бодит цагийн ханш
├── predictions: object       // Таамаглалууд
├── mt5Connected: boolean     // MT5 холбогдсон эсэх
├── dataSource: string        // 'MT5' or 'API'
├── lastUpdateTime: string    // Сүүлд шинэчилсэн цаг
└── user: object              // Хэрэглэгчийн мэдээлэл
```

---

## 🤖 Machine Learning Model

### HMM (Hidden Markov Model) Талаархи

**Hidden Markov Model** нь цаг хугацааны цуваа өгөгдөл дээр далд төлөвүүдийг (hidden states) тодорхойлж, ирээдүйн төлөв байдлыг таамаглах статистик модель юм.

### 🔄 Prediction Cache System

**Шинэ онцлог**: Backend дээр prediction cache систем нэмэгдсэн.

- **Cache Duration**: 5 минут (300 секунд)
- **Автомат шинэчлэгдэнэ**: Кэш хугацаа дуусвал шинээр тооцоолно
- **Давуу тал**:
  - Сервер ачааллыг бууруулна
  - Хариу өгөх хурд сайжирна (кэш hit бол ~10ms)
  - MT5 API calls-ыг багасгана
  - Бодит цагийн өгөгдөл дээр үндэслэнэ (файл биш)

```python
# Prediction Cache Variables
prediction_cache = {}           # Таамаглалууд хадгалах
prediction_cache_time = {}      # Хугацааг хадгалах
PREDICTION_CACHE_DURATION = 300 # 5 минут

# Example Cache Entry
prediction_cache['EUR_USD'] = {
    'signal': 2,
    'signal_name': 'NEUTRAL',
    'confidence': 0.95,
    'timestamp': '2025-10-20T00:30:45',
    # ... бусад мэдээлэл
}
```

### Архитектур

```
┌─────────────────────────────────────────────────┐
│         INPUT: Historical Price Data            │
│  (OHLCV: Open, High, Low, Close, Volume)        │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│    Feature Engineering (Technical Indicators)   │
│  ┌──────────────────────────────────────────┐   │
│  │ 1. Returns = close.pct_change()          │   │
│  │ 2. MA_5 = close.rolling(5).mean()        │   │
│  │ 3. MA_20 = close.rolling(20).mean()      │   │
│  │ 4. Volatility = returns.rolling(20).std()│   │
│  │ 5. RSI = Relative Strength Index         │   │
│  │ 6. Volume_MA = volume proxy              │   │
│  └──────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│         Feature Scaling (StandardScaler)        │
│  X_scaled = (X - mean) / std                    │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│           HMM Model (Trained Model)             │
│  ┌──────────────────────────────────────────┐   │
│  │ States: 0, 1, 2, 3, 4, ...               │   │
│  │ Transition Matrix: P(state[t] → state[t+1])  │
│  │ Emission Matrix: P(observation | state)  │   │
│  └──────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│         Predict Hidden States                   │
│  hidden_states = model.predict(X_scaled)        │
│  current_state = hidden_states[-1]              │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│       Map State → Trading Signal                │
│  state % 5:                                     │
│  ├─ 0 → STRONG BUY (📈🚀)                      │
│  ├─ 1 → BUY (📈)                               │
│  ├─ 2 → NEUTRAL (➡️)                           │
│  ├─ 3 → SELL (📉)                              │
│  └─ 4 → STRONG SELL (📉💥)                     │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│              OUTPUT: Trading Signal             │
│  {signal, signal_name, confidence, accuracy}    │
└─────────────────────────────────────────────────┘
```

### Feature Тайлбар

| Feature        | Томьёо                                 | Тайлбар                         |
| -------------- | -------------------------------------- | ------------------------------- |
| **Returns**    | `(close[t] - close[t-1]) / close[t-1]` | Үнийн хувийн өөрчлөлт           |
| **MA_5**       | `mean(close[t-4:t])`                   | 5 үеийн жигнэсэн дундаж         |
| **MA_20**      | `mean(close[t-19:t])`                  | 20 үеийн жигнэсэн дундаж        |
| **Volatility** | `std(returns[t-19:t])`                 | Үнийн хэлбэлзэл                 |
| **RSI**        | `100 - 100/(1 + RS)`                   | Худалдан авалт/борлуулалтын хүч |
| **Volume_MA**  | `mean(volume[t-19:t])`                 | Эзлэхүүний жигнэсэн дундаж      |

### Модель Сургах Процесс (Training)

```python
# 1. Өгөгдөл бэлтгэх
df = pd.read_csv('EUR_USD_1min.csv')
df = calculate_features(df)

# 2. Feature matrix үүсгэх
X = df[['returns', 'MA_5', 'MA_20', 'volatility', 'RSI', 'volume_ma']].values

# 3. Scaling хийх
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 4. HMM модель сургах
model = GaussianHMM(n_components=5, covariance_type='full', n_iter=100)
model.fit(X_scaled)

# 5. Хадгалах
pickle.dump(model, open('hmm_forex_model.pkl', 'wb'))
pickle.dump(scaler, open('hmm_scaler.pkl', 'wb'))
```

---

## 🔌 MT5 Integration

### MetaTrader 5 Талаархи

MetaTrader 5 нь дэлхийн хамгийн алдартай форекс худалдааны платформ бөгөөд бидний апп нь MT5 Python library ашиглан бодит цагийн өгөгдөл татдаг.

### MT5Handler Class

```python
class MT5Handler:
    """MetaTrader 5 холболт ба өгөгдөл татах class"""

    def __init__(self):
        self.connected = False
        self.account_info = None

    def connect(self, login, password, server):
        """MT5 терминалд холбогдох"""
        # 1. MT5 эхлүүлэх
        if not mt5.initialize():
            return False

        # 2. Нэвтрэх
        authorized = mt5.login(
            login=login,      # 944467
            password=password,
            server=server     # MOTCapital-Demo-1
        )

        # 3. Account info хадгалах
        self.account_info = mt5.account_info()
        self.connected = True
        return True

    def get_live_rates(self, symbols):
        """Бодит цагийн ханш авах"""
        rates = {}
        for symbol in symbols:
            tick = mt5.symbol_info_tick(symbol)
            if tick:
                rates[symbol] = {
                    'bid': tick.bid,
                    'ask': tick.ask,
                    'spread': (tick.ask - tick.bid) / tick.bid * 10000,
                    'time': datetime.fromtimestamp(tick.time),
                    'last': tick.last
                }
        return rates

    def get_historical_data(self, symbol, timeframe, count):
        """Түүхэн OHLCV өгөгдөл татах"""
        # Timeframe хөрвүүлэх
        tf_dict = {
            'M1': mt5.TIMEFRAME_M1,    # 1 минут
            'M5': mt5.TIMEFRAME_M5,    # 5 минут
            'M15': mt5.TIMEFRAME_M15,  # 15 минут
            'H1': mt5.TIMEFRAME_H1,    # 1 цаг
            'D1': mt5.TIMEFRAME_D1,    # 1 өдөр
        }

        # Өгөгдөл татах
        rates = mt5.copy_rates_from_pos(
            symbol,
            tf_dict.get(timeframe, mt5.TIMEFRAME_M1),
            0,
            count
        )

        # DataFrame болгох
        df = pd.DataFrame(rates)
        df['time'] = pd.to_datetime(df['time'], unit='s')
        return df
```

### MT5 Холболтын Урсгал

```
Backend Startup
      │
      ▼
┌─────────────────────┐
│ Check MT5_ENABLED   │
└─────────┬───────────┘
          │ True
          ▼
┌─────────────────────────┐
│ Read .env credentials   │
│ - MT5_LOGIN: 944467     │
│ - MT5_PASSWORD: ***     │
│ - MT5_SERVER: MOT...    │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ mt5.initialize()        │
│ (Start MT5 connection)  │
└─────────┬───────────────┘
          │ Success
          ▼
┌─────────────────────────┐
│ mt5.login(credentials)  │
│ (Authorize account)     │
└─────────┬───────────────┘
          │ Authorized
          ▼
┌─────────────────────────┐
│ mt5.account_info()      │
│ Get account details     │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ mt5_handler.connected   │
│ = True                  │
└─────────────────────────┘
```

### MT5 Symbol Format

| App Format | MT5 Format | Тайлбар             |
| ---------- | ---------- | ------------------- |
| EUR_USD    | EURUSD     | Евро/Доллар         |
| GBP_USD    | GBPUSD     | Фунт/Доллар         |
| USD_JPY    | USDJPY     | Доллар/Иен          |
| USD_CAD    | USDCAD     | Доллар/Канад Доллар |
| USD_CHF    | USDCHF     | Доллар/Франк        |
| XAU_USD    | XAUUSD     | Алт/Доллар          |

---

## 🔗 API Endpoints

### Authentication Endpoints

#### POST `/auth/register`

**Бүртгүүлэх (Имэйл баталгаажуулалттай)**

Request:

```json
{
  "name": "Батаа",
  "email": "bataa@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "success": true,
  "email": "bataa@example.com",
  "message": "Баталгаажуулалтын код ... руу илгээгдлээ"
}
```

---

#### POST `/auth/verify-email`

**Имэйл баталгаажуулах**

Request:

```json
{
  "email": "bataa@example.com",
  "code": "123456"
}
```

Response:

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Батаа",
    "email": "bataa@example.com"
  }
}
```

---

#### POST `/auth/login`

**Нэвтрэх**

Request:

```json
{
  "email": "bataa@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Батаа",
    "email": "bataa@example.com",
    "email_verified": true
  }
}
```

---

### Live Rates Endpoints

#### GET `/rates/live?source=mt5`

**Бодит цагийн бүх валютын ханш авах**

Response:

```json
{
  "success": true,
  "timestamp": "2025-10-20 00:30:45",
  "source": "MT5",
  "rates": {
    "EUR_USD": {
      "rate": 1.16504,
      "bid": 1.16502,
      "ask": 1.16506,
      "spread": 0.34,
      "time": "2025-10-20T00:30:45"
    },
    "GBP_USD": {
      "rate": 1.34376,
      "bid": 1.34374,
      "ask": 1.34378,
      "spread": 0.3,
      "time": "2025-10-20T00:30:45"
    }
  },
  "count": 6
}
```

---

#### GET `/rates/specific?pair=EUR/USD`

**Тодорхой валютын хослолын ханш авах**

Response:

```json
{
  "success": true,
  "pair": "EUR_USD",
  "rate": 1.16504,
  "bid": 1.16502,
  "ask": 1.16506,
  "spread": 0.34,
  "timestamp": "2025-10-20 00:30:45",
  "source": "MT5"
}
```

---

### Prediction Endpoints

#### POST `/predict_file`

**MT5 өгөгдөл ашиглан таамаглал хийх**

Request:

```json
{
  "file_path": "data/test/EUR_USD_test.csv"
}
```

Response:

```json
{
  "success": true,
  "currency_pair": "EUR/USD",
  "signal": 2,
  "signal_name": "NEUTRAL",
  "confidence": 0.95,
  "historical_accuracy": 0.78,
  "timestamp": "2025-10-20T00:30:45.123456",
  "current_price": 1.16504,
  "price_change_percent": 0.0034,
  "data_source": "MT5",
  "bars_analyzed": 100
}
```

---

#### GET `/currencies`

**Дэмжигдсэн валютын жагсаалт**

Response:

```json
{
  "success": true,
  "currencies": [
    "EUR_USD",
    "GBP_USD",
    "USD_CAD",
    "USD_CHF",
    "USD_JPY",
    "XAU_USD"
  ],
  "count": 6
}
```

---

### System Endpoints

#### GET `/health`

**Системийн эрүүл байдал шалгах**

Response:

```json
{
  "status": "healthy",
  "database": "connected",
  "users_count": 42,
  "ml_model": "loaded",
  "timestamp": "2025-10-20T00:30:45.123456"
}
```

---

#### GET `/rates/mt5/status`

**MT5 холболтын статус шалгах**

Response:

```json
{
  "success": true,
  "enabled": true,
  "connected": true,
  "account_info": {
    "login": 944467,
    "server": "MOTCapital-Demo-1",
    "company": "MOT Forex LLC",
    "currency": "USD",
    "leverage": 500,
    "balance": 10000.0
  }
}
```

---

## 🔐 Security & Authentication

### JWT Token Структур

```
Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "user_id": "507f1f77bcf86cd799439011",
  "email": "bataa@example.com",
  "exp": 1729468800,  // Expiry (7 days)
  "iat": 1728864000   // Issued at
}

Signature:
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  SECRET_KEY
)
```

### Password Hashing (bcrypt)

```python
# Registration хийхэд:
password = "user_password"
salt = bcrypt.gensalt()
hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
# Хадгална: $2b$12$xyz...

# Login хийхэд:
input_password = "user_password"
stored_hash = user['password']
is_valid = bcrypt.checkpw(
    input_password.encode('utf-8'),
    stored_hash
)
```

### Email Verification Flow

```
1. User бүртгүүлэх
   ↓
2. Generate 6-digit code
   ↓
3. Save to verification_codes collection
   ↓
4. Send email with code
   ↓
5. User enters code
   ↓
6. Verify code & expiry
   ↓
7. Create user account
   ↓
8. Return JWT token
```

### API Request Security

```javascript
// Mobile App дээр:
const token = await AsyncStorage.getItem("userToken");

axios.get("/rates/live", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Backend дээр:
auth_header = request.headers.get("Authorization");
token = auth_header.split(" ")[1];
payload = jwt.decode(token, SECRET_KEY);
user = users_collection.find_one({ _id: payload["user_id"] });
```

---

## 📦 Installation & Setup

### Prerequisites

- Python 3.13+
- Node.js 16+
- MongoDB Atlas account
- MetaTrader 5 Demo account
- Gmail account (for email service)

### Backend Setup

```bash
# 1. Clone repository
git clone https://github.com/Asura-lab/Forex-Signal-App.git
cd Forex-Signal-App

# 2. Create virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Mac/Linux

# 3. Install dependencies
cd backend
pip install -r requirements.txt

# 4. Configure .env file
cd config
# Edit .env with your credentials:
# - MONGO_URI
# - SECRET_KEY
# - MAIL_USERNAME, MAIL_PASSWORD
# - MT5_LOGIN, MT5_PASSWORD, MT5_SERVER

# 5. Run backend
cd ..
python app.py
```

### Mobile App Setup

```bash
# 1. Navigate to mobile app
cd mobile_app

# 2. Install dependencies
npm install

# 3. Configure API URL
# Edit src/services/api.js:
const API_BASE_URL = "http://YOUR_IP:5000";

# 4. Start Expo
npx expo start

# 5. Scan QR code with Expo Go app
```

### MT5 Setup

1. **Download MT5**: https://www.metatrader5.com/en/download
2. **Create Demo Account**:
   - Open MT5 → File → Open Account
   - Select "MOT Forex LLC"
   - Choose "Demo Account"
3. **Get Credentials**:
   - Account Number (login)
   - Password
   - Server Name
4. **Add to .env**:
   ```
   MT5_ENABLED=True
   MT5_LOGIN=944467
   MT5_PASSWORD=your_password
   MT5_SERVER=MOTCapital-Demo-1
   ```

---

## 🚀 Deployment

### Backend Deployment (Heroku Example)

```bash
# 1. Create Procfile
echo "web: gunicorn backend.app:app" > Procfile

# 2. Create runtime.txt
echo "python-3.13.0" > runtime.txt

# 3. Install gunicorn
pip install gunicorn
pip freeze > requirements.txt

# 4. Initialize git
git init
git add .
git commit -m "Initial commit"

# 5. Create Heroku app
heroku create forex-signal-api

# 6. Set environment variables
heroku config:set MONGO_URI=mongodb+srv://...
heroku config:set SECRET_KEY=...
heroku config:set MT5_ENABLED=False  # MT5 won't work on Heroku

# 7. Deploy
git push heroku main
```

### Mobile App Deployment

#### Android (Google Play Store)

```bash
# 1. Build APK
eas build --platform android

# 2. Download APK
# 3. Upload to Google Play Console
```

#### iOS (App Store)

```bash
# 1. Build IPA
eas build --platform ios

# 2. Download IPA
# 3. Upload to App Store Connect
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. MT5 Authorization Failed

**Асуудал:**

```
MT5 эхлүүлэх алдаа: (-6, 'Terminal: Authorization failed')
```

**Шийдэл:**

- MetaTrader 5 программыг нээнэ үү
- Demo account-оор нэвтэрсэн эсэхийг шалгана уу
- .env файлд зөв credentials байгаа эсэхийг шалгана уу
- Server нэр зөв эсэхийг шалгана уу (MOTCapital-Demo-1)

---

#### 2. MongoDB Connection Error

**Асуудал:**

```
MongoClient cannot connect to mongodb+srv://...
```

**Шийдэл:**

- MongoDB Atlas дээр Network Access-д өөрийн IP-г нэмнэ үү
- Database User нууц үг зөв эсэхийг шалгана уу
- MONGO_URI string зөв форматтай эсэхийг шалгана уу

---

#### 3. Email Not Sending

**Асуудал:**

```
SMTP authentication error
```

**Шийдэл:**

- Gmail-д "App Password" үүсгэнэ үү (2FA идэвхтэй байх ёстой)
- MAIL_USERNAME = бүтэн имэйл хаяг
- MAIL_PASSWORD = App Password (16 тэмдэгт)
- Less secure app access DISABLED байх ёстой

---

#### 4. Mobile App Cannot Connect to Backend

**Асуудал:**

```
Network Error: Request failed
```

**Шийдэл:**

- Backend ажиллаж байгаа эсэхийг шалгана уу
- Mobile app болон backend ижил Wi-Fi дээр байгаа эсэхийг шалгана уу
- Firewall backend port (5000)-г block хийгээгүй эсэхийг шалгана уу
- API_BASE_URL-д зөв IP хаяг байгаа эсэхийг шалгана уу

---

#### 5. Predictions Showing "?" Icon

**Асуудал:**

```
Mobile app дээр prediction icon харагдахгүй байна
```

**Шийдэл:**

- Backend terminal дээр prediction request ирж байгаа эсэхийг шалгана уу
- HMM model файлууд (\*.pkl) байгаа эсэхийг шалгана уу
- Backend console дээр алдаа байгаа эсэхийг харна уу
- Mobile app-д pull-to-refresh хийнэ үү

---

## 📊 Performance Metrics

### Backend Performance

- **API Response Time**: ~200-500ms
- **MT5 Live Rates**: ~100-200ms
- **Prediction Calculation**: ~300-600ms
- **Database Query**: ~50-100ms

### Mobile App Performance

- **Initial Load**: ~2-3 seconds
- **Pull-to-Refresh**: ~1-2 seconds
- **Navigation**: <100ms
- **Auto-refresh Interval**: 30 seconds

### Model Accuracy

- **Training Accuracy**: ~75-85%
- **Historical Accuracy**: 60-90% (depending on market conditions)
- **Confidence Range**: 65-95%

---

## 🔮 Future Enhancements

### Төлөвлөж байгаа Features

1. **Push Notifications**: Сигнал өөрчлөгдөхөд мэдэгдэл
2. **Multiple Timeframes**: M5, M15, H1, H4, D1
3. **Custom Alerts**: Хэрэглэгч өөрөө alert тохируулах
4. **Trading History**: Сигналын түүх хадгалах
5. **Performance Analytics**: Модель үр дүнгийн дэлгэрэнгүй
6. **Social Trading**: Хэрэглэгчдийн хооронд сигнал хуваалцах
7. **Multiple ML Models**: LSTM, Transformer зэрэг нэмэх
8. **Auto-Trading**: MT5-тай холбож автомат арилжаа хийх
9. **News Integration**: Форекс мэдээг таамаглалд нэмэх
10. **Dark Mode**: Харааны өөр горим нэмэх

---

## 📞 Support & Contact

### Технологийн Дэмжлэг

- **GitHub Issues**: https://github.com/Asura-lab/Forex-Signal-App/issues
- **Email**: support@forexsignalapp.com
- **Documentation**: https://docs.forexsignalapp.com

### Хөгжүүлэгчийн Мэдээлэл

- **GitHub**: https://github.com/Asura-lab
- **Project Repository**: https://github.com/Asura-lab/Forex-Signal-App

---

## 📜 License

MIT License - Дэлгэрэнгүй LICENSE файлыг үзнэ үү.

---

## 🙏 Acknowledgments

- **MetaTrader 5**: Бодит цагийн өгөгдөл
- **MongoDB Atlas**: Cloud database
- **Expo**: Mobile app framework
- **scikit-learn**: Machine learning library

---

**📅 Last Updated**: October 20, 2025  
**📌 Version**: 2.0.0  
**👨‍💻 Author**: Asura-lab
