import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const ExerciseRecommendationCard = ({ exerciseData, onExercisePress }) => {
  const navigation = useNavigation();

  if (!exerciseData) {
    return null;
  }

  const handleExercisePress = () => {
    if (onExercisePress) {
      onExercisePress();
    }

    console.log('🎯 Navigation vers l\'exercice:', exerciseData.title || exerciseData.titre);
    console.log('🔗 URL de la vidéo:', exerciseData.video_url);

    // Naviguer directement vers la vidéo de l'exercice
    if (exerciseData.video_url) {
      navigation.navigate('Video', {
        exerciseData: exerciseData,
        isRecommendedExercise: true
      });
    } else {
      console.warn('⚠️ URL de vidéo manquante pour l\'exercice:', exerciseData);
    }
  };

  const getThumbnailUrl = () => {
    if (!exerciseData.thumbnail && !exerciseData.image) return null;

    const thumbnail = exerciseData.thumbnail || exerciseData.image;

    if (thumbnail.startsWith('http')) {
      return thumbnail;
    }

    return `https://www.abajim.com/${thumbnail.startsWith('/') ? thumbnail.slice(1) : thumbnail}`;
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'صعب': return '#dc3545';
      case 'متوسط': return '#ffc107';
      case 'سهل': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getDifficultyText = (difficulty) => {
    return difficulty || 'متوسط';
  };

  const formatDuration = (duration) => {
    if (!duration) return '0:00';

    // Si c'est déjà formaté (contient :)
    if (typeof duration === 'string' && duration.includes(':')) {
      return duration;
    }

    // Si c'est en secondes
    const seconds = parseInt(duration);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const thumbnailUrl = getThumbnailUrl();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header avec icône et informations de base */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <View style={styles.exerciseIcon}>
              <Ionicons name="play-circle" size={24} color="#fff" />
            </View>
          </View>

          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseTitle} numberOfLines={2}>
              {exerciseData.title || exerciseData.titre || 'تمرين بدون عنوان'}
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="eye" size={14} color="#666" />
                <Text style={styles.statText}>
                  {exerciseData.views || 0} مشاهدة
                </Text>
              </View>

              <View style={styles.statItem}>
                <Ionicons name="heart" size={14} color="#e74c3c" />
                <Text style={styles.statText}>
                  {exerciseData.likes || 0}%
                </Text>
              </View>
            </View>

            <View style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(exerciseData.difficulty) }
            ]}>
              <Text style={styles.difficultyText}>
                {getDifficultyText(exerciseData.difficulty)}
              </Text>
            </View>
          </View>
        </View>

        {/* Manuel et page */}
        {(exerciseData.manuel_name || exerciseData.page) && (
          <View style={styles.bookContainer}>
            <Ionicons name="book" size={16} color="#0097A7" />
            <Text style={styles.bookText}>
              {exerciseData.manuel_name && exerciseData.page
                ? `${exerciseData.manuel_name} - ص ${exerciseData.page}`
                : exerciseData.manuel_name || `الصفحة ${exerciseData.page}`
              }
            </Text>
          </View>
        )}

        {/* Enseignant */}
        {exerciseData.teacher_name && (
          <Text style={styles.teacherInfo} numberOfLines={1}>
            الأستاذ: {exerciseData.teacher_name}
          </Text>
        )}

        {/* Bouton pour voir l'exercice */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleExercisePress}
          activeOpacity={0.8}
        >
          <Ionicons name="play" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>
            مشاهدة التمرين
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
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  exerciseIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0097A7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f3c88',
    marginBottom: 6,
    textAlign: 'right',
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
  bookContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  bookText: {
    fontSize: 14,
    color: '#0097A7',
    fontWeight: '600',
    marginRight: 6,
    textAlign: 'right',
  },
  teacherInfo: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
    textAlign: 'right',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0097A7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#0097A7',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 8,
    textAlign: 'center',
  },
});

export default ExerciseRecommendationCard;
