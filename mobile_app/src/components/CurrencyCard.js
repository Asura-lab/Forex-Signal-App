import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { getColors } from "../config/theme";

/**
 * Валютын хос картын компонент - TradingView style
 */
const CurrencyCard = ({
  pair,
  prediction,
  liveRate,
  onPress,
  loading,
  showChangeColumn = true,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const formatRate = (rate) => {
    if (!rate) return "—";

    const rateValue = typeof rate === "object" ? rate.rate : rate;
    if (!rateValue) return "—";

    // Format with thousands separator for large numbers like XAU/USD
    if (rateValue >= 1000) {
      return rateValue.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    // Standard forex pairs
    if (pair.name.includes("JPY")) {
      return rateValue.toFixed(2);
    }
    return rateValue.toFixed(5);
  };

  const getChange = () => {
    if (!prediction || !prediction.latest_prediction) {
      return {
        value: "—",
        percent: "—",
        signal: "—",
        isPositive: null,
      };
    }

    const { label, confidence } = prediction.latest_prediction;

    // Signal mapping based on prediction
    let signalText = "HOLD";
    let changeDirection = 0; // -1: sell, 0: hold, 1: buy

    if (label === 0) {
      signalText = "S.SELL";
      changeDirection = -1;
    } else if (label === 1) {
      signalText = "SELL";
      changeDirection = -1;
    } else if (label === 2) {
      signalText = "HOLD";
      changeDirection = 0;
    } else if (label === 3) {
      signalText = "BUY";
      changeDirection = 1;
    } else if (label === 4) {
      signalText = "S.BUY";
      changeDirection = 1;
    }

    // Calculate change from MT5 data
    let changeValue = "—";
    let changePercent = "—";
    let isChangePositive = null;

    if (liveRate && typeof liveRate === "object" && liveRate.rate) {
      // If we have previous_close, calculate real change
      if (liveRate.previous_close && liveRate.previous_close > 0) {
        const change = liveRate.rate - liveRate.previous_close;
        changeValue = change.toFixed(pair.name.includes("JPY") ? 3 : 5);
        changePercent = ((change / liveRate.previous_close) * 100).toFixed(2);
        isChangePositive = change >= 0;
      }
      // Otherwise use spread as fallback
      else if (liveRate.spread) {
        const spread = liveRate.spread;
        changeValue = spread.toFixed(pair.name.includes("JPY") ? 3 : 5);
        changePercent = ((spread / liveRate.rate) * 100).toFixed(2);
        // Spread is typically shown as positive change
        isChangePositive = true;
      }
    }

    return {
      value: changeValue,
      percent: changePercent !== "—" ? changePercent + "%" : "—",
      signal: signalText,
      isPositive: isChangePositive,
      isNeutral: isChangePositive === null || changeValue === "—",
      signalDirection: changeDirection, // Keep signal direction separate
    };
  };

  const change = getChange();
  const styles = createStyles(colors, change.isPositive);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={loading}
    >
      {/* Symbol Column */}
      <View style={styles.symbolColumn}>
        <Text style={styles.symbol}>{pair.name}</Text>
      </View>

      {/* Last Price Column */}
      <View style={styles.column}>
        <Text style={styles.lastPrice}>{formatRate(liveRate)}</Text>
      </View>

      {/* Change Column - Hidden on small screens */}
      {showChangeColumn && (
        <View style={styles.column}>
          <Text
            style={[styles.changeValue, change.isNeutral && styles.neutralText]}
          >
            {change.value !== "—" &&
              change.isPositive !== null &&
              (change.isPositive ? "+" : "")}
            {change.value}
          </Text>
        </View>
      )}

      {/* Change % Column */}
      <View style={styles.column}>
        <Text
          style={[styles.changePercent, change.isNeutral && styles.neutralText]}
        >
          {change.percent !== "—" &&
            change.isPositive !== null &&
            (change.isPositive ? "+" : "")}
          {change.percent}
        </Text>
      </View>

      {/* Signal Column */}
      <View style={styles.signalColumn}>
        <Text
          style={[
            styles.signalText,
            change.isNeutral && styles.neutralSignal,
            change.signalDirection > 0 && !change.isNeutral && styles.buySignal,
            change.signalDirection < 0 &&
              !change.isNeutral &&
              styles.sellSignal,
            change.signalDirection === 0 && styles.neutralSignal,
          ]}
        >
          {change.signal}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors, isPositive) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderDark,
    },
    symbolColumn: {
      flex: 1.5,
    },
    symbol: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textDark,
    },
    column: {
      flex: 1,
      alignItems: "flex-end",
    },
    lastPrice: {
      fontSize: 15,
      fontWeight: "500",
      color: colors.textDark,
    },
    changeValue: {
      fontSize: 15,
      fontWeight: "500",
      color: isPositive ? "#00C853" : "#FF1744",
    },
    changePercent: {
      fontSize: 15,
      fontWeight: "600",
      color: isPositive ? "#00C853" : "#FF1744",
    },
    neutralText: {
      color: colors.textLabel,
    },
    signalColumn: {
      flex: 1,
      alignItems: "flex-end",
    },
    signalText: {
      fontSize: 13,
      fontWeight: "700",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    buySignal: {
      color: "#00C853",
      backgroundColor: "#00C85320",
    },
    sellSignal: {
      color: "#FF1744",
      backgroundColor: "#FF174420",
    },
    neutralSignal: {
      color: colors.textLabel,
      backgroundColor: colors.input,
    },
  });

export default CurrencyCard;
