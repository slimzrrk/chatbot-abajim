import React, { useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  DeviceEventEmitter,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { logChildActivity } from '../services/activityLogger';

const { width } = Dimensions.get('window');

const ExerciseNavigationCard = ({ exercise, onPress, autoNavigate = false }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  if (!exercise) {
    return null;
  }

  const getInitials = (fullName) => {
    if (!fullName) return "؟";
    const names = fullName.trim().split(" ");
    return names.length >= 2
      ? (names[0][0] + names[1][0]).toUpperCase()
      : names[0].slice(0, 2).toUpperCase();
  };

  const handleExercisePress = () => {
    if (onPress) {
      onPress();
    }

    // Log l'activité
    logChildActivity({
      action_type: "video",
      reference_id: exercise.id,
    });

    console.log('🎯 Navigation vers l\'exercice depuis ExerciseNavigationCard:', exercise.title);
    console.log('🔗 ID de l\'exercice:', exercise.id);

    // Naviguer vers l'écran Video avec les données de l'exercice
    navigation.navigate("Video", {
      exerciseData: {
        id: exercise.id,
        title: exercise.title,
        video_url: exercise.videoUrl || exercise.video,
        video: exercise.videoUrl || exercise.video,
        teacher: exercise.teacher
      },
      isRecommendedExercise: true
    });
  };

  const handleTeacherPress = (e) => {
    e.stopPropagation();
    if (exercise.teacher?.id) {
      navigation.navigate("Teacher", { teacherId: exercise.teacher.id });
    }
  };

  // Écouter l'événement de fin d'audio pour la navigation automatique
  useEffect(() => {
    if (autoNavigate && exercise) {
      console.log('🎧 ExerciseNavigationCard: Écoute des événements audio pour:', exercise.title);

      const audioFinishedListener = (messageData) => {
        console.log('🎧 Événement audio terminé reçu:', messageData);

        // Vérifier si c'est pour un exercice avec navigation automatique
        if (messageData && messageData.action === 'NAVIGATE_TO_EXERCISE' && messageData.payload) {
          console.log('🚀 Navigation automatique déclenchée après audio pour:', messageData.payload.title);

          // Délai court pour s'assurer que l'interface est prête
          setTimeout(() => {
            handleExercisePress();
          }, 100);
        }
      };

      // S'abonner à l'événement
      const subscription = DeviceEventEmitter.addListener('audioFinished', audioFinishedListener);

      // Nettoyer l'abonnement
      return () => {
        console.log('🎧 Nettoyage de l\'écoute audio pour:', exercise.title);
        subscription.remove();
      };
    }
  }, [autoNavigate, exercise]);

  const getThumbnailUrl = () => {
    if (!exercise.thumbnail) return null;

    if (exercise.thumbnail.startsWith('http')) {
      return exercise.thumbnail;
    }

    return `https://www.abajim.com/${exercise.thumbnail.startsWith('/') ? exercise.thumbnail.slice(1) : exercise.thumbnail}`;
  };

  const getTeacherAvatarUrl = () => {
    if (!exercise.teacher?.avatar) return null;

    if (exercise.teacher.avatar.startsWith('http')) {
      return exercise.teacher.avatar;
    }

    return `https://www.abajim.com/${exercise.teacher.avatar.startsWith('/') ? exercise.teacher.avatar.slice(1) : exercise.teacher.avatar}`;
  };

  const getDifficultyColor = (score) => {
    if (!score) return '#6c757d';
    if (score >= 0.8) return '#28a745';
    if (score >= 0.6) return '#ffc107';
    return '#dc3545';
  };

  const getDifficultyText = (score) => {
    if (!score) return 'متوسط';
    if (score >= 0.8) return 'ممتاز';
    if (score >= 0.6) return 'جيد';
    return 'مبتدئ';
  };

  const thumbnailUrl = getThumbnailUrl();
  const teacherAvatarUrl = getTeacherAvatarUrl();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header avec icône et informations de base */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            {thumbnailUrl ? (
              <Image
                source={{ uri: thumbnailUrl }}
                style={styles.exerciseImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="play-circle" size={32} color="#fff" />
              </View>
            )}

            {/* Badge de page/numéro */}
            {(exercise.page || exercise.numero) && (
              <View style={styles.infoBadge}>
                <Text style={styles.infoText}>
                  {exercise.page && exercise.numero 
                    ? `ص${exercise.page} - ${exercise.numero}`
                    : exercise.page 
                      ? `ص${exercise.page}`
                      : `رقم ${exercise.numero}`
                  }
                </Text>
              </View>
            )}
          </View>

          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseTitle} numberOfLines={2}>
              {exercise.title || 'تمرين بدون عنوان'}
            </Text>

            <View style={styles.statsRow}>
              {exercise.manuel_name && (
                <View style={styles.statItem}>
                  <Ionicons name="book" size={14} color="#666" />
                  <Text style={styles.statText}>
                    {exercise.manuel_name}
                  </Text>
                </View>
              )}

              {exercise.page && (
                <View style={styles.statItem}>
                  <Ionicons name="document" size={14} color="#666" />
                  <Text style={styles.statText}>
                    صفحة {exercise.page}
                  </Text>
                </View>
              )}
            </View>

            {exercise.score && (
              <View style={[
                styles.difficultyBadge,
                { backgroundColor: getDifficultyColor(exercise.score) }
              ]}>
                <Text style={styles.difficultyText}>
                  {getDifficultyText(exercise.score)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Informations sur l'enseignant */}
        {exercise.teacher && (
          <TouchableOpacity
            style={styles.teacherContainer}
            onPress={handleTeacherPress}
            activeOpacity={0.7}
          >
            <View style={styles.teacherInfo}>
              {teacherAvatarUrl ? (
                <Image
                  source={{ uri: teacherAvatarUrl }}
                  style={styles.teacherAvatar}
                />
              ) : (
                <View style={styles.teacherAvatarPlaceholder}>
                  <Text style={styles.teacherInitials}>
                    {getInitials(exercise.teacher.name)}
                  </Text>
                </View>
              )}

              <View style={styles.teacherDetails}>
                <Text style={styles.teacherLabel}>الأستاذ:</Text>
                <Text style={styles.teacherName} numberOfLines={1}>
                  {exercise.teacher.name || 'مدرس غير معروف'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#0097A7" />
          </TouchableOpacity>
        )}

        {/* Bouton pour voir l'exercice */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleExercisePress}
          activeOpacity={0.8}
        >
          <Ionicons name="play-circle" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>
            بدء التمرين
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f2f5',
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 14,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0097A7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#007bff',
  },
  infoText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: 8,
    textAlign: 'right',
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    textAlign: 'right',
  },
  difficultyBadge: {
    alignSelf: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  teacherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  teacherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  teacherAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  teacherAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0097A7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  teacherInitials: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  teacherDetails: {
    flex: 1,
  },
  teacherLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'right',
  },
  teacherName: {
    fontSize: 14,
    color: '#0097A7',
    fontWeight: '600',
    textAlign: 'right',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0097A7',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#0097A7',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    marginTop: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginHorizontal: 10,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

export default ExerciseNavigationCard;
