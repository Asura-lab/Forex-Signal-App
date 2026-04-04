import React, { useState } from "react";
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
import { UI_COPY } from "../config/copy";
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
  const [expandedSummary, setExpandedSummary] = useState(false);
  const [expandedForecast, setExpandedForecast] = useState(false);

  const getNormalizedOutlook = (value: unknown) => {
    const normalized = String(value || "").toLowerCase();

    const bearishKeywords = ["bear", "sell", "буур", "унах", "зарах", "сулрах", "down"];
    const bullishKeywords = ["bull", "buy", "өс", "авах", "чангар", "up"];
    const stableKeywords = ["neutral", "stable", "hold", "sideways", "flat", "тогтвортой", "саармаг", "хажуу"];

    if (bearishKeywords.some((keyword) => normalized.includes(keyword))) {
      return { label: "BEARISH", color: "#EF4444" };
    }

    if (bullishKeywords.some((keyword) => normalized.includes(keyword))) {
      return { label: "BULLISH", color: "#22C55E" };
    }

    if (stableKeywords.some((keyword) => normalized.includes(keyword))) {
      return { label: "NEUTRAL", color: "#F59E0B" };
    }

    return { label: "NEUTRAL", color: "#F59E0B" };
  };

  const getAnalysisSourceBadge = (source: unknown, stale: boolean) => {
    const normalized = String(source || "").toLowerCase();

    if (stale || normalized === "cache-stale") {
      return { label: UI_COPY.signal.badges.staleCache, color: colors.warning };
    }

    if (normalized === "cache-fallback") {
      return { label: UI_COPY.signal.badges.fallbackCache, color: colors.warning };
    }

    if (normalized === "cache-fresh") {
      return { label: UI_COPY.signal.badges.cached, color: colors.primary };
    }

    if (normalized === "market-direct") {
      return { label: UI_COPY.signal.badges.marketMode, color: colors.primary };
    }

    return { label: UI_COPY.signal.badges.realtime, color: colors.success };
  };

  const formatMetaTime = (iso: unknown) => {
    if (!iso) return "";
    try {
      return new Date(String(iso)).toLocaleString("mn-MN", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // Truncate text helper
  const truncateText = (text: string, limit: number = 200) =>
    text && text.length > limit ? text.substring(0, limit) + "..." : text;

  // React Query - Market Analysis
  const {
    data: aiAnalysis,
    isLoading: loadingAnalysis,
    isError: analysisError,
    error: analysisQueryError,
    isFetching: analysisFetching,
    failureCount,
    refetch,
  } = useQuery({
    queryKey: ['analysis', pair?.name],
    queryFn: async () => {
      if (!pair?.name) return null;
      const result = await getMarketAnalysis(pair.name);
      if (!result.success) {
        const errorCode = result.statusCode;
        const typedError = new Error(
          errorCode === 400
            ? 'unsupported_pair'
            : errorCode === 429
              ? 'rate_limited'
              : 'fetch_failed'
        ) as Error & { retryAfter?: number };

        if (typeof result.retryAfter === 'number') {
          typedError.retryAfter = result.retryAfter;
        }

        throw typedError;
      }

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
    retry: (attempt, error: any) => {
      if (error?.message === 'unsupported_pair') return false;
      if (error?.message === 'rate_limited') return attempt < 3;
      return attempt < 5;
    },
    retryDelay: (attempt, error: any) => {
      const retryAfterSeconds = Number(error?.retryAfter || 0);
      if (retryAfterSeconds > 0) {
        return Math.min(retryAfterSeconds * 1000, 30000);
      }
      return Math.min(8000 * (attempt + 1), 30000);
    }, // 8s, 16s, 24s, 30s, 30s
  });

  const queryErrorMessage = (analysisQueryError as Error | null)?.message || "";
  const isUnsupportedPairError = queryErrorMessage === "unsupported_pair";
  const isRateLimitedError = queryErrorMessage === "rate_limited";

  const emptyStateText = isUnsupportedPairError
    ? UI_COPY.signal.unsupportedPair
    : isRateLimitedError
      ? UI_COPY.signal.rateLimited
      : UI_COPY.signal.emptyDefault;



  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={UI_COPY.signal.back}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.pairName} allowFontScaling maxFontSizeMultiplier={1.3}>{pair?.name || "EUR/USD"}</Text>
          <Text style={styles.pairSub} allowFontScaling maxFontSizeMultiplier={1.4}>{UI_COPY.signal.subtitle}</Text>
        </View>
        <View style={{ width: 48 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Market Analysis Section */}
        {(loadingAnalysis || (analysisError && analysisFetching)) ? (
          <View style={[styles.signalCard, { alignItems: "center", paddingVertical: 48 }]}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingText} allowFontScaling maxFontSizeMultiplier={1.4}>
              {failureCount > 0
                ? `${UI_COPY.signal.loading} (${failureCount + 1}-р оролдлого)`
                : UI_COPY.signal.loading}
            </Text>
          </View>
        ) : aiAnalysis ? (
          (() => {
            const rawOutlook = aiAnalysis.outlook || aiAnalysis.market_sentiment || "Neutral";
            const normalizedOutlook = getNormalizedOutlook(rawOutlook);
            const analysisMeta = (aiAnalysis as any).__meta || {};
            const uncertaintyLevel = String((aiAnalysis as any).uncertainty_level || "unknown").toUpperCase();
            const actionability = String((aiAnalysis as any).actionability || "review_then_execute_with_risk_controls");
            const oversightRequired = Boolean((aiAnalysis as any).human_oversight_required !== false);
            const oversightNote = String((aiAnalysis as any).oversight_note || "");
            const sourceBadge = getAnalysisSourceBadge(
              analysisMeta.analysisSource,
              Boolean(analysisMeta.stale)
            );
            return (
              <>
                {/* Outlook banner */}
                <View style={styles.outlookCard}>
                  <Text style={[styles.outlookText, { color: normalizedOutlook.color }]}>
                    {normalizedOutlook.label}
                  </Text>
                </View>

                <View
                  style={[
                    styles.analysisSourceBadge,
                    {
                      borderColor: sourceBadge.color + "55",
                      backgroundColor: sourceBadge.color + "16",
                    },
                  ]}
                >
                  <Text style={[styles.analysisSourceBadgeText, { color: sourceBadge.color }]}>
                    {sourceBadge.label}
                  </Text>
                  {analysisMeta.generatedAt ? (
                    <Text style={styles.analysisSourceTime}>{formatMetaTime(analysisMeta.generatedAt)}</Text>
                  ) : null}
                </View>

                <View style={styles.raiCard}>
                  <Text style={styles.raiHeader}>RESPONSIBLE AI</Text>

                  <View style={styles.raiRow}>
                    <Text style={styles.raiLabel}>{UI_COPY.signal.uncertaintyLabel}</Text>
                    <Text style={styles.raiValue}>{uncertaintyLevel}</Text>
                  </View>

                  <View style={styles.raiDivider} />

                  <View style={styles.raiRow}>
                    <Text style={styles.raiLabel}>{UI_COPY.signal.actionabilityLabel}</Text>
                    <Text style={styles.raiValue}>{actionability.replace(/_/g, " ")}</Text>
                  </View>

                  <View style={styles.raiDivider} />

                  <View style={styles.raiRow}>
                    <Text style={styles.raiLabel}>{UI_COPY.signal.humanOversightLabel}</Text>
                    <Text style={styles.raiValue}>
                      {oversightRequired ? UI_COPY.signal.humanOversightRequired : UI_COPY.signal.humanOversightOptional}
                    </Text>
                  </View>

                  {!!oversightNote && <Text style={styles.raiNote}>{oversightNote}</Text>}
                </View>

                {/* Summary */}
                {aiAnalysis.summary && (
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionTitleRow}>
                      <View style={[styles.sectionDot, { backgroundColor: colors.primary }]} />
                      <Text style={styles.sectionTitle} allowFontScaling maxFontSizeMultiplier={1.3}>{UI_COPY.signal.summaryTitle}</Text>
                    </View>
                    <Text style={styles.sectionText} allowFontScaling maxFontSizeMultiplier={1.4}>
                      {expandedSummary ? aiAnalysis.summary : truncateText(aiAnalysis.summary, 180)}
                    </Text>
                    {aiAnalysis.summary.length > 180 && (
                      <TouchableOpacity
                        onPress={() => setExpandedSummary(!expandedSummary)}
                        style={styles.expandBtn}
                        accessibilityRole="button"
                        accessibilityLabel={expandedSummary ? UI_COPY.signal.collapse : UI_COPY.signal.expand}
                      >
                        <Text style={styles.expandBtnText} allowFontScaling maxFontSizeMultiplier={1.4}>
                          {expandedSummary ? UI_COPY.signal.collapse : UI_COPY.signal.expand}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Forecast */}
                {aiAnalysis.forecast && (
                  <View style={[styles.sectionCard, { borderLeftWidth: 3, borderLeftColor: colors.warning + "80" }]}>
                    <View style={styles.sectionTitleRow}>
                      <View style={[styles.sectionDot, { backgroundColor: colors.warning }]} />
                      <Text style={styles.sectionTitle} allowFontScaling maxFontSizeMultiplier={1.3}>{UI_COPY.signal.forecastTitle}</Text>
                    </View>
                    <Text style={styles.sectionText} allowFontScaling maxFontSizeMultiplier={1.4}>
                      {expandedForecast ? aiAnalysis.forecast : truncateText(aiAnalysis.forecast, 180)}
                    </Text>
                    {aiAnalysis.forecast.length > 180 && (
                      <TouchableOpacity
                        onPress={() => setExpandedForecast(!expandedForecast)}
                        style={styles.expandBtn}
                        accessibilityRole="button"
                        accessibilityLabel={expandedForecast ? UI_COPY.signal.collapse : UI_COPY.signal.expand}
                      >
                        <Text style={styles.expandBtnText} allowFontScaling maxFontSizeMultiplier={1.4}>
                          {expandedForecast ? UI_COPY.signal.collapse : UI_COPY.signal.expand}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Risk factors */}
                {aiAnalysis.risk_factors && aiAnalysis.risk_factors.length > 0 && (
                  <View style={[styles.sectionCard, { borderLeftWidth: 3, borderLeftColor: colors.error + "80" }]}>
                    <View style={styles.sectionTitleRow}>
                      <View style={[styles.sectionDot, { backgroundColor: colors.error }]} />
                      <Text style={styles.sectionTitle} allowFontScaling maxFontSizeMultiplier={1.3}>{UI_COPY.signal.riskTitle}</Text>
                    </View>
                    {(aiAnalysis.risk_factors as any[]).map((risk: any, index: number) => (
                      <View key={index} style={styles.riskRow}>
                        <View style={[styles.riskBullet, { backgroundColor: colors.error }]} />
                        <Text style={styles.riskText} allowFontScaling maxFontSizeMultiplier={1.4}>{risk}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            );
          })()
        ) : (
          <View style={[styles.signalCard, { alignItems: "center", paddingVertical: 40, gap: 16 }]}>
            <Text style={styles.sectionText} allowFontScaling maxFontSizeMultiplier={1.4}>{emptyStateText}</Text>
            {isUnsupportedPairError ? (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  padding: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.primary + '60'
                }}
                accessibilityRole="button"
                accessibilityLabel={UI_COPY.signal.back}
              >
                <ChevronLeft size={16} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }} allowFontScaling maxFontSizeMultiplier={1.4}>{UI_COPY.signal.back}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => refetch()}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  padding: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.primary + '60'
                }}
                accessibilityRole="button"
                accessibilityLabel={UI_COPY.signal.retry}
              >
                <RefreshCw size={16} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }} allowFontScaling maxFontSizeMultiplier={1.4}>{UI_COPY.signal.retry}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerBadge} allowFontScaling maxFontSizeMultiplier={1.3}>{UI_COPY.signal.disclaimerTitle}</Text>
          <Text style={styles.disclaimer} allowFontScaling maxFontSizeMultiplier={1.4}>{UI_COPY.signal.disclaimerText}</Text>
        </View>
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
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  sectionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 8,
    textAlign: "justify",
  },
  expandBtn: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.primary + "15",
    alignSelf: "flex-start",
  },
  expandBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  outlookCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    alignItems: "center",
    justifyContent: "center",
  },

  outlookText: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0.5,
    lineHeight: 32,
    textAlign: "center",
  },
  analysisSourceBadge: {
    marginTop: -8,
    marginBottom: 14,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 2,
  },
  analysisSourceBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  analysisSourceTime: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  raiCard: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.warning + "50",
    backgroundColor: colors.warning + "14",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  raiHeader: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  raiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  raiLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  raiValue: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    flexShrink: 1,
    textAlign: "right",
  },
  raiDivider: {
    height: 1,
    backgroundColor: colors.warning + "35",
  },
  raiNote: {
    color: colors.textPrimary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "justify",
    marginTop: 4,
  },
  riskRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  riskBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 12,
  },
  riskText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: "justify",
  },
  disclaimerBox: {
    marginTop: 8,
    backgroundColor: colors.warning + "14",
    borderWidth: 1,
    borderColor: colors.warning + "45",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  disclaimerBadge: {
    alignSelf: "flex-start",
    fontSize: 10,
    fontWeight: "800",
    color: colors.warning,
    letterSpacing: 1,
    marginBottom: 6,
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textPrimary,
    textAlign: "justify",
    lineHeight: 18,
    fontWeight: "600",
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
    textAlign: "justify",
  },
});

export default SignalScreen;
