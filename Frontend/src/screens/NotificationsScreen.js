import React, { useEffect } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, I18nManager, ActivityIndicator, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import BottomNavigation from "../components/BottomNavigation";
import { useSelector, useDispatch } from "react-redux";
import { fetchNotifications, markNotificationAsSeen,deleteNotification } from "../reducers/auth/AuthAction";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);


I18nManager.forceRTL(false);
I18nManager.allowRTL(false);

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const activeChild = useSelector((state) => state.auth.activeChild);
  const notifications = useSelector((state) => state.auth.notifications);
  const loading = useSelector((state) => state.auth.isLoading);
  const handleDeleteNotification = (notificationId) => {
    if (activeChild?.id) {
      dispatch(deleteNotification(activeChild.id, notificationId));
    }
  };
  useEffect(() => {
    if (activeChild?.id) {
      dispatch(fetchNotifications(activeChild.id));
    }
  }, [activeChild]);

  const handleNotificationClick = (item) => {
    if (!item.statuses?.length || !item.statuses[0].seen_at) {
      dispatch(markNotificationAsSeen(activeChild.id, item.id));
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleNotificationClick(item)} activeOpacity={0.7}>
      <View style={styles.notificationItem}>
  <Image source={require("../../assets/icons/notifications.png")} style={styles.notificationIcon} />

  <View style={styles.notificationTextContainer}>
    <Text style={styles.notificationText}>{item.message}</Text>
    <Text style={styles.notificationTime}>
  {item.created_at
    ? `${dayjs.unix(item.created_at).fromNow()} —`
    : "—"}{" "}
  {item.statuses?.[0]?.seen_at ? "✅ مقروء" : "🟢 جديد"}
</Text>
  </View>

  <TouchableOpacity onPress={() => handleDeleteNotification(item.id)} style={styles.deleteButton}>
    <Ionicons name="close-circle" size={24} color="#d32f2f" />
  </TouchableOpacity>
</View>

    </TouchableOpacity>
  );

  return (
    <View style={styles.pageContainer}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>الإشعارات</Text>
      </View>

      {/* SCROLLABLE CONTENT */}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#0097A7" style={{ marginTop: 50 }} />
        ) : notifications?.length === 0 ? (
          <Text style={styles.emptyText}>لا توجد إشعارات حالياً.</Text>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* BOTTOM NAVIGATION */}
      <BottomNavigation />
    </View>
  );
};

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0097A7",
    paddingVertical: 50,
    paddingHorizontal: 15,
    justifyContent: "center",
  },
  backButton: { position: "absolute", left: 15 },
  headerText: { fontSize: 20, fontWeight: "bold", color: "white" },
  content: {
    flex: 1, // ✅ Le contenu est scrollable
    paddingBottom: 100, // ✅ Pour laisser de la place pour le menu
  },
  listContainer: {
    padding: 20,
  },
  notificationItem: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 12,
    elevation: 2,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    marginLeft: 10,
  },
  notificationTextContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  notificationText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F3B64",
    textAlign: "right",
  },
  notificationTime: {
    fontSize: 14,
    color: "#666",
    textAlign: "right",
    marginTop: 4,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
  },
  deleteButton: {
    marginLeft: 8,
  },
  
});

export default NotificationsScreen;
