import axios from "axios";


// Backend API хаяг - ЭНИЙГ ӨӨРИЙН BACKEND IP-ЭЭР СОЛИНО УУ!
const API_BASE_URL = "http://192.168.1.44:5000"; // Жишээ: Өөрийн компьютерын IP

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

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

export default {
  checkApiStatus,
  getModelInfo,
  getPrediction,
  getAllPredictions,
  predictWithData,
};
