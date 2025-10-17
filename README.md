# 📱 Форекс Сигнал Таамаглах Аппликейшн

> **Судалгааны ажил**: HMM (Hidden Markov Model) ашиглан форекс хослолуудын хөдөлгөөнийг таамаглах React Native аппликейшн

## 📋 Агуулга

1. [Тойм](#тойм)
2. [5 Ангилал](#5-ангилал)
3. [Технологи](#технологи)
4. [Файлын бүтэц](#файлын-бүтэц)
5. [Суулгах](#суулгах)
6. [Ашиглах](#ашиглах)
7. [Архитектур](#архитектур)

## 🎯 Тойм

Энэ аппликейшн нь форекс хослолуудын өмнөх түүхэн дата дээр дүн шинжилгээ хийж, одоо ямар хөдөлгөөн үзүүлэх хандлагатай байгааг HMM (Hidden Markov Model) ашиглан таамаглана.

### Онцлог шинж чанарууд:

- ✅ **5 ангилалын таамаглал** (өндөр/дунд хэлбэлзэл өсөх/буурах, чиглэлгүй)
- ✅ **Walking Forward Analysis** - цаг хугацааны дагуу сургалт
- ✅ **Backtest шалгалт** - test дата дээр үр дүн үнэлэх
- ✅ **6 валютын хос дэмжих** (EUR/USD, GBP/USD, USD/CAD, USD/CHF, USD/JPY, XAU/USD)
- ✅ **Real-time магадлал** - ангилал тус бүрийн магадлалыг үзүүлнэ
- ✅ **Харагдах байдал** - Confusion matrix, Classification report

## 🏆 5 Ангилал

Аппликейшн форекс хөдөлгөөнийг дараах 5 ангилалд хуваана:

| Код | Ангилал                       | Тайлбар                    |
| --- | ----------------------------- | -------------------------- |
| 0   | **High volatility down** 📉💥 | Өндөр хэлбэлзэлтэй бууралт |
| 1   | **Medium volatility down** 📉 | Дунд хэлбэлзэлтэй бууралт  |
| 2   | **No trend** ➡️               | Чиглэлгүй (хажуу тийш)     |
| 3   | **Medium volatility up** 📈   | Дунд хэлбэлзэлтэй өсөлт    |
| 4   | **High volatility up** 📈🚀   | Өндөр хэлбэлзэлтэй өсөлт   |

## 🛠️ Технологи

### Backend & Machine Learning:

- **Python 3.8+**
- **hmmlearn** - Hidden Markov Model
- **scikit-learn** - Feature scaling, үнэлгээ
- **pandas & numpy** - Дата боловсруулалт
- **Flask** - REST API
- **Jupyter Notebook** - Модель сургалт

### Mobile App (React Native):

- **React Native + Expo** - Cross-platform mobile app
- **React Navigation** - Navigation system
- **axios** - API холболт
- **Linear Gradient** - UI дизайн
- **Chart Kit** - График харуулалт

## 📁 Файлын бүтэц

```
Forex_signal_app/
│
├── 📊 data/
│   ├── train/              # Сургалтын датанууд
│   │   ├── EUR_USD_1min.csv
│   │   ├── GBP_USD_1min.csv
│   │   ├── USD_CAD_1min.csv
│   │   ├── USD_CHF_1min.csv
│   │   ├── USD_JPY_1min.csv
│   │   └── XAU_USD_1min.csv
│   │
│   └── test/               # Test датанууд (Backtest)
│       ├── EUR_USD_test.csv
│       ├── GBP_USD_test.csv
│       ├── USD_CAD_test.csv
│       ├── USD_CHF_test.csv
│       ├── USD_JPY_test.csv
│       └── XAU_USD_test.csv
│
├── 🤖 models/              # Сургагдсан моделиуд (автоматаар үүснэ)
│   ├── hmm_forex_model.pkl
│   └── hmm_scaler.pkl
│
├── � mobile_app/          # React Native аппликейшн
│   ├── src/
│   │   ├── components/    # UI компонентууд
│   │   ├── screens/       # Дэлгэцүүд
│   │   ├── services/      # API холболт
│   │   └── utils/         # Туслах функцууд
│   ├── App.js
│   ├── package.json
│   └── README.md          # Mobile app заавар
│
├── �📓 HMM_machine_learning.ipynb  # ҮНДСЭН: Модель сургалт
├── 🌐 backend_api.py               # Backend REST API
├── 📥 download_data.py             # Дата татах скрипт
├── 📋 requirements.txt             # Python dependencies
├── 📖 REACT_NATIVE_GUIDE.md        # React Native гарын авлага
└── 📘 README.md                    # Энэ файл
```

## 🚀 Суулгах

### 1. Python орчин бэлдэх

```powershell
# Python шаардлагатай эсэхээ шалгах
python --version

# Virtual environment үүсгэх (санал болгож байна)
python -m venv venv
.\venv\Scripts\activate

# Шаардлагатай сангууд суулгах
pip install -r requirements.txt
```

### 2. Модель сургах

```powershell
# Jupyter Notebook эхлүүлэх
jupyter notebook HMM_machine_learning.ipynb
```

**Дараах дарааллаар cell-үүдийг ажиллуулна:**

1. ✅ Сангууд импортлох
2. ✅ Дата боловсруулах функцууд
3. ✅ 5 ангилалын шошго үүсгэх функц
4. ✅ HMM модель сургах функцууд
5. ✅ Walking Forward Analysis функц
6. ✅ Үнэлгээний функцууд
7. ✅ Сургалтын дата ачаалах
8. ✅ Walking Forward сургалт
9. ✅ Test дата дээр Backtest
10. ✅ Эцсийн модель хадгалах

**Хүлээгдэж буй үр дүн:**

- `models/hmm_forex_model.pkl` - Сургагдсан модель
- `models/hmm_scaler.pkl` - Feature scaler
- Сургалтын болон test нарийвчлал хэвлэгдэнэ

### 3. Backend API эхлүүлэх

```powershell
# Backend API эхлүүлэх
python backend_api.py
```

API хаяг: `http://localhost:5000`

**Endpoints:**

- `GET /` - API мэдээлэл
- `GET /model_info` - Моделийн мэдээлэл
- `POST /predict` - Шинэ дата дээр таамаглал
- `POST /predict_file` - CSV файлаас таамаглал

### 4. React Native аппликейшн ажиллуулах

```powershell
# Mobile app folder руу очих
cd mobile_app

# Dependencies суулгах
npm install

# Backend IP хаяг тохируулах
# src/services/api.js файлд API_BASE_URL өөрчлөх

# Аппликейшн эхлүүлэх
npm start

# Android/iOS дээр ажиллуулах
npm run android  # Android
npm run ios      # iOS (Mac only)
```

**Дэлгэрэнгүй:** [`mobile_app/README.md`](mobile_app/README.md)

## 📖 Ашиглах

### Backend ашиглах жишээ (Python):

```python
import requests

# API статус шалгах
response = requests.get('http://localhost:5000/')
print(response.json())

# Файлаас таамаглал хийх
data = {
    'file_path': 'data/test/EUR_USD_test.csv'
}
response = requests.post('http://localhost:5000/predict_file', json=data)
result = response.json()

print(f"Сүүлчийн таамаглал: {result['latest_prediction']['trend']}")
print(f"Нийт дата: {result['total_predictions']}")
```

### React Native аппликейшн ашиглах:

#### 📱 Mobile App Онцлогууд:

1. **Үндсэн дэлгэц**
   - 6 валютын хослолын жагсаалт
   - Real-time сигнал (emoji)
   - Pull-to-refresh шинэчлэлт
   - API холболтын статус

2. **Дэлгэрэнгүй дэлгэц**
   - Сигналын мэдээлэл (Strong Buy/Sell, Buy/Sell, Hold)
   - Итгэлцлийн түвшин (%)
   - Худалдааны зөвлөмж
   - Статистикийн график
   - Дэлгэрэнгүй мэдээлэл

3. **Онцлогууд**
   - Gradient UI design
   - Touch animations
   - Real-time update
   - Error handling
   - Loading states

**Дэлгэрэнгүй:** [`mobile_app/README.md`](mobile_app/README.md)

## 🏗️ Архитектур

```
┌─────────────────────────────────────────────────┐
│          React Native Mobile App                │
│  (User Interface - Харилцах хэсэг)              │
└───────────────┬─────────────────────────────────┘
                │ HTTP Requests (axios)
                ↓
┌─────────────────────────────────────────────────┐
│           Flask Backend API                     │
│  (REST API - Дата хүлээн авах/илгээх)           │
└───────────────┬─────────────────────────────────┘
                │ Loads Model
                ↓
┌─────────────────────────────────────────────────┐
│        HMM Machine Learning Model               │
│  (Сургагдсан модель - Таамаглал хийх)           │
└───────────────┬─────────────────────────────────┘
                │ Trained on
                ↓
┌─────────────────────────────────────────────────┐
│          Historical Forex Data                  │
│  (CSV файлууд - Түүхэн дата)                    │
└─────────────────────────────────────────────────┘
```

### Дата урсгал:

1. **Сургалт** (Training):

   ```
   CSV Data → Feature Engineering → HMM Training → Saved Model
   ```

2. **Таамаглал** (Prediction):

   ```
   New Data → Feature Engineering → Model Prediction → API Response → Mobile App
   ```

3. **Walking Forward**:
   ```
   [Training Window 1] → Predict → Move Forward
   [Training Window 2] → Predict → Move Forward
   ...
   ```

## 📊 Үр дүнгийн жишээ

### Сургалтын үр дүн:

```
НИЙТ НАРИЙВЧЛАЛ: 45.67%
============================================================

АНГИЛАЛ ТУС БҮРИЙН ГҮЙЦЭТГЭЛ:
                          precision    recall  f1-score   support

   High Vol Down             0.42      0.38      0.40      5234
   Med Vol Down              0.44      0.41      0.42      8921
   No Trend                  0.48      0.52      0.50     15678
   Med Vol Up                0.46      0.43      0.44      9012
   High Vol Up               0.43      0.40      0.41      5432

         accuracy                          0.46     44277
        macro avg             0.45      0.43      0.43     44277
     weighted avg             0.46      0.46      0.46     44277
```

### Mobile App дэлгэц:

```
┌────────────────────────────┐
│      EUR/USD               │
│   📈 Medium volatility up  │
│   62.3% итгэлтэй           │
├────────────────────────────┤
│ Магадлалууд:               │
│ High Vol Down:    8.5%     │
│ Med Vol Down:    15.2%     │
│ No Trend:        14.0%     │
│ Med Vol Up:      62.3% ✓   │
│ High Vol Up:      0.0%     │
└────────────────────────────┘
```

## 🔬 Техникийн дэлгэрэнгүй

### Шинж чанарууд (Features):

1. **returns** - Үнийн өөрчлөлт (%)
2. **volatility** - High-Low зөрүү / Close
3. **atr** - Average True Range (14 period)
4. **ma_cross** - MA(5) - MA(20) / Close
5. **rsi** - Relative Strength Index (14 period)
6. **volume_change** - Volume өөрчлөлт (%)

### Шошго үүсгэх логик:

```python
if abs(returns) < threshold:
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
```

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

## 👨‍💻 Хөгжүүлэгч

Судалгааны ажил - Форекс сигнал таамаглах систем

## 📄 Лиценз

Энэ код судалгааны зориулалтаар үнэгүй ашиглаж болно.

---

**Амжилт хүсье!** 🚀📈

Асуулт байвал бидэнд хандаарай.
