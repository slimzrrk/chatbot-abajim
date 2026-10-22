import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  FlatList,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Video } from "expo-av";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import {
  fetchCorrectionVideoUrl,
  toggleLikeVideo,
  toggleFollowSimple,
} from "../reducers/auth/AuthAction";
import { logChildActivity } from "../services/activityLogger";
import axios from "axios";
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const VideoScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const videoRef = useRef(null);

  const { url, exerciseData, isRecommendedExercise } = route.params || {};
  const [manuelId, setManuelId] = useState(null);
  const [icon, setIcon] = useState(null);
  const [page, setPage] = useState(null);
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const toggleFollowersModal = () => setShowFollowersModal((prev) => !prev);
  const activeChild = useSelector((state) => state.auth.activeChild);


  const isLiked = useSelector((state) =>
    videoData?.id ? state.auth.videoLikes?.[videoData.id] : false
  );

  const parseParamsFromUrl = () => {
    try {
      const id = url?.split("/panel/scolaire/")[1]?.split("?")[0];
      const iconValue = url?.split("icon=")[1]?.split("&")[0];
      const pageValue = url?.split("page=")[1];
      if (id && iconValue && pageValue) {
        setManuelId(parseInt(id));
        setIcon(parseInt(iconValue));
        setPage(parseInt(pageValue));
      }
    } catch (err) {
      console.error("❌ Erreur parsing URL :", err.message);
    }
  };

  useEffect(() => {
    if (url) {
      parseParamsFromUrl();
    } else if (isRecommendedExercise && exerciseData) {
      // Pour les exercices recommandés, utiliser directement les données
      loadRecommendedExercise();
    }
  }, [url, isRecommendedExercise, exerciseData]);

  const loadRecommendedExercise = async () => {
    try {
      console.log('🎯 Chargement exercice recommandé:', exerciseData);

      // Construire l'URL de la vidéo si elle n'est pas complète
      let videoUrl = exerciseData.video_url || exerciseData.video;

      if (videoUrl && !videoUrl.startsWith('http')) {
        videoUrl = `https://www.abajim.com/${videoUrl.startsWith('/') ? videoUrl.slice(1) : videoUrl}`;
      }

      setVideoData({
        id: exerciseData.id,
        url: videoUrl,
        title: exerciseData.title || exerciseData.titre || 'تمرين',
        views: exerciseData.vues || exerciseData.views || 0,
        likes: exerciseData.likes || 0,
        teacher: exerciseData.teacher || null,
      });

      // Enregistrer la vue pour l'exercice recommandé
      if (exerciseData.id && activeChild?.id) {
        await recordVideoView(exerciseData.id);
      }

      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur lors du chargement de l\'exercice recommandé:', error);
      setLoading(false);
    }
  };

  const loadVideo = async () => {
    if (manuelId && icon && page) {
      const response = await dispatch(fetchCorrectionVideoUrl(manuelId, icon, page, activeChild?.id));
      if (response?.payload && typeof response.payload === "object") {
        const payload = response.payload;
        setVideoData({
          id: payload.id,
          url: encodeURI(payload.videoUrl),
          title: payload.title,
          views: payload.views,
          likes: payload.likes,
          teacher: payload.teacher || null,
        });

        const followers = payload.teacher?.followers || [];
        const childId = response.meta?.childId;
        if (childId && followers.some((f) => f.follower_id === childId)) {
          setIsFollowing(true);
        } else {
          setIsFollowing(false);
        }
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isRecommendedExercise) {
      loadVideo();
    }
  }, [manuelId, icon, page, isRecommendedExercise]);

  // ⬇️ Enregistrement de l’activité pour le dashboard
  useEffect(() => {
    if (videoData?.url) {
      // Enregistrer l'activité pour le dashboard
      logChildActivity({
        action_type: "navigation",
        screen_name: "VideoScreen",
        metadata: {
          video_id: videoData.id,
          video_title: videoData.title,
        },
      });

      // Enregistrer la vue dans la table user_views
      recordVideoView(videoData.id);
    }
  }, [videoData?.url]);

  // Fonction pour enregistrer une vue
  const recordVideoView = async (videoId) => {
    try {
      if (!videoId || !activeChild?.id) return;

      // Récupérer le token d'authentification
      const token = await AsyncStorage.getItem('token');

      // Obtenir l'URL de l'API à partir des constantes Expo
      const API_URL = Constants.expoConfig?.extra?.BASE_URL || 'http://localhost:5001/api';

      // Extraire la base de l'URL (sans le /api à la fin si présent)
      const baseUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

      // Appeler l'API pour enregistrer la vue
      const response = await axios.post(`${baseUrl}/documents/record-view`, {
        videoId,
        userId: activeChild.id
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('✅ Vue enregistrée avec succès:', response.data);
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement de la vue:', error.message);
      // Afficher plus de détails sur l'erreur pour le débogage
      if (error.response) {
        // La requête a été faite et le serveur a répondu avec un code d'état
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        console.error('Headers:', error.response.headers);
      } else if (error.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        console.error('Request:', error.request);
      } else {
        // Une erreur s'est produite lors de la configuration de la requête
        console.error('Error message:', error.message);
      }
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });

        const video = videoRef.current;
        if (video) {
          const status = await video.getStatusAsync();
          if (status?.isLoaded && status?.isMuted) {
            await video.setIsMutedAsync(false);
          }
          await video.setVolumeAsync(1.0);
        } else {
          console.warn("⚠️ videoRef.current is null at audio setup");
        }
      } catch (error) {
        console.warn("🔇 Erreur lors de l'activation audio :", error);
      }
    })();
  }, [videoData?.url]);


  const handleToggleFollow = async () => {
    if (videoData?.teacher?.id) {
      await dispatch(toggleFollowSimple(videoData.teacher.id));
      await loadVideo();
    }
  };

  const handleToggleLike = async () => {
    if (!videoData?.id) return;
    const liked = await dispatch(toggleLikeVideo(videoData.id));
    setVideoData((prev) => ({
      ...prev,
      likes: liked ? prev.likes + 1 : prev.likes > 0 ? prev.likes - 1 : 0,
    }));
  };

  const navigateToTeacher = () => {
    if (videoData?.teacher?.id) {
      navigation.navigate("Teacher", { teacherId: videoData.teacher.id });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0097A7" />
        <Text style={styles.loadingText}>جاري تحميل الفيديو...</Text>
      </View>
    );
  }

  if (!videoData?.url) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🎬 إصلاح التمرين</Text>
          <View style={{ width: 28 }} />
        </View>
        <Text style={styles.errorText}>❌ لا يوجد فيديو متاح حالياً</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          🎬 إصلاح التمرين
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <Text style={styles.title}>{videoData.title}</Text>

      <Video
        ref={videoRef}
        source={{ uri: videoData.url }}
        style={styles.video}
        useNativeControls
        resizeMode="contain"
        shouldPlay
      />

      <View style={styles.infoContainer}>
        <View style={styles.stats}>
          <TouchableOpacity
            onPress={handleToggleLike}
            style={{
              flexDirection: "row-reverse",
              alignItems: "center",
              backgroundColor: isLiked ? "#ffe6e6" : "#f2f2f2",
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 30,
              borderWidth: 1,
              borderColor: isLiked ? "#e74c3c" : "#ccc",
              marginBottom: 10,
            }}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={22}
              color={isLiked ? "#e74c3c" : "#777"}
              style={{ marginLeft: 8 }}
            />
            <Text style={{ fontSize: 15, fontWeight: "600", color: isLiked ? "#e74c3c" : "#555" }}>
              {videoData.likes} إعجاب
            </Text>
          </TouchableOpacity>
        </View>

        {videoData.teacher && (
          <View style={styles.teacherSection}>
            <TouchableOpacity onPress={navigateToTeacher} style={{ alignItems: "center" }}>
              <Image
                source={{
                  uri: videoData.teacher.avatar
                    ? `https://www.abajim.com${videoData.teacher.avatar}`
                    : "https://www.abajim.com/default-avatar.png",
                }}
                style={styles.teacherAvatar}
              />
              <Text style={styles.teacherFullName}>{videoData.teacher.full_name}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.followButton} onPress={handleToggleFollow}>
              <Text style={styles.followText}>{isFollowing ? "✔️ إلغاء المتابعة" : "+ متابعة"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleFollowersModal} style={styles.followerRow}>
              <Ionicons name="people" size={20} color="#0097A7" />
              <Text style={styles.followerCount}>
                {videoData.teacher?.followers_count || videoData.teacher?.followers?.length || 0} متابع
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal visible={showFollowersModal} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>المتابعين</Text>
              <TouchableOpacity onPress={toggleFollowersModal}>
                <Ionicons name="close" size={24} color="#1F3B64" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={videoData.teacher?.followers || []}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.followerItem}>
                  <Image
                    source={{ uri: item.follower_user?.avatar
                      ? `https://www.abajim.com${item.follower_user.avatar}`
                      : "https://www.abajim.com/default-avatar.png" }}
                  style={styles.followerAvatar}
                  />
                  <Text style={styles.followerName}>{item.follower_user?.full_name}</Text>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#0097A7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: { fontSize: 20, color: "#FFF", fontWeight: "bold" },
  title: { fontSize: 20, fontWeight: "bold", color: "#1F3B64", textAlign: "center", marginTop: 55, marginBottom: 30 },
  video: { width, height: width * 0.5625, backgroundColor: "#000" },
  infoContainer: { padding: 20, backgroundColor: "#fff", alignItems: "center" },
  stats: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  loadingText: { marginTop: 10, fontSize: 16, color: "#0097A7" },
  errorText: { fontSize: 16, color: "red" },
  teacherSection: { alignItems: "center", justifyContent: "center", marginTop: 30, backgroundColor: "#F8FAFC", paddingVertical: 25, paddingHorizontal: 20, borderRadius: 20, width: "90%", alignSelf: "center", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  teacherAvatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 10 },
  teacherFullName: { fontSize: 18, fontWeight: "bold", color: "#1F3B64", marginBottom: 10 },
  followButton: { backgroundColor: "#0097A7", paddingVertical: 8, paddingHorizontal: 20, borderRadius: 30, marginBottom: 12 },
  followText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  followerRow: { flexDirection: "row-reverse", alignItems: "center" },
  followerCount: { fontSize: 15, color: "#1F3B64", marginRight: 8, fontWeight: "600" },
  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", borderRadius: 30, width: "90%", maxHeight: "80%", padding: 20 },
  modalHeader: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginBottom: 15 },
  modalTitle: { fontSize: 22, fontWeight: "900", color: "#1F3B64" },
  followerItem: { flexDirection: "row-reverse", alignItems: "center", marginBottom: 12 },
  followerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: "#eee", marginLeft: 10 },
  followerName: { fontSize: 16, color: "#1F3B64", fontWeight: "700", flex: 1, textAlign: "right" },
});

export default VideoScreen;