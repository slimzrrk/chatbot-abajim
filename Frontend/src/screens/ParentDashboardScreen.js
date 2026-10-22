import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { fetchDashboardKpi } from '../reducers/auth/AuthAction';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { logChildActivity } from '../services/activityLogger';

const screenWidth = Dimensions.get('window').width;

const COLORS = {
  primary: '#0097A7',
  secondary: '#E0F7FA',
  background: '#F0F4F8',
  textPrimary: '#FFFFFF',
  textSecondary: '#546E7A',
  success: '#4CAF50',
  cardShadow: '#0000001A',
};

const SIZES = {
  padding: 16,
  borderRadius: 12,
  fontLarge: 24,
  fontMedium: 18,
  fontRegular: 14,
};
const getScreenLabelInArabic = (screen) => {
  switch (screen) {
    case "ParentDashboardScreen":
      return "📊 صفحة نشاط الطفل الأسبوعي ";
    case "BooksScreen":
      return "📘 صفحة الكتب المدرسية";
    case "WebinarsScreen":
      return "🎓 صفحة الدروس الإضافية";
    case "MeetingsScreen":
    case "MeetingsDetailsScreen":
    case "LiveSessionScreen":
      return "📡 صفحة الدروس المباشرة";
    case "CartScreen":
      return "🛒 سلة المشتريات";
    case "FavoritesScreen":
      return "❤️ الدروس المفضلة";
    case "KidsListScreen":
      return "👨‍👩‍👧‍👦 قائمة الأطفال";
    case "SettingsScreen":
      return "⚙️ الإعدادات";
    case "DocumentScreen":
      return "📄 عرض الكتاب";
    case "NotificationsScreen":
      return "🔔 الإشعارات";
    case "QuizScreen":
      return "📝 صفحة التحديات المرحة";
    case "TeacherScreen":
      return "👨‍🏫 صفحة المعلم";
    case "RechargeWalletScreen":
      return "💳 شحن المحفظة";
    case "ReservedMeetingsScreen":
      return "📅 الدروس المباشرة المحجوزة";
    case "SignInScreen":
      return "🔐 تسجيل الدخول";
    case "SignUpScreen":
      return "🆕 إنشاء حساب";
    case "SubscriptionScreen":
      return "📦 الاشتراك";
    case "ParentInfoScreen":
      return "🧑‍💼 معلومات الولي";
    case "VerificationScreen":
      return "📧 تأكيد الحساب";
    case "forgetPasswordScreen":
      return "🔑 استرجاع كلمة المرور";
    default:
      return "📱 شاشة غير معروفة";
  }
};

const ParentDashboardScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [isActivityVisible, setIsActivityVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStatType, setSelectedStatType] = useState(null);

  const childId = useSelector(state => state.auth.activeChild?.id);
  const child = useSelector(state => state.auth.activeChild);
  const data = useSelector(state => state.auth.dashboardKpi);

  useEffect(() => {
    if (!childId) return;
    logChildActivity({ action_type: 'navigation', screen_name: 'ParentDashboardScreen' });
    setIsLoading(true);
    dispatch(fetchDashboardKpi(childId))
      .then(() => setIsLoading(false))
      .catch(() => {
        setError('فشل في تحميل البيانات. حاول مرة أخرى.');
        setIsLoading(false);
      });
  }, [childId, dispatch]);

  const handleStatPress = (type) => {
    setSelectedStatType(type);
    setModalVisible(true);
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => dispatch(fetchDashboardKpi(childId))} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading || !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[COLORS.primary, '#006064']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>نشاط الطفل الأسبوعي</Text>
      </LinearGradient>

      <View style={{ alignItems: "center", marginTop: 20 }}>
        <LinearGradient colors={[COLORS.primary, '#006064']} style={{ width: "90%", padding: 30, borderRadius: 16 }}>
          <Text style={{ color: "#FFF", fontSize: 18, fontWeight: "600", textAlign: "right" }}>{child?.full_name} : الطفل 👤</Text>
          <Text style={{ color: "#FFF", fontSize: 14, textAlign: "right", marginTop: 10 }}>تم تحميل الإحصائيات بنجاح ✅</Text>
        </LinearGradient>
      </View>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryText}>ملخص: كان طفلك نشطًا بشكل رئيسي في مشاهدة الفيديوهات هذا الأسبوع بنسبة إتمام {data.video_completion_rate}%.</Text>
      </View>

      <View style={styles.cardRow}>
        <StatCard label="عدد الفيديوهات المشاهدة" value={data.total_videos} icon="videocam" onPress={() => handleStatPress('videos')} />
        <StatCard label="الكتب المفتوحة" value={data.total_books} icon="book" onPress={() => handleStatPress('books')} />
        <StatCard label="الدروس الإضافية" value={data.total_webinars} icon="tv" onPress={() => handleStatPress('webinars')} />
        <StatCard label="الدروس المباشرة" value={data.total_meetings} icon="people" onPress={() => handleStatPress('meetings')} />
      </View>

      <View style={styles.metricsBox}>
        <MetricItem label="⏱️ مدة الاستخدام الكلي" value={`${data.total_minutes} دقيقة`} />
        <MetricItem label="📈 الأيام النشطة هذا الأسبوع" value={data.days_active_this_week} />
        <MetricItem label="🕒 المدة المتوسطة للجلسة" value={`${data.average_session_duration} ثانية`} />
        <MetricItem label="📈 نسبة إتمام الفيديوهات" value={`${data.video_completion_rate}%`} />
        <MetricItem label="🕵️‍♂️ آخر نشاط" value={formatDate(data.most_recent_activity)} />
      </View>

      {data.daily_activity?.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>📊 النشاط خلال الأسبوع</Text>
          <LineChart
            data={{
              labels: data.daily_activity.map(item => item.day),
              datasets: [{ data: data.daily_activity.map(item => parseInt(item.actions) || 0) }],
            }}
            width={screenWidth - 32}
            height={260}
            chartConfig={{
              backgroundGradientFrom: COLORS.secondary,
              backgroundGradientTo: '#B3E5FC',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(2, 136, 209, ${opacity})`,
              labelColor: () => COLORS.textPrimary,
              propsForDots: { r: '6', strokeWidth: '2', stroke: COLORS.primary },
              fillShadowGradient: COLORS.primary,
              fillShadowGradientOpacity: 0.3,
            }}
            bezier
            style={styles.chart}
            withShadow
            withInnerLines={false}
          />
        </View>
      )}

      <TouchableOpacity style={styles.sectionHeader} onPress={() => setIsActivityVisible(!isActivityVisible)}>
        <Text style={styles.sectionTitle}>📝 الأنشطة الأخيرة</Text>
        <Ionicons name={isActivityVisible ? 'chevron-up' : 'chevron-down'} size={32} color="#1F3B64" />
      </TouchableOpacity>

      {isActivityVisible && (
        <View>
          {data.navigation?.slice(0, 5).map((item, i) => (
            <ActivityItem key={`nav-${i}`} text={`• تنقل إلى: ${getScreenLabelInArabic(item.screen_name)}`} />
          ))}
          {data.books?.slice(0, 3).map((item, i) => (
            <ActivityItem key={`book-${i}`} text={`📖 فتح كتاب: ${item.book_title || "غير معروف"}`} />
          ))}
          {data.webinars?.slice(0, 3).map((item, i) => (
            <ActivityItem key={`webinar-${i}`} text={`🎓 درس إضافي: ${item.webinar_title || "غير معروف"}`} />
          ))}
          {data.meetings?.slice(0, 3).map((item, i) => (
            <ActivityItem key={`meeting-${i}`} text={`📡 لقاء مباشر: ${item.meeting_title || "غير معروف"}`} />
          ))}
        </View>
      )}

      {modalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedStatType === 'videos' && '📺 الفيديوهات التي شاهدها الطفل'}
              {selectedStatType === 'books' && '📘 الكتب التي فتحها الطفل'}
              {selectedStatType === 'webinars' && '🎓 الدروس الإضافية التي تابعها الطفل'}
              {selectedStatType === 'meetings' && '📡 الدروس المباشرة التي انضم إليها الطفل'}
            </Text>

            <ScrollView style={{ maxHeight: 200 }}>
              {(data[selectedStatType] || [])
                .filter(item => {
                  if (selectedStatType === "books") return !!item.book_title;
                  if (selectedStatType === "webinars") return !!item.webinar_title;
                  if (selectedStatType === "meetings") return !!item.meeting_title;
                  if (selectedStatType === "videos") return !!item.video_title;
                  return true;
                })
                .map((item, index) => {
                  let label = "—";
                  if (selectedStatType === "books") {
                    label = item.book_title;
                  } else if (selectedStatType === "webinars") {
                    label = item.webinar_title;
                  } else if (selectedStatType === "meetings") {
                    label = item.meeting_title;
                  } else if (selectedStatType === "videos") {
                    label = item.video_title;
                  }

                  return (
                    <Text key={`${item.reference_id}-${item.created_at}-${index}`} style={styles.modalItemText}>
                      • {label}
                    </Text>
                  );
                })}
            </ScrollView>

            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const StatCard = ({ label, value, icon, onPress }) => (
  <TouchableOpacity activeOpacity={0.8} style={styles.card} onPress={onPress}>
    <Ionicons name={icon} size={28} color={COLORS.primary} style={styles.cardIcon} />
    <Text style={styles.cardValue}>{value}</Text>
    <Text style={styles.cardLabel}>{label}</Text>
  </TouchableOpacity>
);

const MetricItem = ({ label, value }) => (
  <View style={styles.metricItem}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

const ActivityItem = ({ text }) => (
  <View style={styles.logItemContainer}>
    <Text style={styles.logItem}>{text}</Text>
  </View>
);

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-EG', { day: 'numeric', month: 'short', year: 'numeric' });
};
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: { position: 'absolute', left: 16, top: 60 },
  headerText: { color: COLORS.textPrimary, fontSize: 22, fontWeight: 'bold' },
  summaryBox: {
    backgroundColor: COLORS.success + '20',
    padding: SIZES.padding,
    borderRadius: SIZES.borderRadius,
    margin: 16,
  },
  summaryText: {
    fontSize: SIZES.fontRegular,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  cardRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    width: '48%',
    backgroundColor: COLORS.secondary,
    borderRadius: SIZES.borderRadius,
    padding: SIZES.padding,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cardIcon: { marginBottom: 8 },
  cardValue: { fontSize: 24, fontWeight: '700', color: COLORS.primary, textAlign: 'center' },
  cardLabel: { fontSize: SIZES.fontRegular, fontWeight: '500', color: COLORS.textSecondary, marginTop: 4, textAlign: 'center' },
  metricsBox: {
    backgroundColor: COLORS.secondary,
    padding: SIZES.padding,
    borderRadius: SIZES.borderRadius,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  metricItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  metricLabel: { fontSize: SIZES.fontRegular, fontWeight: '500', color: COLORS.textSecondary, flex: 1, textAlign: 'right' },
  metricValue: { fontSize: SIZES.fontRegular, fontWeight: '600', color: COLORS.primary, textAlign: 'right' },
  chart: { borderRadius: SIZES.borderRadius, marginVertical: 8, marginHorizontal: 16 },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 30,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: SIZES.fontMedium, fontWeight: '600', color: COLORS.primary, textAlign: 'right' },
  logItemContainer: { paddingVertical: 6, paddingHorizontal: 16 },
  logItem: { fontSize: SIZES.fontRegular, fontWeight: '400', color: COLORS.textSecondary, textAlign: 'right' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: SIZES.padding },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: SIZES.padding },
  errorText: { fontSize: SIZES.fontRegular, color: '#D32F2F', marginBottom: 16, textAlign: 'center' },
  retryButton: { backgroundColor: COLORS.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: SIZES.borderRadius },
  retryButtonText: { fontSize: SIZES.fontRegular, color: '#FFFFFF', fontWeight: '600' },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalContent: {
    width: '85%',
    maxHeight: '65%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    elevation: 10,
    justifyContent: 'flex-start',
  },  
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'right',
    color: '#1F3B64',
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
    marginVertical: 4,
  },
  modalCloseButton: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  
});

export default ParentDashboardScreen;
