# Authentication Flow Documentation

## Overview

The Forex Signal App now includes a complete authentication system with Login and Sign Up functionality. Users must authenticate before accessing the home page and trading signals.

## Features

### 1. Login Screen (`LoginScreen.js`)

- **Email & Password Authentication**
- Password visibility toggle
- Form validation
- Loading states during authentication
- Navigation to Sign Up screen
- Automatic redirect to Home screen after successful login

### 2. Sign Up Screen (`SignUpScreen.js`)

- **User Registration**
- Name, Email, and Password fields
- Password confirmation with validation
- Password visibility toggles
- Comprehensive form validation:
  - All fields required
  - Valid email format
  - Minimum password length (6 characters)
  - Password match confirmation
- Automatic redirect to Home screen after successful registration

### 3. Home Screen (`HomeScreen.js`)

- **Logout Functionality**
- Logout button in header
- Confirmation dialog before logout
- Redirect to Login screen after logout

## Navigation Flow

```
Login Screen (Initial)
    ↓
    ├─ Sign Up → Home Screen
    └─ Login → Home Screen
         ↓
         ├─ Signal Screen
         └─ Logout → Login Screen
```

## Authentication Service (`auth.js`)

Located in `src/services/auth.js`, this service provides:

### Functions:

- `loginUser(email, password)` - Authenticate user
- `registerUser(name, email, password)` - Register new user
- `logoutUser()` - Clear authentication data
- `isAuthenticated()` - Check if user is logged in
- `getAuthToken()` - Retrieve stored auth token
- `getUserData()` - Retrieve stored user data

### Storage:

- Uses `@react-native-async-storage/async-storage` for persistent storage
- Stores authentication token
- Stores user profile data

## Implementation Details

### App.js Configuration

```javascript
initialRouteName="Login"  // App starts at Login screen

Stack Screens:
- Login (no header)
- SignUp (no header)
- Home (no header, with logout)
- Signal (with header)
```

### Security Notes

⚠️ **Current Implementation is for Demo Purposes**

The current authentication system uses mock API calls. For production:

1. **Replace Mock API Calls:**

   - Update `loginUser()` in `auth.js` with real backend endpoint
   - Update `registerUser()` in `auth.js` with real backend endpoint
   - Implement proper token validation

2. **Add Backend Integration:**

   ```javascript
   // Example in auth.js
   const response = await axios.post("http://YOUR_API_URL/auth/login", {
     email,
     password,
   });
   ```

3. **Implement Token Management:**

   - Add token refresh logic
   - Add token expiration handling
   - Implement secure storage for sensitive data

4. **Add Security Features:**
   - Password strength requirements
   - Rate limiting
   - CAPTCHA for signup
   - Two-factor authentication (optional)
   - Biometric authentication (optional)

## Installation

The authentication system requires the following dependency:

```bash
npm install @react-native-async-storage/async-storage
```

Or with Expo:

```bash
npx expo install @react-native-async-storage/async-storage
```

## Usage

### Running the App

```bash
cd mobile_app
npm install
npm start
```

### Testing Authentication

1. Open the app - Login screen appears
2. Click "Бүртгүүлэх" (Sign Up) to create an account
3. Fill in all fields and submit
4. You'll be redirected to Home screen automatically
5. Test logout by clicking the logout icon in the header
6. Login again with any credentials (mock accepts any valid format)

## User Experience

### Login Flow:

1. User opens app → Login screen
2. User enters email & password
3. User clicks "Нэвтрэх" (Login)
4. System validates and authenticates
5. Success → Navigate to Home screen
6. Error → Show error message

### Sign Up Flow:

1. User clicks "Бүртгүүлэх" (Sign Up) from Login
2. User fills registration form
3. User clicks "Бүртгүүлэх" (Sign Up)
4. System validates all fields
5. Success → Navigate to Home screen
6. Error → Show error message

### Logout Flow:

1. User clicks logout button in Home screen
2. Confirmation dialog appears
3. User confirms
4. System clears auth data
5. Navigate to Login screen

## Validation Rules

### Email:

- Must contain '@' symbol
- Required field

### Password:

- Minimum 6 characters
- Required field

### Sign Up Additional:

- Name is required
- Password and Confirm Password must match

## UI/UX Features

- **Visual Feedback:**

  - Loading spinners during API calls
  - Disabled buttons during processing
  - Success/error alerts

- **Password Security:**

  - Password fields masked by default
  - Toggle visibility option with eye icon

- **Responsive Design:**

  - KeyboardAvoidingView for better mobile experience
  - ScrollView in Sign Up for smaller screens

- **Gradient Background:**
  - Professional blue gradient theme
  - Consistent with app branding

## Future Enhancements

1. **Social Authentication:**

   - Google Sign In
   - Apple Sign In
   - Facebook Login

2. **Password Recovery:**

   - Forgot password flow
   - Email verification
   - Password reset

3. **Profile Management:**

   - Edit profile screen
   - Change password
   - Account settings

4. **Session Management:**

   - Auto-logout on token expiration
   - Keep me logged in option
   - Multiple device management

5. **Enhanced Security:**
   - Biometric authentication (Face ID/Touch ID)
   - Two-factor authentication
   - Password strength meter

## Troubleshooting

### Issue: AsyncStorage not found

**Solution:** Install the package:

```bash
npm install @react-native-async-storage/async-storage
```

### Issue: Navigation not working

**Solution:** Make sure all navigation dependencies are installed:

```bash
npm install @react-navigation/native @react-navigation/stack
```

### Issue: Can't access Home screen

**Solution:** Login or Sign Up first. The app now requires authentication.

## Files Modified/Created

### Created:

- `src/screens/LoginScreen.js` - Login interface
- `src/screens/SignUpScreen.js` - Registration interface
- `src/services/auth.js` - Authentication service
- `AUTH_GUIDE.md` - This documentation

### Modified:

- `App.js` - Added auth screens and navigation
- `package.json` - Added AsyncStorage dependency
- `src/screens/HomeScreen.js` - Added logout functionality

## Support

For issues or questions about the authentication system:

1. Check this documentation
2. Review the code comments in auth-related files
3. Ensure all dependencies are properly installed
4. Verify navigation configuration in App.js
