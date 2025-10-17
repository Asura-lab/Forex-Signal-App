# Profile Screen & Bottom Tab Navigation

## 🎯 Overview

Implemented a complete Profile screen with bottom tab navigation, allowing users to switch between Home and Profile screens using icons at the bottom of the app.

## ✨ Features Implemented

### 1. **Profile Screen** (`src/screens/ProfileScreen.js`)

A comprehensive user profile page with the following sections:

#### 👤 **User Profile Header**

- Profile avatar with camera icon (for future photo upload)
- User name display
- User email display
- Gradient background matching app theme

#### 📝 **Personal Information Section**

- **Edit Mode:** Toggle to edit user information
- **Name Field:** Editable user name
- **Email Field:** Editable email address
- **Save/Cancel Buttons:** Save changes or cancel editing

#### ⚙️ **Settings Section**

- **Notifications Toggle:** Enable/disable push notifications
- **Dark Mode Toggle:** Placeholder for future dark mode feature (currently disabled)

#### 🔒 **Security Section**

- **Change Password:** Button to initiate password change flow

#### ℹ️ **About Section**

- **Help:** Access to help documentation
- **Terms of Service:** View terms and conditions
- **Privacy Policy:** View privacy policy
- **Version Info:** Display app version (1.0.0)

#### 🚪 **Logout**

- Red logout button with confirmation dialog

### 2. **Bottom Tab Navigation** (`src/navigation/MainTabs.js`)

#### Tab Bar Features:

- **Home Tab (Нүүр):**
  - Icon: Home (outline when inactive, filled when active)
  - Displays currency pairs and signals
- **Profile Tab (Профайл):**
  - Icon: Person (outline when inactive, filled when active)
  - Displays user profile and settings

#### Tab Bar Styling:

- White background
- Active tab color: Blue (#2196F3)
- Inactive tab color: Gray (#757575)
- Height: 60px with proper padding
- Shadow effect for elevation
- Smooth transitions between tabs

### 3. **Updated Navigation Flow** (`App.js`)

```
Login/SignUp → Main (Bottom Tabs) → Signal Details
                  ↓
            Home ↔ Profile
```

## 📱 User Experience

### Navigation Flow:

1. **User logs in or signs up**
2. **Redirected to Main screen with bottom tabs**
3. **Default view: Home tab**
4. **Tap Profile icon to view profile**
5. **Tap Home icon to return to home**
6. **From Home, tap a currency pair to view Signal details**

### Profile Interactions:

1. **View Profile:**

   - See personal information
   - View current settings

2. **Edit Information:**

   - Tap "Засах" (Edit) button
   - Modify name and email
   - Save or cancel changes

3. **Toggle Settings:**

   - Enable/disable notifications with switch
   - View other settings options

4. **Access Information:**

   - Help, terms, privacy policy
   - View app version

5. **Logout:**
   - Tap logout button
   - Confirm action
   - Redirected to login screen

## 🎨 Design Features

### Visual Elements:

- ✅ Gradient header matching app theme
- ✅ Circular avatar with border
- ✅ Icon-based menu items with background circles
- ✅ Card-based layout with shadows
- ✅ Consistent spacing and padding
- ✅ Clear visual hierarchy

### Interactive Elements:

- ✅ Touchable menu items with chevron indicators
- ✅ Toggle switches for settings
- ✅ Edit mode for profile information
- ✅ Confirmation dialogs for critical actions
- ✅ Smooth navigation transitions

## 📂 File Structure

```
mobile_app/
├── src/
│   ├── navigation/
│   │   └── MainTabs.js          ← NEW: Bottom tab navigator
│   ├── screens/
│   │   ├── HomeScreen.js        ← UPDATED: Removed logout button
│   │   ├── ProfileScreen.js     ← NEW: Profile screen
│   │   ├── LoginScreen.js       ← UPDATED: Navigate to Main
│   │   └── SignUpScreen.js      ← UPDATED: Navigate to Main
│   └── services/
│       └── auth.js              ← Used by ProfileScreen
└── App.js                       ← UPDATED: Integrated MainTabs
```

## 🔄 Changes Made

### Created Files:

1. **`src/screens/ProfileScreen.js`** - Complete profile screen
2. **`src/navigation/MainTabs.js`** - Bottom tab navigation

### Modified Files:

1. **`App.js`**

   - Imported MainTabs
   - Changed "Home" screen to "Main" screen
   - Updated navigation structure

2. **`src/screens/LoginScreen.js`**

   - Changed navigation target from "Home" to "Main"

3. **`src/screens/SignUpScreen.js`**

   - Changed navigation target from "Home" to "Main"

4. **`src/screens/HomeScreen.js`**
   - Removed logout button (now in Profile)
   - Removed logout function
   - Removed logoutUser import
   - Simplified header layout

## 🚀 How to Test

```bash
cd mobile_app
npm start
```

### Test Scenarios:

1. **Login/SignUp Flow:**

   - Login or sign up
   - Should see Home screen with bottom tabs

2. **Tab Navigation:**

   - Tap Profile icon → Profile screen appears
   - Tap Home icon → Home screen appears
   - Icons change color when active

3. **Profile Features:**

   - View user information
   - Tap "Засах" (Edit) to edit info
   - Change name/email
   - Save or cancel changes
   - Toggle notification switch
   - Tap menu items (Help, Terms, etc.)

4. **Logout:**
   - Go to Profile tab
   - Scroll down to Logout button
   - Tap logout
   - Confirm logout
   - Should return to Login screen

## 💡 Profile Screen Sections

### 1. Header Section

```javascript
- Avatar (100x100px circular)
- Camera icon overlay (for future upload)
- User name (24px bold)
- User email (14px, faded)
```

### 2. Personal Information Card

```javascript
- Name with person icon
- Email with mail icon
- Edit mode toggle
- Save/Cancel buttons when editing
```

### 3. Settings Card

```javascript
- Notifications toggle (active)
- Dark mode toggle (disabled/placeholder)
```

### 4. Security Menu

```javascript
- Change password option
- Lock icon
- Chevron indicator
```

### 5. About Menu

```javascript
- Help
- Terms of Service
- Privacy Policy
- Version number
```

### 6. Logout Button

```javascript
- Red color (#F44336)
- Outlined style
- Confirmation dialog
```

## 🎯 Bottom Tab Features

### Tab Specifications:

```javascript
Height: 60px
Background: White (#FFFFFF)
Border Top: 1px (#E0E0E0)
Padding: 8px (top and bottom)
Shadow: Elevation 10

Active Tab:
- Color: Blue (#2196F3)
- Filled icon
- Bold label (600 weight)

Inactive Tab:
- Color: Gray (#757575)
- Outline icon
- Regular label
```

### Icons Used:

- **Home Tab:** `home` / `home-outline`
- **Profile Tab:** `person` / `person-outline`

## 📊 State Management

### Profile Screen State:

```javascript
- userData: User information from storage
- editMode: Toggle edit mode
- name: Editable name field
- email: Editable email field
- notifications: Toggle state
- darkMode: Toggle state (disabled)
```

## 🔮 Future Enhancements

### Planned Features:

1. **Profile Photo Upload:**

   - Camera/gallery integration
   - Image cropping
   - Upload to backend

2. **Change Password:**

   - Password change form
   - Validation
   - API integration

3. **Dark Mode:**

   - Theme switching
   - Persistent preference
   - App-wide dark theme

4. **Notifications:**

   - Push notification setup
   - Notification preferences
   - Firebase integration

5. **Additional Tabs:**

   - History/Analytics tab
   - Settings tab
   - Favorites tab

6. **Profile Customization:**

   - Custom themes
   - Language selection
   - Currency preferences

7. **Help & Support:**
   - FAQ section
   - Contact support
   - Live chat

## 🎨 Design Consistency

### Color Scheme:

```javascript
Primary Blue: #2196F3
Primary Dark: #1a237e
Success Green: #4CAF50
Error Red: #F44336
Gray Text: #757575
Dark Text: #212121
Background: #F5F5F5
White: #FFFFFF
```

### Typography:

```javascript
Header Title: 24px bold
Section Title: 18px bold
Menu Item: 16px medium
Label: 12px regular
Small Text: 14px regular
```

### Spacing:

```javascript
Section Gap: 20px
Card Padding: 16px
Icon Size: 22px (menu), 50px (avatar)
Border Radius: 12px (cards), 20px (buttons)
```

## ✅ Testing Checklist

- [x] Bottom tabs display correctly
- [x] Tab icons change on selection
- [x] Profile screen loads user data
- [x] Edit mode works properly
- [x] Save/Cancel buttons function
- [x] Notification toggle works
- [x] Logout confirmation appears
- [x] Logout navigates to login screen
- [x] Navigation between tabs is smooth
- [x] Signal details accessible from Home
- [x] Back navigation works correctly

## 📝 Code Examples

### Accessing User Data:

```javascript
import { getUserData } from "../services/auth";

const userData = await getUserData();
// { name: "John", email: "john@example.com", id: 1 }
```

### Navigation Between Tabs:

```javascript
// Users can freely switch between tabs by tapping icons
// No code needed - handled by React Navigation
```

### Logout from Profile:

```javascript
import { logoutUser } from "../services/auth";

await logoutUser();
navigation.reset({
  index: 0,
  routes: [{ name: "Login" }],
});
```

## 🎉 Summary

✅ **Profile screen created** with complete user information  
✅ **Bottom tab navigation** implemented with icons  
✅ **Home and Profile tabs** switching smoothly  
✅ **Edit profile functionality** with save/cancel  
✅ **Settings toggles** for notifications and dark mode  
✅ **Logout from profile** with confirmation  
✅ **Clean navigation flow** from login to main tabs  
✅ **Professional design** matching app theme

**The app now has a complete profile management system with intuitive bottom navigation!** 🚀
