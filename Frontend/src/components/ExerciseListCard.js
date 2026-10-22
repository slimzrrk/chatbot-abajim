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

const ExerciseListCard = ({ exercises, title = "التمارين المتاحة" }) => {
  const navigation = useNavigation();

  if (!exercises || exercises.length === 0) {
    return null;
  }

  const handleExercisePress = (exercise) => {
    // Log l'activité
    logChildActivity({
      action_type: "video",
      reference_id: exercise.id,
    });

    console.log('🎯 Navigation vers l\'exercice:', exercise.title);
    console.log('🔗 ID de l\'exercice:', exercise.id);

    // Naviguer vers l'écran Video avec les données de l'exercice
    navigation.navigate("Video", {
      exerciseData: {
        id: exercise.id,
        title: exercise.title,
        video_url: exercise.videoUrl,
        video: exercise.videoUrl,
        teacher: exercise.teacher
      },
      isRecommendedExercise: true
    });
  };

  const getThumbnailUrl = (exercise) => {
    if (!exercise.thumbnail) return null;

    if (exercise.thumbnail.startsWith('http')) {
      return exercise.thumbnail;
    }

    return `https://www.abajim.com/${exercise.thumbnail.startsWith('/') ? exercise.thumbnail.slice(1) : exercise.thumbnail}`;
  };

  const getTeacherInitials = (fullName) => {
    if (!fullName) return "؟";
    const names = fullName.trim().split(" ");
    return names.length >= 2
      ? (names[0][0] + names[1][0]).toUpperCase()
      : names[0].slice(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="list" size={24} color="#0097A7" />
          <Text style={styles.title}>{title}</Text>
        </View>

        {/* Liste des exercices */}
        <ScrollView 
          style={styles.exercisesList}
          showsVerticalScrollIndicator={false}
        >
          {exercises.map((exercise, index) => {
            const thumbnailUrl = getThumbnailUrl(exercise);
            
            return (
              <TouchableOpacity
                key={exercise.id || index}
                style={styles.exerciseItem}
                onPress={() => handleExercisePress(exercise)}
                activeOpacity={0.7}
              >
                {/* Image/Icône de l'exercice */}
                <View style={styles.exerciseImageContainer}>
                  {thumbnailUrl ? (
                    <Image
                      source={{ uri: thumbnailUrl }}
                      style={styles.exerciseImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.exerciseImagePlaceholder}>
                      <Ionicons name="play-circle" size={20} color="#fff" />
                    </View>
                  )}
                </View>

                {/* Informations de l'exercice */}
                <View style={styles.exerciseContent}>
                  <Text style={styles.exerciseTitle} numberOfLines={2}>
                    {exercise.title || 'تمرين بدون عنوان'}
                  </Text>

                  <View style={styles.exerciseDetails}>
                    {exercise.page && (
                      <View style={styles.detailItem}>
                        <Ionicons name="document" size={12} color="#666" />
                        <Text style={styles.detailText}>صفحة {exercise.page}</Text>
                      </View>
                    )}

                    {exercise.numero && (
                      <View style={styles.detailItem}>
                        <Ionicons name="list" size={12} color="#666" />
                        <Text style={styles.detailText}>رقم {exercise.numero}</Text>
                      </View>
                    )}

                    {exercise.manuel && (
                      <View style={styles.detailItem}>
                        <Ionicons name="book" size={12} color="#666" />
                        <Text style={styles.detailText} numberOfLines={1}>
                          {exercise.manuel}
                        </Text>
                      </View>
                    )}
                  </View>

                  {exercise.teacher && (
                    <View style={styles.teacherContainer}>
                      <View style={styles.teacherAvatar}>
                        <Text style={styles.teacherInitials}>
                          {getTeacherInitials(exercise.teacher)}
                        </Text>
                      </View>
                      <Text style={styles.teacherText} numberOfLines={1}>
                        الأستاذ: {exercise.teacher}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Flèche de navigation */}
                <View style={styles.arrowContainer}>
                  <Ionicons name="chevron-forward" size={20} color="#0097A7" />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Footer avec nombre d'exercices */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {exercises.length} تمرين متاح
          </Text>
        </View>
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
    maxHeight: 400,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a202c',
    marginRight: 12,
    textAlign: 'right',
    flex: 1,
  },
  exercisesList: {
    maxHeight: 280,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  exerciseImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
  },
  exerciseImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0097A7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseContent: {
    flex: 1,
    paddingRight: 8,
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 4,
    textAlign: 'right',
  },
  exerciseDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    marginBottom: 2,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    textAlign: 'right',
  },
  teacherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  teacherAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0097A7',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  teacherInitials: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  teacherText: {
    fontSize: 12,
    color: '#0097A7',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  arrowContainer: {
    paddingLeft: 8,
  },
  footer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f2f5',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});

export default ExerciseListCard;
