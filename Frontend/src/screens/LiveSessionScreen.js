import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from "react-redux";
import { fetchMeetingsByLevel } from "../reducers/auth/AuthAction";
import BottomNavigation from "../components/BottomNavigation";
import ChatBubbleWrapper from "../components/ChatBubbleWrapper";
import CartIcon from "../components/CartIcon";
import NotificationIcon from "../components/NotificationIcon";
import FavoriteIcon from "../components/FavoriteIcon";
import { logChildActivity } from "../services/activityLogger";

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
  return names.length >= 2 ? (names[0][0] + names[1][0]).toUpperCase() : names[0].slice(0, 2).toUpperCase();
};

const isPastSession = (session) => {
  const now = new Date().getTime() / 1000;
  return session.meet_date < now;
};

const LiveSessionsScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const children = useSelector((state) => state.auth.children);
  const activeChild = useSelector((state) => state.auth.activeChild) || children[0];
  const { meetings, loadingMeetings } = useSelector((state) => state.auth);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (activeChild?.level_id) {
      logChildActivity({
        action_type: "navigation",
        screen_name: "LiveSessionsScreen"
      });

      dispatch(fetchMeetingsByLevel(activeChild.level_id));
    }
  }, [activeChild, dispatch]);


  useFocusEffect(
    useCallback(() => {
      dispatch({ type: "RESET_RESERVATION_SUCCESS" });
    }, [dispatch])
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerBottom}>
        <Text style={styles.title}>الدروس المباشرة</Text>
        <View style={styles.headerIcons}>
          <CartIcon onPress={() => navigation.navigate("CartScreen")} />
          <FavoriteIcon onPress={() => navigation.navigate("Settings", { screen: "Favorites" })} />
          <NotificationIcon onPress={() => navigation.navigate("Settings", { screen: "Notifications" })} />
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {loadingMeetings ? (
        <ActivityIndicator size="large" color="#0097A7" style={styles.loading} />
      ) : meetings.length === 0 ? (
        <View style={{ flex: 1 }}>
          {renderHeader()}
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", marginTop: 50 }}>
            <Text style={{ fontSize: 18, color: "#999", writingDirection: "rtl" }}>
              لا توجد دروس مباشرة متاحة لهذا المستوى حالياً
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={meetings}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.webinarsList}
          ListHeaderComponent={renderHeader()}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                logChildActivity({
                  action_type: "meeting",
                  reference_id: item.id,
                });
                navigation.navigate("MeetingsDetails", { meetingId: item.id });
              }}

            >
              <View style={[
                styles.webinarCard,
                { backgroundColor: index % 2 === 0 ? "#f0e8f5" : "#e8f5e9" }
              ]}>
                <View style={styles.badgeContainer}>
                  {item.times[0]?.material && (
                    <View style={[styles.badgeMaterial, { backgroundColor: getBadgeColor(item.times[0].material.name) }]}>
                      <Text style={styles.badgeText}>{item.times[0].material.name}</Text>
                    </View>
                  )}
                  <View style={styles.badgePrice}>
                    <Text style={styles.badgeTextPrice}>{item.amount} د.ت</Text>
                  </View>
                </View>

                <View style={styles.row}>
                <TouchableOpacity
                  style={styles.avatarWrapper}
                  onPress={() => navigation.navigate("Teacher", { teacherId: item.teacher?.id })}
                >
                  {item.teacher?.avatar ? (
                    <Image
                      source={{ uri: `https://www.abajim.com/${item.teacher.avatar}` }}
                      style={styles.teacherAvatar}
                    />
                  ) : (
                    <View style={styles.initialsCircle}>
                      <Text style={styles.initialsText}>{getInitials(item.teacher?.full_name)}</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.teacherInfo}
                  onPress={() => navigation.navigate("Teacher", { teacherId: item.teacher?.id })}
                >
                  <Text style={styles.teacherName}>{item.teacher?.full_name || "غير متوفر"}</Text>
                </TouchableOpacity>
              </View>


                <View style={styles.sessionHeader}>
                  <Ionicons name="calendar" size={20} color="#34395e" />
                  <Text style={styles.webinarTitle}>عدد الحصص: {item.times.length}</Text>
                </View>

                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => setExpanded(expanded === item.id ? null : item.id)}
                >
                  <Text style={styles.accordionTitle}>📋 تفاصيل الحصص</Text>
                  <Ionicons name={expanded === item.id ? "chevron-up" : "chevron-down"} size={24} color="#0097A7" />
                </TouchableOpacity>

                {expanded === item.id && (
                  <ScrollView style={styles.sessionContainer}>
                    {item.times
                      .slice()
                      .sort((a, b) => a.meet_date - b.meet_date)
                      .map((time, index) => {
                        const isPast = isPastSession(time);
                        return (
                          <View key={index} style={styles.sessionCard}>
                            <View style={styles.sessionHeaderRow}>
                              <Text style={styles.sessionText}>
                                التاريخ : {new Date(time.meet_date * 1000).toLocaleDateString()}
                              </Text>
                              {isPast && (
                                <View style={styles.badgeCompleted}>
                                  <Text style={styles.badgeCompletedText}>مكتملة</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.sessionText}>من : {new Date(time.start_time * 1000).toLocaleTimeString()}</Text>
                            <Text style={styles.sessionText}>إلى : {new Date(time.end_time * 1000).toLocaleTimeString()}</Text>
                          </View>
                        );
                      })}
                  </ScrollView>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
      <BottomNavigation />

      {/* ✅ Bulle de chat flottante */}
      <ChatBubbleWrapper bottomOffset={20} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F0F0" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  webinarsList: { paddingBottom: 90 },
  header: { backgroundColor: "#0097A7", paddingHorizontal: 20, paddingVertical: 50, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: "center" },
  headerBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 10, marginTop: 15 },
  headerIcons: { flexDirection: "row-reverse", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", color: "#FFF", textAlign: "right" },
  webinarCard: { borderRadius: 20, padding: 15, marginHorizontal: 15, marginVertical: 10, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  badgeContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  badgeMaterial: { paddingVertical: 6, paddingHorizontal: 14, backgroundColor: "#FF9800", alignSelf: "flex-start", borderTopLeftRadius: 15, borderBottomLeftRadius: 15, elevation: 5, borderWidth: 1, borderColor: "#FFD700" },
  badgePrice: { paddingVertical: 6, paddingHorizontal: 14, backgroundColor: "#4CAF50", alignSelf: "flex-start", borderTopRightRadius: 15, borderBottomRightRadius: 15, elevation: 5, borderWidth: 1, borderColor: "#C8E6C9" },
  badgeText: { color: "#FFF", fontWeight: "bold", fontSize: 14, transform: [{ rotate: "7deg" }] },
  badgeTextPrice: { color: "#FFF", fontWeight: "bold", fontSize: 14, textAlign: "center" },
  row: { flexDirection: "column", alignItems: "center", marginBottom: 20 },
  avatarWrapper: { marginLeft: 10 },
  teacherAvatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 10 },
  initialsCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#0097A7", justifyContent: "center", alignItems: "center", marginBottom: 10 },
  initialsText: { color: "#FFF", fontSize: 30, fontWeight: "bold" },
  teacherInfo: { alignItems: "center", marginBottom: 15 },
  teacherName: { fontSize: 18, fontWeight: "bold", color: "#0097A7", textAlign: "center" },
  sessionHeader: { flexDirection: "row-reverse", alignItems: "center", marginBottom: 10 },
  webinarTitle: { fontSize: 16, fontWeight: "bold", marginVertical: 5, textAlign: "right", color: "#1d3b65" },
  accordionHeader: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  accordionTitle: { textAlign: "right", fontSize: 18, fontWeight: "bold", color: "#1f3b64" },
  sessionContainer: { marginTop: 10, paddingHorizontal: 10 },
  sessionCard: { backgroundColor: "#E0F7FA", padding: 10, borderRadius: 15, marginBottom: 10 },
  sessionText: { fontSize: 14, color: "#333", textAlign: "right" },
  badgeCompleted: { backgroundColor: "#e74c3c", paddingVertical: 3, paddingHorizontal: 10, borderRadius: 12 },
  badgeCompletedText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  sessionHeaderRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
});

export default LiveSessionsScreen;
