# Predictrix Forex Signal App

## English

Predictrix is a mobile + backend forex signal system focused on **EUR/USD live signal generation** using a locked production ML model.

### Current Version Scope

- Mobile app: React Native (Expo), version 0.4.3
- Backend: Flask API + MongoDB
- Signal model: Multi-timeframe GBDT ensemble
- Runtime policy: **single active model only**

### Single-Model Runtime Policy

- Backend loads only: `backend/ml/models/EURUSD_gbdt_experimental.pkl`
- No model switching via environment variables
- No baseline/secondary model fallback
- If this file is missing, model loading fails by design

### Main Components

- `backend/app.py`: API server, auth, signal endpoints, background jobs
- `backend/ml/signal_generator_gbdt.py`: feature build + prediction engine
- `mobile_app/App.tsx`: app entry
- `mobile_app/src/screens/PredictionScreen.tsx`: live signal UI
- `mobile_app/src/screens/ProfileScreen.tsx`: in-app help/legal text modal
- `docs/`: privacy policy and terms

### Local Setup

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Mobile:

```bash
cd mobile_app
npm install
npm start
```

### Environment Notes

- `SAVE_CONFIDENCE_THRESHOLD` is optional and controls DB save threshold for auto-signals.
- Do not configure model-path/model-variant environment variables; they are not used.

### Disclaimer

This project is for research and educational use.
It does not provide financial advice.

---

## Монгол

Predictrix нь **EUR/USD хос дээр бодит цагийн сигнал гаргахад төвлөрсөн** mobile + backend систем бөгөөд ML runtime нь нэг тогтмол моделтой ажиллана.

### Одоогийн хувилбарын хүрээ

- Mobile апп: React Native (Expo), 0.4.3
- Backend: Flask API + MongoDB
- Сигнал модел: олон timeframe-тэй GBDT ensemble
- Runtime бодлого: **зөвхөн нэг идэвхтэй модел**

### Нэг моделийн runtime бодлого

- Backend зөвхөн энэ файлыг ачаална: `backend/ml/models/EURUSD_gbdt_experimental.pkl`
- Environment variable-аар модел солих боломжгүй
- Baseline эсвэл өөр fallback модел ашиглахгүй
- Энэ файл байхгүй бол зориуд алдаа өгч ачаалахгүй

### Гол бүрэлдэхүүн хэсгүүд

- `backend/app.py`: API сервер, нэвтрэлт, сигнал endpoint-ууд, background job-ууд
- `backend/ml/signal_generator_gbdt.py`: feature тооцоо + таамаглалын хөдөлгүүр
- `mobile_app/App.tsx`: аппын эхлэл
- `mobile_app/src/screens/PredictionScreen.tsx`: live сигналын дэлгэц
- `mobile_app/src/screens/ProfileScreen.tsx`: апп доторх тусламж/эрх зүйн текст
- `docs/`: нууцлал ба үйлчилгээний нөхцлийн баримт бичиг

### Local ажиллуулах

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Mobile:

```bash
cd mobile_app
npm install
npm start
```

### Орчны тохиргооны тэмдэглэл

- `SAVE_CONFIDENCE_THRESHOLD` хувьсагч нь автоматаар хадгалах босгыг удирдана (сонголтот).
- Model path/model variant хувьсагчид ашиглагдахгүй.

### Анхааруулга

Энэ төсөл нь судалгаа, сургалтын зориулалттай.
Санхүүгийн зөвлөгөө өгөхгүй.
