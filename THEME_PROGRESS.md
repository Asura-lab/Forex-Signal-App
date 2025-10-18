# 🎨 Theme System Implementation Plan

## Зорилго

Бүх screen-үүд ижил дизайн, dark theme болгох боломжтой болгох

## ✅ Бэлэн болсон

- `src/config/theme.js` - Centralized theme config файл

## 🔄 Шинэчлэх screen-үүд

### 1. HomeScreen.js ✅

- Theme import нэмсэн
- Colors, spacing, fontSize ашиглаж байна
- Gradients ашиглаж байна

### 2. SignalScreen.js 🟡

- Theme import нэмсэн
- Styles шинэчлэх хэрэгтэй

### 3. ProfileScreen.js

- Theme ашиглуулах
- AsyncStorage логик засах

### 4. LoginScreen.js ✅

- Өмнө нь theme-д ойрхон байсан
- Зөвхөн import нэмэх

### 5. SignUpScreen.js ✅

- Өмнө нь theme-д ойрхон байсан
- Зөвхөн import нэмэх

### 6. EmailVerificationScreen.js ✅

- Gradient өнгө theme-тэй тааруулах

### 7. ForgotPasswordScreen.js ✅

- Gradient өнгө theme-тэй тааруулах

## 🎯 Дараагийн алхам

1. Бүх screen-үүд theme ашиглах
2. ThemeContext үүсгэх (dark mode-ийн тулд)
3. AsyncStorage-аас theme preference уншуулах
4. Toggle switch ProfileScreen-д нэмэх

## 📝 Theme Variables

### Colors

- Primary: `#1a237e` (Blue)
- Secondary: `#4CAF50` (Green)
- Accent: `#FF9800` (Orange)
- Success: `#4CAF50`
- Error: `#F44336`
- Warning: `#FF9800`

### Gradients

- Primary: Blue gradient
- Secondary: Green gradient
- Accent: Orange gradient
- Error: Red gradient

### Spacing

- xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48

### FontSize

- xs: 12, sm: 14, md: 16, lg: 18, xl: 20, xxl: 24, xxxl: 28, display: 32
