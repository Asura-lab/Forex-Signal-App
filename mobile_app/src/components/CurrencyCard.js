import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

/**
 * Валютын хос картын компонент
 */
const CurrencyCard = ({ pair, prediction, liveRate, onPress, loading }) => {
  const getQuickSignal = () => {
    if (loading) return { text: "⏳", color: "#9E9E9E" };
    if (
      !prediction ||
      !prediction.latest_prediction ||
      prediction.latest_prediction.label == null
    ) {
      return { text: "❓", color: "#9E9E9E" };
    }

    const { label } = prediction.latest_prediction;

    if (label === 0) return { text: "📉💥", color: "#D32F2F" };
    if (label === 1) return { text: "📉", color: "#F44336" };
    if (label === 2) return { text: "➡️", color: "#FFC107" };
    if (label === 3) return { text: "📈", color: "#4CAF50" };
    if (label === 4) return { text: "📈🚀", color: "#2E7D32" };

    return { text: "❓", color: "#9E9E9E" };
  };

  const formatRate = (rate) => {
    if (!rate) return null;

    // Handle MT5 format (object with rate, bid, ask)
    const rateValue = typeof rate === "object" ? rate.rate : rate;

    if (!rateValue) return null;

    // JPY has different decimal places (2-3 digits)
    if (pair.name.includes("JPY")) {
      return rateValue.toFixed(3);
    }
    // Most pairs: 4-5 decimal places
    return rateValue.toFixed(5);
  };

  const getRateDetails = () => {
    if (!liveRate || typeof liveRate !== "object") return null;

    return {
      bid: liveRate.bid ? liveRate.bid.toFixed(5) : null,
      ask: liveRate.ask ? liveRate.ask.toFixed(5) : null,
      spread: liveRate.spread ? liveRate.spread.toFixed(5) : null,
    };
  };

  const signal = getQuickSignal();
  const rateDetails = getRateDetails();

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: pair.color }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={loading}
    >
      <View style={styles.leftSection}>
        <Text style={styles.flag}>{pair.flag}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.pairName}>{pair.name}</Text>
          <Text style={styles.displayName} numberOfLines={1}>
            {pair.displayName}
          </Text>
          {liveRate && (
            <View>
              <Text style={styles.liveRate}>💱 {formatRate(liveRate)}</Text>
              {rateDetails && rateDetails.bid && rateDetails.ask && (
                <Text style={styles.rateDetails}>
                  Bid: {rateDetails.bid} • Ask: {rateDetails.ask}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      <View style={styles.rightSection}>
        <View style={[styles.signalBadge, { backgroundColor: signal.color }]}>
          <Text style={styles.signalEmoji}>{signal.text}</Text>
        </View>
        {prediction &&
          prediction.latest_prediction &&
          prediction.latest_prediction.confidence != null && (
            <Text style={styles.confidence}>
              {prediction.latest_prediction.confidence.toFixed(0)}%
            </Text>
          )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  flag: {
    fontSize: 32,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  pairName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 2,
  },
  displayName: {
    fontSize: 12,
    color: "#757575",
  },
  liveRate: {
    fontSize: 13,
    color: "#1a237e",
    fontWeight: "600",
    marginTop: 4,
  },
  rateDetails: {
    fontSize: 10,
    color: "#757575",
    marginTop: 2,
  },
  rightSection: {
    alignItems: "center",
  },
  signalBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  signalEmoji: {
    fontSize: 24,
  },
  confidence: {
    fontSize: 11,
    color: "#757575",
    fontWeight: "600",
  },
});

export default CurrencyCard;
