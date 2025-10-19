import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import SignalCard from "../components/SignalCard";
import StatisticsChart from "../components/StatisticsChart";
import {
  getTradingAdvice,
  getConfidenceLevel,
  formatDate,
} from "../utils/helpers";
import { getPrediction, getSpecificRate } from "../services/api";
import {
  colors,
  gradients,
  spacing,
  fontSize,
  fontWeight,
  shadows,
} from "../config/theme";
import { Ionicons } from "@expo/vector-icons";

/**
 * Сигнал дэлгэц - Дэлгэрэнгүй таамаглал
 */
const SignalScreen = ({ route, navigation }) => {
  const { pair, prediction: initialPrediction } = route.params;
  const [prediction, setPrediction] = useState(initialPrediction);
  const [loading, setLoading] = useState(false);
  const [liveRate, setLiveRate] = useState(null);
  const [rateLoading, setRateLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      title: pair.name,
      headerStyle: {
        backgroundColor: pair.color,
      },
      headerTintColor: "#fff",
    });

    // Fetch live rate
    fetchLiveRate();

    // Auto-refresh rate every 30 seconds
    const interval = setInterval(fetchLiveRate, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveRate = async () => {
    try {
      const result = await getSpecificRate(pair.name);
      if (result.success) {
        setLiveRate(result.data.rate);
      }
    } catch (error) {
      console.error("Live rate авах алдаа:", error);
    } finally {
      setRateLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);

    // Fetch both prediction and live rate
    const [predResult, rateResult] = await Promise.all([
      getPrediction(pair.name),
      getSpecificRate(pair.name),
    ]);

    if (predResult.success) {
      setPrediction(predResult.data);
    } else {
      Alert.alert("Алдаа", "Шинэчлэхэд алдаа гарлаа");
    }

    if (rateResult.success) {
      setLiveRate(rateResult.data.rate);
    }

    setLoading(false);
  };

  const formatRate = (rate) => {
    if (!rate) return "—";
    if (pair.name.includes("JPY")) {
      return rate.toFixed(3);
    }
    return rate.toFixed(5);
  };

  if (
    !prediction ||
    !prediction.latest_prediction ||
    prediction.latest_prediction.label == null ||
    prediction.latest_prediction.confidence == null
  ) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Таамаглал олдсонгүй</Text>
      </View>
    );
  }

  const { label, trend, confidence } = prediction.latest_prediction;
  const confLevel = getConfidenceLevel(confidence);
  const advice = getTradingAdvice(label, confidence);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[pair.color, `${pair.color}CC`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <Text style={styles.flag}>{pair.flag}</Text>
        <Text style={styles.pairName}>{pair.displayName}</Text>
        <Text style={styles.timestamp}>{formatDate(new Date())}</Text>

        {/* Live Rate Display */}
        <View style={styles.liveRateContainer}>
          <Ionicons name="stats-chart" size={16} color="#fff" />
          <Text style={styles.liveRateLabel}>Бодит ханш:</Text>
          {rateLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.liveRateValue}>{formatRate(liveRate)}</Text>
          )}
        </View>
      </LinearGradient>

      {/* Үндсэн сигнал */}
      <SignalCard prediction={prediction} />

      {/* Итгэлцлийн түвшин */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Итгэлцлийн түвшин</Text>
        <View style={styles.confidenceRow}>
          <View style={styles.confidenceInfo}>
            <Text style={styles.confidenceValue}>{confidence.toFixed(1)}%</Text>
            <Text style={[styles.confidenceLevel, { color: confLevel.color }]}>
              {confLevel.text}
            </Text>
          </View>
          <View style={styles.confidenceBarContainer}>
            <View style={styles.confidenceBarBg}>
              <View
                style={[
                  styles.confidenceBarFill,
                  { width: `${confidence}%`, backgroundColor: confLevel.color },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Худалдааны зөвлөмж */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>💡 Худалдааны зөвлөмж</Text>
        <View style={styles.adviceContainer}>
          <Text style={styles.adviceText}>{advice}</Text>
        </View>

        <View style={styles.tipsContainer}>
          <Text style={styles.tipTitle}>Санамж:</Text>
          <Text style={styles.tipText}>
            • Risk management-ийг мартуузай{"\n"}• Stop loss ашигла{"\n"}•
            Позицоо хэт томруулаагүй{"\n"}• Олон шинжилгээний хослол хий
          </Text>
        </View>
      </View>

      {/* Статистик */}
      {prediction.statistics && (
        <StatisticsChart statistics={prediction.statistics} />
      )}

      {/* Дэлгэрэнгүй мэдээлэл */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Дэлгэрэнгүй мэдээлэл</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Нийт дата:</Text>
          <Text style={styles.infoValue}>
            {prediction.total_predictions?.toLocaleString() || "N/A"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Файл:</Text>
          <Text style={styles.infoValue}>
            {prediction.file || `${pair.name.replace("/", "_")}_test.csv`}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Модель:</Text>
          <Text style={styles.infoValue}>HMM (Gaussian)</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Шинж чанарууд:</Text>
          <Text style={styles.infoValue} numberOfLines={2}>
            Returns, Volatility, ATR, MA Cross, RSI, Volume
          </Text>
        </View>
      </View>

      {/* Шинэчлэх товч */}
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={handleRefresh}
        disabled={loading}
      >
        <LinearGradient
          colors={["#4CAF50", "#45a049"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.refreshGradient}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.refreshIcon}>🔄</Text>
              <Text style={styles.refreshText}>Шинэчлэх</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.error,
  },
  headerGradient: {
    padding: spacing.lg,
    alignItems: "center",
  },
  flag: {
    fontSize: 64,
    marginBottom: spacing.sm,
  },
  pairName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  timestamp: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  liveRateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    gap: spacing.xs,
  },
  liveRateLabel: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  liveRateValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: spacing.sm,
    padding: spacing.lg,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.md,
    ...shadows.md,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
    marginBottom: spacing.md,
  },
  confidenceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  confidenceInfo: {
    marginRight: spacing.lg,
  },
  confidenceValue: {
    fontSize: 36,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
  },
  confidenceLevel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.xs,
  },
  confidenceBarContainer: {
    flex: 1,
  },
  confidenceBarBg: {
    height: 12,
    backgroundColor: colors.borderDark,
    borderRadius: 6,
    overflow: "hidden",
  },
  confidenceBarFill: {
    height: "100%",
    borderRadius: 6,
  },
  adviceContainer: {
    backgroundColor: "#E3F2FD",
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
    padding: spacing.md,
    borderRadius: spacing.sm,
    marginBottom: spacing.md,
  },
  adviceText: {
    fontSize: fontSize.md,
    color: "#1565C0",
    fontWeight: fontWeight.semibold,
  },
  tipsContainer: {
    backgroundColor: "#FFF9C4",
    borderRadius: spacing.sm,
    padding: spacing.sm,
  },
  tipTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: "#F57F17",
    marginBottom: 6,
  },
  tipText: {
    fontSize: fontSize.xs,
    color: colors.textDark,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    flex: 1,
  },
  infoValue: {
    fontSize: fontSize.sm,
    color: colors.textDark,
    fontWeight: fontWeight.semibold,
    flex: 1,
    textAlign: "right",
  },
  refreshButton: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: spacing.sm,
    overflow: "hidden",
    ...shadows.md,
  },
  refreshGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },
  refreshIcon: {
    fontSize: fontSize.xl,
    marginRight: spacing.sm,
  },
  refreshText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
});

export default SignalScreen;
