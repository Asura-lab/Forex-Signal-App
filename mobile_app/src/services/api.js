import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Backend API хаяг - ЭНИЙГ ӨӨРИЙН BACKEND IP-ЭЭР СОЛИНО УУ!
const API_BASE_URL = "http://192.168.1.44:5000"; // Жишээ: Өөрийн компьютерын IP

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Token автоматаар нэмэх
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("userToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==================== AUTH ENDPOINTS ====================

/**
 * Бүртгүүлэх (Имэйл баталгаажуулалттай)
 */
export const registerUser = async (name, email, password) => {
  try {
    const response = await apiClient.post("/auth/register", {
      name,
      email,
      password,
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
 * Имэйл баталгаажуулах
 */
export const verifyEmail = async (email, code) => {
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
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * Баталгаажуулалтын код дахин илгээх
 */
export const resendVerificationCode = async (email) => {
  try {
    const response = await apiClient.post("/auth/resend-verification", {
      email,
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
 * Нэвтрэх
 */
export const loginUser = async (email, password) => {
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
 * API холболтыг шалгах
 */
export const checkApiStatus = async () => {
  try {
    const response = await apiClient.get("/");
    return { success: true, data: response.data };
  } catch (error) {
    console.error("API холболт амжилтгүй:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Моделийн мэдээлэл авах
 */
export const getModelInfo = async () => {
  try {
    const response = await apiClient.get("/model_info");
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Моделийн мэдээлэл авах алдаа:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Форекс хослолын таамаглал авах
 * @param {string} currencyPair - Валютын хос (жишээ: EUR/USD)
 */
export const getPrediction = async (currencyPair) => {
  try {
    // Файлын нэр үүсгэх
    const fileName = currencyPair.replace("/", "_") + "_test.csv";
    const filePath = `data/test/${fileName}`;

    const response = await apiClient.post("/predict_file", {
      file_path: filePath,
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error("Таамаглал авах алдаа:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Бүх валютын хослолуудын таамаглал авах
 */
export const getAllPredictions = async () => {
  const pairs = [
    "EUR/USD",
    "GBP/USD",
    "USD/CAD",
    "USD/CHF",
    "USD/JPY",
    "XAU/USD",
  ];

  try {
    const predictions = await Promise.all(
      pairs.map(async (pair) => {
        const result = await getPrediction(pair);
        return {
          pair,
          ...result,
        };
      })
    );

    return { success: true, data: predictions };
  } catch (error) {
    console.error("Бүх таамаглал авах алдаа:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Шинэ дата дээр таамаглал хийх
 * @param {Array} ohlcvData - OHLCV дата массив
 */
export const predictWithData = async (ohlcvData) => {
  try {
    const response = await apiClient.post("/predict", {
      data: ohlcvData,
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error("Дата дээр таамаглал хийх алдаа:", error.message);
    return { success: false, error: error.message };
  }
};

// ==================== LIVE RATES ENDPOINTS ====================

/**
 * Бодит цагийн валютын ханш авах
 * @param {Array} currencies - Optional: ['EUR', 'GBP', 'JPY'] гэх мэт
 * @param {String} source - 'mt5', 'api', or 'auto' (default: 'auto')
 * @returns {Object} { success, data: { rates, timestamp, source } }
 */
export const getLiveRates = async (currencies = null, source = "auto") => {
  try {
    let url = "/rates/live";
    const params = [];

    if (currencies && currencies.length > 0) {
      params.push(`currencies=${currencies.join(",")}`);
    }

    if (source) {
      params.push(`source=${source}`);
    }

    if (params.length > 0) {
      url += `?${params.join("&")}`;
    }

    const response = await apiClient.get(url);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Live rates авах алдаа:", error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * Тодорхой хослолын бодит цагийн ханш авах
 * @param {String} pair - Жишээ: "EUR_USD", "USD_JPY"
 * @returns {Object} { success, data: { pair, rate, timestamp } }
 */
export const getSpecificRate = async (pair) => {
  try {
    const response = await apiClient.get(`/rates/specific?pair=${pair}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`${pair} ханш авах алдаа:`, error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * MT5 холболтын статус шалгах
 * @returns {Object} { success, data: { enabled, connected, account_info } }
 */
export const getMT5Status = async () => {
  try {
    const response = await apiClient.get("/rates/mt5/status");
    return { success: true, data: response.data };
  } catch (error) {
    console.error("MT5 статус шалгах алдаа:", error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

export default {
  checkApiStatus,
  getModelInfo,
  getPrediction,
  getAllPredictions,
  predictWithData,
  getLiveRates,
  getSpecificRate,
  getMT5Status,
};
