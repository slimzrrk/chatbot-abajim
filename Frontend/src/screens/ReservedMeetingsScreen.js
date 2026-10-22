import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { fetchReservationsByUserId } from "../reducers/auth/AuthAction";
import BottomNavigation from "../components/BottomNavigation";
import ChatBubbleWrapper from "../components/ChatBubbleWrapper";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const badgeColors = {
  "العربية": "#FF9800",
  "الرياضيات": "#4CAF50",
  "الإيقاظ العلمي": "#03A9F4",
  "الفرنسية": "#673AB7",
  "المواد الاجتماعية": "#795548",
  "الإنجليزية": "#3F51B5",
};

const getBadgeColor = (materialName) => badgeColors[materialName] || "#0097A7";

const getInitials = (fullName) => {
  if (!fullName) return "؟";
  const names = fullName.trim().split(" ");
  return names.length >= 2
    ? (names[0][0] + names[1][0]).toUpperCase()
    : names[0].slice(0, 2).toUpperCase();
};

const ReservedMeetingsScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { reservations, loadingReservations } = useSelector((state) => state.auth);
  const [expandedItems, setExpandedItems] = useState({});

  const fetchReservations = useCallback(async () => {
    const userId = await AsyncStorage.getItem("activeChildId");
    if (userId) {
      dispatch(fetchReservationsByUserId(userId));
    }
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      fetchReservations();
    }, [fetchReservations])
  );

  const validReservations = reservations ? reservations.filter(item => item && item.meeting) : [];

  const toggleExpand = (id) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const renderReservation = ({ item }) => {
    const times = item.meeting.times || [];
    const reservedSession = times.find(session => session.id === item.meeting_time_id);
    if (!reservedSession) return null;

    const isExpanded = expandedItems[item.id] || false;

    return (
      <View style={styles.webinarCard}>
        <View style={styles.headerRow}>
          {reservedSession?.material && (
            <View style={[styles.badge, { backgroundColor: getBadgeColor(reservedSession.material.name) }]}>
              <Text style={styles.badgeText}>{reservedSession.material.name}</Text>
            </View>
          )}
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>{item.paid_amount} د.ت</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate("MeetingsDetails", {
            meetingId: item.meeting.id,
            isReserved: true,
            reservationId: item.id,
          })}
          style={styles.cardContent}
        >
          <View style={styles.row}>
            <View style={styles.avatarWrapper}>
              {item.meeting.teacher?.avatar ? (
                <Image
                  source={{ uri: `https://www.abajim.com/${item.meeting.teacher.avatar}` }}
                  style={styles.teacherAvatar}
                />
              ) : (
                <View style={styles.initialsCircle}>
                  <Text style={styles.initialsText}>{getInitials(item.meeting.teacher?.full_name)}</Text>
                </View>
              )}
            </View>

            <View style={styles.teacherInfo}>
              <Text style={styles.teacherName}>{item.meeting.teacher?.full_name || "غير متوفر"}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.accordionTitle}>📋 تفاصيل الحصة</Text>
          <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={24} color="#0097A7" />
        </TouchableOpacity>

        {isExpanded && reservedSession && (
          <View style={styles.sessionContainer}>
            <View style={styles.sessionCard}>
              <Text style={styles.sessionText}>المادة الفرعية : {reservedSession.submaterial?.name || "غير متوفر"}</Text>
              <Text style={styles.sessionText}>التاريخ : {reservedSession.meet_date ? new Date(reservedSession.meet_date * 1000).toLocaleDateString() : "غير متوفر"}</Text>
              <Text style={styles.sessionText}>من : {reservedSession.start_time ? new Date(reservedSession.start_time * 1000).toLocaleTimeString() : "غير متوفر"}</Text>
              <Text style={styles.sessionText}>إلى : {reservedSession.end_time ? new Date(reservedSession.end_time * 1000).toLocaleTimeString() : "غير متوفر"}</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBack}>
          <Ionicons name="arrow-back" size={30} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.title}>الحصص المحجوزة</Text>
      </View>

      {loadingReservations ? (
        <ActivityIndicator size="large" color="#0097A7" style={styles.loading} />
      ) : validReservations.length > 0 ? (
        <FlatList
          data={validReservations}
          renderItem={renderReservation}
          keyExtractor={(item) => (item && item.id ? item.id.toString() : Math.random().toString())}
          contentContainerStyle={styles.webinarsList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>لا توجد حصص محجوزة</Text>
        </View>
      )}
      <BottomNavigation />

      {/* ✅ Bulle de chat flottante */}
      <ChatBubbleWrapper />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F0F0" },
  header: {
    backgroundColor: "#0097A7",
    paddingHorizontal: 20,
    paddingVertical: 45,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: "center",
    position: "relative",
  },
  goBack: { position: "absolute", left: 20, top: 45 },
  title: { fontSize: 22, fontWeight: "bold", color: "#FFF", textAlign: "center" },
  webinarsList: { paddingBottom: 90 },
  webinarCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 10,
    marginHorizontal: 15,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  badge: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    backgroundColor: "#FF9800",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#FFD700", // 🎨 Doré
    shadowColor: "#FFD700", // 🎨 Ombre dorée
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6, // 🌟 Effet de profondeur
  },
  badgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
    textShadowColor: "rgba(0,0,0,0.2)", // 🕶️ Un peu d'ombre sur le texte
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  priceBadge: {
    backgroundColor: "#4CAF50",
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#A5D6A7", // 💎 Vert clair pour la bordure
    shadowColor: "#FFD700", // 🌟 Ombre légère verte
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6, // Android effet de profondeur
    alignSelf: "flex-start", // Très important pour ne pas étirer sur tout l'écran
  },
  priceBadgeText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 13,
    textShadowColor: "rgba(0,0,0,0.2)", // 🕶️ Une petite ombre sur le texte pour plus de lisibilité
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 2,
  },
  row: {
    alignItems: "center",
  },
  avatarWrapper: {
    marginBottom: 5,
  },
  teacherAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  initialsCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#0097A7",
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: { color: "#FFF", fontSize: 24, fontWeight: "bold" },
  teacherInfo: { alignItems: "center" },
  teacherName: { fontSize: 16, fontWeight: "bold", color: "#0097A7" },
  accordionHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  accordionTitle: { fontSize: 15, fontWeight: "bold", color: "#1f3b64" },
  sessionContainer: { marginTop: 8 },
  sessionCard: { backgroundColor: "#E0F7FA", padding: 8, borderRadius: 12 },
  sessionText: { fontSize: 13, color: "#333", textAlign: "right", marginBottom: 4 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#555",
    textAlign: "center",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ReservedMeetingsScreen;
