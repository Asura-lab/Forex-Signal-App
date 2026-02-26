import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SectionList, 
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getColors } from '../config/theme';
import { getNews, analyzeNewsEvent } from '../services/api';
import { X } from 'lucide-react-native';

const NewsScreen: React.FC = () => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(colors);
  
  const [activeTab, setActiveTab] = useState<string>('upcoming'); // 'past' | 'upcoming' | 'outlook'
  const [news, setNews] = useState<any[]>([]);
  const [majorImpacts, setMajorImpacts] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Analysis Modal State
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');

  const handleEventPress = async (item: any) => {
    setSelectedEvent(item);
    setAiAnalysis('');
    setAnalysisLoading(true);

    try {
      const result = await analyzeNewsEvent(item);
      if (result.success && result.data?.status === 'success') {
        setAiAnalysis(result.data.analysis);
      } else {
        setAiAnalysis('Дүгнэлт хийх боломжгүй байна.');
      }
    } catch (error: any) {
      setAiAnalysis('Холболтын алдаа гарлаа.');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const groupNewsByDate = (data: any[]) => {
    const groups: Record<string, any[]> = {};
    data.forEach(item => {
      const dateStr = item.date.split(' ')[0];
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(item);
    });
    
    return Object.keys(groups).map(date => ({
      title: date,
      data: groups[date]
    })).sort((a, b) => a.title.localeCompare(b.title));
  };

  const fetchNews = async (type = 'upcoming') => {
    try {
      setLoading(true);
      const result = await getNews(type);
      if (result.success && result.data?.status === 'success') {
        if (type === 'upcoming') {
          const grouped = groupNewsByDate(result.data.data);
          setNews(grouped);
        } else if (type === 'past') {
          setMajorImpacts(result.data.data);
        } else if (type === 'outlook') {
          setAnalysis(result.data.data);
        }
      }
    } catch (error: any) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    await fetchNews(activeTab);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNews(activeTab);
    setRefreshing(false);
  };

  const getImpactColor = (impact: string) => {
    switch(impact?.toLowerCase()) {
      case 'high': return '#ef5350'; // Red
      case 'medium': return '#ff9800'; // Orange
      case 'low': return '#4caf50'; // Green
      default: return colors.textSecondary;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    if (!sentiment) return colors.textSecondary;
    const s = sentiment.toLowerCase();
    if (s.includes('bullish')) return '#4caf50';
    if (s.includes('bearish')) return '#ef5350';
    return colors.warning;
  };

  // --- Render Functions ---

  const renderAnalysisModal = () => (
    <Modal
      visible={!!selectedEvent}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setSelectedEvent(null)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>AI Дүгнэлт</Text>
            <TouchableOpacity onPress={() => setSelectedEvent(null)}>
              <X size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.eventTitle}>{selectedEvent?.title}</Text>
          
          <View style={styles.dataRow}>
            <Text style={styles.modalData}>Actual: {selectedEvent?.actual}</Text>
            <Text style={styles.modalData}>Forecast: {selectedEvent?.forecast}</Text>
          </View>

          {analysisLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <ScrollView style={styles.analysisScroll}>
              <Text style={styles.analysisText}>{aiAnalysis}</Text>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'past' && styles.activeTab]} 
        onPress={() => setActiveTab('past')}
      >
        <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>Өмнөх мэдээ</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]} 
        onPress={() => setActiveTab('upcoming')}
      >
        <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>Удахгүй болох</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'outlook' && styles.activeTab]} 
        onPress={() => setActiveTab('outlook')}
      >
        <Text style={[styles.tabText, activeTab === 'outlook' && styles.activeTabText]}>Дүгнэлт</Text>
      </TouchableOpacity>
    </View>
  );

  // 1. Upcoming News (SectionList)
  const renderNewsItem = ({ item }: { item: any }) => {
    const impactColor = getImpactColor(item.sentiment);
    const time = item.date.split(' ')[1] || item.date;
    
    const summaryParts = (item.summary as string).split('. ');
    const actualPart = summaryParts.find(p => p.includes('Actual:'))?.replace('Actual: ', '') || '-';
    const forecastPart = summaryParts.find(p => p.includes('Forecast:'))?.replace('Forecast: ', '') || '-';
    const currency = item.title.split(' - ')[0];
    const eventName = item.title.split(' - ')[1] || item.title;

    return (
      <TouchableOpacity style={styles.row} onPress={() => handleEventPress(item)}>
        <View style={[styles.indicator, { backgroundColor: impactColor }]} />
        <View style={styles.leftColumn}>
          <Text style={styles.currencyText}>{currency}</Text>
          <Text style={styles.timeText}>{time}</Text>
        </View>
        <View style={styles.centerColumn}>
          <Text style={styles.eventText} numberOfLines={2}>{eventName}</Text>
          <Text style={[styles.impactText, { color: impactColor }]}>{item.sentiment}</Text>
        </View>
        <View style={styles.rightColumn}>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Act:</Text>
            <Text style={[styles.dataValue, { color: colors.textPrimary }]}>{actualPart}</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Fcst:</Text>
            <Text style={[styles.dataValue, { color: colors.textSecondary }]}>{forecastPart}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  // 2. Past News (FlatList of Major Impacts)
  const renderPastNewsItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.pastNewsCard} onPress={() => handleEventPress(item)}>
      <View style={styles.impactHeader}>
        <Text style={styles.impactCardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.impactDate}>{item.date.split(' ')[0]}</Text>
      </View>
      <View style={styles.impactDataRow}>
        <Text style={styles.impactData}>Act: {item.actual}</Text>
        <Text style={styles.impactData}>Fcst: {item.forecast}</Text>
      </View>
      <Text style={styles.impactAnalysis}>{item.impact_analysis}</Text>
    </TouchableOpacity>
  );

  // 3. Market Outlook (ScrollView)
  const renderOutlook = () => {
    if (!analysis) return <Text style={styles.emptyText}>Мэдээлэл байхгүй байна</Text>;
    
    // Determine colors for Outlook
    const outlookLower = analysis.outlook?.toLowerCase() || '';
    let outlookColor = '#2196f3'; // Neutral - Blue
    let outlookBg = 'rgba(33, 150, 243, 0.1)';
    
    if (outlookLower.includes('bullish') || outlookLower.includes('өсөх')) {
      outlookColor = '#4caf50';
      outlookBg = 'rgba(76, 175, 80, 0.1)';
    } else if (outlookLower.includes('bearish') || outlookLower.includes('унах')) {
      outlookColor = '#ef5350';
      outlookBg = 'rgba(239, 83, 80, 0.1)';
    }

    return (
      <ScrollView 
        contentContainerStyle={styles.outlookScroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.outlookSection}>
          
          {/* 1. Main Outlook Card */}
          <View style={[styles.mainOutcomeCard, { backgroundColor: outlookBg, borderColor: outlookColor }]}>
            <Text style={[styles.outcomeTitle, { color: outlookColor }]}>
              {analysis.outlook || "ТОДОРХОЙГҮЙ"}
            </Text>
            <Text style={[styles.outcomeSubtitle, { color: colors.textSecondary }]}>
              Зах зээлийн үндсэн хандлага
            </Text>
          </View>

          {/* 2. Market Sentiment */}
          {analysis.market_sentiment && (
            <View style={[styles.sentimentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
               <View style={styles.cardHeaderRow}>
                  <View style={[styles.indicatorDot, { backgroundColor: colors.secondary }]} />
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>ЭРСДЭЛИЙН ТӨЛӨВ</Text>
               </View>
               <Text style={[styles.sentimentText, { color: colors.textSecondary }]}>
                 {analysis.market_sentiment}
               </Text>
            </View>
          )}
          
          {/* 3. Summary */}
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
               <Text style={[styles.cardTitle, { color: colors.primary }]}>ЗАХ ЗЭЭЛИЙН ТОЙМ</Text>
            </View>
            <Text style={[styles.insightSummary, { color: colors.textPrimary }]}>
              {analysis.summary || "AI дүгнэлт хийгдэж байна..."}
            </Text>
          </View>

          {/* 4. Forecast */}
          {analysis.forecast && (
            <View style={[styles.forecastCard, { backgroundColor: isDark ? '#1e293b' : '#f0f9ff', borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 8 }]}>ТААМАГЛАЛ (24H)</Text>
              <Text style={[styles.analysisText, { color: colors.textPrimary }]}>
                {analysis.forecast}
              </Text>
            </View>
          )}

          {/* 5. Risk Factors */}
          {analysis.risk_factors && analysis.risk_factors.length > 0 && (
             <View style={styles.sectionBlock}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginLeft: 4 }]}>ЭРСДЭЛҮҮД</Text>
              {(analysis.risk_factors as any[]).map((risk: any, index: number) => (
                <View key={index} style={styles.riskRow}>
                  <Text style={{color: '#ef5350', marginRight: 10, fontSize: 16}}>•</Text>
                  <Text style={[styles.analysisText, { color: colors.textPrimary, flex: 1, marginBottom: 0 }]}>{risk}</Text>
                </View>
              ))}
            </View>
          )}
          
          {analysis.weekly_analysis && analysis.weekly_analysis.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ОНЦЛОХ МЭДЭЭНҮҮД</Text>
              {(analysis.weekly_analysis as any[]).map((item: any, index: number) => (
                <View key={index} style={[styles.analysisCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.analysisHeader}>
                    <Text style={[styles.analysisTitle, { color: colors.textPrimary, flex: 1, marginRight: 8 }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.impactDate, { fontSize: 12, color: colors.textSecondary }]}>
                      {item.date.replace('T', ' ').substring(0, 16)}
                    </Text>
                  </View>
                  <Text style={[styles.analysisText, { color: colors.textSecondary }]}>{item.impact_analysis}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MARKET INTELLIGENCE</Text>
      </View>

      {renderTabs()}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <View style={{ flex: 1 }}>
          {activeTab === 'upcoming' && (
            <SectionList
              sections={news}
              keyExtractor={(item, index) => item.id + index}
              renderItem={renderNewsItem}
              renderSectionHeader={renderSectionHeader}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
              }
              ListEmptyComponent={
                <Text style={styles.emptyText}>No events scheduled</Text>
              }
              stickySectionHeadersEnabled={true}
            />
          )}

          {activeTab === 'past' && (
            <FlatList
              data={majorImpacts}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderPastNewsItem}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
              }
              ListEmptyComponent={
                <Text style={styles.emptyText}>Өмнөх мэдээлэл олдсонгүй</Text>
              }
            />
          )}

          {activeTab === 'outlook' && renderOutlook()}
        </View>
      )}
      
      {renderAnalysisModal()}
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 1,
  },
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '700',
  },
  loader: {
    marginTop: 50,
  },
  listContent: {
    paddingBottom: 20,
  },
  sectionHeader: {
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Row Styles (Upcoming)
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  indicator: {
    width: 3,
    height: 32,
    borderRadius: 1.5,
    marginRight: 12,
  },
  leftColumn: {
    width: 50,
    justifyContent: 'center',
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  centerColumn: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 12,
  },
  eventText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 18,
  },
  impactText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  rightColumn: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  dataLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginRight: 4,
  },
  dataValue: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 35,
    textAlign: 'right',
    fontVariant: ["tabular-nums"],
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: colors.textSecondary,
  },
  // Past News Styles
  pastNewsCard: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  impactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  impactCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  impactDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  impactDataRow: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: colors.background,
    padding: 8,
    borderRadius: 8,
  },
  impactData: {
    fontSize: 13,
    color: colors.textPrimary,
    marginRight: 16,
    fontWeight: '600',
  },
  impactAnalysis: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  // Outlook Styles
  outlookScroll: {
    paddingBottom: 20,
  },
  outlookSection: {
    padding: 20,
  },
  mainOutcomeCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  outcomeSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  sentimentCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sentimentText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  insightSummary: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
  },
  forecastCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  riskRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingRight: 10,
  },
  analysisCard: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
    color: colors.textPrimary,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  modalData: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 16,
  },
  analysisScroll: {
    marginTop: 12,
  },
});

export default NewsScreen;
