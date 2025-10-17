/**
 * Authentication Service
 * Handles user authentication, login, signup, and session management
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys
const AUTH_TOKEN_KEY = "@auth_token";
const USER_DATA_KEY = "@user_data";

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const loginUser = async (email, password) => {
  try {
    // TODO: Replace with actual API endpoint
    // Example:
    // const response = await axios.post('http://YOUR_API_URL/auth/login', {
    //   email,
    //   password,
    // });

    // Simulate API call for demo
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock successful response
    const mockResponse = {
      token: "mock_token_" + Date.now(),
      user: {
        id: 1,
        name: email.split("@")[0],
        email: email,
      },
    };

    // Store auth token and user data
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, mockResponse.token);
    await AsyncStorage.setItem(
      USER_DATA_KEY,
      JSON.stringify(mockResponse.user)
    );

    return {
      success: true,
      data: mockResponse,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Login failed",
    };
  }
};

/**
 * Register new user
 * @param {string} name - User name
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const registerUser = async (name, email, password) => {
  try {
    // TODO: Replace with actual API endpoint
    // Example:
    // const response = await axios.post('http://YOUR_API_URL/auth/register', {
    //   name,
    //   email,
    //   password,
    // });

    // Simulate API call for demo
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock successful response
    const mockResponse = {
      token: "mock_token_" + Date.now(),
      user: {
        id: Date.now(),
        name: name,
        email: email,
      },
    };

    // Store auth token and user data
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, mockResponse.token);
    await AsyncStorage.setItem(
      USER_DATA_KEY,
      JSON.stringify(mockResponse.user)
    );

    return {
      success: true,
      data: mockResponse,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || "Registration failed",
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
    return !!token;
  } catch (error) {
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
