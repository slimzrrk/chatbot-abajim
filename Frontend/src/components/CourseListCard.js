import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { logChildActivity } from '../services/activityLogger';

const CourseListCard = ({ courses, title, onCoursePress }) => {
  const navigation = useNavigation();

  // Fonction pour obtenir les initiales
  const getInitials = (fullName) => {
    if (!fullName) return "؟";
    const names = fullName.trim().split(" ");
    return names.length >= 2
      ? (names[0][0] + names[1][0]).toUpperCase()
      : names[0].slice(0, 2).toUpperCase();
  };

  // Debug: Log des données reçues
  console.log('🎯 CourseListCard - Données reçues:', {
    coursesLength: courses?.length,
    title: title,
    courses: courses?.map(course => ({
      id: course.id,
      title: course.title,
      name: course.name,
      webinar_title: course.webinar_title,
      teacher: course.teacher,
      teacher_name: course.teacher_name,
      score: course.score,
      thumbnail: course.thumbnail,
      image_url: course.image_url,
      webinar_image: course.webinar_image
    }))
  });

  // Debug spécifique pour les professeurs
  courses?.forEach((course, index) => {
    console.log(`👨‍🏫 Cours ${index + 1} - Données professeur:`, {
      teacher: course.teacher,
      teacher_name: course.teacher_name,
      hasTeacher: !!(course.teacher || course.teacher_name),
      teacherValue: course.teacher || course.teacher_name,
      initials: getInitials(course.teacher || course.teacher_name)
    });
  });

  if (!courses || courses.length === 0) {
    return null;
  }

  const handleCoursePress = (course) => {
    if (onCoursePress) {
      onCoursePress(course);
    }

    // Log l'activité
    logChildActivity({
      action_type: "webinar",
      reference_id: course.id,
    });

    console.log('🎯 Navigation vers le cours depuis CourseListCard:', course.title);
    console.log('🔗 ID du cours:', course.id);

    // Naviguer vers les détails du cours
    navigation.navigate("WebinarDetail", { webinarId: course.id });
  };

  const getCourseImageUrl = (course) => {
    if (!course.image) return null;

    if (course.image.startsWith('http')) {
      return course.image;
    }

    return `https://www.abajim.com/${course.image.startsWith('/') ? course.image.slice(1) : course.image}`;
  };



  return (
    <View style={styles.container}>
      {/* En-tête de la carte */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="library" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.headerTitle}>
            {`${courses.length} دروس متطابقة`}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{courses.length}</Text>
        </View>
      </View>

      {/* Liste des cours */}
      <ScrollView 
        style={styles.coursesList}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {courses.map((course, index) => {
          // Debug: Log pour chaque cours
          console.log(`🎯 Rendu cours ${index + 1}:`, {
            id: course.id,
            title: course.title,
            titleFallback: course.title || course.name || course.webinar_title || 'عنوان الدرس',
            teacher: course.teacher,
            teacherFallback: course.teacher || course.teacher_name,
            score: course.score
          });

          return (
            <TouchableOpacity
              key={course.id || index}
              style={[
                styles.courseItem,
                index === courses.length - 1 && styles.lastCourseItem
              ]}
              onPress={() => handleCoursePress(course)}
              activeOpacity={0.8}
            >
              {/* Barre colorée en haut de la carte */}
              <View style={styles.topColorBar} />

              {/* Contenu principal de la carte */}
              <View style={styles.cardMainContent}>

                {/* Section image et titre */}
                <View style={styles.headerSection}>
                  {/* Image du cours */}
                  <View style={styles.courseImageContainer}>
                    {getCourseImageUrl(course) ? (
                      <Image
                        source={{ uri: getCourseImageUrl(course) }}
                        style={styles.courseImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <Ionicons name="play-circle" size={32} color="#FFFFFF" />
                      </View>
                    )}
                    {/* Badge overlay sur l'image */}
                    <View style={styles.imageOverlay}>
                      <Ionicons name="play" size={16} color="#FFFFFF" />
                    </View>
                  </View>

                  {/* Titre et informations du cours */}
                  <View style={styles.courseInfoContainer}>
                    <Text
                      style={styles.courseTitle}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {course.title || course.name || course.webinar_title || 'عنوان الدرس'}
                    </Text>

                    {/* Matière ou catégorie */}
                    <View style={styles.subjectContainer}>
                      <Ionicons name="library" size={14} color="#0097A7" />
                      <Text style={styles.subjectText}>
                        {course.subject || course.category || 'مادة دراسية'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Section professeur */}
                <View style={styles.teacherSection}>
                  {(() => {
                    const teacherName = course.teacher || course.teacher_name;
                    console.log(`🔍 Professeur pour cours ${course.id}:`, {
                      teacher: course.teacher,
                      teacher_name: course.teacher_name,
                      teacherName: teacherName,
                      willShow: !!teacherName
                    });

                    return (
                      <View style={styles.teacherContainer}>
                        <View style={styles.teacherInfo}>
                          <View style={styles.teacherLabelContainer}>
                            <Ionicons name="person" size={16} color="#0097A7" />
                            <Text style={styles.teacherLabel}>الأستاذ:</Text>
                          </View>
                          <Text style={styles.teacherName} numberOfLines={3}>
                            {teacherName || 'غير محدد'}
                          </Text>
                        </View>

                        {teacherName && (
                          <View style={styles.teacherAvatar}>
                            <Text style={styles.teacherInitials}>
                              {getInitials(teacherName)}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })()}
                </View>

                {/* Section score et navigation */}
                <View style={styles.bottomSection}>
                  {/* Score de correspondance */}
                  {course.score && (
                    <View style={styles.scoreContainer}>
                      <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                      <Text style={styles.scoreText}>
                        {Math.round(course.score * 100)}% مطابق
                      </Text>
                    </View>
                  )}

                  {/* Flèche de navigation */}
                  <View style={styles.arrowContainer}>
                    <Ionicons name="chevron-forward" size={20} color="#0097A7" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Pied de carte */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          اضغط على أي درس لبدء المشاهدة
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginTop: 12,
    marginHorizontal: 8,
    shadowColor: '#0097A7',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 151, 167, 0.1)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0097A7',
    borderBottomWidth: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 12,
    textAlign: 'right',
    flex: 1,
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  coursesList: {
    maxHeight: 320,
    paddingHorizontal: 4,
  },
  courseItem: {
    flexDirection: 'column',
    marginHorizontal: 12,
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    minHeight: 160,
    shadowColor: '#0097A7',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 151, 167, 0.08)',
    overflow: 'hidden',
  },
  lastCourseItem: {
    marginBottom: 12,
  },
  topColorBar: {
    height: 4,
    backgroundColor: '#0097A7',
    width: '100%',
  },
  cardMainContent: {
    flex: 1,
    padding: 16,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  courseImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  courseImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0097A7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 151, 167, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseInfoContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  courseTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F3B64',
    textAlign: 'right',
    lineHeight: 24,
    marginBottom: 8,
  },
  subjectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 151, 167, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-end',
  },
  subjectText: {
    fontSize: 13,
    color: '#0097A7',
    fontWeight: '600',
    marginLeft: 6,
  },
  teacherSection: {
    marginBottom: 12,
  },
  teacherContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 151, 167, 0.06)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 151, 167, 0.12)',
    minHeight: 60,
  },
  teacherInfo: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
  },
  teacherLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  teacherLabel: {
    fontSize: 14,
    color: '#0097A7',
    fontWeight: '600',
    marginLeft: 8,
  },
  teacherName: {
    fontSize: 15,
    color: '#1F3B64',
    fontWeight: '600',
    textAlign: 'left',
    lineHeight: 22,
    width: '100%',
  },
  teacherAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0097A7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0097A7',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  teacherInitials: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  scoreText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 6,
    fontWeight: '700',
  },
  arrowContainer: {
    padding: 10,
    backgroundColor: 'rgba(0, 151, 167, 0.15)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 151, 167, 0.2)',
  },
  footer: {
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 151, 167, 0.1)',
  },
  footerText: {
    fontSize: 13,
    color: '#0097A7',
    textAlign: 'center',
    fontWeight: '600',
    fontStyle: 'italic',
  },
});

export default CourseListCard;
