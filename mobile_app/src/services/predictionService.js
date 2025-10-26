/**
 * Prediction Service
 * Multi-timeframe таамаглал авах
 */

import { API_BASE_URL } from "../config/api";

/**
 * Multi-timeframe prediction авах (15min, 30min, 60min)
 * @param {string} currencyPair - Валютын хослол (e.g., "EUR/USD")
 * @param {boolean} forceRefresh - Кэшийг давж шинэчлэх эсэх
 * @returns {Promise<object>} - Prediction үр дүн
 */
export const getMultiTimeframePrediction = async (
  currencyPair,
  forceRefresh = false
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/predict_multi_timeframe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currency_pair: currencyPair,
        force_refresh: forceRefresh,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Prediction алдаа гарлаа");
    }

    return data;
  } catch (error) {
    console.error("Multi-timeframe prediction error:", error);
    throw error;
  }
};

/**
 * Signal name-ийг монгол хэл рүү хөрвүүлэх
 */
export const getSignalNameMongolian = (signalName) => {
  const translations = {
    STRONG_BUY: "Хүчтэй Худалдаж Авах",
    BUY: "Худалдаж Авах",
    NEUTRAL: "Төвийг Сахих",
    SELL: "Зарах",
    STRONG_SELL: "Хүчтэй Зарах",
  };

  return translations[signalName] || signalName;
};

/**
 * Signal-д тохирох өнгө авах
 */
export const getSignalColor = (signalName) => {
  const colors = {
    STRONG_BUY: "#00C853", // Dark green
    BUY: "#69F0AE", // Light green
    NEUTRAL: "#FFB74D", // Orange
    SELL: "#FF5252", // Red
    STRONG_SELL: "#D32F2F", // Dark red
  };

  return colors[signalName] || "#757575";
};

/**
 * Signal-д тохирох icon авах
 */
export const getSignalIcon = (signalName) => {
  const icons = {
    STRONG_BUY: "trending-up",
    BUY: "arrow-up",
    NEUTRAL: "minus",
    SELL: "arrow-down",
    STRONG_SELL: "trending-down",
  };

  return icons[signalName] || "help";
};

/**
 * Confidence level-ийг текст болгох
 */
export const getConfidenceLevel = (confidence) => {
  if (confidence >= 0.9) return "Маш өндөр";
  if (confidence >= 0.75) return "Өндөр";
  if (confidence >= 0.6) return "Дунд";
  if (confidence >= 0.5) return "Бага";
  return "Маш бага";
};

/**
 * Timeframe-ийн нэрийг монгол хэл рүү хөрвүүлэх
 */
export const getTimeframeName = (timeframe) => {
  const names = {
    "15min": "15 минут",
    "30min": "30 минут",
    "60min": "1 цаг",
  };

  return names[timeframe] || timeframe;
};

export default {
  getMultiTimeframePrediction,
  getSignalNameMongolian,
  getSignalColor,
  getSignalIcon,
  getConfidenceLevel,
  getTimeframeName,
};
