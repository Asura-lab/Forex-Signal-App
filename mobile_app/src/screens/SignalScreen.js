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
import { getSignalV2, saveSignal } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

// Mock signal data for non-EUR/USD pairs
const generateMockSignal = (pairName) => {
  const signals = ["BUY", "SELL", "HOLD"];
  const randomSignal = signals[Math.floor(Math.random() * 3)];
  const confidence = 55 + Math.random() * 40; // 55-95%
  
  // Mock prices based on pair
  const mockPrices = {
    "GBP/USD": { price: 1.2650, pip: 0.0001 },
    "USD/JPY": { price: 149.50, pip: 0.01 },
    "USD/CHF": { price: 0.8820, pip: 0.0001 },
    "AUD/USD": { price: 0.6520, pip: 0.0001 },
    "USD/CAD": { price: 1.3580, pip: 0.0001 },
    "NZD/USD": { price: 0.5890, pip: 0.0001 },
    "EUR/GBP": { price: 0.8350, pip: 0.0001 },
    "EUR/JPY": { price: 163.20, pip: 0.01 },
    "GBP/JPY": { price: 189.50, pip: 0.01 },
    "AUD/JPY": { price: 97.80, pip: 0.01 },
    "EUR/AUD": { price: 1.6250, pip: 0.0001 },
    "EUR/CAD": { price: 1.4720, pip: 0.0001 },
    "EUR/CHF": { price: 0.9380, pip: 0.0001 },
    "GBP/AUD": { price: 1.9450, pip: 0.0001 },
    "GBP/CAD": { price: 1.7180, pip: 0.0001 },
    "GBP/CHF": { price: 1.1150, pip: 0.0001 },
    "CAD/JPY": { price: 110.20, pip: 0.01 },
    "CHF/JPY": { price: 169.50, pip: 0.01 },
    "NZD/JPY": { price: 88.40, pip: 0.01 },
  };
  
  const pairData = mockPrices[pairName] || { price: 1.0000, pip: 0.0001 };
  const slPips = 15 + Math.floor(Math.random() * 20);
  const tpPips = slPips * (1.5 + Math.random());
  
  const isJPY = pairName.includes("JPY");
  const digits = isJPY ? 2 : 5;
  
  return {
    signal: randomSignal,
    confidence: confidence,
    entry_price: pairData.price,
    stop_loss: randomSignal === "BUY" 
      ? pairData.price - (slPips * pairData.pip)
      : pairData.price + (slPips * pairData.pip),
    take_profit: randomSignal === "BUY"
      ? pairData.price + (tpPips * pairData.pip)
      : pairData.price - (tpPips * pairData.pip),
    sl_pips: slPips,
    tp_pips: Math.round(tpPips),
    risk_reward: `1:${(tpPips / slPips).toFixed(1)}`,
    atr_pips: 8 + Math.random() * 12,
    model_probabilities: {
      technical: 50 + Math.random() * 45,
      sentiment: 45 + Math.random() * 50,
      pattern: 40 + Math.random() * 55,
    },
    models_agree: Math.random() > 0.4,
    isMock: true,
    digits: digits,
  };
};

/**
 * Signal Screen - EUR/USD = Real AI, Others = Mock
 */
const SignalScreen = ({ route, navigation }) => {
  const { pair } = route.params || {};
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signal, setSignal] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState(80);
  const [showThresholdModal, setShowThresholdModal] = useState(false);

  const isRealAI = pair?.name === "EUR/USD";

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

  useEffect(() => {
    loadSignal();
    
    const interval = setInterval(() => {
      loadSignal(false);
    }, isRealAI ? 5 * 60 * 1000 : 30 * 1000); // Real: 5min, Mock: 30sec
    
    return () => clearInterval(interval);
  }, [pair, confidenceThreshold]);

  const loadThreshold = async () => {
    try {
      const saved = await AsyncStorage.getItem("@confidence_threshold");
      if (saved) setConfidenceThreshold(parseInt(saved));
    } catch (e) {}
  };

  const saveThreshold = async (value) => {
    try {
      await AsyncStorage.setItem("@confidence_threshold", value.toString());
      setConfidenceThreshold(value);
      setShowThresholdModal(false);
      loadSignal();
    } catch (e) {}
  };

  const loadSignal = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      if (isRealAI) {
        // EUR/USD - Real AI analysis
        const result = await getSignalV2(confidenceThreshold);
        
        if (result.success) {
          setSignal({ 
            ...result.data, 
            isMock: false, 
            digits: 5,
            dataInfo: result.data.data_info // Include data info from API
          });
          setLastUpdate(new Date().toLocaleTimeString("en-US", { hour12: false }));
          
          if (result.data.signal && result.data.signal !== "HOLD") {
            const saveResult = await saveSignal({
              pair: "EUR_USD",
              signal: result.data.signal,
              confidence: result.data.confidence,
              entry_price: result.data.entry_price,
              stop_loss: result.data.stop_loss,
              take_profit: result.data.take_profit,
              sl_pips: result.data.sl_pips,
              tp_pips: result.data.tp_pips,
              risk_reward: result.data.risk_reward,
              model_probabilities: result.data.model_probabilities,
              models_agree: result.data.models_agree,
              atr_pips: result.data.atr_pips,
            });
            if (saveResult.success) console.log("✓ Signal saved:", saveResult.data.signal_id);
          }
        } else {
          setError(result.error || "Signal авахад алдаа гарлаа");
        }
      } else {
        // Other pairs - Mock data
        const mockSignal = generateMockSignal(pair?.name);
        setSignal(mockSignal);
        setLastUpdate(new Date().toLocaleTimeString("en-US", { hour12: false }));
      }
    } catch (err) {
      setError("Сервертэй холбогдоход алдаа гарлаа");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSignal(false);
  }, [confidenceThreshold, pair]);

  const getSignalColor = (sig) => {
    if (sig === "BUY") return "#10B981";
    if (sig === "SELL") return "#EF4444";
    return "#6B7280";
  };

  const getConfidenceColor = (conf) => {
    if (conf >= 80) return "#10B981";
    if (conf >= 60) return "#F59E0B";
    return "#EF4444";
  };

  const thresholdOptions = [60, 70, 75, 80, 85, 90, 95];
  const priceDigits = signal?.digits || 5;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>❮</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.pairName}>{pair?.name || "EUR/USD"}</Text>
          <Text style={styles.pairSub}>
            {isRealAI ? "AI Trading Signal" : "Demo Signal"}
          </Text>
        </View>
        
        {isRealAI ? (
          <TouchableOpacity 
            style={styles.thresholdBtn}
            onPress={() => setShowThresholdModal(true)}
          >
            <Text style={styles.thresholdText}>{confidenceThreshold}%</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.demoBadge}>
            <Text style={styles.demoText}>DEMO</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10B981"
            colors={["#10B981"]}
          />
        }
      >
        {/* Loading */}
        {loading && (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>
              {isRealAI ? "AI analyzing market..." : "Loading demo signal..."}
            </Text>
          </View>
        )}

        {/* Error */}
        {error && !loading && (
          <View style={styles.centerBox}>
            <View style={styles.errorIcon}>
              <Text style={styles.errorIconText}>!</Text>
            </View>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => loadSignal()}>
              <Text style={styles.retryText}>Дахин оролдох</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Signal Result */}
        {!loading && !error && signal && (
          <>
            {/* Market Closed Warning */}
            {marketClosed && isRealAI && (
              <View style={styles.marketClosedBox}>
                <View style={styles.marketClosedHeader}>
                  <View style={styles.marketClosedContent}>
                    <Text style={styles.marketClosedTitle}>Market хаалттай</Text>
                    <Text style={styles.marketClosedText}>
                      Амралтын өдрүүдэд Forex market хаалттай байна
                    </Text>
                  </View>
                </View>
                <View style={styles.marketClosedInfo}>
                  {signal?.dataInfo?.to && (
                    <View style={styles.marketInfoRow}>
                      <Text style={styles.marketInfoLabel}>📊 Сүүлийн дата:</Text>
                      <Text style={styles.marketInfoValue}>{signal.dataInfo.to.split('T')[0]}</Text>
                    </View>
                  )}
                  <View style={styles.marketInfoRow}>
                    <Text style={styles.marketInfoLabel}>🔓 Нээгдэх цаг:</Text>
                    <Text style={styles.marketInfoValue}>{nextMarketOpen}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Mock Warning */}
            {signal.isMock && (
              <View style={styles.mockWarning}>
                <Text style={styles.mockWarningText}>
                  ⚠️ Demo Signal - Зөвхөн туршилтын зорилгоор
                </Text>
              </View>
            )}

            {/* Main Signal Card */}
            <View style={styles.signalCard}>
              <View style={styles.signalTop}>
                <View>
                  <Text style={styles.signalLabel}>
                    {signal.isMock ? "DEMO SIGNAL" : "AI SIGNAL"}
                  </Text>
                  <Text style={styles.updateTime}>{lastUpdate}</Text>
                </View>
                <View style={[styles.signalBadge, { backgroundColor: getSignalColor(signal.signal) }]}>
                  <Text style={styles.signalBadgeText}>{signal.signal}</Text>
                </View>
              </View>

              {/* Confidence */}
              <View style={styles.confidenceBox}>
                <View style={styles.confidenceRow}>
                  <Text style={styles.confLabel}>Confidence</Text>
                  <Text style={[styles.confValue, { color: getConfidenceColor(signal.confidence) }]}>
                    {signal.confidence?.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.progressBg}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${Math.min(signal.confidence, 100)}%`,
                        backgroundColor: getConfidenceColor(signal.confidence)
                      }
                    ]} 
                  />
                </View>
              </View>

              {/* BUY/SELL Details */}
              {(signal.signal === "BUY" || signal.signal === "SELL") && (
                <View style={styles.entryGrid}>
                  <View style={styles.entryItem}>
                    <Text style={styles.entryLabel}>ENTRY</Text>
                    <Text style={styles.entryValue}>{signal.entry_price?.toFixed(priceDigits)}</Text>
                  </View>
                  <View style={[styles.entryItem, styles.slItem]}>
                    <Text style={[styles.entryLabel, { color: "#EF4444" }]}>STOP LOSS</Text>
                    <Text style={[styles.entryValue, { color: "#EF4444" }]}>{signal.stop_loss?.toFixed(priceDigits)}</Text>
                    <Text style={styles.pipsText}>-{signal.sl_pips} pips</Text>
                  </View>
                  <View style={[styles.entryItem, styles.tpItem]}>
                    <Text style={[styles.entryLabel, { color: "#10B981" }]}>TAKE PROFIT</Text>
                    <Text style={[styles.entryValue, { color: "#10B981" }]}>{signal.take_profit?.toFixed(priceDigits)}</Text>
                    <Text style={styles.pipsText}>+{signal.tp_pips} pips</Text>
                  </View>
                </View>
              )}

              {/* HOLD Reason */}
              {signal.signal === "HOLD" && (
                <View style={styles.holdBox}>
                  <Text style={styles.holdLabel}>ХҮЛЭЭЛТИЙН ШАЛТГААН</Text>
                  <Text style={styles.holdText}>
                    BUY итгэлцүүр ({signal.confidence?.toFixed(1)}%) таны тохируулсан босго ({confidenceThreshold}%)-оос бага байна. Илүү өндөр итгэлцүүртэй дохио хүлээнэ үү.
                  </Text>
                </View>
              )}

              {/* Risk Reward */}
              {(signal.signal === "BUY" || signal.signal === "SELL") && (
                <View style={styles.rrBox}>
                  <Text style={styles.rrLabel}>Risk/Reward</Text>
                  <Text style={styles.rrValue}>{signal.risk_reward}</Text>
                </View>
              )}
            </View>

            {/* Model Probabilities */}
            {signal.model_probabilities && (
              <View style={styles.modelsCard}>
                <Text style={styles.cardTitle}>
                  {signal.isMock ? "🤖 ШИНЖИЛГЭЭ (DEMO)" : "🤖 AI ЗАГВАРУУДЫН ШИНЖИЛГЭЭ"}
                </Text>
                <View style={styles.modelGrid}>
                  {Object.entries(signal.model_probabilities).map(([name, prob]) => (
                    <View key={name} style={styles.modelItem}>
                      <Text style={styles.modelName}>{name.toUpperCase()}</Text>
                      <Text style={[styles.modelProb, { color: getConfidenceColor(prob || 0) }]}>
                        {(prob || 0)?.toFixed(0)}%
                      </Text>
                    </View>
                  ))}
                </View>
                {signal.models_agree !== undefined && (
                  <View style={[styles.agreeRow, { backgroundColor: signal.models_agree ? "#10B98120" : "#F59E0B20" }]}>
                    <Text style={[styles.agreeText, { color: signal.models_agree ? "#10B981" : "#F59E0B" }]}>
                      {signal.models_agree ? "✓ Загварууд санал нийлж байна" : "⚠ Загварууд санал зөрж байна"}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Info Row */}
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Төрөл</Text>
                <Text style={styles.infoValue}>{isRealAI ? "Бодит AI" : "Demo"}</Text>
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
              {signal.isMock 
                ? "⚠️ Demo signal - Зохиомол дата, бодит арилжаанд ашиглахгүй"
                : "⚠️ Зөвхөн мэдээллийн зорилготой. Санхүүгийн зөвлөгөө биш."
              }
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
            <Text style={styles.modalTitle}>⚙️ Итгэлцүүрийн босго</Text>
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
                  {confidenceThreshold === val && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: "#1E293B",
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
    color: "#FFFFFF",
    fontWeight: "600",
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  pairName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  pairSub: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  thresholdBtn: {
    backgroundColor: "#10B981",
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
    backgroundColor: "#F59E0B",
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
    backgroundColor: "#F59E0B20",
    borderWidth: 1,
    borderColor: "#F59E0B40",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  mockWarningText: {
    color: "#F59E0B",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
  },
  marketClosedBox: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#334155",
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
    backgroundColor: "#3B82F620",
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
    color: "#FFFFFF",
    marginBottom: 2,
  },
  marketClosedText: {
    fontSize: 13,
    color: "#94A3B8",
    lineHeight: 18,
  },
  marketClosedInfo: {
    backgroundColor: "#0F172A",
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
    color: "#64748B",
  },
  marketInfoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E2E8F0",
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
    color: "#94A3B8",
    fontSize: 14,
    marginTop: 16,
  },
  errorIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EF444420",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  errorIconText: {
    fontSize: 28,
    color: "#EF4444",
    fontWeight: "700",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: "#10B981",
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
    backgroundColor: "#1E293B",
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
    color: "#64748B",
    letterSpacing: 1,
  },
  updateTime: {
    fontSize: 12,
    color: "#64748B",
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
    color: "#94A3B8",
  },
  confValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  progressBg: {
    height: 8,
    backgroundColor: "#334155",
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
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  slItem: {
    borderWidth: 1,
    borderColor: "#EF444440",
  },
  tpItem: {
    borderWidth: 1,
    borderColor: "#10B98140",
  },
  entryLabel: {
    fontSize: 11,
    color: "#64748B",
    letterSpacing: 1,
    marginBottom: 6,
  },
  entryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    fontVariant: ["tabular-nums"],
  },
  pipsText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  holdBox: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#F59E0B",
  },
  holdLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F59E0B",
    letterSpacing: 1,
    marginBottom: 8,
  },
  holdText: {
    fontSize: 13,
    color: "#94A3B8",
    lineHeight: 20,
  },
  rrBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  rrLabel: {
    fontSize: 14,
    color: "#94A3B8",
  },
  rrValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#10B981",
  },
  modelsCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
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
    backgroundColor: "#0F172A",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  modelName: {
    fontSize: 10,
    color: "#64748B",
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
    backgroundColor: "#1E293B",
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
    color: "#64748B",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E2E8F0",
  },
  disclaimer: {
    fontSize: 12,
    color: "#64748B",
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
    color: "#FFFFFF",
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: "#94A3B8",
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
    backgroundColor: "#1E293B",
    borderRadius: 20,
    padding: 24,
    width: width * 0.85,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 14,
    color: "#94A3B8",
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
    backgroundColor: "#0F172A",
  },
  optionActive: {
    backgroundColor: "#10B98120",
    borderWidth: 1,
    borderColor: "#10B981",
  },
  optionText: {
    fontSize: 16,
    color: "#E2E8F0",
    fontWeight: "500",
  },
  optionTextActive: {
    color: "#10B981",
    fontWeight: "700",
  },
  checkIcon: {
    fontSize: 18,
    color: "#10B981",
    fontWeight: "700",
  },
});

export default SignalScreen;
