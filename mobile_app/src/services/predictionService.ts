/**
 * Prediction Service
 * Multi-timeframe таамаглал авах
 */

import { API_BASE_URL } from "../config/api";

/**
 * Multi-timeframe prediction авах (15min, 30min, 60min)
 */
export const getMultiTimeframePrediction = async (
  currencyPair: string,
  forceRefresh: boolean = false
): Promise<any> => {
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
  } catch (error: any) {
    console.error("Multi-timeframe prediction error:", error);
    throw error;
  }
};

/**
 * Signal name-ийг монгол хэл рүү хөрвүүлэх
 */
export const getSignalNameMongolian = (signalName: string): string => {
  const translations: Record<string, string> = {
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
export const getSignalColor = (signalName: string) => {
  const colors = {
    STRONG_BUY: "#00C853",
    BUY: "#69F0AE",
    NEUTRAL: "#FFB74D",
    SELL: "#FF5252",
    STRONG_SELL: "#D32F2F",
  };

  return colors[signalName as keyof typeof colors] || "#757575";
};

/**
 * Signal-д тохирох icon авах
 */
export const getSignalIcon = (signalName: string) => {
  const icons = {
    STRONG_BUY: "trending-up",
    BUY: "arrow-up",
    // 'minus' is not a valid Ionicons name; use 'remove-outline' which is available
    NEUTRAL: "remove-outline",
    SELL: "arrow-down",
    STRONG_SELL: "trending-down",
  };

  return icons[signalName as keyof typeof icons] || "help";
};

/**
 * Confidence level-ийг текст болгох
 */
export const getConfidenceLevel = (confidence: number) => {
  if (confidence >= 0.9) return "Маш өндөр";
  if (confidence >= 0.75) return "Өндөр";
  if (confidence >= 0.6) return "Дунд";
  if (confidence >= 0.5) return "Бага";
  return "Маш бага";
};

/**
 * Timeframe-ийн нэрийг монгол хэл рүү хөрвүүлэх
 */
export const getTimeframeName = (timeframe: string) => {
  const names: Record<string, string> = {
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
