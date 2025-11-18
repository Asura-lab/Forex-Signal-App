# 📊 Төслийн хураангуй мэдээлэл

**Огноо:** 2025-11-10  
**Статус:** ✅ Production-Ready  
**Хувилбар:** 2.0.0

---

## 🎯 Системийн тойм

**Forex Signal App** - TensorFlow Deep Learning ашигласан 3 timeframe-ийн валютын таамаглалын систем.

### Үндсэн онцлог:

- 🤖 **3 Deep Learning модель**: Transformer+LSTM, Bi-LSTM+Attention, CNN-LSTM
- ⏱️ **3 Timeframe**: 15, 30, 60 минут
- 📈 **6 Валютын хос**: EUR/USD, GBP/USD, USD/JPY, USD/CAD, USD/CHF, XAU/USD
- 📱 **React Native Mobile App**: Cross-platform (iOS + Android)
- 🔐 **MongoDB + JWT Auth**: Secure authentication
- ⚡ **MetaTrader 5**: Real-time market data

---

## 📁 Одоогийн файлын бүтэц

### ✅ Идэвхтэй файлууд (Ашиглагдаж байгаа)

#### Machine Learning:

```
ml_models/
└── deeplearning.ipynb              🔥 ҮНДСЭН СУРГАЛТЫН NOTEBOOK
                                    (Цорын ганц ашиглагдаж байгаа notebook)
```

#### Trained Models:

```
models/
├── 15min/
│   ├── multi_currency_15min_best.keras       ✅ Transformer+LSTM модель
│   ├── multi_currency_15min_scaler.pkl
│   ├── multi_currency_15min_encoder.pkl
│   └── multi_currency_15min_metadata.json
├── 30min/
│   ├── multi_currency_30min_best.keras       ✅ Bi-LSTM+Attention модель
│   ├── multi_currency_30min_scaler.pkl
│   ├── multi_currency_30min_encoder.pkl
│   └── multi_currency_30min_metadata.json
└── 60min/
    ├── multi_currency_60min_best.keras       ✅ CNN-LSTM модель
    ├── multi_currency_60min_scaler.pkl
    ├── multi_currency_60min_encoder.pkl
    └── multi_currency_60min_metadata.json
```

#### Backend:

```
backend/
├── app.py                          ✅ Үндсэн Flask API
├── config/
│   ├── .env                        ✅ Environment variables
│   └── settings.py                 ✅ Configuration
└── utils/
    └── mt5_handler.py              ✅ MT5 integration
```

#### Mobile App:

```
mobile_app/
├── App.js                          ✅ Main entry
├── src/
│   ├── screens/                    ✅ 5 screens
│   ├── services/api.js             ✅ API integration
│   └── context/AuthContext.js      ✅ Auth state
└── package.json                    ✅ Dependencies
```

#### Training Data:

```
data/train/
├── EUR_USD_1min.csv                ✅ Historical OHLCV data
├── GBP_USD_1min.csv                ✅
├── USD_JPY_1min.csv                ✅
├── USD_CAD_1min.csv                ✅
├── USD_CHF_1min.csv                ✅
└── XAU_USD_1min.csv                ✅
```

#### Documentation:

```
docs/
├── README.md                       ✅ Шинэчлэгдсэн
├── DEEP_LEARNING_ARCHITECTURE.md   ✅ Шинэчлэгдсэн
├── IMPLEMENTATION_GUIDE.md         ✅ Шинэчлэгдсэн
├── ER_DIAGRAM_GUIDE.md             ✅ Database ER diagram
├── database_schema.dbml            ✅ DBML schema
├── PRIVACY_POLICY.md               ✅
└── TERMS_OF_SERVICE.md             ✅
```

---
## 🚀 Ажлын урсгал (Workflow)

### 1️⃣ Модель сургах

```bash
# Зөвхөн энэ нэг notebook ашиглана:
ml_models/deeplearning.ipynb

# Үр дүн:
models/15min/*.keras, *.pkl, *.json
models/30min/*.keras, *.pkl, *.json
models/60min/*.keras, *.pkl, *.json
```

### 2️⃣ Backend ажиллуулах

```bash
python backend/app.py

# Автоматаар:
# - Models ачаална (models/ folder-оос)
# - MongoDB холбогдоно
# - MT5 холбогдоно (хэрэв идэвхтэй бол)
# - REST API бэлэн болно (port 5000)
```

### 3️⃣ Mobile App ажиллуулах

```bash
cd mobile_app
npx expo start

# Утсан дээр:
# - Expo Go app install
# - QR code scan
# - App ачаална
```

### 4️⃣ Prediction авах

**Mobile App-аас:**

1. Login хий
2. Prediction screen рүү ор
3. Валют сонго (EUR/USD, гэх мэт)
4. Prediction харна (3 timeframe)

**API-аас:**

```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"currency_pair": "EUR/USD"}'
```

---

## 📊 Моделийн гүйцэтгэл

| Model    | Architecture        | Accuracy | Training Time |
| -------- | ------------------- | -------- | ------------- |
| 15-минут | Transformer + LSTM  | 88.2%    | ~45 min       |
| 30-минут | Bi-LSTM + Attention | 85.6%    | ~40 min       |
| 60-минут | CNN-LSTM Hybrid     | 82.1%    | ~35 min       |

---

## 🗄️ Database

**Platform:** MongoDB Atlas  
**Database:** `users_db`

**Collections:**

1. `users` - Хэрэглэгчийн мэдээлэл
2. `verification_codes` - Имэйл баталгаажуулалт (TTL: 10 мин)
3. `reset_codes` - Нууц үг сэргээх (TTL: 10 мин)

**ER Diagram:** `docs/database_schema.dbml` (dbdiagram.io форматаар)

---

## 🔑 API Endpoints

### Authentication:

```
POST /auth/register          - Бүртгүүлэх
POST /auth/verify-email      - Имэйл баталгаажуулах
POST /auth/login             - Нэвтрэх
GET  /auth/me                - Миний мэдээлэл
PUT  /auth/update            - Profile шинэчлэх
PUT  /auth/change-password   - Нууц үг солих
POST /auth/forgot-password   - Нууц үг мартсан
POST /auth/reset-password    - Нууц үг сэргээх
```

### Predictions:

```
POST /predict                - Multi-timeframe prediction
GET  /health                 - Health check
```

### Market Data:

```
GET  /currencies             - Валютын жагсаалт
GET  /rates/live             - Бодит цагийн ханш
```

---

## 🛠️ Технологи Stack

### Backend:

- Python 3.11+
- TensorFlow 2.15+ / Keras 3.0+
- Flask 3.0+
- MongoDB (PyMongo)
- MetaTrader5
- bcrypt, PyJWT

### Mobile:

- React Native + Expo
- React Navigation
- Axios
- AsyncStorage

### ML:

- TensorFlow/Keras
- pandas, numpy
- scikit-learn

---

## 📝 Анхаарах зүйлс

### ✅ Хийх зүйлс:

1. **Модель сургахдаа:**

   - `ml_models/deeplearning.ipynb` ЗӨВХӨН үүнийг ашигла
   - Бусад notebook-уудыг БИТГИЙ ашигла

2. **Backend ажиллуулахдаа:**

   - `.env` файлыг зөв тохируул
   - MongoDB холболтоо шалга
   - Models folder-т бүх файлууд байгаа эсэхийг шалга

3. **Mobile App:**
   - API_URL-ийг бодит IP-рүү солих
   - Утсан ба компьютер ижил WiFi-д байх

### ❌ Битгий хий:

1. Хуучин notebook-уудыг ашиглах
2. `.env` файлыг Git-рүү commit хийх
3. Model файлуудыг устгах
4. Production-д DEBUG=True байлгах

---

## 📚 Баримтын зөвлөмж

### Эхлэх:

1. `README.md` - Төслийн ерөнхий танилцуулга
2. `docs/IMPLEMENTATION_GUIDE.md` - Алхам алхмаар заавар

### Модель сургалт:

1. `ml_models/deeplearning.ipynb` - Сургалтын notebook
2. `docs/DEEP_LEARNING_ARCHITECTURE.md` - Архитектурын дэлгэрэнгүй

### Database:

1. `docs/database_schema.dbml` - DBML schema
2. `docs/ER_DIAGRAM_GUIDE.md` - ER диаграмм зурах заавар

---

## 🎯 Дараагийн алхамууд

### Хөгжүүлэлт:

- [ ] Push notifications нэмэх
- [ ] Trading history tracking
- [ ] Performance analytics
- [ ] Dark mode
- [ ] Multi-language (EN, MN)

### Deployment:

- [ ] Backend: Heroku/AWS/Azure
- [ ] Mobile: Google Play / App Store
- [ ] Database: MongoDB Atlas (production cluster)
- [ ] Monitoring: Sentry, Logging

---

## ⚠️ Анхааруулга

**Энэ систем нь зөвхөн боловсрол, судалгааны зорилгоор үүсгэгдсэн.**

Бодит арилжаанд ашиглахдаа:

- Анхаарал хандуулах
- Backtesting хийх
- Жижиг дүнгээр эхлэх
- Stop-loss ашиглах

---

## 📞 Холбоо барих

**GitHub:** [@Asura-lab](https://github.com/Asura-lab)  
**Repository:** [Forex-Signal-App](https://github.com/Asura-lab/Forex-Signal-App)

---

**Made with ❤️ in Mongolia 🇲🇳**

**Last Updated:** November 10, 2025
