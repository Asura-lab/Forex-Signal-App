import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  getSignalEmoji,
  getSignalText,
  getSignalColor,
} from "../utils/helpers";

/**
 * Сигнал картын компонент
 */
const SignalCard = ({ prediction, onPress }) => {
  if (
    !prediction ||
    !prediction.latest_prediction ||
    prediction.latest_prediction.label == null ||
    prediction.latest_prediction.confidence == null
  ) {
    return null;
  }

  const { label, trend, confidence } = prediction.latest_prediction;
  const signalColor = getSignalColor(label);
  const signalText = getSignalText(label);
  const signalEmoji = getSignalEmoji(label);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={[signalColor, `${signalColor}CC`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Emoji */}
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>{signalEmoji}</Text>
        </View>

        {/* Сигналын нэр */}
        <View style={styles.signalContainer}>
          <Text style={styles.signalText}>{signalText}</Text>
          {trend && <Text style={styles.trendText}>{trend}</Text>}
        </View>

        {/* Итгэлцэл */}
        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceValue}>{confidence.toFixed(1)}%</Text>
          <Text style={styles.confidenceLabel}>Итгэлцэл</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  gradient: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  emojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: {
    fontSize: 32,
  },
  signalContainer: {
    flex: 1,
    marginLeft: 16,
  },
  signalText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  trendText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
  },
  confidenceContainer: {
    alignItems: "flex-end",
  },
  confidenceValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  confidenceLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
  },
});

export default SignalCard;
