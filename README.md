# Predictrix — AI Forex Signal App

**Диплом судалгааны ажил** | React Native | Flask (Azure) | GBDT Ensemble ML | MongoDB

---

## Зорилго ба зориулалт

Predictrix нь **EUR/USD** валютын хосын Forex арилжааны дохиог машин сургалтаар таамаглах систем юм. Энэ төсөл нь дипломын ажлын судалгааны хэрэглэгдэхүүн бөгөөд дараах асуудлыг шийдвэрлэхийг зорьсон:

> *"Техникийн дүн шинжилгээний олон timeframe-ийн мэдээллийг нэгтгэсэн GBDT ensemble загвар нь Forex зах зээлд ашигтай арилжааны дохиог найдвартай таамаглах боломжтой юу?"*

Судалгааны гол зорилтууд:
- 6 өөр timeframe-ийн (M1–H4) техникийн үзүүлэлтүүдийг (48 feature) нэгтгэн загвар бүтээх
- Overfitting-ийг бодитоор шийдэх — validation дээр calibrated probability үүсгэх
- Backtest-ийн үр дүнг эрсдэлийн удирдлагатай хамт (Sharpe, Drawdown, PF) үнэлэх
- Загварыг production мобайл аппликейшнтэй нэгтгэж, бодит цагийн дохио гаргах

---

## ML Загварын архитектур

### Ensemble GBDT (Phase 7B)

Загвар нь 3 gradient boosting алгоритмыг тэнцүү жинтэйгээр нийлүүлсэн ensemble юм:

```
Input: 48 Multi-Timeframe Features (M1, M5, M15, M30, H1, H4)
         │
    ┌────┴────────────────────────────────────┐
    │                                         │
LightGBM          XGBoost              CatBoost
(496 trees,       (~400 trees,         (499 trees,
 GPU, L1+L2)       CPU-hist, L1+L2)    GPU, L2=3.0)
    │                  │                    │
    └──────────────────┴────────────────────┘
                       │
              Equal-Weight Averaging
                       │
              Probability Calibration
              (Logistic Regression)
                       │
         3-Class Output: BUY / HOLD / SELL
                + Confidence Score (0–1)
```

**Anti-overfitting дизайн (Phase 7B шийдэл):**

Phase 6B-д training accuracy 100% (overfitting!), backtest win rate зөвхөн 37.2% байсан.
Phase 7B-д дараах аргуудаар шийдэв:

| Техник | Тохиргоо | Нөлөө |
|--------|----------|-------|
| Багтаамж бууруулах | max_depth: 8→5, num_leaves: 128→31 | Noise-г цаашид цагхааж чадахгүй |
| L1/L2 regularization | reg_alpha=0.1, reg_lambda=1.0–3.0 | Жин хасах, sparse features |
| Early stopping | 50 round, 2023 validation дээр | Overfitting-ийн өмнө зогсоох |
| Удаан сургалт | learning rate: 0.05→0.03 | Алхам алхмаар ерөнхийлөх |
| Probability calibration | Logistic Regression | Raw score → бодит магадлал |

---

## Өгөгдөл ба сургалт

**EUR/USD 1-minute OHLCV өгөгдөл (2015–2025):**

```
Нийт өгөгдөл:   3,715,131 мөр (3.7M)
├── Train:       2,972,624 мөр  (2015–2022)
├── Validation:    371,125 мөр  (2023)    ← Early stopping, calibration
├── Test:          371,382 мөр  (2024)    ← Загваруудад харуулаагүй
└── Backtest:      359,639 мөр  (2025)    ← Signal үүсгэх
```

**48 Feature инженерчлэл (6 timeframe × 8 feature):**

| Feature | Тайлбар |
|---------|---------|
| RSI(14), RSI(7) | Momentum oscillator |
| ATR(14) | Volatility хэмжилт |
| SMA(20), SMA(50) | Trend чиглэл |
| MACD, Signal, Hist | Trend хүч |
| Bollinger Bands | Volatility хүрээ |

**Label үүсгэлт:** 4 цагийн дотор 30+ pips хөдлөх — BUY / SELL, бусад — HOLD

```
BUY:   451,686  (12.2%)
SELL:  453,559  (12.2%)
HOLD:  2,809,886 (75.6%)   ← Зах зээлийн 75% нь range
```

---

## Загварын гүйцэтгэл

### Accuracy (Classification)

| Dataset | Samples | Accuracy | High-conf (≥0.92) accuracy |
|---------|---------|----------|---------------------------|
| Train (2015–2022) | 2,378,099 | 77.4% | 97.8% |
| Validation (2023) | 371,125 | 80.2% | 96.2% |
| Test (2024) | 371,382 | 87.4% | — |

Train–Validation gap: −2.8% → Overfitting хамгийн бага

**Confidence calibration:**
```
Confidence 0.85–0.90  →  ~72% accuracy
Confidence 0.90–0.92  →  ~84% accuracy
Confidence 0.92–0.95  →  ~91% accuracy  ✅ Production threshold
Confidence 0.95+      →  ~97% accuracy
```

### Backtest үр дүн (2025 он, EUR/USD)

**Систем:**  1% risk per trade, ATR×5 SL, ATR×15 TP (1:3 R/R)

| Хэмжүүр | Утга | Тайлбар |
|---------|------|---------|
| **Annual Return** | **+41.61%** | S&P 500 (~10%) -аас хамаагүй өндөр |
| **Sharpe Ratio** | **9.64** | Институцийн түвшин (>3.0 = сайн) |
| **Profit Factor** | **2.46** | Ашигтай (>2.0 = маш сайн) |
| **Max Drawdown** | **3.93%** | Маш бага эрсдэл |
| **Win Rate** | **44.44%** (20/45) | 1:3 R/R-тэй хамт ашигтай |
| **Total Trades** | 45 (12 сар) | Overtrading байхгүй |
| **Recovery Factor** | 6.69 | Drawdown-аас хурдан сэргэдэг |
| **Avg Confidence** | 0.923 | Зөвхөн өндөр итгэлтэй дохио |
| **Total Signals gen.** | 1,065 | Маш сонгомол (0.3% нь арилжаа болдог) |

> **Тэмдэглэл:** Win rate 44% харагдах боловч 1:3 risk/reward харьцаатай учир ашигтай.
> 20 ялалт × ~28 pips = +560 pips, 25 ялагдал × ~9.4 pips = −235 pips → Net: +325 pips

---

## Системийн архитектур

```
┌────────────────────────────────────────────────┐
│          PREDICTRIX MOBILE APP                 │
│          React Native + Expo SDK 51            │
│                                                │
│  Signal  │  Live Rates  │  News  │  Auth/Profile│
└────────────────────────────────────────────────┘
                    ↕ HTTPS + JWT
┌────────────────────────────────────────────────┐
│    BACKEND — Azure App Service (Korea Central) │
│    Flask REST API + Gunicorn                   │
│                                                │
│  GBDT Signal Engine  │  Gemini AI Analyst      │
│  JWT + bcrypt Auth   │  Twelve Data Rates      │
│  MongoDB Atlas       │  Expo Push Notifications│
└────────────────────────────────────────────────┘
        ↕                  ↕               ↕
  MongoDB Atlas      Twelve Data API   ForexFactory
  (users, signals)  (20+ pairs, OHLCV) (news, events)
```

---

## Технологийн стек

### Backend (Azure App Service, Korea Central)

| Технологи | Зориулалт |
|-----------|-----------|
| Python 3.11 + Flask | REST API (30+ endpoint) |
| Gunicorn | Production WSGI |
| LightGBM, XGBoost, CatBoost | GBDT ensemble загвар |
| scikit-learn | Calibration, pipeline |
| pandas, numpy | Өгөгдлийн боловсруулалт |
| PyMongo | MongoDB Atlas |
| PyJWT + bcrypt | Аутентификаци |
| Flask-Mail | Email OTP |
| Google Gemini AI | Зах зээлийн AI дүн шинжилгээ |

### Mobile App (React Native + Expo)

| Технологи | Зориулалт |
|-----------|-----------|
| React Native 0.74 + Expo SDK 51 | Android/iOS |
| React Navigation 6 | Дэлгэц навигаци |
| Axios + TanStack Query | API & cache |
| AsyncStorage | Token хадгалалт |
| expo-notifications | Push notification |

---

## Файлын бүтэц

```
Forex-Signal-App/
├── backend/
│   ├── app.py                       # Flask API (30+ endpoint)
│   ├── Procfile / runtime.txt       # Azure deploy тохиргоо
│   ├── config/settings.py           # Env config
│   ├── ml/
│   │   ├── signal_generator_gbdt.py # GBDT inference engine
│   │   └── models/                  # Trained .joblib files
│   └── utils/
│       ├── twelvedata_handler.py    # Live rates
│       ├── market_analyst.py        # Gemini AI
│       └── push_notifications.py
│
├── mobile_app/
│   ├── app.json / eas.json          # Expo + EAS config
│   └── src/
│       ├── screens/                 # Signal, Rates, News, Auth
│       ├── services/api.ts          # Backend calls
│       ├── config/api.ts            # Azure URL
│       └── context/ navigation/
│
├── model & backtest result/
│   ├── code/                        # train_models.py, generate_signals_2025.py
│   ├── data/                        # EUR/USD M1–H4 CSV (2015–2025)
│   ├── models/                      # GBDT .joblib artifacts
│   ├── figures/                     # equity_curve, drawdown, feature_importance...
│   ├── results/                     # backtest_summary.txt, signals_2025.csv
│   └── documentation/               # Phase 7B technical report
│
├── diplom/                          # Дипломын ажил (LaTeX, XeLaTeX)
├── mt5/                             # MetaTrader 5 EA scripts
├── docs/                            # Privacy policy, terms of service
└── tests/
```

---

## Backtest харьцуулалт (Хөгжлийн үе шатууд)

| Хувилбар | Win Rate | Profit Factor | Sharpe | Max DD | Тайлбар |
|---------|----------|---------------|--------|--------|---------|
| Phase 5 | 46.6% | 1.53 | — | 22.5% | Эхний baseline |
| Phase 6B | 37.2% | — | — | — | Overfitting (train 100%!) |
| **Phase 7B** | **44.4%** | **2.46** | **9.64** | **3.93%** | Anti-overfitting, calibrated |

Phase 6B-аас Phase 7B руу шилжихдээ overfitting-ийг арилгаж, Sharpe ratio 9.64-д хүрсэн нь системийн хамгийн том ахиц юм.

---

## Android APK

**[⬇ Хамгийн сүүлийн APK татах](https://github.com/Asura-lab/Forex-Signal-App/releases/latest)**

```
Minimum: Android 6.0 (API 23)
Суулгахдаа "Unknown sources" зөвшөөрнө үү
```

---

## Backend API (Azure)

`https://predictrix-cvhvhtheawabdahg.koreacentral-01.azurewebsites.net`

| Group | Endpoint | Method |
|-------|----------|--------|
| Auth | `/auth/register`, `/auth/login`, `/auth/verify-email` | POST |
| Auth | `/auth/me`, `/auth/update` | GET/PUT |
| Signal | `/signal`, `/predict` | GET/POST |
| Rates | `/rates/live`, `/rates/specific` | GET |
| Analysis | `/api/market-analysis`, `/api/news` | GET |
| System | `/health` | GET |

---

## Хөгжүүлэлтийн орчин

```bash
# Backend
git clone https://github.com/Asura-lab/Forex-Signal-App.git
cd Forex-Signal-App
python -m venv .venv && .venv\Scripts\activate
pip install -r backend/requirements.txt
# backend/config/.env: MONGO_URI, SECRET_KEY, TWELVEDATA_API_KEY, GEMINI_API_KEY_1
python backend/app.py

# Mobile
cd mobile_app && npm install
npx expo start
# EAS build
npx eas build --platform android --profile preview
```

---

## Хувилбарын түүх

| Хувилбар | Огноо | Өөрчлөлт |
|---------|-------|----------|
| **v0.4.3** | 2026-02-27 | yfinance data source, AI prompt сайжруулалт, icon шинэчлэл, scrollbar нуух, мэдэгдэлийн navigation засвар, MongoDB offline горим |
| **v0.4.2** | 2026-02-26 | News impact filter засвар, мэдэгдлийн тохиргоо upsert засвар |
| v0.4.1 | 2026-02-26 | Бүх emoji-г icon-оор сольсон, About хэсэг шинэчилсэн, GBDT загварын мэдээлэл нэмсэн |
| v0.4.0 | 2026-02-24 | Backend Azure App Service-д байршсан |
| v0.3.3 | 2026-02-23 | Bug fix, UI сайжруулалт |
| v0.3.2 | 2026-02-23 | Push notification |
| v0.3.1 | 2026-02-22 | Market analysis, news feed |
| v0.3.0 | 2026-02-22 | GBDT multi-timeframe ensemble нэвтрүүлсэн |

---

## Зохиогч

Судалгааны ажил, дипломын зорилгоор хийгдсэн. Бодит арилжаанд ашиглахдаа өөрийн эрсдэлээр хэрэглэнэ үү.

**Asura-lab** · [github.com/Asura-lab](https://github.com/Asura-lab)
