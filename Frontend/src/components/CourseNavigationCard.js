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

const CourseNavigationCard = ({ course, onPress }) => {
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

    console.log('🎯 Navigation vers le cours depuis CourseNavigationCard:', course.title);
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
  imageContainer: {
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

export default CourseNavigationCard;
