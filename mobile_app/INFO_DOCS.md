# 📱 Форекс Сигнал Mobile App

React Native + Expo application

## 📋 Мэдээлэл хэсэгт нэмэгдсэн баримтууд

Апп-ын **Профайл** → **Мэдээлэл** хэсэгт дараах баримтууд нэмэгдлээ:

### 📖 Хэрэглэгчид харагдах баримтууд:

1. **🆘 Тусламж**

   - Апп-ын үндсэн функцүүд
   - Ашиглах заавар
   - Холбоо барих мэдээлэл

2. **📋 Үйлчилгээний нөхцөл**

   - Апп ашиглах журам
   - Эрсдэлийн анхааруулга
   - Хэрэглэгчийн хариуцлага
   - Хориотой үйлдлүүд
   - Хариуцлагын хязгаарлалт

3. **🔒 Нууцлалын бодлого**

   - Цуглуулах мэдээллийн төрөл
   - Мэдээлэл ашиглах зориулалт
   - Хадгалах байршил
   - Аюулгүй байдлын хамгаалалт
   - Хэрэглэгчийн эрхүүд
   - GDPR compliance

4. **ℹ️ Апп-ын тухай**
   - Хувилбарын мэдээлэл
   - Технологийн stack
   - Дэмждэг валютууд
   - Холбоо барих

## 🎨 UI Implementation

### Modal харуулах:

```javascript
// Help document
openDocument("help");

// Terms of Service
openDocument("terms");

// Privacy Policy
openDocument("privacy");

// About App
openDocument("about");
```

### Features:

- ✅ Full-screen modal with smooth animation
- ✅ Scrollable content
- ✅ Formatted text with emojis
- ✅ Close button
- ✅ Professional design

## 📂 Бүтэц:

```
ProfileScreen.js
├── State Management
│   ├── showDocumentModal (boolean)
│   └── currentDocument (object)
├── Functions
│   ├── openDocument(docType)
│   └── openExternalLink(url)
└── UI Components
    ├── Document Menu Items
    └── Document Modal
```

## 🔗 Холбоосууд:

Апп дотроос дэлгэрэнгүй баримт руу шилжих:

- `docs/TERMS_OF_SERVICE.md` - Монгол хэл
- `docs/PRIVACY_POLICY.md` - Монгол хэл
- `docs/TERMS_OF_SERVICE_EN.md` - English
- `docs/PRIVACY_POLICY_EN.md` - English

## 📱 Хэрэглэх:

1. Апп-г нээнэ
2. Профайл tab-руу очино
3. "Мэдээлэл" хэсэг дээр scroll хийнэ
4. Сонирхож буй баримтаа дарж нээнэ
5. Уншаад "Хаах" товч дээр дарна

## ⚠️ Анхааруулга:

Баримтууд нь апп дотор **embedded** байгаа тул:

- Интернэт холболт шаардлагагүй
- Хурдан ачаалагдана
- Offline ажиллана

Хэрэв илүү дэлгэрэнгүй хувилбар харах бол:

- GitHub repository-д очиж `docs/` folder-ыг үзнэ
- Эсвэл вэб хөтөч дээр markdown файлыг нээнэ

---

**© 2025 Форекс Сигнал**
