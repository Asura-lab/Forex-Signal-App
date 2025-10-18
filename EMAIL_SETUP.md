# 📧 Email Баталгаажуулалт - Тохиргооны заавар

## Gmail App Password үүсгэх

Имэйл баталгаажуулалт ажиллуулахын тулд Gmail App Password хэрэгтэй.

### 1️⃣ Google Account тохиргоо

1. **Google Account руу нэвтрэх**: https://myaccount.google.com
2. **Security хэсэг** рүү орох
3. **2-Step Verification** идэвхжүүлэх (заавал шаардлагатай)

### 2️⃣ App Password үүсгэх

1. Security хэсэгт **App passwords** сонгох
2. **Select app** → **Mail** сонгох
3. **Select device** → **Other** сонгоод "Forex Signal App" гэж нэрлэх
4. **Generate** товч дарах
5. **16 оронтой код** үүснэ - Энийг хуулж авна

### 3️⃣ Backend тохируулах

`.env` файлыг нээж дараах мэдээллийг оруулна:

```env
# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USE_SSL=False
MAIL_USERNAME=your.email@gmail.com          # Өөрийн Gmail хаяг
MAIL_PASSWORD=your-16-digit-app-password    # 16 оронтой App Password (зайгүй)
MAIL_DEFAULT_SENDER=your.email@gmail.com
```

**⚠️ Анхаар:**

- `MAIL_PASSWORD` нь таны энгийн Gmail нууц үг БИШ
- 16 оронтой App Password-ийг ЗАЙГҮЙ оруулна
- Жишээ: `abcd efgh ijkl mnop` → `abcdefghijklmnop`

### 4️⃣ Backend дахин ажиллуулах

```bash
cd backend
.venv\Scripts\python.exe app.py
```

### 5️⃣ Шалгах

1. Mobile app-ийг ажиллуулах
2. Шинэ бүртгэл үүсгэх
3. Gmail-ээ шалгах - 6 оронтой код ирнэ
4. Кодоо оруулж баталгаажуулах

---

## 🔥 Demo Mode

Хэрэв имэйл тохиргоо хийгдээгүй бол **Demo Mode** автоматаар идэвхжинэ:

- Имэйл илгээхгүй
- Баталгаажуулах кодыг API response-оор буцаана
- Alert дээр код харагдана
- Хөгжүүлэлтийн үед тохиромжтой

---

## 📱 Flow

### Бүртгүүлэх

```
SignUp → Мэдээлэл оруулах → Submit
  ↓
Email Verification Screen
  ↓
6 оронтой код оруулах → Verify
  ↓
Main Screen (Амжилттай)
```

### Нэвтрэх

```
Login → Имэйл баталгаажаагүй бол
  ↓
Alert → Email Verification Screen руу шилжүүлэх
```

### Нууц үг сэргээх

```
Forgot Password → Имэйл оруулах → Код авах
  ↓
6 оронтой код оруулах → Шалгах
  ↓
Шинэ нууц үг оруулах → Амжилттай
```

---

## 🔒 Аюулгүй байдал

- Verification код: **10 минутын хугацаатай**
- Password reset код: **10 минутын хугацаатай**
- Код хугацаа дуусахад MongoDB-оос автоматаар устана
- Амжилттай баталгаажуулсны дараа `email_verified=True` болно
- Login хийхэд `email_verified` заавал шалгагдана

---

## 🎨 HTML Email Template

Илгээгдэх имэйлүүд:

### Баталгаажуулах имэйл

- **Gradient header** (цэнхэр)
- Том тодорхой **6 оронтой код**
- 10 минутын хугацаа анхааруулга
- Брэнд дэлгэрэнгүй мэдээлэл

### Нууц үг сэргээх имэйл

- **Gradient header** (улбар шар)
- Аюулгүй байдлын анхааруулга
- 6 оронтой сэргээх код
- Холбоо барих мэдээлэл

---

## 🐛 Troubleshooting

### Имэйл очихгүй байвал:

1. Gmail спам folder шалгах
2. App Password зөв эсэхийг шалгах
3. 2-Step Verification идэвхтэй эсэхийг шалгах
4. Backend console-д алдаа байгаа эсэхийг шалгах

### "Authentication failed" гэвэл:

- App Password дахин үүсгэх
- `.env` файл дахин шалгах
- Backend restart хийх

### Код "expired" гэвэл:

- "Resend Code" дарж шинэ код авах
- 10 минутын дотор код оруулах

---

## 📞 Тусламж

Асуудал гарвал:

- Backend console шалгах
- Network request шалгах
- MongoDB verification_codes collection шалгах

**Email тохиргоо бүрэн амжилттай!** 🎉
