import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  StatusBar,
  Dimensions,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { getColors } from "../config/theme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSignal, saveSignal, getMarketAnalysis, getLatestSignal } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationProp, RouteProp } from "@react-navigation/native";
import { CurrencyPair } from "../utils/helpers";
import { updateNotificationPreferences } from "../services/notificationService";
import { ChevronLeft } from 'lucide-react-native';

const { width } = Dimensions.get("window");

type RootStackParamList = {
  Signal: { pair: CurrencyPair };
};

type SignalScreenRouteProp = RouteProp<RootStackParamList, 'Signal'>;

interface SignalScreenProps {
  route: SignalScreenRouteProp;
  navigation: NavigationProp<any>;
}

/**
 * Signal Screen - AI Analysis & Signals
 */
const SignalScreen = ({ route, navigation }: SignalScreenProps) => {
  const { pair } = route.params || {};
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(colors);
  
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(90);
  const [showThresholdModal, setShowThresholdModal] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toLocaleTimeString());

  // React Query - Get Signal
  const { 
    data: signalData, 
    isLoading: loading, 
    error: signalError,
    refetch: refetchSignal 
  } = useQuery({
    queryKey: ['signal', pair?.name, confidenceThreshold],
    queryFn: async () => {
      const pairName = pair?.name || "EUR/USD";
      const result = await getSignal(confidenceThreshold, pairName);
      if (!result.success) throw new Error(result.error);
      
      const isJPY = pairName.includes("JPY");
      return { 
        ...result.data, 
        isMock: false, 
        digits: isJPY ? 2 : 5,
        dataInfo: result.data.data_info 
      };
    },
    staleTime: 60000, // Data is fresh for 60s — won't refetch on re-mount
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 min
    refetchInterval: 60000, // Auto refetch every 1 min
    retry: 2
  });

  // React Query - Market Analysis
  const {
    data: aiAnalysis,
    isLoading: loadingAnalysis
  } = useQuery({
    queryKey: ['analysis', pair?.name],
    queryFn: async () => {
      if (!pair?.name) return null;
      const result = await getMarketAnalysis(pair.name);
      if (result.success) return result.data;
      return null;
    },
    staleTime: 15 * 60 * 1000, // AI analysis is fresh for 15 min
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 min
    enabled: !!pair?.name, // Only run if pair name exists
  });

  // Save Signal Mutation
  const saveSignalMutation = useMutation({
    mutationFn: (signalToSave: any) => saveSignal(signalToSave),
    onSuccess: (data) => {
      if (data.success) console.log("+ Signal saved:", data.data.signal_id);
    }
  });

  // Signal auto-save хэрэггүй — backend continuous_signal_generator хариуцна
  // Effect to track last update time
  useEffect(() => {
    setLastUpdate(new Date().toLocaleTimeString("en-US", { hour12: false }));
  }, [signalData]);

  const signal = signalData;
  const error = signalError?.message;
  const [isManualRefreshing, setIsManualRefreshing] = React.useState(false);

  // Clear manual-refresh spinner once loading finishes
  React.useEffect(() => {
    if (!loading) setIsManualRefreshing(false);
  }, [loading]);

  // Check if market is closed from API response or local calculation
  const isMarketClosedFromAPI = signal?.dataInfo?.market_closed === true;

  
  // Get next market open time in local timezone
  const getNextMarketOpen = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Market opens Monday 08:00 local time
    let daysUntilMonday = (8 - day) % 7; // Days until next Monday
    if (day === 0) daysUntilMonday = 1; // Sunday -> Monday is 1 day
    if (day === 6) daysUntilMonday = 2; // Saturday -> Monday is 2 days
    
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(8, 0, 0, 0);
    
    return nextMonday.toLocaleString('mn-MN', {
      weekday: 'long',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Local check if forex market is closed (Saturday & Sunday)
  const isMarketClosedLocal = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = now.getHours();
    
    // Market opens Monday 08:00 local, closes Friday evening
    if (day === 6) return true; // Saturday - fully closed
    if (day === 0) return true; // Sunday - fully closed  
    if (day === 1 && hour < 8) return true; // Monday before 08:00
    return false;
  };
  
  const marketClosed = isMarketClosedFromAPI || isMarketClosedLocal();
  const nextMarketOpen = getNextMarketOpen();

  useEffect(() => {
    loadThreshold();
  }, []);

  const loadThreshold = async () => {
    try {
      const saved = await AsyncStorage.getItem("@confidence_threshold");
      if (saved) setConfidenceThreshold(parseInt(saved));
    } catch (e) {}
  };

  const saveThreshold = async (value: number) => {
    try {
      await AsyncStorage.setItem("@confidence_threshold", value.toString());
      setConfidenceThreshold(value);
      setShowThresholdModal(false);
      // Sync with server notification preferences (convert to 0-1 range)
      await updateNotificationPreferences({ signal_threshold: value / 100 });
      refetchSignal();
    } catch (e) {}
  };

  const onRefresh = useCallback(() => {
    setIsManualRefreshing(true);
    refetchSignal();
  }, [refetchSignal]);

  const getSignalColor = (type: string) => {
    if (type === "BUY") return colors.success;
    if (type === "SELL") return colors.error;
    return colors.warning;
  };

  const thresholdOptions = [90, 92, 94, 96, 98, 100];
  const priceDigits = signal?.digits || 5;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.pairName}>{pair?.name || "EUR/USD"}</Text>
          <Text style={styles.pairSub}>AI Шинжилгээ</Text>
        </View>

        <TouchableOpacity 
          style={styles.thresholdBtn}
          onPress={() => setShowThresholdModal(true)}
        >
          <Text style={styles.thresholdText}>{confidenceThreshold}%+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isManualRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Market Closed Warning */}
        {marketClosed && (
          <View style={styles.marketClosedBox}>
            <View style={styles.marketClosedHeader}>
              <View style={styles.marketClosedIconBox}>
                <Text style={styles.marketClosedIcon}>X</Text>
              </View>
              <View style={styles.marketClosedContent}>
                <Text style={styles.marketClosedTitle}>Зах зээл хаалттай байна</Text>
                <Text style={styles.marketClosedText}>
                  Форекс зах зээл амралтын өдрүүдэд амардаг.
                </Text>
              </View>
            </View>
            
            <View style={styles.marketClosedInfo}>
              <View style={styles.marketInfoRow}>
                <Text style={styles.marketInfoLabel}>Нээгдэх цаг:</Text>
                <Text style={styles.marketInfoValue}>{nextMarketOpen}</Text>
              </View>
              {signal?.dataInfo?.to && (
                <View style={styles.marketInfoRow}>
                  <Text style={styles.marketInfoLabel}>Сүүлийн дата:</Text>
                  <Text style={styles.marketInfoValue}>
                    {new Date(signal.dataInfo.to).toLocaleString('mn-MN', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>AI зах зээлийг шинжилж байна...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <View style={styles.errorIcon}>
              <Text style={styles.errorIconText}>!</Text>
            </View>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetchSignal()}>
              <Text style={styles.retryText}>Дахин оролдох</Text>
            </TouchableOpacity>
          </View>
        ) : signal && (
          <>
            {/* Main Signal Card */}
            <View style={styles.signalCard}>
              <View style={styles.signalTop}>
                <View>
                  <Text style={styles.signalLabel}>ДОХИО</Text>
                  <Text style={styles.updateTime}>Шинэчлэгдсэн: {lastUpdate}</Text>
                </View>
                <View style={[styles.signalBadge, { backgroundColor: getSignalColor(signal.signal) }]}>
                  <Text style={styles.signalBadgeText}>
                    {signal.signal === 'BUY' ? 'BUY [UP]' : signal.signal === 'SELL' ? 'SELL [DOWN]' : 'HOLD [WAIT]'}
                  </Text>
                </View>
              </View>

              {/* Confidence Meter */}
              <View style={styles.confidenceBox}>
                <View style={styles.confidenceRow}>
                  <Text style={styles.confLabel}>Итгэлцүүр</Text>
                  <Text style={[styles.confValue, { color: getSignalColor(signal.signal) }]}>
                    {signal.confidence?.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.progressBg}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${signal.confidence}%`,
                        backgroundColor: getSignalColor(signal.signal)
                      }
                    ]} 
                  />
                </View>
              </View>

              {/* BUY/SELL Details */}
              {(signal.signal === "BUY" || signal.signal === "SELL") && (
                <View style={styles.entryGrid}>
                  <View style={styles.entryItem}>
                    <Text style={styles.entryLabel}>ОРНО (ENTRY)</Text>
                    <Text style={styles.entryValue}>{signal.entry_price?.toFixed(priceDigits)}</Text>
                  </View>
                  
                  <View style={{flexDirection: 'row', gap: 12}}>
                    <View style={[styles.entryItem, styles.slItem, {flex: 1}]}>
                      <Text style={[styles.entryLabel, { color: colors.error }]}>STOP LOSS</Text>
                      <Text style={[styles.entryValue, { color: colors.error }]}>{signal.stop_loss?.toFixed(priceDigits)}</Text>
                      <Text style={styles.pipsText}>-{signal.sl_pips} pips</Text>
                    </View>
                    <View style={[styles.entryItem, styles.tpItem, {flex: 1}]}>
                      <Text style={[styles.entryLabel, { color: colors.success }]}>TAKE PROFIT</Text>
                      <Text style={[styles.entryValue, { color: colors.success }]}>{signal.take_profit?.toFixed(priceDigits)}</Text>
                      <Text style={styles.pipsText}>+{signal.tp_pips} pips</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* HOLD Reason */}
              {signal.signal === "HOLD" && (
                <View style={styles.holdBox}>
                  <Text style={styles.holdLabel}>ХҮЛЭЭЛТИЙН ШАЛТГААН</Text>
                  <Text style={styles.holdText}>
                    {signal.confidence < confidenceThreshold 
                      ? `Итгэлцүүр (${signal.confidence?.toFixed(1)}%) таны тохируулсан босго (${confidenceThreshold}%)-оос бага байна. Илүү өндөр итгэлцүүртэй дохио хүлээнэ үү.`
                      : `Зах зээлийн нөхцөл байдал тодорхойгүй байна. (Итгэлцүүр: ${signal.confidence?.toFixed(1)}%)`
                    }
                  </Text>
                </View>
              )}

              {/* Risk Reward */}
              {(signal.signal === "BUY" || signal.signal === "SELL") && (
                <View style={styles.rrBox}>
                  <Text style={styles.rrLabel}>Эрсдэл/Өгөөж</Text>
                  <Text style={styles.rrValue}>{signal.risk_reward}</Text>
                </View>
              )}
            </View>

            {/* Model Probabilities */}
            {signal.model_probabilities && (
              <View style={styles.modelsCard}>
                <Text style={styles.cardTitle}>
                  AI ЗАГВАРУУДЫН ШИНЖИЛГЭЭ
                </Text>
                <View style={styles.modelGrid}>
                  {Object.entries(signal.model_probabilities).map(([model, prob]) => {
                    // prob is an object like {SELL: 3.2, HOLD: 93.5, BUY: 3.3}
                    let probNum: number;
                    if (typeof prob === 'object' && prob !== null) {
                      const probObj = prob as Record<string, number>;
                      // Show the probability for the current signal direction
                      if (signal.signal === 'BUY') {
                        probNum = probObj.BUY ?? 0;
                      } else if (signal.signal === 'SELL') {
                        probNum = probObj.SELL ?? 0;
                      } else {
                        probNum = probObj.HOLD ?? 0;
                      }
                    } else {
                      probNum = typeof prob === 'number' ? prob : parseFloat(String(prob) ?? '0');
                    }
                    const isValid = !isNaN(probNum);
                    return (
                      <View key={model} style={styles.modelItem}>
                        <Text style={styles.modelName}>{model.toUpperCase()}</Text>
                        <Text style={[styles.modelProb, { color: isValid && probNum > 50 ? colors.success : colors.error }]}>
                          {isValid ? probNum.toFixed(0) : '—'}%
                        </Text>
                      </View>
                    );
                  })}
                </View>
                
                {signal.models_agree && (
                  <View style={[styles.agreeRow, { backgroundColor: colors.success + '20' }]}>
                    <Text style={[styles.agreeText, { color: colors.success }]}>
                      + Бүх загварууд санал нэг байна
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Market Analysis Section */}
            <View style={styles.signalCard}>
                <Text style={styles.cardTitle}>ЗАХ ЗЭЭЛИЙН ШИНЖИЛГЭЭ</Text>
                
                {loadingAnalysis ? (
                  <ActivityIndicator color={colors.primary} />
                ) : aiAnalysis ? (
                  <>
                    <View style={styles.analysisRow}>
                      <Text style={styles.analysisLabel}>Төлөв (Outlook)</Text>
                      <Text style={[styles.analysisValue, { 
                        color: (aiAnalysis.outlook?.includes('Bullish') || aiAnalysis.outlook?.includes('Өсөх')) ? colors.success : 
                               (aiAnalysis.outlook?.includes('Bearish') || aiAnalysis.outlook?.includes('Унах')) ? colors.error : colors.warning 
                      }]}>
                        {aiAnalysis.outlook || aiAnalysis.market_sentiment || 'Neutral'}
                      </Text>
                    </View>

                    <View style={styles.analysisSection}>
                      <Text style={styles.analysisSubTitle}>Дүгнэлт</Text>
                      <Text style={styles.analysisText}>{aiAnalysis.summary}</Text>
                    </View>

                    {aiAnalysis.forecast && (
                      <View style={styles.analysisSection}>
                        <Text style={styles.analysisSubTitle}>Таамаглал</Text>
                        <Text style={styles.analysisText}>{aiAnalysis.forecast}</Text>
                      </View>
                    )}

                    {aiAnalysis.risk_factors && aiAnalysis.risk_factors.length > 0 && (
                      <View style={styles.analysisSection}>
                        <Text style={styles.analysisSubTitle}>Эрсдэлт хүчин зүйлс</Text>
                        {(aiAnalysis.risk_factors as any[]).map((risk: any, index: number) => (
                          <Text key={index} style={styles.riskText}>• {risk}</Text>
                        ))}
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={styles.analysisText}>Шинжилгээ хийгдээгүй байна</Text>
                )}
              </View>

            {/* Info Row */}
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Төрөл</Text>
                <Text style={styles.infoValue}>AI Signal</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Хэлбэлзэл</Text>
                <Text style={styles.infoValue}>Дунд</Text>
              </View>
              {signal.atr_pips && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>ATR</Text>
                  <Text style={styles.infoValue}>{signal.atr_pips?.toFixed(1)} pip</Text>
                </View>
              )}
            </View>

            {/* Disclaimer */}
            <Text style={styles.disclaimer}>
              [!] Зөвхөн мэдээллийн зорилготой. Санхүүгийн зөвлөгөө биш.
            </Text>
          </>
        )}
      </ScrollView>

      {/* Threshold Modal */}
      <Modal
        visible={showThresholdModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowThresholdModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalBg}
          activeOpacity={1}
          onPress={() => setShowThresholdModal(false)}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Итгэлцүүрийн босго</Text>
            <Text style={styles.modalSub}>
              Дохио өгөх хамгийн бага итгэлцүүрийн хэмжээ
            </Text>
            
            <View style={styles.optionList}>
              {thresholdOptions.map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.optionBtn, confidenceThreshold === val && styles.optionActive]}
                  onPress={() => saveThreshold(val)}
                >
                  <Text style={[styles.optionText, confidenceThreshold === val && styles.optionTextActive]}>
                    {val}%
                  </Text>
                  {confidenceThreshold === val && <Text style={styles.checkIcon}>+</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
    width: width * 0.85,
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
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  analysisLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  analysisValue: {
    fontSize: 16,
    fontWeight: "700",
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
  riskText: {
    fontSize: 13,
    color: colors.error,
    lineHeight: 20,
    marginBottom: 4,
  },
});

export default SignalScreen;
