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

const ExercisePageCard = ({ exercises, page, book, onPress }) => {
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
      reference_id: exercise.videoId || exercise.id,
    });

    console.log('🎯 Navigation vers l\'exercice depuis ExercisePageCard:', exercise.title);
    console.log('🔗 ID de l\'exercice:', exercise.videoId || exercise.id);

    // Naviguer vers l'écran Video avec les données de l'exercice
    navigation.navigate("Video", {
      exerciseData: {
        id: exercise.videoId || exercise.id,
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

    return (
      <TouchableOpacity
        key={exercise.videoId || exercise.id}
        style={[styles.exerciseItem, index === exercises.length - 1 && styles.lastItem]}
        onPress={() => handleExercisePress(exercise)}
        activeOpacity={0.8}
      >
        <View style={styles.exerciseContent}>
          {/* Thumbnail avec style amélioré */}
          <View style={styles.thumbnailContainer}>
            {thumbnailUrl ? (
              <Image
                source={{ uri: thumbnailUrl }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.thumbnailPlaceholder}>
                <Ionicons name="play-circle" size={28} color="#fff" />
              </View>
            )}
            {/* Badge de lecture */}
            <View style={styles.playBadge}>
              <Ionicons name="play" size={12} color="#fff" />
            </View>
          </View>

          {/* Informations de l'exercice avec layout amélioré */}
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseTitle} numberOfLines={2}>
              {exercise.title || 'تمرين بدون عنوان'}
            </Text>

            {/* Badge du numéro d'exercice */}
            {exercise.numero && (
              <View style={styles.exerciseNumberBadge}>
                <Text style={styles.exerciseNumberText}>تمرين {exercise.numero}</Text>
              </View>
            )}

            {/* Informations sur le professeur avec style moderne */}
            {exercise.teacher && exercise.teacher.full_name && (
              <View style={styles.teacherContainer}>
                <View style={styles.teacherAvatar}>
                  <Text style={styles.teacherInitials}>
                    {getTeacherInitials(exercise.teacher.full_name)}
                  </Text>
                </View>
                <View style={styles.teacherInfo}>
                  <Text style={styles.teacherLabel}>الأستاذ:</Text>
                  <Text style={styles.teacherName} numberOfLines={1}>
                    {exercise.teacher.full_name}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Bouton d'action avec style moderne */}
          <View style={styles.actionContainer}>
            <View style={styles.actionButton}>
              <Ionicons name="play" size={18} color="#0097A7" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header avec informations de la page */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="document-text" size={24} color="#0097A7" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>
              تمارين الصفحة {page}
            </Text>
            <Text style={styles.subtitle}>
              {book && `من كتاب ${book} • `}
              {exercises.length} تمرين متاح
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
    borderColor: '#e8f4f8',
    maxHeight: 400,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8f4f8',
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
    backgroundColor: '#f8f9fa',
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
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  lastItem: {
    marginBottom: 0,
  },
  exerciseContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  thumbnailContainer: {
    width: 60,
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
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
  playBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 151, 167, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
    paddingRight: 8,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    textAlign: 'right',
    marginBottom: 8,
    lineHeight: 22,
  },
  exerciseNumberBadge: {
    alignSelf: 'flex-end',
    backgroundColor: '#e6f7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  exerciseNumberText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0097A7',
    textAlign: 'right',
  },
  teacherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  teacherAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0097A7',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  teacherInitials: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  teacherInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  teacherLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'right',
    marginBottom: 2,
  },
  teacherName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1a202c',
    textAlign: 'right',
  },
  actionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#b3e5fc',
  },
});

export default ExercisePageCard;
