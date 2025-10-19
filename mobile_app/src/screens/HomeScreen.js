import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CurrencyCard from "../components/CurrencyCard";
import { CURRENCY_PAIRS, getTimeBasedGreeting } from "../utils/helpers";
import {
  checkApiStatus,
  getAllPredictions,
  getLiveRates,
  getMT5Status,
} from "../services/api";
import {
  colors,
  gradients,
  spacing,
  fontSize,
  fontWeight,
} from "../config/theme";

/**
 * Үндсэн дэлгэц - Валютын хослолууд
 */
const HomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [predictions, setPredictions] = useState({});
  const [userName, setUserName] = useState("");
  const [greeting, setGreeting] = useState("");
  const [emailVerified, setEmailVerified] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [liveRates, setLiveRates] = useState({});
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [mt5Connected, setMt5Connected] = useState(false);
  const [dataSource, setDataSource] = useState("API");

  useEffect(() => {
    loadUserData();
    loadData();
    checkMT5Status();

    // Auto-refresh live rates every 30 seconds
    const ratesInterval = setInterval(() => {
      fetchLiveRates();
    }, 30000);

    return () => clearInterval(ratesInterval);
  }, []);

  // Load user data
  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (userData) {
        const parsed = JSON.parse(userData);
        setUserName(parsed.name);
        setUserEmail(parsed.email || "");
        setEmailVerified(parsed.email_verified !== false);
      }
    } catch (error) {
      console.error("Load user data error:", error);
    }
    setGreeting(getTimeBasedGreeting("mn")); // Use 'en' for English
  };

  const fetchLiveRates = async () => {
    try {
      // MT5-аас авах (хэрэв холбогдсон бол)
      const result = await getLiveRates(null, "mt5");
      if (result.success) {
        setLiveRates(result.data.rates || {});
        setLastUpdateTime(
          result.data.timestamp || new Date().toLocaleTimeString()
        );
        setDataSource(result.data.source || "API");
      }
    } catch (error) {
      console.error("Live rates авах алдаа:", error);
    }
  };

  const checkMT5Status = async () => {
    try {
      const result = await getMT5Status();
      if (result.success) {
        setMt5Connected(result.data.connected || false);
      }
    } catch (error) {
      console.error("MT5 статус шалгах алдаа:", error);
    }
  };

  const loadData = async () => {
    // API холболт шалгах
    const statusResult = await checkApiStatus();
    setApiConnected(statusResult.success);

    if (!statusResult.success) {
      Alert.alert(
        "Холболтын алдаа",
        "Backend API-тай холбогдож чадсангүй.\n\n" +
          "Шалгах:\n" +
          "1. Backend сервер ажиллаж байгаа эсэх\n" +
          "2. IP хаяг зөв эсэх (src/services/api.js)\n" +
          "3. Нэг сүлжээнд байгаа эсэх",
        [{ text: "OK" }]
      );
      setLoading(false);
      return;
    }

    // Бодит цагийн ханш авах
    await fetchLiveRates();

    // Бүх таамаглалуудыг авах
    const result = await getAllPredictions();

    if (result.success) {
      const predictionsMap = {};
      result.data.forEach((item) => {
        if (item.success && item.data) {
          // Backend-ийн response format-г mobile app format руу хөрвүүлэх
          const predictionData = item.data;
          predictionsMap[item.pair] = {
            latest_prediction: {
              label: predictionData.signal, // signal -> label
              confidence: predictionData.confidence * 100, // 0.9 -> 90
            },
            signal_name: predictionData.signal_name,
            historical_accuracy: predictionData.historical_accuracy,
            timestamp: predictionData.timestamp,
          };
        }
      });
      setPredictions(predictionsMap);
    } else {
      console.error("Таамаглал авах алдаа:", result.error);
    }

    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handlePairPress = (pair) => {
    const prediction = predictions[pair.name];
    if (!prediction) {
      Alert.alert("Алдаа", "Таамаглал олдсонгүй");
      return;
    }

    navigation.navigate("Signal", {
      pair,
      prediction,
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.info} />
        <Text style={styles.loadingText}>Ачааллаж байна...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerContent}>
            {/* Greeting */}
            {userName ? (
              <View style={styles.greetingContainer}>
                <Text style={styles.greetingText}>
                  {greeting}, {userName}! 👋
                </Text>
              </View>
            ) : null}
            <Text style={styles.headerTitle}>Форекс Сигнал</Text>
            <Text style={styles.headerSubtitle}>
              AI-аар хөтлөгддөг таамаглал
            </Text>
          </View>
        </View>

        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: apiConnected ? colors.success : colors.error },
            ]}
          />
          <Text style={styles.statusText}>
            {apiConnected ? "Холбогдсон" : "Холбогдоогүй"}
          </Text>

          {/* MT5 Badge */}
          {mt5Connected && (
            <View style={styles.mt5Badge}>
              <Text style={styles.mt5BadgeText}>MT5</Text>
            </View>
          )}

          {/* Data Source */}
          {lastUpdateTime && (
            <Text style={styles.sourceText}>
              {dataSource} • {lastUpdateTime}
            </Text>
          )}
        </View>
      </LinearGradient>

      {/* Валютын хослолууд */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Имэйл баталгаажуулалтын мэдэгдэл */}
        {!emailVerified ? (
          <View style={styles.verificationAlert}>
            <View style={styles.verificationHeader}>
              <Ionicons name="warning" size={24} color={colors.warning} />
              <Text style={styles.verificationTitle}>
                Имэйл баталгаажуулаагүй байна
              </Text>
            </View>
            <Text style={styles.verificationText}>
              Таны имэйл хаяг ({userEmail}) баталгаажаагүй байна. Валютын
              хослолуудыг үзэхийн тулд эхлээд имэйл хаягаа баталгаажуулна уу.
            </Text>
            <TouchableOpacity
              style={styles.verificationButton}
              onPress={() =>
                navigation.navigate("EmailVerification", { email: userEmail })
              }
            >
              <Text style={styles.verificationButtonText}>Баталгаажуулах</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.white} />
            </TouchableOpacity>

            {/* Хаалттай валютын хослолууд */}
            <View style={styles.lockedSection}>
              <Ionicons
                name="lock-closed"
                size={60}
                color={colors.textMuted}
                style={styles.lockIcon}
              />
              <Text style={styles.lockedTitle}>Валютын хослолууд</Text>
              <Text style={styles.lockedText}>
                Имэйл баталгаажуулсны дараа бүх валютын хослолууд болон AI
                таамаглалууд танд нээгдэнэ
              </Text>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Валютын хослолууд</Text>
                  <Text style={styles.sectionSubtitle}>
                    Хослол сонгож дэлгэрэнгүй таамаглал үзнэ үү
                  </Text>
                </View>
                {lastUpdateTime && (
                  <View style={styles.updateTimeContainer}>
                    <Ionicons
                      name="time-outline"
                      size={12}
                      color={colors.textMuted}
                    />
                    <Text style={styles.updateTimeText}>{lastUpdateTime}</Text>
                  </View>
                )}
              </View>
            </View>

            {CURRENCY_PAIRS.map((pair) => (
              <CurrencyCard
                key={pair.id}
                pair={pair}
                prediction={predictions[pair.name]}
                liveRate={liveRates[pair.name]}
                onPress={() => handlePairPress(pair)}
                loading={false}
              />
            ))}

            {/* Анхааруулга */}
            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerTitle}>⚠️ Анхааруулга</Text>
              <Text style={styles.disclaimerText}>
                Энэ аппликейшн нь судалгааны зорилгоор бүтээгдсэн. Бодит
                худалдаанд ашиглахаас өмнө өөрийн судалгаа хийж, эрсдлийн
                менежментийг сайн тооцоолоорой.
              </Text>
            </View>

            <View style={{ height: 20 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  header: {
    paddingTop: 60,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  greetingContainer: {
    marginBottom: spacing.sm,
  },
  greetingText: {
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
    opacity: 0.95,
  },
  headerTitle: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: fontSize.xs,
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  mt5Badge: {
    backgroundColor: colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  mt5BadgeText: {
    fontSize: fontSize.xs,
    color: colors.textPrimary,
    fontWeight: fontWeight.bold,
  },
  sourceText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  updateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.xs,
    gap: 4,
  },
  updateTimeText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  disclaimer: {
    backgroundColor: "#FFF3E0",
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    borderRadius: spacing.sm,
  },
  disclaimerTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: "#E65100",
    marginBottom: spacing.sm,
  },
  disclaimerText: {
    fontSize: fontSize.xs,
    color: colors.textDark,
    lineHeight: 20,
  },
  verificationAlert: {
    backgroundColor: "#FFF3CD",
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: spacing.sm,
  },
  verificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  verificationTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: "#856404",
    marginLeft: spacing.sm,
  },
  verificationText: {
    fontSize: fontSize.sm,
    color: "#856404",
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  verificationButton: {
    backgroundColor: colors.warning,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.sm,
    gap: spacing.xs,
  },
  verificationButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  lockedSection: {
    marginTop: spacing.xl,
    padding: spacing.xl,
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: spacing.md,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  lockIcon: {
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  lockedTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  lockedText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default HomeScreen;
