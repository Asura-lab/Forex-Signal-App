import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { getColors } from "../config/theme";
import CurrencyList from "../components/CurrencyList";
import { checkApiStatus, getLiveRates } from "../services/api";
import { API_URL } from "../config/api";

/**
 * Home Screen - Professional TradingView style
 */
const HomeScreen = ({ navigation }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(colors);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [liveRates, setLiveRates] = useState({});
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  useEffect(() => {
    loadData();

    const ratesInterval = setInterval(() => {
      fetchLiveRates();
    }, 60000);

    return () => clearInterval(ratesInterval);
  }, []);

  const fetchLiveRates = async () => {
    try {
      const result = await getLiveRates();
      if (result.success) {
        const ratesMap = {};
        const rates = result.data.rates || {};
        Object.keys(rates).forEach((key) => {
          const pairName = key.replace("_", "/");
          ratesMap[pairName] = rates[key];
        });
        setLiveRates(ratesMap);
        setLastUpdateTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
      }
    } catch (error) {
      console.error("Live rates error:", error);
    }
  };

  const loadData = async () => {
    const statusResult = await checkApiStatus();
    setApiConnected(statusResult.success);

    if (!statusResult.success) {
      Alert.alert(
        "Connection Error",
        "Cannot connect to API server.",
        [{ text: "OK" }]
      );
      setLoading(false);
      return;
    }

    await fetchLiveRates();
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLiveRates();
    setRefreshing(false);
  };

  const handlePairPress = (pair) => {
    navigation.navigate("Signal", { pair });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
        <ActivityIndicator size="large" color={colors.success} />
        <Text style={styles.loadingText}>Loading market data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>FOREX MARKET</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: apiConnected ? colors.success : colors.error }]} />
            <Text style={[styles.statusText, { color: apiConnected ? colors.success : colors.error }]}>{apiConnected ? "LIVE" : "OFFLINE"}</Text>
          </View>
        </View>
        {lastUpdateTime && (
          <Text style={styles.updateTime}>Last update: {lastUpdateTime}</Text>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.success}
            colors={[colors.success]}
          />
        }
      >
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.symbolColumn]}>SYMBOL</Text>
          <Text style={[styles.tableHeaderText, styles.priceColumn]}>PRICE</Text>
          <Text style={[styles.tableHeaderText, styles.changeColumn]}>CHG</Text>
          <Text style={[styles.tableHeaderText, styles.percentColumn]}>CHG%</Text>
        </View>

        {/* Currency List */}
        <CurrencyList
          liveRates={liveRates}
          onPairPress={handlePairPress}
          loading={false}
          colors={colors}
        />
      </ScrollView>
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
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
    marginTop: 16,
    color: colors.textSecondary,
    fontSize: 14,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cardSecondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
  },
  updateTime: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  symbolColumn: {
    flex: 2.5,
  },
  priceColumn: {
    flex: 2,
    textAlign: "right",
  },
  changeColumn: {
    flex: 1.5,
    textAlign: "right",
  },
  percentColumn: {
    flex: 1.5,
    textAlign: "right",
  },
  scrollView: {
    flex: 1,
  },
});

export default HomeScreen;
