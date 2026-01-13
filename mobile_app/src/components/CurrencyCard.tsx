import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { CurrencyPair } from "../utils/helpers";

interface CurrencyCardProps {
  pair: CurrencyPair;
  liveRate: any;
  onPress: () => void;
  loading: boolean;
  colors: any;
}

/**
 * Currency Card - Professional trading style row
 */
const CurrencyCard: React.FC<CurrencyCardProps> = ({ pair, liveRate, onPress, loading, colors }) => {
  // Default colors if not passed
  const c = colors || {
    background: "#0D1421",
    card: "#131C2E",
    border: "#1E293B",
    textPrimary: "#FFFFFF",
    textSecondary: "#6B7280",
    success: "#00C853",
    error: "#EF5350",
    neutral: "#6B7280",
  };
  
  // Get rate data
  const rateData = typeof liveRate === "object" ? liveRate : { rate: liveRate };
  const rate: number = rateData?.rate || 0;
  const change: number = rateData?.change || 0;
  const changePercent: number = rateData?.change_percent || 0;

  const isPositive = change > 0;
  const isNegative = change < 0;
  const changeColor = isPositive ? c.success : isNegative ? c.error : c.textSecondary;

  const formatRate = (value: number | undefined) => {
    if (!value) return "-.-----";
    if (pair.name.includes("JPY")) {
      return value.toFixed(3);
    }
    return value.toFixed(5);
  };

  const formatChange = (value: number | undefined) => {
    if (!value && value !== 0) return "-";
    const prefix = value! > 0 ? "+" : "";
    if (pair.name.includes("JPY")) {
      return prefix + value!.toFixed(3);
    }
    return prefix + value!.toFixed(5);
  };

  const formatChangePercent = (value: number | undefined) => {
    if (!value && value !== 0) return "-";
    const prefix = value! > 0 ? "+" : "";
    return prefix + value!.toFixed(2) + "%";
  };

  const styles = createStyles(c);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={loading}
    >
      {/* Symbol */}
      <View style={styles.symbolColumn}>
        <View style={[styles.indicator, { backgroundColor: changeColor }]} />
        <View>
          <Text style={styles.symbol}>{pair.displayName}</Text>
          <Text style={styles.pairLabel}>{pair.name.replace("/", " / ")}</Text>
        </View>
      </View>

      {/* Price */}
      <View style={styles.priceColumn}>
        <Text style={styles.price}>{formatRate(rate)}</Text>
      </View>

      {/* Change */}
      <View style={styles.changeColumn}>
        <Text style={[styles.change, { color: changeColor }]}>
          {formatChange(change)}
        </Text>
      </View>

      {/* Change % */}
      <View style={styles.percentColumn}>
        <View style={[styles.percentBadge, { backgroundColor: changeColor + '20' }]}>
          <Text style={[styles.percent, { color: changeColor }]}>
            {formatChangePercent(changePercent)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  symbolColumn: {
    flex: 2.5,
    flexDirection: "row",
    alignItems: "center",
  },
  indicator: {
    width: 3,
    height: 32,
    borderRadius: 1.5,
    marginRight: 12,
  },
  symbol: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  pairLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  priceColumn: {
    flex: 2,
    alignItems: "flex-end",
  },
  price: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  changeColumn: {
    flex: 1.5,
    alignItems: "flex-end",
  },
  change: {
    fontSize: 12,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
  percentColumn: {
    flex: 1.5,
    alignItems: "flex-end",
  },
  percentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  percent: {
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});

export default CurrencyCard;
