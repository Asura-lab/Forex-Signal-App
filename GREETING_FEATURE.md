# User Greeting Feature

## Overview

The Home screen now displays a personalized, time-based greeting to users when they log in.

## Feature Details

### Greeting Format

```
[Time-based greeting], [Username]! 👋
```

### Examples:

- **Morning (00:00 - 11:59):** "Good morning, John! 👋" or "Өглөөний мэнд, John! 👋"
- **Afternoon (12:00 - 17:59):** "Good afternoon, John! 👋" or "Өдрийн мэнд, John! 👋"
- **Evening (18:00 - 23:59):** "Good evening, John! 👋" or "Оройн мэнд, John! 👋"

## Implementation

### 1. Helper Function (`src/utils/helpers.js`)

```javascript
getTimeBasedGreeting((language = "mn"));
```

**Parameters:**

- `language` (string): Language code
  - `"mn"` - Mongolian (default)
  - `"en"` - English

**Returns:**

- Appropriate greeting based on current time

**Time Ranges:**

- Morning: 00:00 - 11:59
- Afternoon: 12:00 - 17:59
- Evening: 18:00 - 23:59

### 2. HomeScreen Integration

**State Variables:**

- `userName` - Stores the logged-in user's name
- `greeting` - Stores the time-based greeting message

**Functions:**

- `loadUserData()` - Fetches user data from AsyncStorage and sets greeting

**Display:**

- Shows at the top of the header
- Only displays when user is logged in (userName exists)
- Includes a waving hand emoji 👋

## User Data Source

The username is retrieved from the authentication service:

```javascript
import { getUserData } from "../services/auth";

const userData = await getUserData();
// userData.name contains the user's name
```

## Language Support

### Mongolian (Default)

```javascript
setGreeting(getTimeBasedGreeting("mn"));
```

- Өглөөний мэнд (Good morning)
- Өдрийн мэнд (Good afternoon)
- Оройн мэнд (Good evening)

### English

```javascript
setGreeting(getTimeBasedGreeting("en"));
```

- Good morning
- Good afternoon
- Good evening

## Styling

The greeting appears in the header with:

- **Font size:** 18px
- **Color:** White (#FFFFFF)
- **Font weight:** 600 (Semi-bold)
- **Opacity:** 0.95
- **Bottom margin:** 8px

## User Experience

1. **User logs in or signs up**
2. **Redirected to Home screen**
3. **Greeting loads automatically:**

   - Fetches user data from storage
   - Determines current time
   - Displays personalized greeting

4. **Greeting updates:**
   - When user refreshes the app
   - When navigating back to Home screen
   - Automatically reflects the current time of day

## Future Enhancements

### Suggested Improvements:

1. **Real-time Updates:**

   - Update greeting when time crosses boundaries (12:00 PM, 6:00 PM)
   - Use setInterval to check and update

2. **More Languages:**

   - Add support for more languages
   - User preference for language selection

3. **Custom Greetings:**

   - Special greetings on holidays
   - Birthday greetings
   - Weekend vs weekday greetings

4. **Weather Integration:**

   - "Good morning, John! ☀️" (sunny)
   - "Good evening, John! 🌧️" (rainy)

5. **Timezone Support:**
   - Respect user's timezone
   - Handle international users

## Testing

### Test Different Times:

You can manually test by changing the hour check in `getTimeBasedGreeting()`:

```javascript
// Test morning
const hour = 8; // 8 AM

// Test afternoon
const hour = 14; // 2 PM

// Test evening
const hour = 20; // 8 PM
```

### Test Different Users:

- Sign up with different names
- Check if greeting displays the correct name
- Verify emoji appears

### Test Languages:

```javascript
// In HomeScreen.js, change language parameter
setGreeting(getTimeBasedGreeting("en")); // English
setGreeting(getTimeBasedGreeting("mn")); // Mongolian
```

## Code Locations

### Files Modified:

1. **`src/screens/HomeScreen.js`**

   - Added state variables for greeting
   - Added loadUserData function
   - Updated header JSX to display greeting
   - Added greeting styles

2. **`src/utils/helpers.js`**
   - Added getTimeBasedGreeting function
   - Exported new function

### New Styles Added:

```javascript
headerContent: {
  flex: 1,
},
greetingContainer: {
  marginBottom: 8,
},
greetingText: {
  fontSize: 18,
  color: "#FFFFFF",
  fontWeight: "600",
  opacity: 0.95,
},
```

## Usage Example

```javascript
import { getTimeBasedGreeting } from "../utils/helpers";

// Get Mongolian greeting
const greeting = getTimeBasedGreeting("mn");
console.log(greeting); // "Өглөөний мэнд" (morning)

// Get English greeting
const greeting = getTimeBasedGreeting("en");
console.log(greeting); // "Good morning"

// Display with username
const userName = "Sarah";
const fullGreeting = `${greeting}, ${userName}! 👋`;
console.log(fullGreeting); // "Good morning, Sarah! 👋"
```

## Accessibility

- **Visual:** Clear, readable text on contrasting background
- **Size:** Large enough font size (18px) for easy reading
- **Contrast:** White text on dark blue gradient (WCAG compliant)
- **Position:** Prominent placement at top of screen

## Performance

- **Minimal impact:** Only calculates once on screen load
- **Cached:** User data retrieved from AsyncStorage (fast)
- **No API calls:** All calculations done locally
- **Lightweight:** Simple time check and string concatenation

## Summary

✅ **Personalized greeting** based on time of day  
✅ **User's name displayed** from authentication  
✅ **Multi-language support** (Mongolian & English)  
✅ **Friendly design** with emoji  
✅ **Automatic updates** on screen load  
✅ **Extensible** for future enhancements

The greeting feature adds a welcoming, personalized touch to the user experience! 🎉
