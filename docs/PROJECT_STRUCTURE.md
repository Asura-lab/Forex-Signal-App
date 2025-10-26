# 📁 Project Structure - Deep Learning Forex Prediction

**Version:** 1.0.0  
**Date:** October 22, 2025

---

## 🗂️ Complete Directory Structure

```
Forex_signal_app/
│
├── 📂 backend/                          # Flask API Server
│   ├── __init__.py
│   ├── app.py                           # Main Flask application
│   │
│   ├── 📂 config/                       # Configuration files
│   │   ├── __init__.py
│   │   ├── settings.py                  # App settings
│   │   └── ml_config.py                 # ML model configurations
│   │
│   ├── 📂 api/                          # API endpoints
│   │   ├── __init__.py
│   │   ├── auth.py                      # Authentication routes
│   │   ├── predictions.py               # Prediction endpoints ⭐
│   │   ├── historical.py                # Historical data
│   │   └── model_management.py          # Model retraining
│   │
│   ├── 📂 ml/                           # ML Core System ⭐⭐⭐
│   │   ├── __init__.py
│   │   │
│   │   ├── 📂 models/                   # Model definitions
│   │   │   ├── __init__.py
│   │   │   ├── transformer_lstm.py      # Transformer+LSTM model
│   │   │   ├── bilstm_attention.py      # Bi-LSTM with attention
│   │   │   ├── cnn_lstm.py              # CNN-LSTM hybrid
│   │   │   └── ensemble.py              # Ensemble meta-learner
│   │   │
│   │   ├── 📂 features/                 # Feature engineering
│   │   │   ├── __init__.py
│   │   │   ├── technical_indicators.py  # 100+ indicators
│   │   │   ├── candlestick_patterns.py  # Pattern recognition
│   │   │   ├── market_microstructure.py # Order book features
│   │   │   └── feature_store.py         # Feature caching (Redis)
│   │   │
│   │   ├── 📂 preprocessing/            # Data preprocessing
│   │   │   ├── __init__.py
│   │   │   ├── scalers.py               # Normalization
│   │   │   ├── sequence_creator.py      # Sequence generation
│   │   │   └── label_creator.py         # Label generation
│   │   │
│   │   ├── 📂 training/                 # Training pipeline
│   │   │   ├── __init__.py
│   │   │   ├── trainer.py               # Main training loop
│   │   │   ├── callbacks.py             # Custom callbacks
│   │   │   ├── data_generator.py        # Batch generator
│   │   │   └── hyperparameter_tuner.py  # HP optimization
│   │   │
│   │   ├── 📂 inference/                # Live prediction ⭐
│   │   │   ├── __init__.py
│   │   │   ├── live_predictor.py        # Real-time inference
│   │   │   ├── confidence_filter.py     # Signal quality filter
│   │   │   ├── ensemble_voter.py        # Model voting
│   │   │   └── risk_calculator.py       # Entry/TP/SL calculation
│   │   │
│   │   └── 📂 evaluation/               # Model evaluation
│   │       ├── __init__.py
│   │       ├── metrics.py               # Performance metrics
│   │       ├── backtester.py            # Backtesting engine
│   │       └── visualizer.py            # Result visualization
│   │
│   └── 📂 utils/                        # Utility functions
│       ├── __init__.py
│       ├── mt5_handler.py               # MT5 API wrapper
│       ├── logger.py                    # Logging system
│       ├── news_calendar.py             # Economic calendar
│       └── market_regime.py             # Market state detection
│
├── 📂 ml_models/                        # Jupyter Notebooks & Experiments
│   │
│   ├── 📓 01_Data_Exploration.ipynb     # EDA
│   ├── 📓 02_Feature_Engineering.ipynb  # Feature development
│   ├── 📓 03_Model_Training_15min.ipynb # 15-min model ⭐
│   ├── 📓 04_Model_Training_30min.ipynb # 30-min model ⭐
│   ├── 📓 05_Model_Training_60min.ipynb # 60-min model ⭐
│   ├── 📓 06_Ensemble_Training.ipynb    # Meta-learner
│   ├── 📓 07_Backtesting.ipynb          # Performance testing
│   ├── 📓 08_Hyperparameter_Tuning.ipynb# Optimization
│   ├── 📓 09_Model_Comparison.ipynb     # A/B testing
│   └── 📓 10_Production_Testing.ipynb   # Final validation
│
├── 📂 models/                           # Saved Models
│   ├── 📂 15min/
│   │   ├── transformer_lstm_v1.h5
│   │   ├── transformer_lstm_v1.tflite   # Optimized
│   │   ├── scaler_15min.pkl
│   │   └── metadata_15min.json
│   │
│   ├── 📂 30min/
│   │   ├── bilstm_attention_v1.h5
│   │   ├── bilstm_attention_v1.tflite
│   │   ├── scaler_30min.pkl
│   │   └── metadata_30min.json
│   │
│   ├── 📂 60min/
│   │   ├── cnn_lstm_v1.h5
│   │   ├── cnn_lstm_v1.tflite
│   │   ├── scaler_60min.pkl
│   │   └── metadata_60min.json
│   │
│   └── 📂 ensemble/
│       ├── meta_learner_v1.pkl
│       └── ensemble_weights.json
│
├── 📂 data/                             # Dataset storage
│   ├── 📂 train/                        # Training data (2020-2022)
│   │   ├── EUR_USD_1min.csv             # ~3M rows
│   │   ├── GBP_USD_1min.csv
│   │   ├── USD_JPY_1min.csv
│   │   ├── USD_CAD_1min.csv
│   │   ├── USD_CHF_1min.csv
│   │   └── XAU_USD_1min.csv
│   │
│   ├── 📂 validation/                   # Validation data (2023 H1)
│   │   └── [same structure]
│   │
│   ├── 📂 test/                         # Test data (2023 H2 - 2024)
│   │   └── [same structure]
│   │
│   └── 📂 live/                         # Live data cache
│       └── latest_candles.parquet
│
├── 📂 mobile_app/                       # React Native App
│   ├── App.js
│   ├── 📂 src/
│   │   ├── 📂 screens/
│   │   │   ├── SignalScreen.js          # Updated for DL signals
│   │   │   └── [other screens]
│   │   │
│   │   ├── 📂 components/
│   │   │   ├── PredictionCard.js        # New component ⭐
│   │   │   ├── ConfidenceBar.js         # Confidence visualization
│   │   │   ├── MultiTimeframeView.js    # 15/30/60 min view
│   │   │   └── [other components]
│   │   │
│   │   └── 📂 services/
│   │       ├── api.js
│   │       └── predictionService.js     # DL API calls ⭐
│   │
│   └── [other mobile files]
│
├── 📂 scripts/                          # Utility scripts
│   ├── download_data.py                 # MT5 data downloader
│   ├── train_all_models.py              # Batch training
│   ├── evaluate_models.py               # Performance check
│   ├── deploy_models.py                 # Model deployment
│   └── retrain_scheduler.py             # Auto-retrain cron
│
├── 📂 tests/                            # Unit & Integration tests
│   ├── 📂 unit/
│   │   ├── test_models.py
│   │   ├── test_features.py
│   │   ├── test_preprocessing.py
│   │   └── test_inference.py
│   │
│   ├── 📂 integration/
│   │   ├── test_api.py
│   │   ├── test_mt5_connection.py
│   │   └── test_live_prediction.py
│   │
│   └── 📂 performance/
│       ├── test_latency.py
│       └── test_accuracy.py
│
├── 📂 docs/                             # Documentation
│   ├── DEEP_LEARNING_ARCHITECTURE.md    # ✅ Created
│   ├── PROJECT_STRUCTURE.md             # ✅ This file
│   ├── API_DOCUMENTATION.md             # API specs
│   ├── MODEL_TRAINING_GUIDE.md          # Training guide
│   ├── DEPLOYMENT_GUIDE.md              # Deployment steps
│   └── USER_MANUAL.md                   # End-user guide
│
├── 📂 logs/                             # Application logs
│   ├── app.log
│   ├── training.log
│   ├── predictions.log
│   └── errors.log
│
├── 📂 monitoring/                       # Monitoring & dashboards
│   ├── grafana_dashboard.json
│   ├── prometheus_config.yml
│   └── alert_rules.yml
│
├── 📂 docker/                           # Docker configurations
│   ├── Dockerfile.backend
│   ├── Dockerfile.training
│   ├── docker-compose.yml
│   └── .dockerignore
│
├── .gitignore
├── requirements.txt                     # Python dependencies
├── requirements-dev.txt                 # Dev dependencies
├── README.md                            # Project overview
└── .env.example                         # Environment variables
```

---

## 📦 File Descriptions

### 🔥 Critical Files (Start Here)

#### 1. **backend/ml/models/transformer_lstm.py**

```python
"""
Core model architecture for 15-min predictions
- Combines Transformer (global patterns) + LSTM (sequential)
- Expected accuracy: 88-92% with confidence filtering
"""
```

#### 2. **backend/ml/inference/live_predictor.py**

```python
"""
Real-time prediction engine
- Latency: <200ms
- Handles MT5 data ingestion → feature calculation → inference
- Outputs: Direction, Confidence, Entry/TP/SL
"""
```

#### 3. **backend/api/predictions.py**

```python
"""
Flask API endpoints:
- GET /api/predictions/live?symbol=EURUSD
- GET /api/predictions/history?symbol=EURUSD&timeframe=15
- Returns JSON with all 3 timeframe predictions
"""
```

#### 4. **ml_models/03_Model_Training_15min.ipynb**

```jupyter
"""
Interactive training notebook
- Data loading & preprocessing
- Model architecture definition
- Training with visualization
- Evaluation & backtesting
"""
```

---

## 🔧 Development Workflow

### **Notebooks (.ipynb) - For Experimentation**

```
1. Explore data → 01_Data_Exploration.ipynb
2. Design features → 02_Feature_Engineering.ipynb
3. Train models → 03-05_Model_Training_*.ipynb
4. Tune hyperparameters → 08_Hyperparameter_Tuning.ipynb
5. Test ensemble → 06_Ensemble_Training.ipynb
6. Backtest → 07_Backtesting.ipynb
```

**When to use .ipynb:**

- ✅ Data exploration
- ✅ Feature experiments
- ✅ Model prototyping
- ✅ Visualization
- ✅ Quick testing

---

### **Python Files (.py) - For Production**

```
1. Convert notebook code → backend/ml/models/
2. Add error handling
3. Optimize performance
4. Write unit tests
5. Deploy to Flask API
```

**When to use .py:**

- ✅ Production API
- ✅ Automated scripts
- ✅ Background jobs
- ✅ Reusable modules
- ✅ CI/CD pipelines

---

## 🚀 Quick Start Commands

### **1. Setup Environment**

```bash
# Create virtual environment
python -m venv .venv

# Activate
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### **2. Download Training Data**

```bash
python scripts/download_data.py --start-date 2020-01-01 --end-date 2024-10-22
```

### **3. Train Models**

```bash
# Option A: Interactive (Jupyter)
jupyter notebook ml_models/03_Model_Training_15min.ipynb

# Option B: Automated (Python)
python scripts/train_all_models.py --config config/training_config.yaml
```

### **4. Test Predictions**

```bash
# Run Flask API
python backend/app.py

# Test endpoint
curl http://localhost:5000/api/predictions/live?symbol=EURUSD
```

### **5. Run Tests**

```bash
pytest tests/ -v --cov=backend/ml
```

---

## 📊 Data Flow

```
┌─────────────────────────────────────────────────┐
│  MT5 LIVE DATA                                  │
│  - 1-minute candles                             │
│  - Bid/Ask prices                               │
│  - Volume                                       │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  FEATURE ENGINEERING (backend/ml/features/)     │
│  - technical_indicators.py (100+ indicators)    │
│  - candlestick_patterns.py (15 patterns)        │
│  - market_microstructure.py (order book)        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  PREPROCESSING (backend/ml/preprocessing/)      │
│  - scalers.py (normalization)                   │
│  - sequence_creator.py (60-120 timesteps)       │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  MODEL INFERENCE (backend/ml/inference/)        │
│  - live_predictor.py                            │
│  - 3 models in parallel (15/30/60 min)         │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  ENSEMBLE VOTING (backend/ml/inference/)        │
│  - ensemble_voter.py                            │
│  - Weighted average by confidence               │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  QUALITY FILTER (backend/ml/inference/)         │
│  - confidence_filter.py                         │
│  - Only output if confidence > 85%              │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  API RESPONSE (backend/api/predictions.py)      │
│  - JSON format                                  │
│  - Mobile app receives signal                   │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Development Priorities

### **Phase 1: Core ML System (Week 1-2)**

```
Priority 1: Create training notebooks
├── 03_Model_Training_15min.ipynb
├── 04_Model_Training_30min.ipynb
└── 05_Model_Training_60min.ipynb

Priority 2: Implement model architectures
├── backend/ml/models/transformer_lstm.py
├── backend/ml/models/bilstm_attention.py
└── backend/ml/models/cnn_lstm.py

Priority 3: Feature engineering
└── backend/ml/features/technical_indicators.py
```

### **Phase 2: Integration (Week 3)**

```
Priority 1: Live prediction system
└── backend/ml/inference/live_predictor.py

Priority 2: API endpoints
└── backend/api/predictions.py

Priority 3: Mobile app integration
└── mobile_app/src/services/predictionService.js
```

### **Phase 3: Testing & Optimization (Week 4)**

```
Priority 1: Backtesting
└── ml_models/07_Backtesting.ipynb

Priority 2: Performance optimization
├── Model quantization (TFLite)
└── Feature caching (Redis)

Priority 3: Deployment
└── Docker containers
```

---

## 📝 Naming Conventions

### **Files**

```
- Notebooks:  01_PascalCase_Description.ipynb
- Python:     snake_case_module.py
- Models:     transformer_lstm_v1.h5
- Configs:    service_config.yaml
```

### **Code**

```python
# Classes: PascalCase
class TransformerLSTMModel:
    pass

# Functions: snake_case
def calculate_technical_indicators(df):
    pass

# Constants: UPPER_SNAKE_CASE
MAX_SEQUENCE_LENGTH = 120

# Variables: snake_case
prediction_confidence = 0.92
```

---

## 🔐 Environment Variables

```bash
# .env file structure
# MT5 Configuration
MT5_LOGIN=12345678
MT5_PASSWORD=YourPassword
MT5_SERVER=MetaQuotes-Demo

# Database
MONGODB_URI=mongodb://localhost:27017/forex_db

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379

# Model Paths
MODEL_15MIN_PATH=models/15min/transformer_lstm_v1.h5
MODEL_30MIN_PATH=models/30min/bilstm_attention_v1.h5
MODEL_60MIN_PATH=models/60min/cnn_lstm_v1.h5

# API Configuration
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-secret-key-here

# Monitoring
ENABLE_MONITORING=True
GRAFANA_URL=http://localhost:3000
```

---

## 📚 Dependencies

### **Core ML**

```
tensorflow>=2.15.0
keras>=2.15.0
scikit-learn>=1.3.0
numpy>=1.24.0
pandas>=2.0.0
```

### **Feature Engineering**

```
ta>=0.11.0  # Technical analysis
mplfinance>=0.12.0  # Candlestick patterns
```

### **Data & API**

```
MetaTrader5>=5.0.45
flask>=3.0.0
flask-cors>=4.0.0
pymongo>=4.5.0
redis>=5.0.0
```

### **Monitoring**

```
prometheus-client>=0.18.0
grafana-api>=1.0.3
```

---

## 🎓 Learning Resources

### **For ML Beginners**

1. Start with: `01_Data_Exploration.ipynb`
2. Read: `docs/DEEP_LEARNING_ARCHITECTURE.md`
3. Watch TensorFlow tutorials
4. Practice with: `02_Feature_Engineering.ipynb`

### **For Experienced Developers**

1. Jump to: `backend/ml/models/`
2. Review: Production code structure
3. Optimize: Latency & accuracy
4. Deploy: Docker containers

---

**Document Version:** 1.0.0  
**Last Updated:** October 22, 2025  
**Maintainer:** AI Development Team  
**Status:** Ready ✅
