# 🔧 Simulation Fix Guide

## 🐛 Your Simulation is Broken - Here's How to Fix It

### **Problem:**

The changes aren't showing up in your simulator/emulator.

### **✅ Solution - Follow These Steps:**

## Step 1: Stop Everything

In the terminal where Expo is running, press **`Ctrl + C`** to stop the server.

Or kill all Node processes:

```powershell
taskkill /F /IM node.exe
```

## Step 2: Clear All Caches

```powershell
cd mobile_app

# Clear Expo cache
npx expo start -c

# OR manually delete cache folders
Remove-Item -Recurse -Force .expo
Remove-Item -Recurse -Force node_modules/.cache
```

## Step 3: Restart Your Simulator/Emulator

### For Android:

1. Close the Android Emulator completely
2. Reopen it from Android Studio or AVD Manager
3. Wait for it to fully start

### For iOS:

1. Close the iOS Simulator
2. Reopen from Xcode
3. Wait for it to fully start

## Step 4: Start Expo Fresh

```powershell
cd mobile_app
npx expo start --clear
```

Wait for the QR code to appear, then press **`a`** for Android or **`i`** for iOS.

## Step 5: If Still Not Working - Full Clean Install

```powershell
cd mobile_app

# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install

# Clear Metro bundler cache
npx expo start --clear --reset-cache
```

---

## 🎯 **Quick Test - Are Changes Actually There?**

Let me verify the changes are in the files:

### ✅ Check LoginScreen.js:

Open: `mobile_app/src/screens/LoginScreen.js`
Look for line 14: Should say `import { loginUser } from "../services/auth";`

### ✅ Check SignUpScreen.js:

Open: `mobile_app/src/screens/SignUpScreen.js`
Look for line 15: Should say `import { registerUser } from "../services/auth";`

### ✅ Check App.js:

Open: `mobile_app/App.js`
Look for lines 1-9: Should include useState, useEffect, and auth imports

---

## 🔍 **Alternative: Test Without Simulator**

You can test on your physical phone:

1. **Download Expo Go app** on your phone (Android/iOS)
2. **Connect to same WiFi** as your computer
3. **Scan the QR code** from the terminal
4. **App will load on your phone**

---

## 🚨 **If Nothing Works - Manual Verification**

### Test 1: Check if files are saved

```powershell
cd mobile_app
Get-Content src/screens/LoginScreen.js | Select-String "loginUser"
```

Should show: `import { loginUser } from "../services/auth";`

### Test 2: Check if App.js has auth check

```powershell
Get-Content App.js | Select-String "isAuthenticated"
```

Should show: `import { isAuthenticated } from "./src/services/auth";`

---

## 📝 **Common Issues:**

### Issue 1: "Port 8081 already in use"

**Solution:**

```powershell
taskkill /F /IM node.exe
npx expo start
```

### Issue 2: "Metro bundler stuck"

**Solution:**

```powershell
npx expo start --clear --reset-cache
```

### Issue 3: "Simulator not responding"

**Solution:**

- Close simulator
- Delete app from simulator
- Restart simulator
- Run `npx expo start` and press `a` or `i`

### Issue 4: "App crashes on startup"

**Solution:** Check the terminal for error messages. Common errors:

- Missing dependencies: `npm install`
- Syntax errors: Check the files I edited
- Import errors: Make sure all files exist

---

## 🎯 **What You Should See After Fix:**

### On App Start:

1. **Loading screen** (blue with spinner) - for 1 second
2. **Login screen** (if not logged in)
3. Enter credentials and login
4. **Main screen with bottom tabs** appear
5. **Home tab** shows "Өглөөний мэнд, [username]! 👋"
6. **Profile tab** shows your info

### Bottom Tabs Should Look Like:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│   🏠 Нүүр        👤 Профайл     │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 💡 **Emergency: Test Authentication Manually**

Create a test file to verify auth works:

```javascript
// Create: mobile_app/test-auth.js
const AsyncStorage =
  require("@react-native-async-storage/async-storage").default;

async function testAuth() {
  // Store test data
  await AsyncStorage.setItem("@auth_token", "test_token");
  await AsyncStorage.setItem(
    "@user_data",
    JSON.stringify({
      name: "Test User",
      email: "test@test.com",
    })
  );

  // Retrieve and print
  const token = await AsyncStorage.getItem("@auth_token");
  const userData = await AsyncStorage.getItem("@user_data");

  console.log("Token:", token);
  console.log("User Data:", userData);
}

testAuth();
```

Run: `node test-auth.js`

---

## 🆘 **Still Stuck?**

### Option 1: Use Web Instead

```powershell
npx expo start
# Press 'w' to open in web browser
```

This will open in your browser instead of simulator.

### Option 2: Check Error Logs

Look at the terminal output carefully for any red error messages.

### Option 3: Rebuild from Scratch

```powershell
cd ..
Remove-Item -Recurse -Force mobile_app/node_modules
Remove-Item mobile_app/package-lock.json
cd mobile_app
npm install
npx expo start --clear
```

---

## ✅ **Success Checklist:**

- [ ] Expo server is running (QR code visible)
- [ ] Simulator/emulator is open and running
- [ ] App loads without errors
- [ ] Login screen appears first
- [ ] Can enter credentials
- [ ] After login, bottom tabs appear
- [ ] Can switch between Home and Profile tabs
- [ ] Greeting shows your username
- [ ] Profile shows your information

---

**If you're still having issues, let me know what error messages you see!**
