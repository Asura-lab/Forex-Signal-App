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
import { Ionicons } from "@expo/vector-icons";

/**
 * Сигнал дэлгэц - Дэлгэрэнгүй таамаглал
 */
const SignalScreen = ({ route, navigation }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(colors);

  const { pair, prediction: initialPrediction } = route.params;
  const [prediction, setPrediction] = useState(initialPrediction);
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

    // Fetch live rate
    fetchLiveRate();
    // Fetch historical data
    fetchHistoricalData();

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
      // Fetch both prediction and live rate
      const [predResult, rateResult] = await Promise.all([
        getPrediction(pair.name),
        getSpecificRate(pair.name),
      ]);

      console.log("🔄 Refresh result:", predResult);

      if (predResult.success && predResult.data) {
        // Ensure we have the correct structure
        if (predResult.data.latest_prediction) {
          setPrediction(predResult.data);
        } else {
          Alert.alert("Алдаа", "Таамаглалын өгөгдөл олдсонгүй");
        }
      } else {
        Alert.alert("Алдаа", predResult.message || "Шинэчлэхэд алдаа гарлаа");
      }

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

      {/* Prediction Signal */}
      <SignalCard prediction={prediction} />

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
            <Text style={styles.infoLabel}>Модель</Text>
            <Text style={styles.infoValue}>HMM Gaussian</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Нийт дата</Text>
            <Text style={styles.infoValue}>
              {prediction.total_predictions?.toLocaleString() || "—"}
            </Text>
          </View>
        </View>

        <View style={styles.featuresList}>
          <Text style={styles.featuresTitle}>Шинж чанарууд:</Text>
          <View style={styles.featureTags}>
            <Text style={styles.featureTag}>Returns</Text>
            <Text style={styles.featureTag}>Volatility</Text>
            <Text style={styles.featureTag}>ATR</Text>
            <Text style={styles.featureTag}>MA Cross</Text>
            <Text style={styles.featureTag}>RSI</Text>
            <Text style={styles.featureTag}>Volume</Text>
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
    },
    errorText: {
      fontSize: fontSize.lg,
      color: colors.error,
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
    updateBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.input,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    updateTime: {
      fontSize: 11,
      color: colors.textLabel,
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
