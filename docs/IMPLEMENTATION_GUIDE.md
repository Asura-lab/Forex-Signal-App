# 📘 Implementation Guide - Updated

**Version:** 2.0.0  
**Last Updated:** November 10, 2025  
**Status:** Production-Ready System

---

## 📋 Table of Contents

1. [Quick Start](#1-quick-start)
2. [Development Setup](#2-development-setup)
3. [Model Training](#3-model-training)
4. [Backend Setup](#4-backend-setup)
5. [Mobile App Setup](#5-mobile-app-setup)
6. [Database Setup](#6-database-setup)
7. [Testing](#7-testing)
8. [Deployment](#8-deployment)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Quick Start

### Prerequisites

```bash
# Required:
- Python 3.11+
- Node.js 18+
- MongoDB Atlas account
- Git

# Optional:
- MetaTrader 5 (for live data)
- Android Studio / Xcode (for mobile development)
```

### 30-Second Setup

```bash
# 1. Clone
git clone https://github.com/Asura-lab/Forex-Signal-App.git
cd Forex-Signal-App

# 2. Backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# 3. Configure
cd backend/config
copy .env.example .env
# Edit .env: add MONGO_URI, SECRET_KEY

# 4. Run Backend
cd ..\..
python backend/app.py

# 5. Mobile App (new terminal)
cd mobile_app
npm install
npx expo start
```

---

## 2. Development Setup

### 2.1 Python Environment

```bash
# Create virtual environment
python -m venv .venv

# Activate
# Windows:
.venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Verify installation
python -c "import tensorflow as tf; print(tf.__version__)"
python -c "import keras; print(keras.__version__)"
```

### 2.2 VS Code Setup

**Recommended Extensions:**
- Python (Microsoft)
- Jupyter (Microsoft)
- Python Debugger
- React Native Tools
- MongoDB for VS Code

**settings.json:**
```json
{
  "python.defaultInterpreterPath": ".venv/Scripts/python.exe",
  "jupyter.notebookFileRoot": "${workspaceFolder}",
  "python.linting.enabled": true,
  "python.formatting.provider": "black"
}
```

### 2.3 Environment Variables

**File:** `backend/config/.env`

```bash
# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/users_db?retryWrites=true&w=majority

# JWT Secret
SECRET_KEY=your-super-secret-key-here-min-32-chars

# Flask
API_HOST=0.0.0.0
API_PORT=5000
DEBUG=True

# Email (Gmail)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USE_SSL=False
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=your-email@gmail.com

# MetaTrader 5 (optional)
MT5_ENABLED=True
MT5_LOGIN=12345678
MT5_PASSWORD=your-mt5-password
MT5_SERVER=YourBroker-Demo
```

**Security Notes:**
- Never commit `.env` to Git
- Use strong SECRET_KEY (32+ characters)
- Gmail: Use App Password, not regular password

---

## 3. Model Training

### 3.1 The ONE Training Notebook

**File:** `ml_models/deeplearning.ipynb` ✅ (ONLY ONE TO USE)

**Deprecated Notebooks** ❌ (DO NOT USE):
- `01_Data_Exploration.ipynb`
- `02_Feature_Engineering.ipynb`
- `03_Model_Training_15min.ipynb`
- `HMM_improved.ipynb`
- `HMM_machine_learning.ipynb`
- `Multi_Currency_Multi_Timeframe_Training.ipynb`
- `Multi_Timeframe_Training_Complete.ipynb`

### 3.2 Training Steps

```python
# 1. Open deeplearning.ipynb in VS Code

# 2. Select Python interpreter (.venv)
# Ctrl+Shift+P → "Python: Select Interpreter" → .venv

# 3. Run cells sequentially:

# Cell 1: Import libraries
# Cell 2: Check TensorFlow/Keras versions
# Cell 3: Load data from data/train/
# Cell 4: Feature engineering (30+ features)
# Cell 5-7: Data preprocessing
# Cell 8-10: Create sequences (window_size=60)
# Cell 11: Train/Val split

# Cell 12-14: Train 15-min model (Transformer+LSTM)
# Cell 15-17: Train 30-min model (Bi-LSTM+Attention)
# Cell 18-20: Train 60-min model (CNN-LSTM)

# Cell 21-25: Evaluate & visualize
# Cell 26-28: Save models to models/ folder
```

### 3.3 Training Configuration

**Hardware Requirements:**
- CPU: 4+ cores recommended
- RAM: 16GB+ recommended
- GPU: Optional (speeds up training 5-10x)

**Training Time:**
- With GPU: ~30-60 minutes total
- Without GPU: ~2-4 hours total

**Expected Output:**
```
models/
├── 15min/
│   ├── multi_currency_15min_best.keras (5-10 MB)
│   ├── multi_currency_15min_scaler.pkl
│   ├── multi_currency_15min_encoder.pkl
│   └── multi_currency_15min_metadata.json
├── 30min/ (similar files)
└── 60min/ (similar files)
```

### 3.4 Retraining Models

**When to retrain:**
- New historical data available
- Model performance degrades
- Adding new currency pairs
- Changing prediction threshold

**Retraining steps:**
```bash
# 1. Update data in data/train/
python scripts/download_data.py  # Optional: download fresh data

# 2. Open deeplearning.ipynb
# 3. Run all cells from top to bottom
# 4. Models automatically saved to models/
# 5. Restart backend to load new models
python backend/app.py
```

---

## 4. Backend Setup

### 4.1 Project Structure

```
backend/
├── app.py                   # Main Flask application ⭐
├── config/
│   ├── .env                 # Environment variables
│   └── settings.py          # Configuration loader
├── utils/
│   └── mt5_handler.py       # MetaTrader 5 integration
└── ml/
    ├── models/              # Model architecture definitions
    │   ├── transformer_lstm.py
    │   ├── bilstm_attention.py
    │   └── cnn_lstm.py
    ├── features/            # Feature engineering
    └── preprocessing/       # Data preprocessing
```

### 4.2 Running Backend

```bash
# Development mode
python backend/app.py

# Production mode (with gunicorn)
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 backend.app:app
```

**Expected Output:**
```
✓ Configuration loaded from: backend/config/.env
✓ Имэйл тохиргоо: you***@gmail.com
✓ MongoDB холбогдлоо

🤖 Multi-Timeframe моделуудыг ачаалж байна...
🔎 TensorFlow version: 2.15.0
🔎 Keras module: keras, version: 3.0.5
✓ 15min .keras модель амжилттай ачааллаа
✓ 15min модель бүрэн ачаалагдлаа
✓ 30min .keras модель амжилттай ачааллаа
✓ 30min модель бүрэн ачаалагдлаа
✓ 60min .keras модель амжилттай ачааллаа
✓ 60min модель бүрэн ачаалагдлаа
✓ 3/3 multi-timeframe модель бэлэн

🔄 MT5 холболт эхлүүлж байна...
✓ MT5 бэлэн болсон

 * Running on http://0.0.0.0:5000
```

### 4.3 API Endpoints

**Test endpoints:**
```bash
# 1. Health check
curl http://localhost:5000/health

# 2. Get currencies
curl http://localhost:5000/currencies

# 3. Prediction
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"currency_pair": "EUR/USD"}'

# 4. Live rates
curl http://localhost:5000/rates/live
```

### 4.4 Backend Configuration

**Key Files:**

**`backend/config/settings.py`:**
```python
# Loads .env variables
# Validates required configs
# Sets default values
```

**`backend/app.py`:**
```python
# Lines 85-256: Model loading
# Lines 390-470: Feature calculation
# Lines 956-1230: Prediction endpoint
# Lines 510-950: Authentication endpoints
```

---

## 5. Mobile App Setup

### 5.1 Installation

```bash
cd mobile_app

# Install dependencies
npm install

# Start Expo
npx expo start
```

### 5.2 Configuration

**File:** `mobile_app/src/config/api.js`

```javascript
// Update API URL
const API_URL = 'http://192.168.1.100:5000';  // Your local IP

// OR for production:
const API_URL = 'https://your-backend-domain.com';

export default API_URL;
```

**Get your local IP:**
```bash
# Windows
ipconfig

# Linux/Mac
ifconfig
# Look for 192.168.x.x
```

### 5.3 Running on Device

**Option 1: Expo Go (Easiest)**
```bash
npx expo start

# 1. Install "Expo Go" app on your phone
# 2. Scan QR code from terminal
# 3. App loads on your phone
```

**Option 2: Android Emulator**
```bash
# Install Android Studio
# Create virtual device (AVD)
# Start emulator
npx expo start --android
```

**Option 3: iOS Simulator (Mac only)**
```bash
npx expo start --ios
```

### 5.4 Mobile App Structure

```
mobile_app/src/
├── screens/
│   ├── LoginScreen.js           # Login UI
│   ├── RegisterScreen.js        # Registration + Email verification
│   ├── HomeScreen.js             # Main dashboard
│   ├── PredictionScreen.js      # Show predictions
│   └── ProfileScreen.js          # User profile + settings
├── components/
│   ├── PredictionCard.js        # Prediction display
│   └── CurrencySelector.js      # Currency picker
├── services/
│   └── api.js                    # API calls (Axios)
├── context/
│   └── AuthContext.js            # Auth state management
└── navigation/
    └── AppNavigator.js           # Navigation setup
```

---

## 6. Database Setup

### 6.1 MongoDB Atlas

**Steps:**

1. **Create Account:**
   - Go to https://cloud.mongodb.com
   - Sign up (free tier available)

2. **Create Cluster:**
   - Create free M0 cluster
   - Choose region (closest to you)
   - Cluster name: `Forex-Signal-Cluster`

3. **Database Access:**
   - Add database user
   - Username: `forex_admin`
   - Password: (generate strong password)
   - Role: `Read and write to any database`

4. **Network Access:**
   - Add IP: `0.0.0.0/0` (allow from anywhere)
   - OR add specific IPs for security

5. **Get Connection String:**
   - Click "Connect" → "Connect your application"
   - Copy connection string:
   ```
   mongodb+srv://forex_admin:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
   ```

6. **Update .env:**
   ```bash
   MONGO_URI=mongodb+srv://forex_admin:YOUR_PASSWORD@cluster.mongodb.net/users_db?retryWrites=true&w=majority
   ```

### 6.2 Collections

**Database Name:** `users_db`

**Collections (auto-created):**
1. `users` - User accounts
2. `verification_codes` - Email verification (TTL: 10 min)
3. `reset_codes` - Password reset (TTL: 10 min)

**Indexes:**
```javascript
// users collection
db.users.createIndex({ email: 1 }, { unique: true })

// verification_codes
db.verification_codes.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 })

// reset_codes
db.reset_codes.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 })
```

### 6.3 Database Schema

See: `docs/database_schema.dbml` (DBML format for dbdiagram.io)

---

## 7. Testing

### 7.1 Backend Tests

```bash
# Test authentication
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@test.com", "password": "test123"}'

# Test prediction
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"currency_pair": "EUR/USD"}'
```

### 7.2 Model Tests

```python
# Run in Python console
import sys
sys.path.append('backend')
from app import models_multi_timeframe

# Check models loaded
for tf in ['15min', '30min', '60min']:
    model = models_multi_timeframe[tf]['model']
    print(f"{tf}: {model is not None}")
```

### 7.3 Mobile App Tests

```bash
# Run app in development
npx expo start

# Test on device
# 1. Login with test account
# 2. Navigate to Prediction screen
# 3. Select currency pair
# 4. Check predictions display correctly
```

---

## 8. Deployment

### 8.1 Backend Deployment (Example: Heroku)

```bash
# 1. Install Heroku CLI
# 2. Login
heroku login

# 3. Create app
heroku create forex-signal-backend

# 4. Add buildpack
heroku buildpacks:add heroku/python

# 5. Set environment variables
heroku config:set MONGO_URI=mongodb+srv://...
heroku config:set SECRET_KEY=...

# 6. Deploy
git push heroku main

# 7. Scale
heroku ps:scale web=1
```

### 8.2 Mobile App Deployment

**Android APK:**
```bash
# Build APK
eas build --platform android

# Or local build
npx expo build:android
```

**iOS (requires Mac + Apple Developer account):**
```bash
eas build --platform ios
```

---

## 9. Troubleshooting

### 9.1 Common Issues

**Issue: Model loading fails**
```
Solution:
1. Check TensorFlow/Keras versions match
2. Reinstall: pip install tensorflow==2.15 keras==3.0.5
3. Check model files exist in models/ folder
```

**Issue: MongoDB connection fails**
```
Solution:
1. Check MONGO_URI format
2. Verify IP whitelist (0.0.0.0/0)
3. Check username/password correct
4. Test connection: mongosh "mongodb+srv://..."
```

**Issue: Mobile app can't connect to backend**
```
Solution:
1. Check API_URL in mobile_app/src/config/api.js
2. Use local IP (not localhost)
3. Ensure backend running: python backend/app.py
4. Check firewall allows port 5000
```

**Issue: Email verification not working**
```
Solution:
1. Check Gmail App Password (not regular password)
2. Enable "Less secure app access" (if needed)
3. Check MAIL_* variables in .env
4. Test: send test email via Flask-Mail
```

### 9.2 Debugging

**Backend Logs:**
```bash
# Run with debug
DEBUG=True python backend/app.py

# Check console for errors
```

**Mobile Logs:**
```bash
# View logs in Expo
npx expo start
# Press 'j' to open debugger
```

**Model Predictions:**
```python
# Debug prediction in Python console
import sys
sys.path.append('backend')
from app import predict

# Test prediction logic
```

---

## 📝 Checklist

### Setup Complete When:

- [ ] Python environment activated
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] `.env` configured with valid credentials
- [ ] MongoDB Atlas connected
- [ ] Models trained and saved in `models/`
- [ ] Backend running successfully (`python backend/app.py`)
- [ ] Mobile app running (`npx expo start`)
- [ ] Can make predictions via API
- [ ] Mobile app connects to backend
- [ ] Authentication works (register, login, verify)

---

## 🎓 Next Steps

1. **Train models** (if not done): Run `deeplearning.ipynb`
2. **Test predictions**: Use Postman or curl
3. **Build mobile app**: Test on device
4. **Deploy**: Choose hosting platform
5. **Monitor**: Set up logging and monitoring

---

**Need Help?**
- GitHub Issues: https://github.com/Asura-lab/Forex-Signal-App/issues
- Documentation: `/docs` folder

---

**Last Updated:** November 10, 2025  
**Status:** ✅ Production-Ready
