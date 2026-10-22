import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { logChildActivity } from '../services/activityLogger';

const ExerciseSelectionCard = ({ exercises, onPress }) => {
  const navigation = useNavigation();

  if (!exercises || exercises.length === 0) {
    return null;
  }

  const handleExercisePress = (exercise) => {
    if (onPress) {
      onPress();
    }

    // Log l'activité
    logChildActivity({
      action_type: "video",
      reference_id: exercise.videoId,
    });

    console.log('🎯 Navigation vers l\'exercice depuis ExerciseSelectionCard:', exercise.title);
    console.log('🔗 ID de l\'exercice:', exercise.videoId);

    // Naviguer vers l'écran Video avec les données de l'exercice
    navigation.navigate("Video", {
      exerciseData: {
        id: exercise.videoId,
        title: exercise.title,
        video_url: exercise.videoUrl,
        video: exercise.videoUrl,
        teacher: exercise.teacher
      },
      isRecommendedExercise: true
    });
  };

  const getThumbnailUrl = (thumbnail) => {
    if (!thumbnail) return null;

    if (thumbnail.startsWith('http')) {
      return thumbnail;
    }

    return `https://www.abajim.com/${thumbnail.startsWith('/') ? thumbnail.slice(1) : thumbnail}`;
  };

  const getTeacherInitials = (fullName) => {
    if (!fullName) return "؟";
    const names = fullName.trim().split(" ");
    return names.length >= 2
      ? (names[0][0] + names[1][0]).toUpperCase()
      : names[0].slice(0, 2).toUpperCase();
  };

  const renderExerciseItem = (exercise, index) => {
    const thumbnailUrl = getThumbnailUrl(exercise.thumbnail);

    // Extraire le numéro d'exercice du titre ou utiliser numero
    const exerciseNumber = exercise.numero ||
      (exercise.title && exercise.title.match(/\d+/)) ?
      exercise.title.match(/\d+/)[0] : (index + 1);

    return (
      <TouchableOpacity
        key={exercise.videoId}
        style={[styles.exerciseItem, index === exercises.length - 1 && styles.lastItem]}
        onPress={() => handleExercisePress(exercise)}
        activeOpacity={0.8}
      >
        <View style={styles.exerciseContent}>
          {/* Thumbnail avec numéro d'exercice */}
          <View style={styles.thumbnailContainer}>
            {thumbnailUrl ? (
              <Image
                source={{ uri: thumbnailUrl }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.thumbnailPlaceholder}>
                <Ionicons name="play-circle" size={24} color="#fff" />
              </View>
            )}
            {/* Badge avec numéro d'exercice */}
            <View style={styles.exerciseNumberBadge}>
              <Text style={styles.exerciseNumberText}>{exerciseNumber}</Text>
            </View>
          </View>

          {/* Informations principales */}
          <View style={styles.exerciseInfo}>
            {/* Titre de l'exercice */}
            <View style={styles.titleRow}>
              <Text style={styles.exerciseTitle}>
                التمرين {exerciseNumber}
              </Text>
              <View style={styles.playIconContainer}>
                <Ionicons name="play" size={16} color="#0097A7" />
              </View>
            </View>

            {/* Informations sur la page */}
            {exercise.page && (
              <View style={styles.pageInfo}>
                <Text style={styles.pageLabel}>صفحة</Text>
                <Text style={styles.pageNumber}>{exercise.page}</Text>
              </View>
            )}

            {/* Nom du manuel/matière */}
            {exercise.manuelName && (
              <Text style={styles.subjectName} numberOfLines={1}>
                {exercise.manuelName}
              </Text>
            )}

            {/* Informations sur le professeur */}
            {exercise.teacher && exercise.teacher.full_name && (
              <View style={styles.teacherRow}>
                <View style={styles.teacherAvatar}>
                  <Text style={styles.teacherInitials}>
                    {getTeacherInitials(exercise.teacher.full_name)}
                  </Text>
                </View>
                <Text style={styles.teacherName} numberOfLines={1}>
                  الأستاذ {exercise.teacher.full_name}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="list" size={24} color="#0097A7" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>التمارين المتاحة</Text>
            <Text style={styles.subtitle}>
              تم العثور على {exercises.length} تمرين. اختر التمرين المطلوب:
            </Text>
          </View>
        </View>

        {/* Liste des exercices */}
        <ScrollView 
          style={styles.exercisesList}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {exercises.map((exercise, index) => renderExerciseItem(exercise, index))}
        </ScrollView>
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
    maxHeight: 400, // Limiter la hauteur pour éviter que la carte soit trop grande
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e6f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a202c',
    textAlign: 'right',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    lineHeight: 20,
  },
  exercisesList: {
    maxHeight: 280,
  },
  exerciseItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lastItem: {
    marginBottom: 0,
  },
  exerciseContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
    position: 'relative',
    backgroundColor: '#f8f9fa',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0097A7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseNumberBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#0097A7',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  exerciseNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  exerciseInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  exerciseTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a202c',
    textAlign: 'right',
    flex: 1,
  },
  playIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e6f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  pageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  pageLabel: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  pageNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0097A7',
    backgroundColor: '#e6f7ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  subjectName: {
    fontSize: 13,
    color: '#666',
    textAlign: 'right',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  teacherAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0097A7',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  teacherInitials: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  teacherName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a202c',
    textAlign: 'right',
    flex: 1,
  },
});

export default ExerciseSelectionCard;
