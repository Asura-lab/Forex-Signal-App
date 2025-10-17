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
import CurrencyCard from "../components/CurrencyCard";
import { CURRENCY_PAIRS } from "../utils/helpers";
import { checkApiStatus, getAllPredictions } from "../services/api";

/**
 * Үндсэн дэлгэц - Валютын хослолууд
 */
const HomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [predictions, setPredictions] = useState({});

  useEffect(() => {
    loadData();
  }, []);

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
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Ачааллаж байна...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#1a237e", "#283593", "#3949ab"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Форекс Сигнал</Text>
        <Text style={styles.headerSubtitle}>AI-аар хөтлөгддөг таамаглал</Text>

        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: apiConnected ? "#4CAF50" : "#F44336" },
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
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#757575",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 12,
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
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#757575",
  },
  disclaimer: {
    backgroundColor: "#FFF3E0",
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 8,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#E65100",
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 13,
    color: "#424242",
    lineHeight: 20,
  },
});

export default HomeScreen;
