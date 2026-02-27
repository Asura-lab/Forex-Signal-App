import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { getColors } from "../config/theme";
import { useQuery } from "@tanstack/react-query";
import { getMarketAnalysis } from "../services/api";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import { CurrencyPair } from "../utils/helpers";
import { ChevronLeft, RefreshCw } from 'lucide-react-native';

type RootStackParamList = {
  Signal: { pair: CurrencyPair };
};

type SignalScreenRouteProp = RouteProp<RootStackParamList, 'Signal'>;

interface SignalScreenProps {
  route: SignalScreenRouteProp;
  navigation: NavigationProp<any>;
}

/**
 * Signal Screen - AI Market Analysis
 */
const SignalScreen = ({ route, navigation }: SignalScreenProps) => {
  const { pair } = route.params || {};
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(colors);

  // React Query - Market Analysis
  const {
    data: aiAnalysis,
    isLoading: loadingAnalysis,
    isError: analysisError,
    isFetching: analysisFetching,
    failureCount,
    refetch,
  } = useQuery({
    queryKey: ['analysis', pair?.name],
    queryFn: async () => {
      if (!pair?.name) return null;
      const result = await getMarketAnalysis(pair.name);
      if (!result.success) throw new Error('fetch_failed');
      const data = result.data;
      // Шинжилгээ бүрэн биш бол cache хийлгүй retry хийнэ
      const isEmpty =
        !data ||
        data.error === true ||
        (!data.summary && !data.forecast);
      if (isEmpty) throw new Error('analysis_empty');
      return data;
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!pair?.name,
    retry: 5,
    retryDelay: (attempt) => Math.min(8000 * (attempt + 1), 30000), // 8s, 16s, 24s, 30s, 30s
  });



  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.pairName}>{pair?.name || "EUR/USD"}</Text>
          <Text style={styles.pairSub}>AI Шинжилгээ</Text>
        </View>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Market Analysis Section */}
        {(loadingAnalysis || (analysisError && analysisFetching)) ? (
          <View style={[styles.signalCard, { alignItems: "center", paddingVertical: 48 }]}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingText}>
              {failureCount > 0
                ? `AI шинжилж байна... (${failureCount + 1}-р оролдлого)`
                : 'AI шинжилж байна...'}
            </Text>
          </View>
        ) : aiAnalysis ? (
          (() => {
            const rawOutlook = aiAnalysis.outlook || aiAnalysis.market_sentiment || "Neutral";
            const isBullish = rawOutlook.includes("Bullish") || rawOutlook.includes("Өсөх");
            const isBearish = rawOutlook.includes("Bearish") || rawOutlook.includes("Унах");
            const outlookColor = isBullish ? colors.success : isBearish ? colors.error : colors.warning;
            return (
              <>
                {/* Outlook banner */}
                <View style={styles.outlookCard}>
                  <Text style={styles.outlookMeta}>ЗАХ ЗЭЭЛИЙН ТӨЛӨВ</Text>
                  <View style={[styles.outlookBadge, { backgroundColor: outlookColor + "18", borderColor: outlookColor + "60" }]}>
                    <Text style={[styles.outlookText, { color: outlookColor }]}>{rawOutlook}</Text>
                  </View>
                </View>

                {/* Summary */}
                {aiAnalysis.summary && (
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionTitleRow}>
                      <View style={[styles.sectionDot, { backgroundColor: colors.primary }]} />
                      <Text style={styles.sectionTitle}>ДҮГНЭЛТ</Text>
                    </View>
                    <Text style={styles.sectionText}>{aiAnalysis.summary}</Text>
                  </View>
                )}

                {/* Forecast */}
                {aiAnalysis.forecast && (
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionTitleRow}>
                      <View style={[styles.sectionDot, { backgroundColor: colors.warning }]} />
                      <Text style={styles.sectionTitle}>ТААМАГЛАЛ</Text>
                    </View>
                    <Text style={styles.sectionText}>{aiAnalysis.forecast}</Text>
                  </View>
                )}

                {/* Risk factors */}
                {aiAnalysis.risk_factors && aiAnalysis.risk_factors.length > 0 && (
                  <View style={[styles.sectionCard, { borderLeftWidth: 3, borderLeftColor: colors.error + "80" }]}>
                    <View style={styles.sectionTitleRow}>
                      <View style={[styles.sectionDot, { backgroundColor: colors.error }]} />
                      <Text style={styles.sectionTitle}>ЭРСДЭЛТ ХҮЧИН ЗҮЙЛС</Text>
                    </View>
                    {(aiAnalysis.risk_factors as any[]).map((risk: any, index: number) => (
                      <View key={index} style={styles.riskRow}>
                        <View style={[styles.riskBullet, { backgroundColor: colors.error }]} />
                        <Text style={styles.riskText}>{risk}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            );
          })()
        ) : (
          <View style={[styles.signalCard, { alignItems: "center", paddingVertical: 40, gap: 16 }]}>
            <Text style={styles.sectionText}>Шинжилгээ хийгдээгүй байна</Text>
            <TouchableOpacity
              onPress={() => refetch()}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10,
                borderRadius: 8, borderWidth: 1, borderColor: colors.primary + '60' }}
            >
              <RefreshCw size={16} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Дахин оролдох</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          [!] Зөвхөн судалгааны зорилготой. Санхүүгийн зөвлөгөө биш.
        </Text>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  pairName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  pairSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  thresholdBtn: {
    backgroundColor: colors.success,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  thresholdText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  demoBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  demoText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  mockWarning: {
    backgroundColor: colors.warning + '20',
    borderWidth: 1,
    borderColor: colors.warning + '40',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  mockWarningText: {
    color: colors.warning,
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
  },
  marketClosedBox: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  marketClosedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  marketClosedIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '20',
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  marketClosedIcon: {
    fontSize: 22,
  },
  marketClosedContent: {
    flex: 1,
  },
  marketClosedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  marketClosedText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  marketClosedInfo: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
  },
  marketInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  marketInfoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  marketInfoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerBox: {
    alignItems: "center",
    paddingVertical: 80,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 16,
  },
  errorIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.error + '20',
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  errorIconText: {
    fontSize: 28,
    color: colors.error,
    fontWeight: "700",
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: colors.success,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  signalCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  signalTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  signalLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    letterSpacing: 1,
  },
  updateTime: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  signalBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  signalBadgeText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
  confidenceBox: {
    marginBottom: 20,
  },
  confidenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  confLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  confValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  progressBg: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  entryGrid: {
    gap: 12,
  },
  entryItem: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  slItem: {
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  tpItem: {
    borderWidth: 1,
    borderColor: colors.success + '40',
  },
  entryLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  entryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  pipsText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  holdBox: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  holdLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.warning,
    letterSpacing: 1,
    marginBottom: 8,
  },
  holdText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  rrBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rrLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  rrValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.success,
  },
  modelsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 16,
  },
  modelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  modelItem: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  modelName: {
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  modelProb: {
    fontSize: 18,
    fontWeight: "700",
  },
  agreeRow: {
    marginTop: 12,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  agreeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    justifyContent: "space-around",
  },
  infoItem: {
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  comingSoon: {
    fontSize: 48,
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    width: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  optionList: {
    gap: 8,
  },
  optionBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  optionActive: {
    backgroundColor: colors.success + '20',
    borderWidth: 1,
    borderColor: colors.success,
  },
  optionText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  optionTextActive: {
    color: colors.success,
    fontWeight: "700",
  },
  checkIcon: {
    fontSize: 18,
    color: colors.success,
    fontWeight: "700",
  },
  analysisRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  analysisLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  analysisValue: {
    fontSize: 14,
    fontWeight: "700",
    flex: 2,
    textAlign: "right",
  },
  analysisSection: {
    marginBottom: 16,
  },
  analysisSubTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  analysisText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  outlookCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: "center",
  },
  outlookMeta: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  outlookBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: "100%",
  },
  outlookText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 22,
    textAlign: "justify",
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textPrimary,
    letterSpacing: 0.8,
  },
  sectionText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 23,
    textAlign: "justify" as const,
  },
  riskRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 10,
    marginBottom: 8,
  },
  riskBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    flexShrink: 0,
  },
  riskText: {
    fontSize: 13,
    color: colors.error,
    lineHeight: 20,
    marginBottom: 4,
    flex: 1,
    textAlign: "justify" as const,
  },
});

export default SignalScreen;
