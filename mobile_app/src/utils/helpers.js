/**
 * Валютын хослолын мэдээлэл
 */
export const CURRENCY_PAIRS = [
  {
    id: "EUR_USD",
    name: "EUR/USD",
    displayName: "Euro / US Dollar",
    flag: "🇪🇺🇺🇸",
    color: "#2196F3",
  },
  {
    id: "GBP_USD",
    name: "GBP/USD",
    displayName: "British Pound / US Dollar",
    flag: "🇬🇧🇺🇸",
    color: "#4CAF50",
  },
  {
    id: "USD_CAD",
    name: "USD/CAD",
    displayName: "US Dollar / Canadian Dollar",
    flag: "🇺🇸🇨🇦",
    color: "#FF9800",
  },
  {
    id: "USD_CHF",
    name: "USD/CHF",
    displayName: "US Dollar / Swiss Franc",
    flag: "🇺🇸🇨🇭",
    color: "#9C27B0",
  },
  {
    id: "USD_JPY",
    name: "USD/JPY",
    displayName: "US Dollar / Japanese Yen",
    flag: "🇺🇸🇯🇵",
    color: "#F44336",
  },
  {
    id: "XAU_USD",
    name: "XAU/USD",
    displayName: "Gold / US Dollar",
    flag: "🏅🇺🇸",
    color: "#FFD700",
  },
];

/**
 * Сигналын ангилал
 */
export const SIGNAL_TYPES = {
  0: {
    name: "High volatility down",
    shortName: "STRONG SELL",
    emoji: "📉💥",
    color: "#D32F2F",
    textColor: "#FFFFFF",
    action: "SELL",
    strength: "STRONG",
  },
  1: {
    name: "Medium volatility down",
    shortName: "SELL",
    emoji: "📉",
    color: "#F44336",
    textColor: "#FFFFFF",
    action: "SELL",
    strength: "MEDIUM",
  },
  2: {
    name: "No trend",
    shortName: "HOLD",
    emoji: "➡️",
    color: "#FFC107",
    textColor: "#000000",
    action: "HOLD",
    strength: "NEUTRAL",
  },
  3: {
    name: "Medium volatility up",
    shortName: "BUY",
    emoji: "📈",
    color: "#4CAF50",
    textColor: "#FFFFFF",
    action: "BUY",
    strength: "MEDIUM",
  },
  4: {
    name: "High volatility up",
    shortName: "STRONG BUY",
    emoji: "📈🚀",
    color: "#2E7D32",
    textColor: "#FFFFFF",
    action: "BUY",
    strength: "STRONG",
  },
};

/**
 * Форматлах функцууд
 */
export const formatNumber = (num, decimals = 2) => {
  return num?.toFixed(decimals) || "0.00";
};

export const formatPercent = (num) => {
  return `${formatNumber(num, 1)}%`;
};

export const formatDate = (date) => {
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
export const getSignalColor = (label) => {
  return SIGNAL_TYPES[label]?.color || "#9E9E9E";
};

/**
 * Сигналын текст авах
 */
export const getSignalText = (label) => {
  return SIGNAL_TYPES[label]?.shortName || "UNKNOWN";
};

/**
 * Сигналын emoji авах
 */
export const getSignalEmoji = (label) => {
  return SIGNAL_TYPES[label]?.emoji || "❓";
};

/**
 * Итгэлцлийн түвшинг үнэлэх
 */
export const getConfidenceLevel = (confidence) => {
  if (confidence >= 70) return { text: "Өндөр", color: "#4CAF50" };
  if (confidence >= 50) return { text: "Дунд", color: "#FFC107" };
  return { text: "Бага", color: "#F44336" };
};

/**
 * Худалдааны зөвлөмж үүсгэх
 */
export const getTradingAdvice = (label, confidence) => {
  const signal = SIGNAL_TYPES[label];
  const confLevel = getConfidenceLevel(confidence);

  if (signal.action === "BUY") {
    if (signal.strength === "STRONG" && confidence >= 60) {
      return "✅ Худалдан авах сайн боломж";
    } else if (signal.strength === "MEDIUM") {
      return "🟢 Жижиг позиц нээж болно";
    }
  } else if (signal.action === "SELL") {
    if (signal.strength === "STRONG" && confidence >= 60) {
      return "⛔ Зарах сайн боломж";
    } else if (signal.strength === "MEDIUM") {
      return "🔴 Жижиг short позиц нээж болно";
    }
  }

  return "⚠️ Хүлээж, зах зээлийг ажиглах";
};

/**
 * Get time-based greeting
 * @param {string} language - Language code ('mn' for Mongolian, 'en' for English)
 * @returns {string} Greeting message
 */
export const getTimeBasedGreeting = (language = "mn") => {
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
