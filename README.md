# 📱 Predictrix - AI-Powered Forex Predictions

MongoDB + JWT Authentication | React Native | HMM Machine Learning

> **Судалгааны ажил**: HMM (Hidden Markov Model) ашиглан форекс хослолуудын хөдөлгөөнийг таамаглах React Native аппликейшн

---

## 📋 Агуулга

1. [Тойм](#тойм)
2. [5 Ангилал](#5-ангилал)
3. [Технологи](#технологи)
4. [Файлын бүтэц](#файлын-бүтэц)
5. [Суулгах](#суулгах)
6. [Ашиглах](#ашиглах)
7. [Архитектур](#архитектур)

8. [API Documentation](#-api-documentation)

## 🎯 Тойм

---

Энэ аппликейшн нь форекс хослолуудын өмнөх түүхэн дата дээр дүн шинжилгээ хийж, одоо ямар хөдөлгөөн үзүүлэх хандлагатай байгааг HMM (Hidden Markov Model) ашиглан таамаглана.

## 🎯 Тойм

### Онцлог шинж чанарууд:

Hidden Markov Model (HMM) ашиглан форекс ханшийн хөдөлгөөнийг таамаглах React Native mobile application.

- ✅ **5 ангилалын таамаглал** (өндөр/дунд хэлбэлзэл өсөх/буурах, чиглэлгүй)

### 🎯 Онцлог шинж чанарууд:- ✅ **Walking Forward Analysis** - цаг хугацааны дагуу сургалт

- ✅ **Backtest шалгалт** - test дата дээр үр дүн үнэлэх

- ✅ **MongoDB + JWT Authentication** - Аюулгүй хэрэглэгч бүртгэл- ✅ **6 валютын хос дэмжих** (EUR/USD, GBP/USD, USD/CAD, USD/CHF, USD/JPY, XAU/USD)

- ✅ **HMM Machine Learning** - 6 валютын хос (EUR/USD, GBP/USD, USD/CAD, USD/CHF, USD/JPY, XAU/USD)- ✅ **Real-time магадлал** - ангилал тус бүрийн магадлалыг үзүүлнэ

- ✅ **React Native Mobile App** - Cross-platform (iOS & Android)- ✅ **Харагдах байдал** - Confusion matrix, Classification report

- ✅ **Real-time Predictions** - 5 төрлийн сигнал (STRONG BUY, BUY, NEUTRAL, SELL, STRONG SELL)

- ✅ **Profile Management** - Нэр засварлах, нууц үг солих## 🏆 5 Ангилал

- ✅ **Statistics** - Хэрэглэгчийн статистик мэдээлэл

Аппликейшн форекс хөдөлгөөнийг дараах 5 ангилалд хуваана:

---

| Код | Ангилал | Тайлбар |

## 📁 Шинэ Бүтэц| --- | ----------------------------- | -------------------------- |

| 0 | **High volatility down** 📉💥 | Өндөр хэлбэлзэлтэй бууралт |

```````| 1   | **Medium volatility down** 📉 | Дунд хэлбэлзэлтэй бууралт  |

Forex_signal_app/| 2   | **No trend** ➡️               | Чиглэлгүй (хажуу тийш)     |

│| 3   | **Medium volatility up** 📈   | Дунд хэлбэлзэлтэй өсөлт    |

├── 📂 backend/                 # Backend кодууд| 4   | **High volatility up** 📈🚀   | Өндөр хэлбэлзэлтэй өсөлт   |

│   ├── api/                    # API endpoints

│   │   ├── auth_api.py        # Authentication API (MongoDB + JWT)## 🛠️ Технологи

│   │   └── prediction_api.py  # Prediction API (Machine Learning)

│   ├── config/                 # Configuration файлууд### Backend & Machine Learning:

│   │   ├── .env               # Environment variables

│   │   └── settings.py        # Тохиргооны файл- **Python 3.8+**

│   └── utils/                  # Helper функцууд- **hmmlearn** - Hidden Markov Model

│- **scikit-learn** - Feature scaling, үнэлгээ

├── 📂 mobile_app/              # React Native аппликейшн- **pandas & numpy** - Дата боловсруулалт

│   ├── src/- **Flask** - REST API

│   │   ├── components/        # Reusable components- **Jupyter Notebook** - Модель сургалт

│   │   ├── screens/           # Screen components

│   │   ├── services/          # API services### Mobile App (React Native):

│   │   ├── config/            # App configuration

│   │   └── utils/             # Helper функцууд- **React Native + Expo** - Cross-platform mobile app

│   ├── App.js                 # Main app component- **React Navigation** - Navigation system

│   └── package.json           # Dependencies- **axios** - API холболт

│- **Linear Gradient** - UI дизайн

├── 📂 ml_models/               # Machine Learning- **Chart Kit** - График харуулалт

│   └── HMM_machine_learning.ipynb  # Jupyter notebook

│## 📁 Файлын бүтэц

├── 📂 data/                    # Өгөгдлийн сан

│   ├── train/                 # Сургалтын өгөгдөл```

│   └── test/                  # Тестийн өгөгдөлForex_signal_app/

││

├── 📂 models/                  # Сургагдсан моделиуд (.pkl файлууд)├── 📊 data/

││   ├── train/              # Сургалтын датанууд

├── 📂 scripts/                 # Utility scripts│   │   ├── EUR_USD_1min.csv

│   └── download_data.py       # Өгөгдөл татах script│   │   ├── GBP_USD_1min.csv

││   │   ├── USD_CAD_1min.csv

├── 📂 docs/                    # Documentation файлууд│   │   ├── USD_CHF_1min.csv

││   │   ├── USD_JPY_1min.csv

├── .gitignore│   │   └── XAU_USD_1min.csv

├── requirements.txt           # Python dependencies│   │

└── README.md                  # Энэ файл│   └── test/               # Test датанууд (Backtest)

```│       ├── EUR_USD_test.csv

│       ├── GBP_USD_test.csv

---│       ├── USD_CAD_test.csv

│       ├── USD_CHF_test.csv

## 🛠️ Технологи│       ├── USD_JPY_test.csv

│       └── XAU_USD_test.csv

### Backend & Machine Learning:│

├── 🤖 models/              # Сургагдсан моделиуд (автоматаар үүснэ)

- **Python 3.13+**│   ├── hmm_forex_model.pkl

- **Flask** - REST API│   └── hmm_scaler.pkl

- **MongoDB Atlas** - NoSQL Database│

- **PyJWT** - JSON Web Tokens├── � mobile_app/          # React Native аппликейшн

- **bcrypt** - Password hashing│   ├── src/

- **scikit-learn** - Machine Learning│   │   ├── components/    # UI компонентууд

- **hmmlearn** - Hidden Markov Models│   │   ├── screens/       # Дэлгэцүүд

- **pandas, numpy** - Data processing│   │   ├── services/      # API холболт

│   │   └── utils/         # Туслах функцууд

### Mobile App:│   ├── App.js

│   ├── package.json

- **React Native** - Cross-platform framework│   └── README.md          # Mobile app заавар

- **Expo** - Development platform│

- **React Navigation** - Navigation├── �📓 HMM_machine_learning.ipynb  # ҮНДСЭН: Модель сургалт

- **AsyncStorage** - Local storage├── 🌐 backend_api.py               # Backend REST API

- **Axios/Fetch** - API requests├── 📥 download_data.py             # Дата татах скрипт

├── 📋 requirements.txt             # Python dependencies

---├── 📖 REACT_NATIVE_GUIDE.md        # React Native гарын авлага

└── 📘 README.md                    # Энэ файл

## 📦 Суулгах```



### 1️⃣ Repository татах## 🚀 Суулгах



```bash### 1. Python орчин бэлдэх

git clone https://github.com/Asura-lab/Forex-Signal-App.git

cd Forex-Signal-App```powershell

```# Python шаардлагатай эсэхээ шалгах

python --version

### 2️⃣ Backend суулгах

# Virtual environment үүсгэх (санал болгож байна)

```bashpython -m venv venv

# Virtual environment үүсгэх.\venv\Scripts\activate

python -m venv .venv

# Шаардлагатай сангууд суулгах

# Activate хийх (Windows)pip install -r requirements.txt

.venv\Scripts\activate```



# Dependencies суулгах### 2. Модель сургах

pip install -r requirements.txt

``````powershell

# Jupyter Notebook эхлүүлэх

### 3️⃣ Environment тохируулахjupyter notebook HMM_machine_learning.ipynb

```````

`backend/config/.env` файл үүсгэх:

**Дараах дарааллаар cell-үүдийг ажиллуулна:**

```env

# MongoDB Connection1. ✅ Сангууд импортлох

MONGO_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/database_name2. ✅ Дата боловсруулах функцууд

3. ✅ 5 ангилалын шошго үүсгэх функц

# JWT Secret Key4. ✅ HMM модель сургах функцууд

SECRET_KEY=your_super_secret_key_here5. ✅ Walking Forward Analysis функц

6. ✅ Үнэлгээний функцууд

# API Configuration7. ✅ Сургалтын дата ачаалах

API_HOST=0.0.0.08. ✅ Walking Forward сургалт

API_PORT=50019. ✅ Test дата дээр Backtest

DEBUG=True10. ✅ Эцсийн модель хадгалах

```

**Хүлээгдэж буй үр дүн:**

### 4️⃣ Mobile App суулгах

- `models/hmm_forex_model.pkl` - Сургагдсан модель

```bash- `models/hmm_scaler.pkl` - Feature scaler

cd mobile_app- Сургалтын болон test нарийвчлал хэвлэгдэнэ

# Dependencies суулгах### 3. Backend API эхлүүлэх

npm install

```powershell

# Start Expo# Backend API эхлүүлэх

npm startpython backend_api.py

```

---API хаяг: `http://localhost:5000`

## 🚀 Ашиглах**Endpoints:**

### Backend API эхлүүлэх- `GET /` - API мэдээлэл

- `GET /model_info` - Моделийн мэдээлэл

```bash- `POST /predict` - Шинэ дата дээр таамаглал

# Authentication API- `POST /predict_file` - CSV файлаас таамаглал

cd backend/api

python auth_api.py### 4. React Native аппликейшн ажиллуулах

# Prediction API```powershell

python prediction_api.py# Mobile app folder руу очих

````cd mobile_app



API ажиллах хаяг:# Dependencies суулгах

- Authentication: `http://localhost:5001`npm install

- Prediction: `http://localhost:5000`

# Backend IP хаяг тохируулах

### Mobile App эхлүүлэх# src/services/api.js файлд API_BASE_URL өөрчлөх



```bash# Аппликейшн эхлүүлэх

cd mobile_appnpm start

npm start

# Android/iOS дээр ажиллуулах

# Android эмулятор дээрnpm run android  # Android

anpm run ios      # iOS (Mac only)

````

# iOS simulator дээр

i**Дэлгэрэнгүй:** [`mobile_app/README.md`](mobile_app/README.md)

# Web browser дээр## 📖 Ашиглах

w

````### Backend ашиглах жишээ (Python):



**Анхааруулга:** Android эмулятор дээр API холболт:```python

- Backend URL: `http://10.0.2.2:5001` (localhost-ийн оронд)import requests



---# API статус шалгах

response = requests.get('http://localhost:5000/')

## 📡 API Documentationprint(response.json())



### Authentication Endpoints# Файлаас таамаглал хийх

data = {

#### POST `/auth/register`    'file_path': 'data/test/EUR_USD_test.csv'

Шинэ хэрэглэгч бүртгүүлэх}

response = requests.post('http://localhost:5000/predict_file', json=data)

**Request:**result = response.json()

```json

{print(f"Сүүлчийн таамаглал: {result['latest_prediction']['trend']}")

  "name": "John Doe",print(f"Нийт дата: {result['total_predictions']}")

  "email": "john@example.com",```

  "password": "password123"

}### React Native аппликейшн ашиглах:

````

#### 📱 Mobile App Онцлогууд:

**Response:**

````json1. **Үндсэн дэлгэц**

{

  "success": true,   - 6 валютын хослолын жагсаалт

  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",   - Real-time сигнал (emoji)

  "user": {   - Pull-to-refresh шинэчлэлт

    "id": "...",   - API холболтын статус

    "name": "John Doe",

    "email": "john@example.com"2. **Дэлгэрэнгүй дэлгэц**

  }

}   - Сигналын мэдээлэл (Strong Buy/Sell, Buy/Sell, Hold)

```   - Итгэлцлийн түвшин (%)

   - Худалдааны зөвлөмж

#### POST `/auth/login`   - Статистикийн график

Нэвтрэх   - Дэлгэрэнгүй мэдээлэл



**Request:**3. **Онцлогууд**

```json   - Gradient UI design

{   - Touch animations

  "email": "john@example.com",   - Real-time update

  "password": "password123"   - Error handling

}   - Loading states

````

**Дэлгэрэнгүй:** [`mobile_app/README.md`](mobile_app/README.md)

#### POST `/auth/verify`

Token шалгах## 🏗️ Архитектур

**Request:**```

````json┌─────────────────────────────────────────────────┐

{│          React Native Mobile App                │

  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."│  (User Interface - Харилцах хэсэг)              │

}└───────────────┬─────────────────────────────────┘

```                │ HTTP Requests (axios)

                ↓

#### GET `/auth/me`┌─────────────────────────────────────────────────┐

Өөрийн мэдээлэл авах (Token шаардлагатай)│           Flask Backend API                     │

│  (REST API - Дата хүлээн авах/илгээх)           │

**Headers:**└───────────────┬─────────────────────────────────┘

```                │ Loads Model

Authorization: Bearer <token>                ↓

```┌─────────────────────────────────────────────────┐

│        HMM Machine Learning Model               │

#### PUT `/auth/update`│  (Сургагдсан модель - Таамаглал хийх)           │

Мэдээлэл шинэчлэх└───────────────┬─────────────────────────────────┘

                │ Trained on

**Headers:**                ↓

```┌─────────────────────────────────────────────────┐

Authorization: Bearer <token>│          Historical Forex Data                  │

```│  (CSV файлууд - Түүхэн дата)                    │

└─────────────────────────────────────────────────┘

**Request:**```

```json

{### Дата урсгал:

  "name": "New Name"

}1. **Сургалт** (Training):

````

````

#### PUT `/auth/change-password`   CSV Data → Feature Engineering → HMM Training → Saved Model

Нууц үг солих   ```



**Headers:**2. **Таамаглал** (Prediction):

````

Authorization: Bearer <token> ```

```New Data → Feature Engineering → Model Prediction → API Response → Mobile App

```

**Request:**

````json3. **Walking Forward**:

{   ```

  "oldPassword": "old_password",   [Training Window 1] → Predict → Move Forward

  "newPassword": "new_password"   [Training Window 2] → Predict → Move Forward

}   ...

```   ```



#### GET `/health`## 📊 Үр дүнгийн жишээ

API эрүүл байдал шалгах

### Сургалтын үр дүн:

---

````

## 🏆 5 Ангилал (Сигнал)НИЙТ НАРИЙВЧЛАЛ: 45.67%

============================================================

| Ангилал | Утга | Тайлбар |

|---------|------|---------|АНГИЛАЛ ТУС БҮРИЙН ГҮЙЦЭТГЭЛ:

| 🟢 **0** | STRONG BUY | Маш хүчтэй худалдан авах | precision recall f1-score support

| 🟢 **1** | BUY | Худалдан авах |

| ⚪ **2** | NEUTRAL | Хүлээх (хөдөлгөөн алга) | High Vol Down 0.42 0.38 0.40 5234

| 🔴 **3** | SELL | Зарах | Med Vol Down 0.44 0.41 0.42 8921

| 🔴 **4** | STRONG SELL | Маш хүчтэй зарах | No Trend 0.48 0.52 0.50 15678

Med Vol Up 0.46 0.43 0.44 9012

--- High Vol Up 0.43 0.40 0.41 5432

## 👨‍💻 Хөгжүүлэгч accuracy 0.46 44277

        macro avg             0.45      0.43      0.43     44277

**Asura Lab** weighted avg 0.46 0.46 0.46 44277

- GitHub: [@Asura-lab](https://github.com/Asura-lab)```

- Repository: [Forex-Signal-App](https://github.com/Asura-lab/Forex-Signal-App)

### Mobile App дэлгэц:

---

````

## 📄 License┌────────────────────────────┐

│      EUR/USD               │

MIT License - Чөлөөтэй ашиглаж болно│   📈 Medium volatility up  │

│   62.3% итгэлтэй           │

---├────────────────────────────┤

│ Магадлалууд:               │

## 🐛 Алдаа засах│ High Vol Down:    8.5%     │

│ Med Vol Down:    15.2%     │

Алдаа илэрвэл [Issues](https://github.com/Asura-lab/Forex-Signal-App/issues) хэсэгт мэдэгдэнэ үү.│ No Trend:        14.0%     │

│ Med Vol Up:      62.3% ✓   │

---│ High Vol Up:      0.0%     │

└────────────────────────────┘

## 📝 Changelog```



### Version 2.0.0 (2025-10-18)## 🔬 Техникийн дэлгэрэнгүй

- ✅ MongoDB + JWT Authentication нэмэгдсэн

- ✅ Profile management (нэр засварлах, нууц үг солих)### Шинж чанарууд (Features):

- ✅ Файлын бүтэц цэгцлэгдсэн

- ✅ Configuration management сайжруулсан1. **returns** - Үнийн өөрчлөлт (%)

- ✅ API endpoints бүрэн баримтжуулсан2. **volatility** - High-Low зөрүү / Close

3. **atr** - Average True Range (14 period)

### Version 1.0.04. **ma_cross** - MA(5) - MA(20) / Close

- ✅ HMM Machine Learning model5. **rsi** - Relative Strength Index (14 period)

- ✅ React Native mobile app6. **volume_change** - Volume өөрчлөлт (%)

- ✅ 6 валютын хос дэмжих

### Шошго үүсгэх логик:

---

```python

**🎉 Амжилт хүсье!**if abs(returns) < threshold:

    label = "No trend"
elif returns > 0:
    if volatility > high_threshold:
        label = "High volatility up"
    elif volatility > med_threshold:
        label = "Medium volatility up"
else:
    if volatility > high_threshold:
        label = "High volatility down"
    elif volatility > med_threshold:
        label = "Medium volatility down"
````

### HMM параметрүүд:

- **n_components**: 5 (5 ангилал)
- **covariance_type**: "full" (бүрэн covariance matrix)
- **n_iter**: 100 (итерацийн тоо)
- **random_state**: 42 (дахин давтагдах үр дүн)

## ⚠️ Анхааруулга

1. **Судалгааны зориулалт**: Энэ код судалгааны ажилд зориулагдсан. Бодит худалдаанд ашиглахаас өмнө маш болгоомжтой байна уу.

2. **Датаны хэмжээ**: Train датанууд том хэмжээтэй тул эхлээд жижиг хэсгийг ашиглаж турших хэрэгтэй.

3. **Гүйцэтгэл**: Форекс зах зээл маш төвөгтэй тул 100% нарийвчлал гарахгүй. 40-50% орчим нарийвчлал хэвийн үзүүлэлт.

4. **Backend холболт**: Mobile app болон backend нэг сүлжээнд байх ёстой. Өөр төхөөрөмж дээр ажиллуулж байвал IP хаягийг солих хэрэгтэй.

## 🐛 Алдаа засах

### Модель ачаалагдахгүй байна:

```powershell
# Модель файлуудыг шалгах
ls models/

# Дахин сургах
jupyter notebook HMM_machine_learning.ipynb
```

### Backend холбогдохгүй байна:

```powershell
# Backend ажиллаж байгаа эсэхийг шалгах
curl http://localhost:5000/

# Firewall шалгах
netsh advfirewall firewall show rule name=all | findstr 5000
```

### React Native алдаа:

```powershell
# Cache цэвэрлэх
npm start -- --clear

# node_modules дахин суулгах
rm -rf node_modules
npm install
```

## 📚 Нэмэлт мэдээлэл

- **HMM суурь**: Hidden Markov Models нь цаг хугацааны цувааг модельчлоход тохиромжтой
- **Walking Forward**: Овerfitting-ээс зайлсхийх, илүү бодитой үр дүн гаргах арга
- **Feature Engineering**: Техникийн шинжилгээний үзүүлэлтүүд (MA, RSI, ATR) ашигладаг

## � Бодлогууд ба Баримт бичиг

### Хууль эрх зүйн баримтууд:

- 📋 [Үйлчилгээний нөхцөл (Terms of Service)](docs/TERMS_OF_SERVICE.md) - Монгол хэл
- 📋 [Terms of Service (English)](docs/TERMS_OF_SERVICE_EN.md) - English version
- 🔒 [Нууцлалын бодлого (Privacy Policy)](docs/PRIVACY_POLICY.md) - Монгол хэл
- 🔒 [Privacy Policy (English)](docs/PRIVACY_POLICY_EN.md) - English version

### Техникийн баримтууд:

- 📖 [API Documentation](docs/API_DOCUMENTATION.md)
- 🏗️ [Project Structure Guide](docs/PROJECT_RESTRUCTURING.md)
- 🔧 [Setup Guide](docs/SETUP_GUIDE.md)

### Анхааруулга:

⚠️ **Эрсдэлийн мэдэгдэл**: Форекс арилжаа нь маш өндөр эрсдэлтэй бөгөөд таны хөрөнгийг бүрэн алдах магадлалтай. Манай апп нь зөвхөн мэдээллийн зориулалттай бөгөөд санхүүгийн зөвлөгөө биш юм.

## �👨‍💻 Хөгжүүлэгч

Судалгааны ажил - Форекс сигнал таамаглах систем

**GitHub:** https://github.com/Asura-lab/Forex-Signal-App

## 📞 Холбоо барих

- **Email:** support@forexsignal.mn
- **Privacy:** privacy@forexsignal.mn
- **Issues:** [GitHub Issues](https://github.com/Asura-lab/Forex-Signal-App/issues)

## 📄 Лиценз

Энэ код судалгааны зориулалтаар үнэгүй ашиглаж болно.

---

**Амжилт хүсье!** 🚀📈

Асуулт байвал бидэнд хандаарай.
