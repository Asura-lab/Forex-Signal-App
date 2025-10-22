import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { getColors } from "../config/theme";
import { getSignalText } from "../utils/helpers";

/**
 * Сигнал картын компонент
 */
const SignalCard = ({ prediction }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  if (
    !prediction ||
    !prediction.latest_prediction ||
    prediction.latest_prediction.label == null ||
    prediction.latest_prediction.confidence == null
  ) {
    return null;
  }

  const { label, trend, confidence } = prediction.latest_prediction;
  const signalText = getSignalText(label);

  // Confidence badge color based on level
  let badgeColor = "#4CAF50"; // Green for high confidence
  if (confidence < 60) {
    badgeColor = "#FF5252"; // Red for low confidence
  } else if (confidence < 80) {
    badgeColor = "#FFC107"; // Yellow for medium confidence
  }

  const styles = createStyles(colors, badgeColor);

  return (
    <View style={styles.card}>
      {/* Сигнал */}
      <View style={styles.signalHeader}>
        <View style={styles.signalInfo}>
          <Text style={styles.signalText}>{signalText}</Text>
          {trend && <Text style={styles.trendText}>{trend}</Text>}
        </View>
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceValue}>{confidence.toFixed(1)}%</Text>
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors, badgeColor) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      marginVertical: 8,
      marginHorizontal: 16,
      overflow: "hidden",
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    signalHeader: {
      flexDirection: "row",
      alignItems: "center",
      padding: 20,
    },
    signalInfo: {
      flex: 1,
    },
    signalText: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.textDark,
      marginBottom: 4,
    },
    trendText: {
      fontSize: 13,
      color: colors.textLabel,
    },
    confidenceBadge: {
      backgroundColor: badgeColor,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    confidenceValue: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
  });

export default SignalCard;
