# Forex Signal App - ER Диаграмм Зурах Заавар

## ERDPlus.com дээр зурах бүрэн мэдээлэл

### 🗄️ Database: MongoDB (NoSQL - Document-based)

**Database Name:** `users_db`

---

## 📊 Collections (Entities)

### 1. **users** (Үндсэн хэрэглэгчийн мэдээлэл)

**Attributes:**

- `_id` : ObjectId **[PRIMARY KEY]**
- `name` : String **[NOT NULL]**
- `email` : String **[UNIQUE, NOT NULL]**
- `password` : String (hashed with bcrypt) **[NOT NULL]**
- `email_verified` : Boolean [default: false]
- `created_at` : DateTime **[NOT NULL]**
- `verified_at` : DateTime
- `updated_at` : DateTime
- `last_login` : DateTime

**Indexes:**

- PRIMARY: `_id`
- UNIQUE: `email`

**Description:** Бүртгэлтэй хэрэглэгчдийн үндсэн мэдээллийг хадгална

---

### 2. **verification_codes** (Имэйл баталгаажуулалтын код)

**Attributes:**

- `_id` : ObjectId **[PRIMARY KEY]**
- `email` : String **[NOT NULL, INDEXED]**
- `name` : String **[NOT NULL]**
- `password` : String (hashed) **[NOT NULL]**
- `code` : String (6 digits) **[NOT NULL]**
- `expires_at` : DateTime **[NOT NULL]**
- `created_at` : DateTime **[NOT NULL]**
- `is_existing_user` : Boolean [default: false]

**Indexes:**

- PRIMARY: `_id`
- INDEX: `email`
- TTL INDEX: `expires_at` (автоматаар устгагдана)

**Description:** Шинэ бүртгүүлэх үед имэйл баталгаажуулах зориулалттай түр код хадгална. Хугацаа дууссан бичлэгүүд автоматаар устана.

**Lifecycle:** 10 минутын хугацаатай (VERIFICATION_CODE_EXPIRY_MINUTES)

---

### 3. **reset_codes** (Нууц үг сэргээх код)

**Attributes:**

- `_id` : ObjectId **[PRIMARY KEY]**
- `email` : String **[NOT NULL, INDEXED]**
- `code` : String (6 digits) **[NOT NULL]**
- `expires_at` : DateTime **[NOT NULL]**
- `created_at` : DateTime **[NOT NULL]**

**Indexes:**

- PRIMARY: `_id`
- INDEX: `email`
- TTL INDEX: `expires_at` (автоматаар устгагдана)

**Description:** Нууц үг мартсан тохиолдолд сэргээх код хадгална. Хугацаа дууссан кодууд автоматаар устана.

**Lifecycle:** 10 минутын хугацаатай (RESET_CODE_EXPIRY_MINUTES)

---

## 🔗 Relationships (Харилцаа холбоо)

### Relationship 1: users ↔ verification_codes

- **Type:** One-to-Many (1:N)
- **Cardinality:** 1 user can have 0 or 1 verification_code
- **Foreign Key:** `verification_codes.email` references `users.email`
- **Relationship Name:** "requests_verification"
- **Description:** Хэрэглэгч имэйл баталгаажуулалт хийх үед временный код үүснэ

### Relationship 2: users ↔ reset_codes

- **Type:** One-to-Many (1:N)
- **Cardinality:** 1 user can have 0 or 1 reset_code
- **Foreign Key:** `reset_codes.email` references `users.email`
- **Relationship Name:** "requests_reset"
- **Description:** Хэрэглэгч нууц үг сэргээх үед временный код үүснэ

---

## 🎨 ERDPlus.com дээр зурах алхам алхмаар заавар

### Step 1: Entity үүсгэх

#### Entity 1: users

1. **Add Entity** дарж "users" нэртэй entity үүсгэ
2. **Add Attribute** дээр дарж дараах attribute-уудыг нэмнэ:
   - `_id` - **Underline хий** (Primary Key тэмдэглэх)
   - `name`
   - `email` - Хажууд нь `(U)` гэж бичиж UNIQUE болгох
   - `password`
   - `email_verified`
   - `created_at`
   - `verified_at`
   - `updated_at`
   - `last_login`

#### Entity 2: verification_codes

1. **Add Entity** дарж "verification_codes" нэртэй entity үүсгэ
2. **Add Attribute** дээр дарж:
   - `_id` - **Underline хий**
   - `email` - Энэ нь **Foreign Key** болох тул онцгойлох
   - `name`
   - `password`
   - `code`
   - `expires_at`
   - `created_at`
   - `is_existing_user`

#### Entity 3: reset_codes

1. **Add Entity** дарж "reset_codes" нэртэй entity үүсгэ
2. **Add Attribute** дээр дарж:
   - `_id` - **Underline хий**
   - `email` - **Foreign Key**
   - `code`
   - `expires_at`
   - `created_at`

---

### Step 2: Relationship үүсгэх

#### Relationship 1: users → verification_codes

1. **Add Relationship** дарна
2. "users"-аас "verification_codes" руу шугам татна
3. Relationship-ийг "requests_verification" гэж нэрлэнэ
4. Cardinality тохируулах:
   - **users тал:** 1 (нэг хэрэглэгч)
   - **verification_codes тал:** 0..1 (0 эсвэл 1 код)
5. **Foreign Key:** verification_codes.email → users.email

#### Relationship 2: users → reset_codes

1. **Add Relationship** дарна
2. "users"-аас "reset_codes" руу шугам татна
3. Relationship-ийг "requests_reset" гэж нэрлэнэ
4. Cardinality тохируулах:
   - **users тал:** 1
   - **reset_codes тал:** 0..1
5. **Foreign Key:** reset_codes.email → users.email

---

## 📝 Crow's Foot Notation (Тэмдэглэгээ)

```
users ||--o{ verification_codes : "requests_verification"
users ||--o{ reset_codes : "requests_reset"
```

**Legend:**

- `||` = Exactly one (1)
- `o{` = Zero or more (0..N)
- `|{` = One or more (1..N)
- `o|` = Zero or one (0..1)

---

## 🔧 Business Rules (Бизнес дүрэм)

1. **User Registration Flow:**

   - Хэрэглэгч бүртгүүлэх → `verification_codes` collection-д код үүснэ
   - Код баталгаажуулсан → `users` collection-д хадгална
   - Verification code 10 минутын дараа автоматаар устана

2. **Password Reset Flow:**

   - Forgot password дарах → `reset_codes` collection-д код үүснэ
   - Код баталгаажуулж нууц үг солих → `users.password` шинэчлэгдэнэ
   - Reset code 10 минутын дараа автоматаар устана

3. **Email Uniqueness:**

   - `users.email` давхардаж болохгүй (UNIQUE constraint)
   - Нэг имэйлд зөвхөн нэг акаунт

4. **Password Security:**
   - Бүх нууц үгс bcrypt ашиглан hash хийгдсэн байна
   - Анхны нууц үг дор хаяж 6 тэмдэгт байх ёстой

---

## 🎯 ERDPlus.com Quick Tips

### Chen Notation (Уламжлалт) ашиглах бол:

- Entities-ийг **Rectangle** (тэгш өнцөгт) болгоно
- Attributes-ийг **Oval** (зууван) болгоно
- Relationships-ийг **Diamond** (алмааз) болгоно
- Primary Keys-ийг **Underline** хийнэ

### Crow's Foot Notation (Орчин үеийн) ашиглах бол:

- Entities: Rectangles with attributes inside
- Relationships: Lines with cardinality symbols
- Илүү тод, уншихад хялбар

**Санал:** **Crow's Foot Notation** ашиглахыг зөвлөж байна.

---

## 📋 Collection Summary Table

| Collection Name    | Primary Key | Foreign Keys | Auto-Delete | Purpose                      |
| ------------------ | ----------- | ------------ | ----------- | ---------------------------- |
| users              | \_id        | -            | No          | Үндсэн хэрэглэгчийн мэдээлэл |
| verification_codes | \_id        | email        | Yes (10min) | Имэйл баталгаажуулах код     |
| reset_codes        | \_id        | email        | Yes (10min) | Нууц үг сэргээх код          |

---

## 🚀 Additional Information

### JWT Authentication

- Системд JWT (JSON Web Token) ашигладаг
- Token expiration: 7 хоног
- Token payload: `{user_id, email, exp, iat}`

### External Services

- **Email Service:** Flask-Mail with Gmail SMTP
- **Database:** MongoDB Atlas
- **ML Models:** TensorFlow/Keras (15min, 30min, 60min predictions)
- **Live Data:** MetaTrader 5 (MT5) Integration

---

## 🎨 Visual Representation (Text-based)

```
┌─────────────────────────────────────────────┐
│              USERS                          │
├─────────────────────────────────────────────┤
│ PK: _id (ObjectId)                          │
│ UK: email (String, Unique)                  │
│     name (String)                           │
│     password (String, Hashed)               │
│     email_verified (Boolean)                │
│     created_at (DateTime)                   │
│     verified_at (DateTime)                  │
│     updated_at (DateTime)                   │
│     last_login (DateTime)                   │
└─────────────────────────────────────────────┘
         │                        │
         │ 1                      │ 1
         │                        │
         │ 0..1                   │ 0..1
         ▼                        ▼
┌──────────────────────┐  ┌─────────────────────┐
│ VERIFICATION_CODES   │  │    RESET_CODES      │
├──────────────────────┤  ├─────────────────────┤
│ PK: _id              │  │ PK: _id             │
│ FK: email → users    │  │ FK: email → users   │
│     name             │  │     code (6 digits) │
│     password         │  │     expires_at      │
│     code (6 digits)  │  │     created_at      │
│     expires_at       │  │ TTL: 10 minutes     │
│     created_at       │  └─────────────────────┘
│     is_existing_user │
│ TTL: 10 minutes      │
└──────────────────────┘
```

---

## 📧 Sample Data Examples

### users collection:

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "name": "Батболд",
  "email": "batbold@gmail.com",
  "password": "$2b$12$xF5k3r...",
  "email_verified": true,
  "created_at": ISODate("2025-10-30T10:30:00Z"),
  "verified_at": ISODate("2025-10-30T10:35:00Z"),
  "updated_at": ISODate("2025-10-30T10:35:00Z"),
  "last_login": ISODate("2025-10-30T12:00:00Z")
}
```

### verification_codes collection:

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439012"),
  "email": "newuser@gmail.com",
  "name": "Новый пользователь",
  "password": "$2b$12$aB3c...",
  "code": "123456",
  "expires_at": ISODate("2025-10-30T10:40:00Z"),
  "created_at": ISODate("2025-10-30T10:30:00Z"),
  "is_existing_user": false
}
```

### reset_codes collection:

```json
{
  "_id": ObjectId("507f1f77bcf86cd799439013"),
  "email": "batbold@gmail.com",
  "code": "789012",
  "expires_at": ISODate("2025-10-30T11:00:00Z"),
  "created_at": ISODate("2025-10-30T10:50:00Z")
}
```

---

## ✅ Checklist for ERDPlus.com

- [ ] 3 Entity үүсгэсэн эсэх (users, verification_codes, reset_codes)
- [ ] Бүх Attributes нэмсэн эсэх
- [ ] Primary Keys underline хийсэн эсэх (\_id)
- [ ] Unique constraints тэмдэглэсэн эсэх (email)
- [ ] 2 Relationship үүсгэсэн эсэх
- [ ] Cardinality зөв тохируулсан эсэх (1 to 0..1)
- [ ] Foreign Keys тэмдэглэсэн эсэх (email fields)
- [ ] Legend эсвэл description нэмсэн эсэх

---

## 🎓 Additional Notes

### MongoDB Specifics:

- MongoDB-д **schema-less** боловч энэ апп нь **schema validation** ашигладаг
- `_id` автоматаар үүсдэг (ObjectId)
- Embedded documents байхгүй (энэ систем дээр)
- Collections хоорондын холбоо email field ашиглан явагдана

### Performance Considerations:

- `email` дээр index үүсгэх (хурдан хайлт)
- TTL index ашиглан хугацаа дууссан код автоматаар устгах
- Bcrypt ашиглан нууц үг hash хийх

---

**Амжилт хүсье! 🚀**

Хэрэв нэмэлт тусламж хэрэгтэй бол асуугаарай.
