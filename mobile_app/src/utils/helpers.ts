/**
 * Валютын хослолын мэдээлэл - 20 алдартай forex хослол
 */
export interface CurrencyPair {
  id: string;
  name: string;
  displayName: string;
  color: string;
}

export const CURRENCY_PAIRS: CurrencyPair[] = [
  // Major Pairs
  {
    id: "EUR_USD",
    name: "EUR/USD",
    displayName: "EURUSD",
    color: "#2962FF",
  },
  {
    id: "GBP_USD",
    name: "GBP/USD",
    displayName: "GBPUSD",
    color: "#26A69A",
  },
  {
    id: "USD_JPY",
    name: "USD/JPY",
    displayName: "USDJPY",
    color: "#EF5350",
  },
  {
    id: "USD_CHF",
    name: "USD/CHF",
    displayName: "USDCHF",
    color: "#AB47BC",
  },
  {
    id: "AUD_USD",
    name: "AUD/USD",
    displayName: "AUDUSD",
    color: "#FF7043",
  },
  {
    id: "USD_CAD",
    name: "USD/CAD",
    displayName: "USDCAD",
    color: "#EC407A",
  },
  {
    id: "NZD_USD",
    name: "NZD/USD",
    displayName: "NZDUSD",
    color: "#26C6DA",
  },
  // Cross Pairs
  {
    id: "EUR_GBP",
    name: "EUR/GBP",
    displayName: "EURGBP",
    color: "#7E57C2",
  },
  {
    id: "EUR_JPY",
    name: "EUR/JPY",
    displayName: "EURJPY",
    color: "#5C6BC0",
  },
  {
    id: "GBP_JPY",
    name: "GBP/JPY",
    displayName: "GBPJPY",
    color: "#26A69A",
  },
  {
    id: "EUR_CHF",
    name: "EUR/CHF",
    displayName: "EURCHF",
    color: "#8D6E63",
  },
  {
    id: "EUR_AUD",
    name: "EUR/AUD",
    displayName: "EURAUD",
    color: "#78909C",
  },
  {
    id: "GBP_CHF",
    name: "GBP/CHF",
    displayName: "GBPCHF",
    color: "#FF7043",
  },
  {
    id: "AUD_JPY",
    name: "AUD/JPY",
    displayName: "AUDJPY",
    color: "#9CCC65",
  },
  {
    id: "CHF_JPY",
    name: "CHF/JPY",
    displayName: "CHFJPY",
    color: "#D4E157",
  },
  {
    id: "NZD_JPY",
    name: "NZD/JPY",
    displayName: "NZDJPY",
    color: "#FFCA28",
  },
  {
    id: "AUD_NZD",
    name: "AUD/NZD",
    displayName: "AUDNZD",
    color: "#29B6F6",
  },
  {
    id: "EUR_CAD",
    name: "EUR/CAD",
    displayName: "EURCAD",
    color: "#BDBDBD",
  },
  {
    id: "GBP_AUD",
    name: "GBP/AUD",
    displayName: "GBPAUD",
    color: "#FF4081",
  },
  {
    id: "GBP_CAD",
    name: "GBP/CAD",
    displayName: "GBPCAD",
    color: "#7C4DFF",
  },
];

export interface SignalType {
  name: string;
  shortName: string;
  emoji: string;
  color: string;
  textColor: string;
  action: "BUY" | "SELL" | "HOLD";
  strength: "STRONG" | "MEDIUM" | "NEUTRAL";
}

/**
 * Сигналын ангилал
 */
export const SIGNAL_TYPES: Record<number, SignalType> = {
  0: {
    name: "High volatility down",
    shortName: "STRONG SELL",
    emoji: "[vv]",
    color: "#D32F2F",
    textColor: "#FFFFFF",
    action: "SELL",
    strength: "STRONG",
  },
  1: {
    name: "Medium volatility down",
    shortName: "SELL",
    emoji: "[v]",
    color: "#F44336",
    textColor: "#FFFFFF",
    action: "SELL",
    strength: "MEDIUM",
  },
  2: {
    name: "No trend",
    shortName: "HOLD",
    emoji: "[-]",
    color: "#FFC107",
    textColor: "#000000",
    action: "HOLD",
    strength: "NEUTRAL",
  },
  3: {
    name: "Medium volatility up",
    shortName: "BUY",
    emoji: "[^]",
    color: "#4CAF50",
    textColor: "#FFFFFF",
    action: "BUY",
    strength: "MEDIUM",
  },
  4: {
    name: "High volatility up",
    shortName: "STRONG BUY",
    emoji: "[^^]",
    color: "#2E7D32",
    textColor: "#FFFFFF",
    action: "BUY",
    strength: "STRONG",
  },
};

/**
 * Форматлах функцууд
 */
export const formatNumber = (num: number | undefined | null, decimals: number = 2): string => {
  return num?.toFixed(decimals) || "0.00";
};

export const formatPercent = (num: number | undefined | null): string => {
  return `${formatNumber(num, 1)}%`;
};

export const formatDate = (date: string | Date | number): string => {
  return new Date(date).toLocaleString("mn-MN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Сигналын өнгө авах
 */
export const getSignalColor = (label: number): string => {
  return SIGNAL_TYPES[label]?.color || "#9E9E9E";
};

/**
 * Сигналын текст авах
 */
export const getSignalText = (label: number): string => {
  return SIGNAL_TYPES[label]?.shortName || "UNKNOWN";
};

/**
 * Сигналын emoji авах
 */
export const getSignalEmoji = (label: number): string => {
  return SIGNAL_TYPES[label]?.emoji || "❓";
};

/**
 * Итгэлцлийн түвшинг үнэлэх
 */
export const getConfidenceLevel = (confidence: number): { text: string; color: string } => {
  if (confidence >= 70) return { text: "Өндөр", color: "#4CAF50" };
  if (confidence >= 50) return { text: "Дунд", color: "#FFC107" };
  return { text: "Бага", color: "#F44336" };
};

/**
 * Худалдааны зөвлөмж үүсгэх
 */
export const getTradingAdvice = (label: number, confidence: number): string => {
  const signal = SIGNAL_TYPES[label];
  const confLevel = getConfidenceLevel(confidence);

  if (signal?.action === "BUY") {
    if (signal.strength === "STRONG" && confidence >= 60) {
      return "Худалдан авах сайн боломж";
    } else if (signal.strength === "MEDIUM") {
      return "Жижиг позиц нээж болно";
    }
  } else if (signal?.action === "SELL") {
    if (signal.strength === "STRONG" && confidence >= 60) {
      return "Зарах сайн боломж";
    } else if (signal.strength === "MEDIUM") {
      return "Жижиг short позиц нээж болно";
    }
  }

  return "Хүлээж, зах зээлийг ажиглах";
};

/**
 * Get time-based greeting
 * @param language - Language code ('mn' for Mongolian, 'en' for English)
 * @returns Greeting message
 */
export const getTimeBasedGreeting = (language: "mn" | "en" = "mn"): string => {
  const hour = new Date().getHours();

  if (language === "en") {
    if (hour < 12) {
      return "Good morning";
    } else if (hour < 18) {
      return "Good afternoon";
    } else {
      return "Good evening";
    }
  }

  // Default to Mongolian
  if (hour < 12) {
    return "Өглөөний мэнд"; // Good morning
  } else if (hour < 18) {
    return "Өдрийн мэнд"; // Good afternoon
  } else {
    return "Оройн мэнд"; // Good evening
  }
};

export default {
  CURRENCY_PAIRS,
  SIGNAL_TYPES,
  formatNumber,
  formatPercent,
  formatDate,
  getSignalColor,
  getSignalText,
  getSignalEmoji,
  getConfidenceLevel,
  getTradingAdvice,
  getTimeBasedGreeting,
};
