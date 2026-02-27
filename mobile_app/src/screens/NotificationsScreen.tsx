import React, { useCallback, useState } from "react";
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
import { getInAppNotifications, markNotificationsRead, InAppNotification } from "../services/api";
import { NavigationProp, useFocusEffect } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, BellOff, TrendingUp, TrendingDown, Newspaper } from 'lucide-react-native';

interface NotificationsScreenProps {
  navigation: NavigationProp<any>;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(colors);
  const queryClient = useQueryClient();
  const [marking, setMarking] = useState(false);

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
    staleTime: 0,
  });

  // Дэлгэц нээгдэх үед жагсаалт шинэчлэх (auto-mark хийхгүй)
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleMarkAllRead = async () => {
    setMarking(true);
    try {
      await markNotificationsRead([]);
      // Шинэ data татаж UI шинэчлэх
      await refetch();
      queryClient.invalidateQueries({ queryKey: ["inAppNotificationsCount"] });
    } finally {
      setMarking(false);
    }
  };

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

  const handleNotifPress = async (notif: InAppNotification) => {
    // Уншсан гэж тэмдэглэх
    if (!notif.is_read && notif._id) {
      await markNotificationsRead([notif._id]);
      queryClient.invalidateQueries({ queryKey: ["inAppNotificationsCount"] });
      refetch();
    }
    // Навигаци
    if (notif.type === "signal") {
      // Predict хуудас руу шилжих (PredictionTab)
      navigation.navigate("Main", { screen: "PredictionTab" } as never);
    } else if (notif.type === "news") {
      navigation.navigate("Main", { screen: "NewsTab" } as never);
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
        style={[styles.notifItem, !item.is_read && styles.notifItemUnread]}
        activeOpacity={0.7}
        onPress={() => handleNotifPress(item)}
      >
        {!item.is_read && <View style={styles.unreadDot} />}
        <View style={[styles.notifIcon, { backgroundColor: iconBg }]}>
          {isSignal
            ? item.data?.signal_type === "BUY"
              ? <TrendingUp size={18} color="#FFFFFF" />
              : <TrendingDown size={18} color="#FFFFFF" />
            : <Newspaper size={18} color="#FFFFFF" />}
        </View>
        <View style={styles.notifContent}>
          <Text style={[styles.notifItemTitle, !item.is_read && styles.notifItemTitleUnread]} numberOfLines={1}>
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
  const unreadCount = notifList.filter((n) => !n.is_read).length;

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
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Мэдэгдэл</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount} шинэ</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          {notifList.length > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              disabled={marking || unreadCount === 0}
              style={[styles.markAllBtn, (marking || unreadCount === 0) && styles.markAllBtnDisabled]}
            >
              <Text style={[styles.markAllText, (marking || unreadCount === 0) && styles.markAllTextDisabled]}>
                {marking ? "Хадгалж байна..." : "Бүгд уншсан"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.success} />
        </View>
      ) : notifList.length === 0 ? (
        <View style={styles.centerContainer}>
          <BellOff size={48} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Мэдэгдэл байхгүй</Text>
          <Text style={styles.emptySubtitle}>
            Шинэ сигнал болон мэдээний мэдэгдлүүд энд харагдана
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifList}
          renderItem={renderItem}
          keyExtractor={(item) => item._id || item.created_at}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
    headerCenter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.textPrimary,
      letterSpacing: 1,
    },
    unreadBadge: {
      backgroundColor: "#2563EB",
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    unreadBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    headerRight: {
      alignItems: "flex-end",
    },
    markAllBtn: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#2563EB",
    },
    markAllBtnDisabled: {
      borderColor: colors.border,
      opacity: 0.4,
    },
    markAllText: {
      fontSize: 11,
      fontWeight: "600",
      color: "#2563EB",
    },
    markAllTextDisabled: {
      color: colors.textSecondary,
    },
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 40,
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
    notifItemUnread: {
      backgroundColor: colors.card + "80",
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#2563EB",
      marginRight: 8,
      flexShrink: 0,
    },
    notifIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
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
    notifItemTitleUnread: {
      fontWeight: "800",
      color: colors.textPrimary,
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
