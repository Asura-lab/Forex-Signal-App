import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useTheme } from "../context/ThemeContext";
import {
  getColors,
  spacing,
  fontSize,
  fontWeight,
  shadows,
} from "../config/theme";
import SignalCard from "../components/SignalCard";
import { formatDate } from "../utils/helpers";
import {
  getPrediction,
  getSpecificRate,
  getMT5HistoricalRates,
} from "../services/api";
import {
  getMultiTimeframePrediction,
  getSignalNameMongolian,
  getSignalColor,
  getSignalIcon,
  getConfidenceLevel,
  getTimeframeName,
} from "../services/predictionService";
import { Ionicons } from "@expo/vector-icons";

/**
 * Сигнал дэлгэц - Multi-timeframe таамаглал
 */
const SignalScreen = ({ route, navigation }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(colors);

  const { pair, prediction: initialPrediction } = route.params;
  const [prediction, setPrediction] = useState(initialPrediction);
  const [multiTimeframePredictions, setMultiTimeframePredictions] =
    useState(null);
  const [loading, setLoading] = useState(false);
  const [liveRate, setLiveRate] = useState(null);
  const [rateLoading, setRateLoading] = useState(true);
  const [historicalData, setHistoricalData] = useState(null);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({
      title: pair.name,
      headerStyle: {
        backgroundColor: colors.card,
      },
      headerTintColor: colors.textDark,
    });

    // Fetch multi-timeframe predictions
    fetchMultiTimeframePredictions();
    // Fetch live rate
    fetchLiveRate();
    // Fetch historical data
    fetchHistoricalData();

    // Auto-refresh rate every 30 seconds
    const interval = setInterval(fetchLiveRate, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchMultiTimeframePredictions = async () => {
    try {
      setLoading(true);
      const result = await getMultiTimeframePrediction(pair.name, false);
      console.log("📊 Multi-timeframe predictions:", result);

      if (result.success) {
        setMultiTimeframePredictions(result.predictions);
      } else {
        Alert.alert("Алдаа", result.error || "Таамаглал авахад алдаа гарлаа");
      }
    } catch (error) {
      console.error("Multi-timeframe prediction error:", error);
      Alert.alert("Алдаа", "Серверт холбогдож чадсангүй");
    } finally {
      setLoading(false);
    }
  };

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

  const fetchHistoricalData = async () => {
    try {
      setChartLoading(true);
      console.log("📊 Fetching MT5 historical data for:", pair.name);

      // Use MT5 historical data - M1 timeframe, last 30 bars
      const result = await getMT5HistoricalRates(pair.name, "M1", 30);

      console.log("📊 MT5 result:", result);

      if (result.success && result.data.data) {
        // Convert MT5 data format to chart format
        const chartData = result.data.data.map((item) => ({
          time: item.time,
          close: item.close,
          open: item.open,
          high: item.high,
          low: item.low,
        }));
        console.log("📊 Chart data prepared:", chartData.length, "points");
        setHistoricalData(chartData);
      } else {
        console.error("MT5 data алдаа:", result.error);
        Alert.alert(
          "Мэдэгдэл",
          "MT5-аас өгөгдөл татах боломжгүй. MT5 холбогдсон эсэхийг шалгана уу."
        );
      }
    } catch (error) {
      console.error("Historical data авах алдаа:", error);
      Alert.alert("Алдаа", "График өгөгдөл татахад алдаа гарлаа");
    } finally {
      setChartLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);

    try {
      // Fetch multi-timeframe predictions with force refresh
      const result = await getMultiTimeframePrediction(pair.name, true);

      if (result.success) {
        setMultiTimeframePredictions(result.predictions);
      } else {
        Alert.alert("Алдаа", result.error || "Шинэчлэхэд алдаа гарлаа");
      }

      // Also fetch live rate
      const rateResult = await getSpecificRate(pair.name);
      if (rateResult.success && rateResult.data) {
        setLiveRate(rateResult.data.rate);
      }
    } catch (error) {
      console.error("Refresh error:", error);
      Alert.alert("Алдаа", "Шинэчлэхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const formatRate = (rate) => {
    if (!rate) return "—";
    if (pair.name.includes("JPY")) {
      return rate.toFixed(3);
    }
    return rate.toFixed(5);
  };

  // Prepare chart data from historical data
  const prepareChartData = () => {
    if (!historicalData || historicalData.length === 0) {
      return null;
    }

    const labels = historicalData.map((item, index) => {
      // Show every 4th label to avoid crowding
      if (index % 4 === 0) {
        const time = item.time || "";
        // Extract time part (HH:MM)
        const timePart = time.split(" ")[1] || "";
        return timePart.substring(0, 5); // HH:MM format
      }
      return "";
    });

    const values = historicalData.map((item) => item.close);

    return {
      labels,
      datasets: [{ data: values }],
    };
  };

  if (!multiTimeframePredictions && !loading) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Таамаглал олдсонгүй</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchMultiTimeframePredictions}
        >
          <Text style={styles.retryButtonText}>Дахин оролдох</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderTimeframeCard = (timeframe, data) => {
    if (!data || !data.success) {
      return (
        <View key={timeframe} style={styles.timeframeCard}>
          <Text style={styles.timeframeTitle}>
            {getTimeframeName(timeframe)}
          </Text>
          <Text style={styles.errorSmall}>
            {data?.error || "Таамаглал олдсонгүй"}
          </Text>
        </View>
      );
    }

    const { signal_name, confidence, current_price, price_change_percent } =
      data;
    const signalColor = getSignalColor(signal_name);
    const iconName = getSignalIcon(signal_name);

    return (
      <View key={timeframe} style={styles.timeframeCard}>
        <View style={styles.timeframeHeader}>
          <Text style={styles.timeframeTitle}>
            {getTimeframeName(timeframe)}
          </Text>
          <View style={[styles.signalBadge, { backgroundColor: signalColor }]}>
            <Ionicons name={iconName} size={16} color="#FFF" />
          </View>
        </View>

        <Text style={[styles.signalText, { color: signalColor }]}>
          {getSignalNameMongolian(signal_name)}
        </Text>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Итгэлцэл</Text>
            <Text style={styles.metricValue}>
              {(confidence * 100).toFixed(1)}%
            </Text>
            <Text style={styles.metricSubtext}>
              {getConfidenceLevel(confidence)}
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Өөрчлөлт</Text>
            <Text
              style={[
                styles.metricValue,
                {
                  color:
                    price_change_percent > 0
                      ? colors.success
                      : price_change_percent < 0
                      ? colors.error
                      : colors.textLabel,
                },
              ]}
            >
              {price_change_percent > 0 ? "+" : ""}
              {price_change_percent.toFixed(4)}%
            </Text>
            <Text style={styles.metricSubtext}>Сүүлийн үеийн</Text>
          </View>
        </View>

        {data.accuracy && (
          <View style={styles.accuracyBadge}>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={colors.success}
            />
            <Text style={styles.accuracyText}>
              Нарийвчлал: {(data.accuracy * 100).toFixed(1)}%
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* Live Rate Card */}
      <View style={styles.rateCard}>
        <View style={styles.rateHeader}>
          <Text style={styles.pairName}>{pair.displayName}</Text>
        </View>

        <View style={styles.rateDisplay}>
          {rateLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <>
              <Text style={styles.rateLabel}>Одоогийн ханш</Text>
              <Text style={styles.rateValue}>{formatRate(liveRate)}</Text>
            </>
          )}
        </View>
      </View>

      {/* Multi-Timeframe Predictions */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="analytics" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Олон хугацааны таамаглал</Text>
        </View>

        {loading && !multiTimeframePredictions ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Таамаглал тооцоолж байна...</Text>
          </View>
        ) : (
          <View style={styles.timeframeContainer}>
            {renderTimeframeCard("15min", multiTimeframePredictions?.["15min"])}
            {renderTimeframeCard("30min", multiTimeframePredictions?.["30min"])}
            {renderTimeframeCard("60min", multiTimeframePredictions?.["60min"])}
          </View>
        )}

        <View style={styles.noteContainer}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={colors.textLabel}
          />
          <Text style={styles.noteText}>
            Deep Learning моделуудын таамаглал (Transformer + LSTM)
          </Text>
        </View>
      </View>

      {/* Price Chart */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trending-up" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>MT5 Ханшийн график</Text>
        </View>
        {chartLoading ? (
          <View
            style={{
              height: 220,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : prepareChartData() ? (
          <LineChart
            data={prepareChartData()}
            width={Dimensions.get("window").width - 64}
            height={220}
            chartConfig={{
              backgroundColor: colors.card,
              backgroundGradientFrom: colors.card,
              backgroundGradientTo: colors.card,
              decimalPlaces: pair.name.includes("JPY") ? 2 : 5,
              color: (opacity = 1) => colors.primary,
              labelColor: (opacity = 1) => colors.textLabel,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "0", // Hide dots
              },
              propsForBackgroundLines: {
                strokeDasharray: "",
                stroke: colors.borderDark,
                strokeWidth: 1,
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        ) : (
          <Text style={styles.chartNote}>
            MT5 өгөгдөл олдсонгүй. MT5 холбогдсон эсэхийг шалгана уу.
          </Text>
        )}
        <View>
          <Text style={styles.chartNote}>
            * MT5-аас авсан бодит цагийн өгөгдөл (1 минутын график)
          </Text>
        </View>
      </View>

      {/* Model Info */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Ionicons
            name="information-circle"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.sectionTitle}>Дэлгэрэнгүй мэдээлэл</Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Архитектур</Text>
            <Text style={styles.infoValue}>Transformer + LSTM</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Таамаглал</Text>
            <Text style={styles.infoValue}>3 хугацаа</Text>
          </View>
        </View>

        <View style={styles.featuresList}>
          <Text style={styles.featuresTitle}>Шинж чанарууд:</Text>
          <View style={styles.featureTags}>
            <Text style={styles.featureTag}>SMA/EMA</Text>
            <Text style={styles.featureTag}>RSI</Text>
            <Text style={styles.featureTag}>MACD</Text>
            <Text style={styles.featureTag}>Bollinger Bands</Text>
            <Text style={styles.featureTag}>ATR</Text>
            <Text style={styles.featureTag}>Stochastic</Text>
            <Text style={styles.featureTag}>Volume</Text>
            <Text style={styles.featureTag}>Momentum</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
      padding: spacing.xl,
    },
    errorText: {
      fontSize: fontSize.lg,
      color: colors.error,
      marginBottom: spacing.md,
      textAlign: "center",
    },
    errorSmall: {
      fontSize: fontSize.xs,
      color: colors.error,
      marginTop: spacing.xs,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: 8,
      marginTop: spacing.md,
    },
    retryButtonText: {
      color: "#FFF",
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
    },
    // Live Rate Card
    rateCard: {
      backgroundColor: colors.card,
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: 16,
      padding: spacing.lg,
      ...shadows.md,
    },
    rateHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    pairName: {
      fontSize: 22,
      fontWeight: fontWeight.bold,
      color: colors.textDark,
    },
    rateDisplay: {
      alignItems: "center",
      paddingVertical: spacing.md,
    },
    rateLabel: {
      fontSize: fontSize.sm,
      color: colors.textLabel,
      marginBottom: spacing.xs,
    },
    rateValue: {
      fontSize: 32,
      fontWeight: fontWeight.bold,
      color: colors.primary,
    },
    // Card Styles
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: spacing.lg,
      marginVertical: spacing.sm,
      marginHorizontal: spacing.md,
      ...shadows.md,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    sectionTitle: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: colors.textDark,
    },
    loadingContainer: {
      paddingVertical: spacing.xl,
      alignItems: "center",
    },
    loadingText: {
      marginTop: spacing.md,
      fontSize: fontSize.sm,
      color: colors.textLabel,
    },
    // Timeframe Cards
    timeframeContainer: {
      gap: spacing.md,
    },
    timeframeCard: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderDark,
    },
    timeframeHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.sm,
    },
    timeframeTitle: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
      color: colors.textDark,
    },
    signalBadge: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
    },
    signalText: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      marginBottom: spacing.md,
    },
    metricsRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: spacing.sm,
    },
    metricItem: {
      flex: 1,
      alignItems: "center",
    },
    metricLabel: {
      fontSize: fontSize.xs,
      color: colors.textLabel,
      marginBottom: 4,
    },
    metricValue: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: colors.textDark,
    },
    metricSubtext: {
      fontSize: fontSize.xs,
      color: colors.textLabel,
      marginTop: 2,
    },
    metricDivider: {
      width: 1,
      height: 40,
      backgroundColor: colors.borderDark,
      marginHorizontal: spacing.sm,
    },
    accuracyBadge: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: spacing.sm,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      backgroundColor: colors.success + "20",
      borderRadius: 8,
      gap: 4,
    },
    accuracyText: {
      fontSize: fontSize.xs,
      color: colors.success,
      fontWeight: fontWeight.semibold,
    },
    noteContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.borderDark,
      gap: spacing.xs,
    },
    noteText: {
      flex: 1,
      fontSize: fontSize.xs,
      color: colors.textLabel,
      fontStyle: "italic",
    },
    chartNote: {
      fontSize: fontSize.xs,
      color: colors.textLabel,
      textAlign: "center",
      marginTop: spacing.sm,
      fontStyle: "italic",
    },
    // Info Grid
    infoGrid: {
      flexDirection: "row",
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    infoItem: {
      flex: 1,
      backgroundColor: colors.background,
      padding: spacing.md,
      borderRadius: spacing.sm,
      alignItems: "center",
    },
    infoLabel: {
      fontSize: fontSize.xs,
      color: colors.textLabel,
      marginBottom: 4,
    },
    infoValue: {
      fontSize: fontSize.md,
      color: colors.textDark,
      fontWeight: fontWeight.bold,
    },
    // Features
    featuresList: {
      backgroundColor: colors.background,
      padding: spacing.md,
      borderRadius: spacing.sm,
    },
    featuresTitle: {
      fontSize: fontSize.sm,
      color: colors.textLabel,
      marginBottom: spacing.sm,
    },
    featureTags: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
    },
    featureTag: {
      backgroundColor: colors.primary + "20",
      color: colors.primary,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 12,
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
    },
  });

export default SignalScreen;
