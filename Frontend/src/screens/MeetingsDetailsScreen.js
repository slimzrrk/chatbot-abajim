import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  I18nManager,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchMeetingById, reserveMeeting, addToCart } from "../reducers/auth/AuthAction";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logChildActivity } from "../services/activityLogger";
import ChatBubbleWrapper from "../components/ChatBubbleWrapper";

const getInitials = (fullName) => {
  if (!fullName) return "؟";
  const names = fullName.trim().split(" ");
  return names.length >= 2 ? (names[0][0] + names[1][0]).toUpperCase() : names[0].slice(0, 2).toUpperCase();
};

const MeetingDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const meetingId = route.params?.meetingId;

  const { meeting, loading } = useSelector((state) => state.auth);
  const [selectedSessions, setSelectedSessions] = useState([]);

  useEffect(() => {
    if (meetingId) {
      dispatch(fetchMeetingById(meetingId));
    }
  }, [meetingId, dispatch]);

  useEffect(() => {
    if (meetingId) {
      logChildActivity({
        action_type: "meeting",
        reference_id: meetingId,
      });
    }
  }, [meetingId]);

  const toggleSession = (sessionId) => {
    const session = meeting.times.find((t) => t.id === sessionId);
    if (!session) return;

    if (session.reserved_students >= session.max_students) {
      Alert.alert("تنبيه", "هذه الحصة ممتلئة بالكامل ولا يمكنك الحجز.");
      return;
    }

    if (selectedSessions.includes(sessionId)) {
      setSelectedSessions(selectedSessions.filter((id) => id !== sessionId));
    } else {
      setSelectedSessions([...selectedSessions, sessionId]);
    }
  };

  const isPastSession = (session) => {
    const now = new Date().getTime() / 1000;
    return session.meet_date < now;
  };

  const handleReserve = async () => {
    if (selectedSessions.length === 0) {
      Alert.alert("تنبيه", "يرجى اختيار حصة واحدة على الأقل للحجز.");
      return;
    }

    const tokenChild = await AsyncStorage.getItem("tokenChild");
    const activeChildId = await AsyncStorage.getItem("activeChildId");

    if (!tokenChild || !activeChildId) {
      Alert.alert("خطأ", "لم يتم العثور على معلومات الطفل.");
      return;
    }

    try {
      for (const sessionId of selectedSessions) {
        const session = meeting.times.find((t) => t.id === sessionId);
        const sessionPrice = meeting.amount / meeting.times.length;

        const payload = {
          meeting_id: meeting.id,
          user_id: parseInt(activeChildId),
          meeting_time_id: session.id,
          day: session.day_label,
          date: new Date(session.meet_date * 1000).toISOString().split("T")[0],
          start_at: new Date(session.start_time * 1000).toLocaleTimeString("en-US", { hour12: false }),
          end_at: new Date(session.end_time * 1000).toLocaleTimeString("en-US", { hour12: false }),
          student_count: 1,
          paid_amount: sessionPrice.toFixed(2),
          meeting_type: meeting.group_meeting ? "group" : "individual",
          discount: meeting.discount || 0,
          description: "Réservation session individuelle",
          status: "reserved",
          created_at: new Date().toISOString(),
          reserved_at: new Date().toISOString(),
          link: "",
          password: "",
        };

        await dispatch(reserveMeeting(payload, tokenChild));
      }

      await dispatch(fetchMeetingById(meeting.id));
      dispatch(addToCart({ reserve_meeting_id: meeting.id }));
      Alert.alert("نجاح", "تمت إضافة الحجز إلى السلة.");
      navigation.navigate("CartScreen");
    } catch (error) {
      if (error?.message?.includes("Session complète")) {
        Alert.alert("تنبيه", "هذه الحصة لم تعد متاحة.");
      } else {
        Alert.alert("خطأ", "حدث خطأ أثناء محاولة الحجز.");
      }
    }
  };

  if (loading || !meeting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0097A7" />
      </View>
    );
  }

  const sessionPrice = meeting.amount / meeting.times.length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
          <Ionicons name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"} size={32} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل الدرس المباشر</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.teacherProfile}>
            {meeting.teacher?.avatar ? (
              <Image source={{ uri: `https://www.abajim.com/${meeting.teacher.avatar}` }} style={styles.avatar} />
            ) : (
              <View style={styles.initialsCircle}>
                <Text style={styles.initialsText}>{getInitials(meeting.teacher?.full_name)}</Text>
              </View>
            )}
          </View>
          <Text style={styles.meetingTitle}>🔹 درس مع المعلم(ة): {meeting.teacher?.full_name || "غير متوفر"}</Text>
          <Text style={styles.priceText}>💰 السعر لكل حصة: {sessionPrice.toFixed(2)} د.ت</Text>

          <Text style={styles.sectionTitle}>📅 الحصص المتاحة :</Text>

          {[...meeting.times]
  .sort((a, b) => a.meet_date - b.meet_date)
  .filter((session, index, array) => {
    const now = new Date().getTime() / 1000;
    const isPast = session.meet_date < now;
    const pastSessionsBefore = array.slice(0, index).filter(s => s.meet_date < now).length;
    return !isPast || pastSessionsBefore >= 2;
  })
  .map((session) => {
    const sessionDate = new Date(session.meet_date * 1000);
    const sessionTimeStart = new Date(session.start_time * 1000);
    const sessionTimeEnd = new Date(session.end_time * 1000);
    const isPast = isPastSession(session);
    const progress = (session.reserved_students / session.max_students) * 100;

    return (
      <TouchableOpacity
        key={session.id}
        style={[styles.sessionCard, isPast && { backgroundColor: "#ddd" }]}
        disabled={isPast}
        onPress={() => toggleSession(session.id)}
      >
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionText}>📆 {sessionDate.toLocaleDateString()} - 🕒 {sessionTimeStart.toLocaleTimeString()} ➔ {sessionTimeEnd.toLocaleTimeString()}</Text>
          <Text style={styles.sessionText}>📚 {session.submaterial?.name || "بدون مادة فرعية"}</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}> {session.reserved_students || 0} / {session.max_students} طالب</Text>
        </View>
        {isPast ? (
          <View style={styles.badgeCompleted}>
            <Text style={styles.badgeText}>مكتمل</Text>
          </View>
        ) : (
          <Ionicons
            name={selectedSessions.includes(session.id) ? "checkbox" : "square-outline"}
            size={24}
            color={selectedSessions.includes(session.id) ? "#4CAF50" : "#aaa"}
          />
        )}
      </TouchableOpacity>
    );
  })}


          <TouchableOpacity style={styles.reserveButton} onPress={handleReserve}>
            <Ionicons name="cart" size={22} color="#fff" style={{ marginLeft: 8 }} />
            <Text style={styles.reserveButtonText}>إحجز الحصص المختارة</Text>
          </TouchableOpacity>
        </View>
      </View>

      
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { backgroundColor: "#0097A7", flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 40, paddingHorizontal: 10, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, position: "relative" },
  goBackButton: { position: "absolute", left: 15, top: 40 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "bold", textAlign: "center" },
  content: { paddingHorizontal: 15, marginTop: 15 },
  card: { backgroundColor: "#fff", borderRadius: 25, padding: 20, elevation: 5, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  teacherProfile: { alignItems: "center", marginBottom: 15 },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  initialsCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#0097A7", justifyContent: "center", alignItems: "center" },
  initialsText: { color: "#FFF", fontSize: 30, fontWeight: "bold" },
  meetingTitle: { fontSize: 18, fontWeight: "bold", color: "#1F3B64", marginBottom: 10, textAlign: "right" },
  priceText: { fontSize: 16, color: "#555", marginBottom: 20, textAlign: "right" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1F3B64", marginBottom: 10, textAlign: "right" },
  sessionCard: { flexDirection: "row-reverse", alignItems: "center", backgroundColor: "#E0F7FA", padding: 15, borderRadius: 15, marginBottom: 10, justifyContent: "space-between" },
  sessionInfo: { flex: 1 },
  sessionText: { fontSize: 14, color: "#333", textAlign: "right", marginBottom: 3 },
  badgeCompleted: { backgroundColor: "#D32F2F", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 15 },
  badgeText: { color: "#FFF", fontSize: 12, fontWeight: "bold" },
  reserveButton: { backgroundColor: "#1F3B64", flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", paddingVertical: 15, borderRadius: 30, marginTop: 20 },
  reserveButtonText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  progressBarContainer: { width: "100%", height: 8, backgroundColor: "#EEE", borderRadius: 10, marginTop: 5 },
  progressBar: { height: 8, backgroundColor: "#0097A7", borderRadius: 10 },
  progressText: { fontSize: 12, textAlign: "right", color: "#1F3B64", marginTop: 4 },
});

export default MeetingDetailsScreen;
