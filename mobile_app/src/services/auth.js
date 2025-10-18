/**
 * Authentication Service
 * MongoDB + JWT ашигласан бодит authentication
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENDPOINTS } from "../config/api";

// Storage keys
const AUTH_TOKEN_KEY = "@auth_token";
const USER_DATA_KEY = "@user_data";

/**
 * Login user - Бодит MongoDB шалгалттай
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const loginUser = async (email, password) => {
  try {
    const response = await fetch(API_ENDPOINTS.LOGIN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || "Имэйл эсвэл нууц үг буруу байна",
      };
    }

    // Store auth token and user data
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: error.message || "Серверт холбогдох боломжгүй байна",
    };
  }
};

/**
 * Register new user - MongoDB-д бүртгэл үүсгэх
 * @param {string} name - User name
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const registerUser = async (name, email, password) => {
  try {
    const response = await fetch(API_ENDPOINTS.REGISTER, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || "Бүртгэл үүсгэхэд алдаа гарлаа",
      };
    }

    // Store auth token and user data
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(data.user));

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error("Register error:", error);
    return {
      success: false,
      error: error.message || "Серверт холбогдох боломжгүй байна",
    };
  }
};

/**
 * Logout user
 * @returns {Promise<{success: boolean}>}
 */
export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem(USER_DATA_KEY);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
      return false;
    }

    // Token шалгах (backend-тай)
    const response = await fetch(API_ENDPOINTS.VERIFY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
      timeout: 5000, // 5 second timeout
    });

    const data = await response.json();
    return data.success && data.valid;
  } catch (error) {
    console.error("Auth check error:", error);
    // If network error, assume not authenticated and let user try to login
    // This prevents the app from getting stuck on network errors
    return false;
  }
};

/**
 * Get stored auth token
 * @returns {Promise<string|null>}
 */
export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    return null;
  }
};

/**
 * Get stored user data
 * @returns {Promise<object|null>}
 */
export const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Check authentication status
 * @returns {Promise<{isAuthenticated: boolean, userData: object|null}>}
 */
export const checkAuthStatus = async () => {
  try {
    const isAuth = await isAuthenticated();
    const userData = isAuth ? await getUserData() : null;

    return {
      isAuthenticated: isAuth,
      userData: userData,
    };
  } catch (error) {
    console.error("Check auth status error:", error);
    return {
      isAuthenticated: false,
      userData: null,
    };
  }
};
