import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Modal,
  Animated,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchTeacherById, toggleFollow } from "../reducers/auth/AuthAction";
import { LinearGradient } from "expo-linear-gradient";

const LEVELS_MAP = {
  6: "الأولى ابتدائي",
  7: "الثانية ابتدائي",
  8: "الثالثة ابتدائي",
  9: "الرابعة ابتدائي",
  10: "الخامسة ابتدائي",
  11: "السادسة ابتدائي",
};

const getInitials = (fullName) => {
  if (!fullName) return "؟";
  const names = fullName.trim().split(" ");
  return names.length >= 2
    ? (names[0][0] + names[1][0]).toUpperCase()
    : names[0].slice(0, 2).toUpperCase();
};

const TeacherScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { teacherId } = route.params;

  const teacher = useSelector((state) => state.auth.teacherProfile);
  const loading = useSelector((state) => state.auth.isLoading);
  const isFollowing = useSelector((state) => state.auth.isFollowing);
  const followersCount = useSelector((state) => state.auth.followersCount);

  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  useEffect(() => {
    if (teacherId) dispatch(fetchTeacherById(teacherId));
  }, [teacherId]);

  const toggleFollowersModal = () => {
    setShowFollowersModal(!showFollowersModal);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: showFollowersModal ? 0 : 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: showFollowersModal ? 0.9 : 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  if (loading || !teacher) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00A3AD" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={["#00A3AD", "#005F73"]} style={styles.coverContainer}>
        {teacher.cover_img && (
          <Image
            source={{ uri: `https://www.abajim.com/${teacher.cover_img}` }}
            style={styles.coverImage}
          />
        )}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>👨‍🏫 الملف الشخصي للمعلم</Text>
      </LinearGradient>

      <View style={styles.profileContainer}>
        <Animated.View style={[styles.avatarContainer, { transform: [{ scale: scaleAnim }] }]}>
          {teacher.avatar ? (
            <Image source={{ uri: `https://www.abajim.com/${teacher.avatar}` }} style={styles.avatar} />
          ) : (
            <LinearGradient colors={["#00A3AD", "#005F73"]} style={styles.initialsCircle}>
              <Text style={styles.initialsText}>{getInitials(teacher.full_name)}</Text>
            </LinearGradient>
          )}
        </Animated.View>

        <View style={styles.followRow}>
          <TouchableOpacity
            onPress={() => dispatch(toggleFollow(teacher.id))}
            style={[styles.followButton, isFollowing && styles.unfollow]}
          >
            <Text style={styles.followButtonText}>{isFollowing ? "إلغاء المتابعة" : "➕ متابعة"}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleFollowersModal} style={styles.followerBox}>
            <Ionicons name="people" size={18} color="#00A3AD" />
            <Text style={styles.followerText}>{followersCount} متابع</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.name}>{teacher.full_name}</Text>
        <Text style={styles.bio}>{teacher.bio}</Text>
        <Text style={styles.about}>{teacher.about}</Text>
      </View>

      {/* Followers Modal */}
      <Modal visible={showFollowersModal} transparent animationType="none" onRequestClose={toggleFollowersModal}>
        <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}>
          <Animated.View style={[styles.modalContent, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>المتابعين</Text>
              <TouchableOpacity onPress={toggleFollowersModal}>
                <Ionicons name="close" size={24} color="#1F3B64" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={teacher.followers}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.followersList}
              renderItem={({ item }) => (
                <View style={styles.followerItem}>
                  <Image
                    source={{ uri: `https://www.abajim.com/${item.follower_user?.avatar}` }}
                    style={styles.followerAvatar}
                  />
                  <Text style={styles.followerName}>{item.follower_user?.full_name}</Text>
                </View>
              )}
            />
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Levels */}
      <Animated.View style={[styles.sectionCard, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.sectionTitle}>📚 المستويات التي يدرسها</Text>
        <View style={styles.levelsContainer}>
          {teacher.levels?.map((level) => (
            <View key={level.id} style={styles.levelBadge}>
              <Text style={styles.levelText}>{LEVELS_MAP[level.level_id] || `المستوى ${level.level_id}`}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Books */}
      <Animated.View style={[styles.sectionCard, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.sectionTitle}>📖 الكتب التي يستخدمها</Text>
        <View style={styles.booksContainer}>
          {teacher.matieres?.map((item) => (
            <View key={item.id} style={styles.bookCard}>
              <Text style={styles.bookText}>{item.manuel?.name}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Webinars */}
      <Animated.View style={[styles.sectionCard, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.sectionTitle}>📺 الدروس الإضافية المنشورة</Text>
        <FlatList
          data={teacher.webinars}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          inverted
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.videoList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.webinarCard}
              onPress={() => navigation.navigate("WebinarDetail", { webinarId: item.id })}
            >
              <Image source={{ uri: `https://www.abajim.com/${item.image_cover}` }} style={styles.webinarImage} />
              <Text style={styles.webinarTitle} numberOfLines={2}>
                {item.translations?.[0]?.title?.trim() || "عنوان غير متوفر"}
              </Text>
            </TouchableOpacity>
          )}
        />
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  coverContainer: {
    height: 160, // was 220
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: "hidden",
  },
  coverImage: { width: "100%", height: "100%", position: "absolute", opacity: 0.6 },
  backButton: { position: "absolute", top: 50, left: 20 },
  headerText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },  
  profileContainer: {
    alignItems: "center",
    paddingVertical: 20, // was 40 -> reduced
    backgroundColor: "#fff",
    borderRadius: 30,
    marginHorizontal: 15,
    marginTop: -20, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarContainer: {
    marginTop: -60, 
  },
  avatar: { width: 110, height: 110, borderRadius: 65, borderWidth: 5, borderColor: "#fff" },
  initialsCircle: { width: 110, height: 110, borderRadius: 65, justifyContent: "center", alignItems: "center", borderWidth: 5, borderColor: "#fff" },
  initialsText: { color: "#fff", fontWeight: "800", fontSize: 36 },
  followRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 25 },
  followButton: { backgroundColor: "#00A3AD", paddingVertical: 12, paddingHorizontal: 30, borderRadius: 30 },
  unfollow: { backgroundColor: "#6B7280" },
  followButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  followerBox: { flexDirection: "row-reverse", alignItems: "center", paddingHorizontal: 25, paddingVertical: 14, borderRadius: 50, backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#00A3AD" },
  followerText: { marginRight: 10, fontSize: 15, fontWeight: "700", color: "#1F3B64" },
  name: { fontSize: 20, fontWeight: "800", color: "#1F3B64", marginTop: 20, textAlign: "right" },
  bio: { fontSize: 16, color: "#6B7280", marginTop: 10, textAlign: "center", paddingHorizontal: 25 },
  about: { fontSize: 14, color: "#4B5563", marginTop: 15, textAlign: "center", paddingHorizontal: 25 },
  sectionCard: { backgroundColor: "#fff", marginHorizontal: 15, marginTop: 25, borderRadius: 25, padding: 25 },
  sectionTitle: { fontSize: 22, fontWeight: "800", color: "#1F3B64", marginBottom: 20, textAlign: "right" },
  levelsContainer: { flexDirection: "row-reverse", flexWrap: "wrap" },
  levelBadge: { backgroundColor: "#00A3AD", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, margin: 5 },
  levelText: { color: "#fff", fontSize: 14, fontWeight: "600", textAlign: "center" },
  booksContainer: { flexDirection: "row-reverse", flexWrap: "wrap" },
  bookCard: { backgroundColor: "#F1F5F9", padding: 14, borderRadius: 20, margin: 6 },
  bookText: { fontSize: 14, color: "#1F3B64", fontWeight: "600", textAlign: "right" },
  videoList: { paddingVertical: 15 },
  webinarCard: { marginLeft: 20, width: 180, backgroundColor: "#fff", borderRadius: 20 },
  webinarImage: { width: 180, height: 110, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  webinarTitle: { fontSize: 14, color: "#1F3B64", margin: 12, textAlign: "center", fontWeight: "600" },
  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", borderRadius: 30, width: "90%", maxHeight: "80%", paddingVertical: 20, paddingHorizontal: 15 },
  modalHeader: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  modalTitle: { fontSize: 24, fontWeight: "900", color: "#1F3B64", textAlign: "right" },
  followersList: { paddingBottom: 20, backgroundColor: "#F9FAFB", borderRadius: 15, padding: 10 },
  followerItem: { flexDirection: "row-reverse", alignItems: "center", paddingVertical: 12, backgroundColor: "#fff", borderRadius: 12, marginVertical: 6 },
  followerAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12, backgroundColor: "#eee" },
  followerName: { fontSize: 16, color: "#1F3B64", fontWeight: "700", flex: 1, textAlign: "right", marginRight:15 },
});

export default TeacherScreen;
