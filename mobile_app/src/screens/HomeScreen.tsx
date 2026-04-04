import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { getColors } from "../config/theme";
import CurrencyList from "../components/CurrencyList";
import { checkApiStatus, getLiveRates, getUnreadNotificationCount } from "../services/api";
import { CurrencyPair } from "../utils/helpers";
import { NavigationProp, useFocusEffect } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from 'lucide-react-native';
import { useAlert } from "../context/AlertContext";
import { UI_COPY } from "../config/copy";

interface HomeScreenProps {
  navigation: NavigationProp<any>;
}

interface LiveRatesMap {
  [key: string]: any;
}

/**
 * Home Screen - Professional TradingView style
 */
const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { isDark } = useTheme();
  const { showAlert } = useAlert();
  const colors = getColors(isDark);
  const styles = createStyles(colors);
  const queryClient = useQueryClient();

  // Буцаж ирэх үед уншаагүй тоог шинэчлэх
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["inAppNotificationsCount"] });
    }, [queryClient])
  );

  // Status Query
  const { data: statusData } = useQuery({
    queryKey: ["apiStatus"],
    queryFn: checkApiStatus,
    refetchInterval: 30000, 
  });

  const apiConnected = statusData?.success || false;

  // Live Rates Query
  const { 
    data: liveRates, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ["liveRates"],
    queryFn: async () => {
      const result = await getLiveRates();
      if (result.success) {
        const ratesMap: LiveRatesMap = {};
        const rates = result.data.rates || {};
        Object.keys(rates).forEach((key) => {
          const pairName = key.replace("_", "/");
          ratesMap[pairName] = rates[key];
        });
        return ratesMap;
      }
      return {};
    },
    refetchInterval: 60000,
  });

  // In-App Notifications Count Query
  const { data: notifCount } = useQuery({
    queryKey: ["inAppNotificationsCount"],
    queryFn: async () => {
      const result = await getUnreadNotificationCount();
      if (result.success && result.data) {
        return result.data.unread_count;
      }
      return 0;
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });

  const lastUpdateTime = new Date().toLocaleTimeString("mn-MN", { hour12: false });

  const onRefresh = async () => {
    await refetch();
  };

  const handlePairPress = (pair: CurrencyPair) => {
    if (pair?.name !== "EUR/USD") {
      showAlert(
        "Зөвхөн EUR/USD таамаг",
        "Бусад валютын хослол дээр одоогоор зөвхөн бодит ханш харуулна."
      );
      return;
    }

    navigation.navigate("Signal", { pair });
  };

  const badgeCount = notifCount ?? 0;


  if (isLoading && !liveRates) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
        <ActivityIndicator size="large" color={colors.success} />
        <Text style={styles.loadingText} allowFontScaling maxFontSizeMultiplier={1.5}>{UI_COPY.home.loading}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle} allowFontScaling maxFontSizeMultiplier={1.3}>{UI_COPY.home.headerTitle.toUpperCase()}</Text>
          <View style={styles.headerRight}>
            {/* Bell Icon */}
            <TouchableOpacity
              style={styles.bellButton}
              onPress={() => navigation.navigate("Notifications" as never)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Мэдэгдэл"
              accessibilityHint="Уншаагүй мэдэгдлүүдийг нээнэ"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View style={styles.bellIcon}>
                <Bell size={22} color={colors.textSecondary} />
              </View>
              {badgeCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText} allowFontScaling maxFontSizeMultiplier={1.2}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {/* Status */}
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: apiConnected ? colors.success : colors.error }]} />
              <Text
                style={[styles.statusText, { color: apiConnected ? colors.success : colors.error }]}
                allowFontScaling
                maxFontSizeMultiplier={1.3}
              >
                {apiConnected ? "ИДЭВХТЭЙ" : "САЛАНГИД"}
              </Text>
            </View>
          </View>
        </View>
        {lastUpdateTime && (
          <Text style={styles.updateTime} allowFontScaling maxFontSizeMultiplier={1.3}>
            {UI_COPY.home.lastUpdatePrefix}: {lastUpdateTime}
          </Text>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isLoading} 
            onRefresh={onRefresh}
            tintColor={colors.success}
            colors={[colors.success]}
          />
        }
      >
        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.symbolColumn]} allowFontScaling maxFontSizeMultiplier={1.3}>{UI_COPY.home.table.symbol.toUpperCase()}</Text>
          <Text style={[styles.tableHeaderText, styles.priceColumn]} allowFontScaling maxFontSizeMultiplier={1.3}>{UI_COPY.home.table.price.toUpperCase()}</Text>
          <Text style={[styles.tableHeaderText, styles.changeColumn]} allowFontScaling maxFontSizeMultiplier={1.3}>{UI_COPY.home.table.change.toUpperCase()}</Text>
          <Text style={[styles.tableHeaderText, styles.percentColumn]} allowFontScaling maxFontSizeMultiplier={1.3}>{UI_COPY.home.table.changePercent.toUpperCase()}</Text>
        </View>

        {/* Currency List */}
        <CurrencyList
          liveRates={liveRates ?? {}}
          onPairPress={handlePairPress}
          loading={false}
          colors={colors}
        />
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
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
    paddingTop: 38,
    paddingBottom: 14,
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bellButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellIcon: {
    alignItems: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: 0,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
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
