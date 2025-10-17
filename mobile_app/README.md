# 📱 Форекс Сигнал Аппликейшн - Суулгах Заавар

## 🎯 Үзэгдэх байдал

Энэ аппликейшн нь HMM (Hidden Markov Model) ашиглан форекс валютын хослолуудын хөдөлгөөнийг таамаглаж, real-time сигнал өгдөг.

### Онцлог шинж чанарууд:
- ✅ **6 валютын хос** - EUR/USD, GBP/USD, USD/CAD, USD/CHF, USD/JPY, XAU/USD
- ✅ **5 төрлийн сигнал** - Strong Buy/Sell, Buy/Sell, Hold
- ✅ **Итгэлцлийн түвшин** - Таамаглалын нарийвчлал
- ✅ **Статистикийн график** - Хуваарилалтын дэлгэрэнгүй
- ✅ **Худалдааны зөвлөмж** - AI-н санал
- ✅ **Real-time шинэчлэлт** - Pull-to-refresh

## 📋 Шаардлага

### 1. Backend API
- Python backend сервер ажиллаж байх ёстой
- `backend_api.py` эхлүүлсэн байх
- Backend IP хаяг: `http://YOUR_IP:5000`

### 2. Хөгжүүлэх орчин
- Node.js 14+ 
- npm эсвэл yarn
- Expo CLI
- Android Studio (Android) эсвэл Xcode (iOS)

## 🚀 Суулгах алхамууд

### 1. Аппликейшн директор руу очих

```bash
cd mobile_app
```

### 2. Dependencies суулгах

```bash
npm install
```

эсвэл

```bash
yarn install
```

### 3. Backend API хаяг тохируулах

`src/services/api.js` файлыг нээж, `API_BASE_URL`-ийг өөрчлөнө:

```javascript
// Өөрийн backend IP хаягаа оруулна уу
const API_BASE_URL = 'http://192.168.1.100:5000';
```

**IP хаяг олох:**

Windows (PowerShell):
```powershell
ipconfig
# IPv4 Address-ийг хар
```

Mac/Linux:
```bash
ifconfig
# inet хаяг олох
```

### 4. Backend эхлүүлэх

Өөр terminal нээж, main folder руу очоод:

```bash
cd ..
python backend_api.py
```

Backend `http://YOUR_IP:5000` дээр ажиллана.

### 5. Аппликейшн эхлүүлэх

```bash
npm start
```

эсвэл

```bash
npx expo start
```

## 📱 Төхөөрөмж дээр ажиллуулах

### Android

```bash
npm run android
```

эсвэл Expo Go аппликейшн ашиглаж QR код scan хийх.

### iOS

```bash
npm run ios
```

эсвэл Expo Go аппликейшн ашиглаж QR код scan хийх.

### Simulator/Emulator

Expo DevTools-с:
- "Run on Android device/emulator" дарах
- "Run on iOS simulator" дарах

## 🔧 Тохиргоо

### Backend холболтын асуудал

Хэрэв аппликейшн backend-тай холбогдохгүй бол:

1. **IP хаяг шалгах:**
   - `src/services/api.js` дахь `API_BASE_URL` зөв эсэх
   - Backend ба утас нэг WiFi сүлжээнд байгаа эсэх

2. **Backend шалгах:**
   ```bash
   # Backend ажиллаж байгаа эсэхийг шалгах
   curl http://YOUR_IP:5000/
   ```

3. **Firewall:**
   - Windows Firewall 5000 портыг блоклоогүй эсэхийг шалгах
   - Антивирус програм хориглоогүй эсэхийг шалгах

4. **Timeout:**
   - `src/services/api.js` дахь `timeout` утгыг нэмэгдүүлэх (жишээ: 30000)

### Датаны файлууд

Аппликейшн `data/test/` folder-оос датаг уншдаг:
- EUR_USD_test.csv
- GBP_USD_test.csv
- USD_CAD_test.csv
- USD_CHF_test.csv
- USD_JPY_test.csv
- XAU_USD_test.csv

Эдгээр файлууд байгаа эсэхийг шалгаарай.

## 📖 Ашиглах заавар

### 1. Үндсэн дэлгэц
- Валютын хослолуудын жагсаалт харагдана
- Хослол бүрт одоогийн сигнал (emoji) харагдана
- Pull-to-refresh-ээр шинэчлэнэ

### 2. Хослол сонгох
- Хослол дээр дарж дэлгэрэнгүй харна
- Үндсэн сигнал, итгэлцэл харагдана
- Худалдааны зөвлөмж үзнэ

### 3. Дэлгэрэнгүй дэлгэц
- **Үндсэн сигнал**: Strong Buy/Sell, Buy/Sell, Hold
- **Итгэлцэл**: Таамаглалын нарийвчлал (%)
- **Зөвлөмж**: Худалдааны санал
- **Статистик**: Ангилалуудын хуваарилалт
- **Мэдээлэл**: Модель, дата, файл

### 4. Сигналын тайлбар

| Сигнал | Үйлдэл | Тайлбар |
|--------|---------|---------|
| 📈🚀 STRONG BUY | Худалдан авах | Өндөр хэлбэлзэлтэй өсөлт |
| 📈 BUY | Худалдан авах | Дунд хэлбэлзэлтэй өсөлт |
| ➡️ HOLD | Хүлээх | Чиглэлгүй |
| 📉 SELL | Зарах | Дунд хэлбэлзэлтэй бууралт |
| 📉💥 STRONG SELL | Зарах | Өндөр хэлбэлзэлтэй бууралт |

## 🐛 Алдаа засах

### "Network Error"
```
Шийдэл:
1. Backend ажиллаж байгаа эсэхийг шалгах
2. IP хаяг зөв эсэхийг шалгах
3. Firewall тохиргоог шалгах
```

### "Таамаглал олдсонгүй"
```
Шийдэл:
1. data/test/ folder-д файлууд байгаа эсэхийг шалгах
2. Backend log-ийг харж алдаа шалгах
3. Модель сургагдсан эсэхийг шалгах (models/ folder)
```

### "Expo app crashed"
```
Шийдэл:
1. Cache цэвэрлэх: npm start -- --clear
2. node_modules дахин суулгах: rm -rf node_modules && npm install
3. Expo app шинэчлэх
```

## 📦 Build хийх

### Android APK

```bash
# EAS Build ашиглах
npm install -g eas-cli
eas build -p android
```

### iOS

```bash
# Mac дээр Xcode ашиглах
eas build -p ios
```

## 🎨 Дизайн өөрчлөх

### Өнгө солих

`src/utils/helpers.js` дахь `SIGNAL_TYPES` объектоос өнгийг өөрчлөнө:

```javascript
export const SIGNAL_TYPES = {
  4: {
    name: 'High volatility up',
    color: '#2E7D32', // Энд өөрчлөх
    // ...
  },
};
```

### Валюта нэмэх

`src/utils/helpers.js` дахь `CURRENCY_PAIRS` array-д нэмнэ:

```javascript
export const CURRENCY_PAIRS = [
  // ... одоогийн хослолууд
  {
    id: 'NEW_PAIR',
    name: 'NEW/PAIR',
    displayName: 'New Pair Description',
    flag: '🚩🚩',
    color: '#000000',
  },
];
```

## ⚠️ Анхааруулга

1. **Судалгааны зориулалт**: Энэ аппликейшн судалгааны зорилгоор бүтээгдсэн
2. **Бодит худалдаа**: Бодит мөнгөөр худалдаа хийхээс өмнө өөрийн судалгаа хийнэ үү
3. **Эрсдэл**: Форекс худалдаа өндөр эрсдэлтэй
4. **Зөвлөмж**: AI зөвлөмж 100% нарийвчлалтай биш

## 🔄 Шинэчлэлт авах

```bash
# Dependencies шинэчлэх
npm update

# Expo SDK шинэчлэх
npm install expo@latest

# React Navigation шинэчлэх
npm install @react-navigation/native@latest @react-navigation/stack@latest
```

## 📞 Тусламж

Асуудал гарвал:
1. Backend log шалгах
2. Expo DevTools console шалгах
3. `src/services/api.js` дахь API хаяг шалгах
4. Internet холболт шалгах

## 📄 Лиценз

MIT License - Судалгааны зорилгоор чөлөөтэй ашиглаж болно.

---

**Амжилт хүсье!** 🚀📈
