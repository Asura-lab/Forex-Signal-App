import React, { useState, useEffect, useRef } from 'react';
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
import { UI_COPY } from '../config/copy';

const NewsScreen: React.FC = () => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(colors);
  
  const [activeTab, setActiveTab] = useState<string>('upcoming'); // 'history' | 'upcoming' | 'outlook'
  const [news, setNews] = useState<any[]>([]);
  const [majorImpacts, setMajorImpacts] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Analysis Modal State
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  // Cache: event key -> analysis text (session-wide, no re-fetch)
  const analysisCache = useRef<Record<string, string>>({});

  const handleEventPress = async (item: any) => {
    setSelectedEvent(item);
    // Unique key per event (title + date)
    const cacheKey = `${item.title}__${item.date}`;

    // Return cached result immediately — no re-fetch
    if (analysisCache.current[cacheKey]) {
      setAiAnalysis(analysisCache.current[cacheKey]);
      setAnalysisLoading(false);
      return;
    }

    setAiAnalysis('');
    setAnalysisLoading(true);

    try {
      const result = await analyzeNewsEvent(item);
      if (result.success && result.data?.status === 'success') {
        analysisCache.current[cacheKey] = result.data.analysis;
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
        } else if (type === 'history') {
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

  const getPastItemColor = (item: any) => {
    const raw = String(item?.sentiment || item?.impact || item?.impact_level || '').toLowerCase();
    if (!raw) return colors.textSecondary;
    if (raw.includes('high') || raw.includes('bearish') || raw.includes('negative')) return '#ef5350';
    if (raw.includes('medium') || raw.includes('neutral') || raw.includes('mixed')) return '#ff9800';
    if (raw.includes('low') || raw.includes('bullish') || raw.includes('positive')) return '#4caf50';
    return colors.textSecondary;
  };

  const getPastItemLabel = (item: any) => {
    const raw = String(item?.sentiment || item?.impact || item?.impact_level || '').trim();
    if (!raw) return UI_COPY.news.pastEventFallback.toUpperCase();
    return raw.toUpperCase();
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
            <Text style={styles.modalTitle}>{UI_COPY.news.modalTitle}</Text>
            <TouchableOpacity onPress={() => setSelectedEvent(null)}>
              <X size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.eventTitle}>{selectedEvent?.title}</Text>

          {analysisLoading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <ScrollView style={styles.analysisScroll} showsVerticalScrollIndicator={false}>
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
        style={[styles.tab, activeTab === 'history' && styles.activeTab]} 
        onPress={() => setActiveTab('history')}
      >
        <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>{UI_COPY.news.tabs.history}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]} 
        onPress={() => setActiveTab('upcoming')}
      >
        <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>{UI_COPY.news.tabs.upcoming}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'outlook' && styles.activeTab]} 
        onPress={() => setActiveTab('outlook')}
      >
        <Text style={[styles.tabText, activeTab === 'outlook' && styles.activeTabText]}>{UI_COPY.news.tabs.outlook}</Text>
      </TouchableOpacity>
    </View>
  );

  // 1. Upcoming News (SectionList)
  const renderNewsItem = ({ item }: { item: any }) => {
    const impactColor = getImpactColor(item.sentiment);
    const time = item.date.split(' ')[1] || item.date;
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
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  // 2. Past News (same row style as upcoming)
  const renderPastNewsItem = ({ item }: { item: any }) => {
    const rawDate = String(item.date || '');
    const normalizedDate = rawDate.replace('T', ' ');
    const parsedDate = new Date(rawDate);
    const timeToken = normalizedDate.split(' ')[1]?.slice(0, 5);

    const currencySource = String(item.currency || item.base_currency || '').toUpperCase();
    const currency = /^[A-Z]{2,6}$/.test(currencySource)
      ? currencySource.slice(0, 3)
      : 'USD';

    const leftTime = timeToken || (
      Number.isNaN(parsedDate.getTime())
        ? '--:--'
        : parsedDate.toLocaleTimeString('mn-MN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })
    );

    const impactColor = getPastItemColor(item);
    const impactLabel = getPastItemLabel(item);

    return (
      <TouchableOpacity style={styles.row} onPress={() => handleEventPress(item)}>
        <View style={[styles.indicator, { backgroundColor: impactColor }]} />

        <View style={styles.leftColumn}>
          <Text style={styles.currencyText} numberOfLines={1}>{currency}</Text>
          <Text style={styles.timeText} numberOfLines={1}>{leftTime}</Text>
        </View>

        <View style={styles.centerColumn}>
          <Text style={styles.eventText} numberOfLines={2}>{item.title}</Text>
          <Text style={[styles.impactText, { color: impactColor }]} numberOfLines={1}>
            {impactLabel}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // 3. Market Outlook (ScrollView)
  const renderOutlook = () => {
    if (!analysis) return <Text style={styles.emptyText}>{UI_COPY.news.emptyOutlook}</Text>;
    
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
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.outlookSection}>
          
          {/* 1. Main Outlook Card */}
          <View style={styles.mainOutcomeCard}>
            <Text style={[styles.outcomeTitle, { color: outlookColor }]}>
              {analysis.outlook || "ТОДОРХОЙГҮЙ"}
            </Text>
            <Text style={[styles.outcomeSubtitle, { color: colors.textSecondary }]}>
              Зах зээлийн үндсэн хандлага
            </Text>
          </View>

          {/* 2. Market Sentiment */}
          {analysis.market_sentiment && (
            <View style={styles.sentimentCard}>
               <View style={styles.cardHeaderRow}>
                  <View style={[styles.indicatorDot, { backgroundColor: colors.secondary }]} />
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>ЭРСДЭЛИЙН ТӨЛӨВ</Text>
               </View>
               <Text style={styles.sentimentText}>
                 {analysis.market_sentiment}
               </Text>
            </View>
          )}
          
          {/* 3. Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.cardHeaderRow}>
               <Text style={[styles.cardTitle, { color: colors.primary }]}>ЗАХ ЗЭЭЛИЙН ТОЙМ</Text>
            </View>
            <Text style={styles.insightSummary}>
              {analysis.summary || "AI дүгнэлт хийгдэж байна..."}
            </Text>
          </View>

          {/* 4. Forecast */}
          {analysis.forecast && (
            <View style={styles.forecastCard}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 8 }]}>ТААМАГЛАЛ (24H)</Text>
              <Text style={styles.analysisText}>
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
                  <Text style={[styles.analysisText, styles.analysisTextCompact, { flex: 1 }]}>{risk}</Text>
                </View>
              ))}
            </View>
          )}
          
          {analysis.weekly_analysis && analysis.weekly_analysis.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>ОНЦЛОХ МЭДЭЭНҮҮД</Text>
              {(analysis.weekly_analysis as any[]).map((item: any, index: number) => (
                <View key={index} style={styles.analysisCard}>
                  <View style={styles.analysisHeader}>
                    <Text style={[styles.analysisTitle, { color: colors.textPrimary, flex: 1, marginRight: 8 }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.impactDate, { fontSize: 12, color: colors.textSecondary }]}>
                      {item.date.replace('T', ' ').substring(0, 16)}
                    </Text>
                  </View>
                  <Text style={styles.analysisText}>{item.impact_analysis}</Text>
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
        <Text style={styles.headerTitle}>{UI_COPY.news.headerTitle.toUpperCase()}</Text>
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
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
              }
              ListEmptyComponent={
                <Text style={styles.emptyText}>{UI_COPY.news.emptyUpcoming}</Text>
              }
              stickySectionHeadersEnabled={true}
            />
          )}

          {activeTab === 'history' && (
            <SectionList
              sections={groupNewsByDate(majorImpacts)}
              keyExtractor={(item, index) => `${item.id || item.title || 'past'}-${index}`}
              renderItem={renderPastNewsItem}
              renderSectionHeader={renderSectionHeader}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
              }
              ListEmptyComponent={
                <Text style={styles.emptyText}>{UI_COPY.news.emptyHistory}</Text>
              }
              stickySectionHeadersEnabled={true}
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
  impactDate: {
    fontSize: 12,
    color: colors.textSecondary,
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
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
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
    borderColor: colors.border,
    backgroundColor: colors.card,
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
    textAlign: 'justify',
    color: colors.textSecondary,
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
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  insightSummary: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
    textAlign: 'justify',
    color: colors.textSecondary,
  },
  forecastCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    borderColor: colors.border,
    backgroundColor: colors.card,
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
    borderColor: colors.border,
    backgroundColor: colors.card,
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
    color: colors.textSecondary,
    textAlign: 'justify',
  },
  analysisTextCompact: {
    marginBottom: 0,
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
    flex: 1,
    textAlign: 'center',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
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
