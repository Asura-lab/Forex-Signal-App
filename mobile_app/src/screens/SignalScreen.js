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
import { getPrediction } from "../services/api";

/**
 * Сигнал дэлгэц - Дэлгэрэнгүй таамаглал
 */
const SignalScreen = ({ route, navigation }) => {
  const { pair, prediction: initialPrediction } = route.params;
  const [prediction, setPrediction] = useState(initialPrediction);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: pair.name,
      headerStyle: {
        backgroundColor: pair.color,
      },
      headerTintColor: "#fff",
    });
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    const result = await getPrediction(pair.name);

    if (result.success) {
      setPrediction(result.data);
    } else {
      Alert.alert("Алдаа", "Шинэчлэхэд алдаа гарлаа");
    }

    setLoading(false);
  };

  if (!prediction || !prediction.latest_prediction) {
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
    backgroundColor: "#F5F5F5",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  errorText: {
    fontSize: 18,
    color: "#F44336",
  },
  headerGradient: {
    padding: 24,
    alignItems: "center",
  },
  flag: {
    fontSize: 64,
    marginBottom: 12,
  },
  pairName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.9)",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 16,
  },
  confidenceRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  confidenceInfo: {
    marginRight: 20,
  },
  confidenceValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#212121",
  },
  confidenceLevel: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  confidenceBarContainer: {
    flex: 1,
  },
  confidenceBarBg: {
    height: 12,
    backgroundColor: "#E0E0E0",
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
    borderLeftColor: "#2196F3",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  adviceText: {
    fontSize: 16,
    color: "#1565C0",
    fontWeight: "600",
  },
  tipsContainer: {
    backgroundColor: "#FFF9C4",
    borderRadius: 8,
    padding: 12,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#F57F17",
    marginBottom: 6,
  },
  tipText: {
    fontSize: 13,
    color: "#424242",
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  infoLabel: {
    fontSize: 14,
    color: "#757575",
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: "#212121",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  refreshButton: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  refreshGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  refreshIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  refreshText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});

export default SignalScreen;
