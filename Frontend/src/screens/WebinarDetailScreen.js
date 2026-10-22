import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { fetchWebinarsByLevel } from "../reducers/auth/AuthAction";
import { Video } from "expo-av";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import API_BASE_URL from "../utils/Config";
import { logChildActivity } from "../services/activityLogger";

const WebinarDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const { webinarId } = route.params || {};
  const { webinars, isLoading, activeChild } = useSelector((state) => state.auth);

  const [expandedChapter, setExpandedChapter] = useState(null);
  const [activeTab, setActiveTab] = useState("content");
  const [quizzes, setQuizzes] = useState([]);
  const [webinarData, setWebinarData] = useState(null);
  const [isLoadingWebinar, setIsLoadingWebinar] = useState(false);
  const videoRefs = useRef({});

  const webinar = webinars.find((w) => w.id === webinarId) || webinarData;

  useEffect(() => {
    logChildActivity({
      action_type: "webinar",
      reference_id: webinarId,
    });

    // Si le webinaire n'est pas trouvé dans le store Redux, essayer de le récupérer depuis l'API
    if (!webinar && webinarId && !isLoadingWebinar) {
      console.log('🔍 Récupération du cours depuis l\'API:', webinarId);
      setIsLoadingWebinar(true);
      fetch(`${API_BASE_URL}/webinars/${webinarId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          if (data && data.id) {
            console.log('✅ Cours récupéré avec succès:', data.translations?.[0]?.title || data.slug);
            setWebinarData(data);
          } else {
            console.warn('⚠️ Webinaire non trouvé:', webinarId);
          }
        })
        .catch(error => {
          console.error('❌ Erreur lors de la récupération du webinaire:', error);
        })
        .finally(() => {
          setIsLoadingWebinar(false);
        });
    }

    // Fallback: récupérer tous les webinaires du niveau si nécessaire
    if (!webinar && activeChild?.level_id && !isLoading && !isLoadingWebinar) {
      dispatch(fetchWebinarsByLevel(activeChild.level_id));
    }
  }, [dispatch, webinar, activeChild, isLoading, webinarId, isLoadingWebinar]);

  // Supprimé: fetchWebinarById n'existe pas et n'est pas nécessaire
  // La logique de récupération est déjà gérée dans le premier useEffect

  useEffect(() => {
    if (webinarId) {
      fetch(`${API_BASE_URL}/quizzes?webinar_id=${webinarId}`)
        .then(response => response.json())
        .then(data => setQuizzes(data))
        .catch(err => {
          console.log("Erreur lors du chargement des quizzes", err);
          setQuizzes([]);
        });
    }
  }, [webinarId]);

  const getInitials = (fullName) => {
    if (!fullName) return "؟";
    const names = fullName.trim().split(" ");
    return names.length >= 2
      ? (names[0][0] + names[1][0]).toUpperCase()
      : names[0].slice(0, 2).toUpperCase();
  };

  const setupAudioForVideo = async (key) => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      const status = await videoRefs.current[key]?.getStatusAsync();
      if (status?.isLoaded) {
        await videoRefs.current[key].setIsMutedAsync(false);
        await videoRefs.current[key].setVolumeAsync(1.0);
      }
    } catch (error) {
      console.warn("🔇 Erreur audio chapitre:", error);
    }
  };

  const renderTeacherCard = () => {
    const teacher = webinar?.teacher;
    if (!teacher) return null;

    const avatar = teacher.avatar ? `https://www.abajim.com/${teacher.avatar}` : null;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate("Teacher", { teacherId: teacher.id })}
        style={styles.teacherCard}
        activeOpacity={0.9}
      >
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.teacherAvatar} />
        ) : (
          <View style={styles.initialsWrapper}>
            <Text style={styles.initialsText}>{getInitials(teacher.full_name)}</Text>
          </View>
        )}
        <View style={styles.teacherDetails}>
          <Text style={styles.teacherLabel}>المعلم 👨‍🏫</Text>
          <Text style={styles.teacherName}>{teacher.full_name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (!webinar || isLoadingWebinar) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0097A7" />
        <Text style={styles.loadingText}>جارٍ تحميل الدرس...</Text>
      </View>
    );
  }

  const chapters = webinar.chapters || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.headerContainer}>
        {webinar.image_cover ? (
          <Image
            source={{ uri: `https://www.abajim.com/${webinar.image_cover}` }}
            style={styles.headerImage}
            onError={(error) => console.warn('⚠️ Erreur de chargement d\'image:', error)}
          />
        ) : (
          <View style={[styles.headerImage, styles.headerImagePlaceholder]}>
            <Ionicons name="school" size={60} color="#0097A7" />
          </View>
        )}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-circle" size={36} color="#fff" />
        </TouchableOpacity>
        <View style={styles.overlayTitle}>
          <Text style={styles.headerTitle}>
            {webinar.translations?.[0]?.title || webinar.slug || "عنوان غير متوفر"}
          </Text>
        </View>
      </View>

      <View style={styles.teacherCardWrapper}>{renderTeacherCard()}</View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "quiz" && styles.activeTab]}
          onPress={() => setActiveTab("quiz")}
        >
          <Text style={styles.tabText}>تحدي مرح</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "documents" && styles.activeTab]}
          onPress={() => setActiveTab("documents")}
        >
          <Text style={styles.tabText}>الوثائق</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "content" && styles.activeTab]}
          onPress={() => setActiveTab("content")}
        >
          <Text style={styles.tabText}>المحتوى</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "content" && (
        chapters.length === 0 ? (
          <View style={styles.emptyState}>
            <Image source={require("../../assets/icons/no_content.png")} style={styles.emptyImage} />
            <Text style={styles.noVideoText}>🚫 لا يوجد محتوى متاح حاليا</Text>
          </View>
        ) : (
          chapters.map((chapter) => (
            <View key={chapter.id} style={styles.chapterContainer}>
              <TouchableOpacity
                style={styles.chapterHeader}
                onPress={() =>
                  setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)
                }
              >
                <Ionicons
                  name={expandedChapter === chapter.id ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#1F3B64"
                />
                <Text style={styles.chapterTitle}>
                  📘 {chapter?.files?.[0]?.translations?.[0]?.title || "فصل بدون عنوان"}
                </Text>
              </TouchableOpacity>

              {expandedChapter === chapter.id && (
                <View style={styles.videoContainer}>
                  {chapter.files?.filter(file => file.file_type === "video").length > 0 ? (
                    chapter.files
                      .filter(file => file.file_type === "video")
                      .map((file, index) => (
                        <View key={index} style={{ marginBottom: 20 }}>
                          <Video
                            ref={(el) => videoRefs.current[`${chapter.id}_${index}`] = el}
                            source={{ uri: file.file }}
                            style={styles.videoPlayer}
                            useNativeControls
                            resizeMode="contain"
                            shouldPlay
                            onLoad={() => setupAudioForVideo(`${chapter.id}_${index}`)}
                          />
                        </View>
                      ))
                  ) : (
                    <Text style={styles.noVideoText}>❌ لا يوجد فيديوهات لهذا الفصل</Text>
                  )}
                </View>
              )}
            </View>
          ))
        )
      )}

      {activeTab === "documents" && (
        <View style={styles.contentBox}>
          {chapters.flatMap(ch => ch.files || []).filter(f => f.file_type === "document").length > 0 ? (
            chapters
              .flatMap(ch => ch.files || [])
              .filter(file => file.file_type === "document")
              .map((file, idx) => (
                <Text key={idx} style={styles.documentText}>
                  📄 {file?.translations?.[0]?.title || "وثيقة بدون عنوان"}
                </Text>
              ))
          ) : (
            <>
              <Image source={require("../../assets/icons/no_files2.png")} style={styles.emptyIllustration} />
              <Text style={styles.noVideoText}>❌ لا توجد وثائق متاحة</Text>
            </>
          )}
        </View>
      )}

      {activeTab === "quiz" && (
        <View style={styles.contentBox}>
          {quizzes.length > 0 ? (
            quizzes.map((quiz) => (
              <TouchableOpacity
                key={quiz.id}
                onPress={() => navigation.navigate("QuizScreen", { quizId: quiz.id })}
                style={styles.quizCard}
              >
                <Text style={[styles.quizTitle, { textAlign: "right", writingDirection: "rtl" }]}>
                  🎯 {quiz.translations?.[0]?.title || quiz.title}
                </Text>
                <Text style={[styles.startQuiz, { textAlign: "right", writingDirection: "rtl" }]}>
                  ▶️ ابدأ الاختبار
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <>
              <Image source={require("../../assets/icons/no_quizz.png")} style={styles.emptyIllustration} />
              <Text style={[styles.noVideoText, { textAlign: "right", writingDirection: "rtl" }]}>🚀 لا يوجد تحديات متاحة بعد</Text>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#888" },
  headerContainer: { position: "relative" },
  headerImage: { width: "100%", height: 280, resizeMode: "cover" },
  headerImagePlaceholder: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center"
  },
  backButton: { position: "absolute", top: 45, left: 15, padding: 5, borderRadius: 5 },
  overlayTitle: { position: "absolute", top: 55, right: 20, backgroundColor: "rgba(255, 255, 255, 0.8)", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 30 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#1F3B64", textAlign: "center" },
  teacherCardWrapper: { paddingHorizontal: 16, marginTop: -75, zIndex: 20 },
  teacherCard: { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, elevation: 3 },
  teacherAvatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: "#0097A7" },
  initialsWrapper: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#0097A7", justifyContent: "center", alignItems: "center" },
  initialsText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
  teacherDetails: { flex: 1, marginHorizontal: 15 },
  teacherLabel: { fontSize: 12, color: "#999", textAlign: "right" },
  teacherName: { fontSize: 16, fontWeight: "bold", color: "#1F3B64", textAlign: "right" },
  tabsContainer: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "#0097A7", paddingVertical: 10 },
  tab: { paddingVertical: 10, paddingHorizontal: 20 },
  activeTab: { borderBottomWidth: 3, borderBottomColor: "white" },
  tabText: { color: "white", fontSize: 16, fontWeight: "bold" },
  chapterContainer: { width: "90%", alignSelf: "center", marginBottom: 5, marginTop: 20 },
  chapterHeader: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#E0E0E0", padding: 15, borderRadius: 10 },
  chapterTitle: { fontSize: 18, fontWeight: "bold", color: "#1F3B64", textAlign: "center", flex: 1 },
  videoContainer: { marginTop: 15 },
  videoPlayer: { width: "100%", height: 220, borderRadius: 10 },
  contentBox: { width: "90%", alignSelf: "center", backgroundColor: "#FFF", padding: 15, borderRadius: 10, elevation: 5, marginBottom: 15 },
  documentText: { fontSize: 16, color: "#333", textAlign: "right" },
  noVideoText: { textAlign: "center", color: "#888", marginTop: 10 },
  emptyIllustration: { width: 200, height: 200, alignSelf: "center", marginBottom: 10, resizeMode: "contain" },
  quizCard: { padding: 15, backgroundColor: "#E8F5E9", marginBottom: 10, borderRadius: 10 },
  quizTitle: { fontSize: 18, color: "#1F3B64", fontWeight: "bold" },
  startQuiz: { fontSize: 14, color: "#0097A7", marginTop: 5, textAlign: "right" },
});

export default WebinarDetailScreen;