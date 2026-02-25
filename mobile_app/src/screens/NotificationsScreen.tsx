import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { getColors } from "../config/theme";
import { getInAppNotifications, InAppNotification } from "../services/api";
import { NavigationProp } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";

interface NotificationsScreenProps {
  navigation: NavigationProp<any>;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(colors);

  const {
    data: notifications,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["inAppNotifications"],
    queryFn: async () => {
      const result = await getInAppNotifications(50);
      if (result.success && result.data) {
        return result.data.notifications || [];
      }
      return [];
    },
    staleTime: 30000,
  });

  const getTimeAgo = useCallback((isoString: string) => {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Одоо";
    if (mins < 60) return `${mins} мин`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} цаг`;
    const days = Math.floor(hours / 24);
    return `${days} өдрийн өмнө`;
  }, []);

  const handleNotifPress = (notif: InAppNotification) => {
    if (notif.type === "signal" && notif.data?.pair) {
      const pairName = notif.data.pair.replace("_", "/");
      navigation.navigate("Signal", {
        pair: { name: pairName, display: pairName },
      });
    }
  };

  const renderItem = ({ item }: { item: InAppNotification }) => {
    const isSignal = item.type === "signal";
    const iconBg = isSignal
      ? item.data?.signal_type === "BUY"
        ? colors.success
        : colors.error
      : colors.warning;

    return (
      <TouchableOpacity
        style={styles.notifItem}
        activeOpacity={0.7}
        onPress={() => handleNotifPress(item)}
      >
        <View style={[styles.notifIcon, { backgroundColor: iconBg }]}>
          <Text style={styles.notifIconText}>
            {isSignal
              ? item.data?.signal_type === "BUY"
                ? "↑"
                : "↓"
              : "📰"}
          </Text>
        </View>
        <View style={styles.notifContent}>
          <Text style={styles.notifItemTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.notifItemBody} numberOfLines={2}>
            {item.body}
          </Text>
        </View>
        <Text style={styles.notifTime}>{getTimeAgo(item.created_at)}</Text>
      </TouchableOpacity>
    );
  };

  const notifList: InAppNotification[] = notifications ?? [];

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>{"<"}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Мэдэгдэл</Text>
        <View style={styles.headerRight}>
          {notifList.length > 0 && (
            <Text style={styles.countText}>{notifList.length}</Text>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.success} />
        </View>
      ) : notifList.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyBellIcon}>
            <View style={[styles.emptyBellDome, { borderColor: colors.textSecondary }]} />
            <View style={[styles.emptyBellRim, { backgroundColor: colors.textSecondary }]} />
            <View style={[styles.emptyBellClapper, { backgroundColor: colors.textSecondary }]} />
          </View>
          <Text style={styles.emptyTitle}>Мэдэгдэл байхгүй</Text>
          <Text style={styles.emptySubtitle}>
            Шинэ сигнал болон мэдээний мэдэгдлүүд энд харагдана
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifList}
          renderItem={renderItem}
          keyExtractor={(_, idx) => idx.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={colors.success}
              colors={[colors.success]}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 38,
      paddingBottom: 16,
      paddingHorizontal: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: {
      width: 36,
      height: 36,
      justifyContent: "center",
      alignItems: "center",
    },
    backText: {
      fontSize: 22,
      color: colors.textPrimary,
      fontWeight: "300",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
      letterSpacing: 1,
    },
    headerRight: {
      width: 36,
      alignItems: "flex-end",
    },
    countText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 40,
    },
    emptyBellIcon: {
      alignItems: 'center',
      marginBottom: 20,
    },
    emptyBellDome: {
      width: 36,
      height: 26,
      borderWidth: 3,
      borderBottomWidth: 0,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
    },
    emptyBellRim: {
      width: 44,
      height: 4,
      borderRadius: 2,
    },
    emptyBellClapper: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 2,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
    listContent: {
      paddingVertical: 8,
    },
    notifItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    notifIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
    },
    notifIconText: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "700",
    },
    notifContent: {
      flex: 1,
      marginRight: 8,
    },
    notifItemTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: 3,
    },
    notifItemBody: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    notifTime: {
      fontSize: 11,
      color: colors.textMuted,
      minWidth: 50,
      textAlign: "right",
    },
    separator: {
      height: 1,
      backgroundColor: colors.border,
      marginLeft: 68,
    },
  });

export default NotificationsScreen;
