import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config/api";

export interface UserData {
  id: string;
  name: string;
  email: string;
  is_verified?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  token?: string;
  user?: UserData;
}

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 секунд
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Token автоматаар нэмэх
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem("userToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response interceptor - 401 token expiry автоматаар зохицуулах
apiClient.interceptors.response.use(
  (response) => response,
  async (error: any) => {
    if (error?.response?.status === 401) {
      // Token expired or invalid — clear it so the user can re-authenticate
      await AsyncStorage.removeItem("userToken");
      console.warn("[WARN] apiClient: 401 received, cleared stored token.");
    }
    return Promise.reject(error);
  }
);

// ==================== AUTH ENDPOINTS ====================

/**
 * Бүртгүүлэх (Имэйл баталгаажуулалттай)
 */
export const registerUser = async (name: string, email: string, password: string): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post("/auth/register", {
      name,
      email,
      password,
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * Имэйл баталгаажуулах
 */
export const verifyEmail = async (email: string, code: string): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post("/auth/verify-email", {
      email,
      code,
    });

    // Token-ийг хадгалах
    if (response.data.token) {
      await AsyncStorage.setItem("userToken", response.data.token);
      await AsyncStorage.setItem(
        "userData",
        JSON.stringify(response.data.user)
      );
    }

    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * Баталгаажуулалтын код дахин илгээх
 */
export const resendVerificationCode = async (email: string): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post("/auth/resend-verification", {
      email,
    });
    return { success: true, data: response.data };
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * Нэвтрэх
 */
export const loginUser = async (email: string, password: string): Promise<ApiResponse> => {
  try {
    const response = await apiClient.post("/auth/login", {
      email,
      password,
    });

    // Token хадгалах
    if (response.data.token) {
      await AsyncStorage.setItem("userToken", response.data.token);
      await AsyncStorage.setItem(
        "userData",
        JSON.stringify(response.data.user)
      );
    }

    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      requiresVerification:
        error.response?.data?.requires_verification || false,
    };
  }
};

/**
 * Нууц үг мартсан
 */
export const forgotPassword = async (email) => {
  try {
    const response = await apiClient.post("/auth/forgot-password", { email });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * Сэргээх код шалгах
 */
export const verifyResetCode = async (email, code) => {
  try {
    const response = await apiClient.post("/auth/verify-reset-code", {
      email,
      code,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * Нууц үг сэргээх
 */
export const resetPassword = async (email, code, newPassword) => {
  try {
    const response = await apiClient.post("/auth/reset-password", {
      email,
      code,
      new_password: newPassword,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * Гарах
 */
export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem("userToken");
    await AsyncStorage.removeItem("userData");
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==================== API STATUS ====================

/**
 * API холболтыг шалгах (Health check)
 */
export const checkApiStatus = async () => {
  try {
    const response = await apiClient.get("/health");
    return { success: true, data: response.data };
  } catch (error) {
    console.error("API холболт амжилтгүй:", error.message);
    return { success: false, error: error.message };
  }
};

// ==================== LIVE RATES ENDPOINTS (UniRate API) ====================

/**
 * Бодит цагийн EUR/USD ханш авах (UniRate API-аас)
 * @returns {Object} { success, data: { pair, rate, bid, ask, spread, time, source } }
 */
export const getLiveRates = async () => {
  try {
    const response = await apiClient.get("/rates/live");
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Live rates авах алдаа:", error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

// ==================== SIGNAL ENDPOINTS ====================

/**
 * Get Best Signal (Currently V10)
 * @param {number} minConfidence - Minimum confidence threshold (default: 80)
 * @param {string} pair - Currency pair (default: "EUR/USD")
 * @returns Signal object with entry, SL, TP, confidence
 */
export const getBestSignal = async (minConfidence: number = 80, pair: string = "EUR/USD") => {
  try {
    const response = await apiClient.get(
      `/signal/best?min_confidence=${minConfidence}&pair=${pair}`
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Signal авах алдаа:", error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * V2 Signal Generator - BUY-only mode with 80%+ accuracy
 * @param {number} minConfidence - Minimum confidence threshold (default: 80)
 * @param {string} pair - Currency pair (default: "EUR/USD")
 * @returns Signal object with entry, SL, TP, confidence
 */
export const getSignalV2 = async (minConfidence: number = 80, pair: string = "EUR/USD") => {
  try {
    const response = await apiClient.get(
      `/signal/v2?min_confidence=${minConfidence}&pair=${pair}`
    );
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Signal V2 авах алдаа:", error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

// ==================== SIGNAL STORAGE ENDPOINTS ====================

/**
 * Signal хадгалах (таамаг гарвал database-д хадгална)
 * @param {Object} signalData - Signal object
 * @returns {Object} { success, signal_id }
 */
export const saveSignal = async (signalData) => {
  try {
    const response = await apiClient.post("/signal/save", signalData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Signal хадгалах алдаа:", error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * Signal түүх авах
 * @param {Object} options - { pair, limit, signal_type, min_confidence }
 * @returns {Object} { success, signals }
 */
export const getSignalsHistory = async (options = {}) => {
  try {
    const params = new URLSearchParams();
    if (options.pair) params.append("pair", options.pair);
    if (options.limit) params.append("limit", options.limit);
    if (options.signal_type) params.append("signal_type", options.signal_type);
    if (options.min_confidence)
      params.append("min_confidence", options.min_confidence);

    const response = await apiClient.get(`/signals/history?${params.toString()}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Signal түүх авах алдаа:", error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * Signal статистик авах
 * @param {string} pair - Currency pair (default: EUR_USD)
 * @returns {Object} { success, stats }
 */
export const getSignalsStats = async (pair = "EUR_USD") => {
  try {
    const response = await apiClient.get(`/signals/stats?pair=${pair}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Signal stats авах алдаа:", error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * Market Analysis авах
 * @param {string} pair - Currency pair (e.g. "EUR/USD")
 * @returns {Object} { success, data }
 */
export const getMarketAnalysis = async (pair) => {
  try {
    const response = await apiClient.get(`/api/market-analysis?pair=${pair}`);
    // Backend returns { status: "success", data: { ... } }
    // We want to return the inner data object
    return { success: true, data: response.data.data };
  } catch (error) {
    console.error("Market analysis авах алдаа:", error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

export default {
  // Auth
  registerUser,
  verifyEmail,
  resendVerificationCode,
  loginUser,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  logoutUser,
  // API
  checkApiStatus,
  getLiveRates,
  getSignalV2,
  // Signal storage
  saveSignal,
  getSignalsHistory,
  getSignalsStats,
  getMarketAnalysis,
};
