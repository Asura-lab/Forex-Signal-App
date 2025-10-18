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
import { checkApiStatus, getAllPredictions } from "../services/api";
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

  useEffect(() => {
    loadUserData();
    loadData();
  }, []);

  // Load user data
  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (userData) {
        const parsed = JSON.parse(userData);
        setUserName(parsed.name);
      }
    } catch (error) {
      console.error("Load user data error:", error);
    }
    setGreeting(getTimeBasedGreeting("mn")); // Use 'en' for English
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

    // Бүх таамаглалуудыг авах
    const result = await getAllPredictions();

    if (result.success) {
      const predictionsMap = {};
      result.data.forEach((item) => {
        if (item.success) {
          predictionsMap[item.pair] = item.data;
        }
      });
      setPredictions(predictionsMap);
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
        </View>
      </LinearGradient>

      {/* Валютын хослолууд */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Валютын хослолууд</Text>
          <Text style={styles.sectionSubtitle}>
            Хослол сонгож дэлгэрэнгүй таамаглал үзнэ үү
          </Text>
        </View>

        {CURRENCY_PAIRS.map((pair) => (
          <CurrencyCard
            key={pair.id}
            pair={pair}
            prediction={predictions[pair.name]}
            onPress={() => handlePairPress(pair)}
            loading={false}
          />
        ))}

        {/* Анхааруулга */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>⚠️ Анхааруулга</Text>
          <Text style={styles.disclaimerText}>
            Энэ аппликейшн нь судалгааны зорилгоор бүтээгдсэн. Бодит худалдаанд
            ашиглахаас өмнө өөрийн судалгаа хийж, эрсдлийн менежментийг сайн
            тооцоолоорой.
          </Text>
        </View>

        <View style={{ height: 20 }} />
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
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
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
});

export default HomeScreen;
