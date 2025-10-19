# MT5 Mobile App Хураангуй

## ✅ Хийгдсэн өөрчлөлтүүд:

### 1. API Service (`mobile_app/src/services/api.js`):

- ✅ `getLiveRates(currencies, source)` - source parameter нэмсэн ('mt5', 'api', 'auto')
- ✅ `getMT5Status()` - MT5 статус шалгах функц

### 2. HomeScreen (`mobile_app/src/screens/HomeScreen.js`):

- ✅ MT5 холболтын статус харуулах
- ✅ MT5 badge (хэрэв холбогдсон бол)
- ✅ Data source харуулах (MT5 эсвэл API)
- ✅ Timestamp харуулах
- ✅ Auto-refresh (30 секунд тутамд)

### 3. CurrencyCard (`mobile_app/src/components/CurrencyCard.js`):

- ✅ MT5 format дэмжих (object with rate, bid, ask)
- ✅ Bid/Ask/Spread харуулах
- ✅ Rate details мөр нэмсэн

## 📱 Mobile App ажиллуулах:

```bash
cd mobile_app
npm start
```

Эсвэл:

```bash
npx expo start
```

## 🎯 Одоо харагдах зүйлс:

1. **Header дээр:**

   - Status: "Холбогдсон" (ногоон цэг)
   - MT5 badge (ногоон, хэрэв MT5 холбогдсон бол)
   - "MT5 • 23:40:11" (data source + timestamp)

2. **Currency Card дээр:**

   - 💱 1.16513 (rate)
   - Bid: 1.16504 • Ask: 1.16521 (MT5 детайл)
   - Prediction сигнал (📈, 📉, ➡️ гэх мэт)
   - Confidence % (жишээ: 87%)

3. **Auto-refresh:**
   - 30 секунд тутамд MT5-аас шинэ ханш татна

## 🔍 Backend Log:

```
✓ MT5 холбогдлоо:
  Акаунт: 944467
  Сервер: MOTCapital-Demo-1
  Компани: MOT Forex LLC

📊 MT5-аас ханш татаж байна...
   ✓ MT5-аас 6 ханш татагдлаа
```

## 📊 MT5 vs API:

| Feature           | MT5 | API        |
| ----------------- | --- | ---------- |
| Бодит цагийн ханш | ✅  | ✅         |
| Bid/Ask           | ✅  | ❌         |
| Spread            | ✅  | ❌         |
| Хязгаар           | ♾️  | 1000/month |
| Delay             | 0s  | ~5s        |

## 🚀 Дараагийн алхам:

1. Mobile app ажиллуулах
2. Login хийх (эсвэл шинээр бүртгүүлэх)
3. Home screen дээр MT5 ханш + prediction харах
4. Pull to refresh хийж шинэчлэх

**Таамаглал бүгд MT5-ын бодит цагийн ханш дээр суурилна!** 🎯
