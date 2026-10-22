import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { logChildActivity } from '../services/activityLogger';

const { width } = Dimensions.get('window');

const CourseRecommendationCard = ({ course, onPress }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  if (!course) {
    return null;
  }

  const getInitials = (fullName) => {
    if (!fullName) return "؟";
    const names = fullName.trim().split(" ");
    return names.length >= 2
      ? (names[0][0] + names[1][0]).toUpperCase()
      : names[0].slice(0, 2).toUpperCase();
  };

  const handleCoursePress = () => {
    if (onPress) {
      onPress();
    }

    // Log l'activité
    logChildActivity({
      action_type: "webinar",
      reference_id: course.id,
    });

    console.log('🎯 Navigation vers le cours:', course.title);
    console.log('🔗 ID du cours:', course.id);

    // Naviguer vers les détails du cours
    navigation.navigate("WebinarDetail", { webinarId: course.id });
  };

  const handleTeacherPress = (e) => {
    e.stopPropagation();
    if (course.teacher?.id) {
      navigation.navigate("Teacher", { teacherId: course.teacher.id });
    }
  };

  const getCourseImageUrl = () => {
    if (!course.image_cover) return null;

    if (course.image_cover.startsWith('http')) {
      return course.image_cover;
    }

    return `https://www.abajim.com/${course.image_cover.startsWith('/') ? course.image_cover.slice(1) : course.image_cover}`;
  };

  const getTeacherAvatarUrl = () => {
    if (!course.teacher?.avatar) return null;

    if (course.teacher.avatar.startsWith('http')) {
      return course.teacher.avatar;
    }

    return `https://www.abajim.com/${course.teacher.avatar.startsWith('/') ? course.teacher.avatar.slice(1) : course.teacher.avatar}`;
  };

  const getDifficultyColor = (score) => {
    if (!score) return '#6c757d';
    if (score >= 4) return '#28a745';
    if (score >= 3) return '#ffc107';
    return '#dc3545';
  };

  const getDifficultyText = (score) => {
    if (!score) return 'متوسط';
    if (score >= 4) return 'ممتاز';
    if (score >= 3) return 'جيد';
    return 'مبتدئ';
  };

  const formatChapterCount = (chapters) => {
    if (!chapters || !Array.isArray(chapters)) return 0;
    return chapters.length;
  };

  const courseImageUrl = getCourseImageUrl();
  const teacherAvatarUrl = getTeacherAvatarUrl();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header avec image et informations de base */}
        <View style={styles.header}>
          <View style={styles.imageContainer}>
            {courseImageUrl ? (
              <Image
                source={{ uri: courseImageUrl }}
                style={styles.courseImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="school" size={32} color="#fff" />
              </View>
            )}

            {/* Badge de prix */}
            <View style={[
              styles.priceBadge,
              { backgroundColor: course.price > 0 ? '#dc3545' : '#28a745' }
            ]}>
              <Text style={styles.priceText}>
                {course.price > 0 ? `${course.price} د.ت` : 'مجاني'}
              </Text>
            </View>
          </View>

          <View style={styles.courseInfo}>
            <Text style={styles.courseTitle} numberOfLines={2}>
              {course.title || 'دورة بدون عنوان'}
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="library" size={14} color="#666" />
                <Text style={styles.statText}>
                  {formatChapterCount(course.chapters)} فصل
                </Text>
              </View>

              {course.duration && (
                <View style={styles.statItem}>
                  <Ionicons name="time" size={14} color="#666" />
                  <Text style={styles.statText}>
                    {course.duration} د
                  </Text>
                </View>
              )}
            </View>

            {course.score && (
              <View style={[
                styles.difficultyBadge,
                { backgroundColor: getDifficultyColor(course.score) }
              ]}>
                <Text style={styles.difficultyText}>
                  {getDifficultyText(course.score)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Informations sur l'enseignant */}
        {course.teacher && (
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
                    {getInitials(course.teacher.name || course.teacher.full_name)}
                  </Text>
                </View>
              )}

              <View style={styles.teacherDetails}>
                <Text style={styles.teacherLabel}>الأستاذ:</Text>
                <Text style={styles.teacherName} numberOfLines={1}>
                  {course.teacher.name || course.teacher.full_name || 'مدرس غير معروف'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#0097A7" />
          </TouchableOpacity>
        )}

        {/* Description courte */}
        {course.description && (
          <Text style={styles.description} numberOfLines={2}>
            {course.description}
          </Text>
        )}

        {/* Score de recommandation */}
        {course.score && (
          <View style={styles.scoreContainer}>
            <Ionicons name="star" size={16} color="#ffc107" />
            <Text style={styles.scoreText}>
              {course.score.toFixed(1)} نقطة توافق
            </Text>
          </View>
        )}

        {/* Bouton pour voir le cours */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCoursePress}
          activeOpacity={0.8}
        >
          <Ionicons name="play-circle" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>
            بدء الدورة
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
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  courseImage: {
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
  priceBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priceText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
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
  teacherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
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
  description: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
    textAlign: 'right',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#fff9e6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  scoreText: {
    fontSize: 12,
    color: '#ffc107',
    marginRight: 6,
    fontWeight: 'bold',
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

export default CourseRecommendationCard;
