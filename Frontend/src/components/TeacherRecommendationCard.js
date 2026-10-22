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

const TeacherRecommendationCard = ({ teacherData, onProfilePress }) => {
  const navigation = useNavigation();

  if (!teacherData) {
    return null;
  }

  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    }
    
    // Naviguer vers l'écran du professeur
    navigation.navigate('Teacher', { 
      teacherId: teacherData.id,
      teacher: teacherData 
    });
  };

  const getAvatarUrl = () => {
    if (!teacherData.avatar) return null;
    
    if (teacherData.avatar.startsWith('http')) {
      return teacherData.avatar;
    }
    
    return `https://www.abajim.com/${teacherData.avatar.startsWith('/') ? teacherData.avatar.slice(1) : teacherData.avatar}`;
  };

  const getInitials = (name) => {
    if (!name) return '؟';
    const parts = name.trim().split(' ');
    return parts.length >= 2 
      ? parts[0][0] + parts[1][0] 
      : parts[0]?.slice(0, 2) || '؟';
  };

  const getExpertiseColor = (expertise) => {
    switch (expertise) {
      case 'خبير': return '#28a745';
      case 'متقدم': return '#007bff';
      case 'متوسط': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const avatarUrl = getAvatarUrl();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header avec avatar et informations de base */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {getInitials(teacherData.name)}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.teacherInfo}>
            <Text style={styles.teacherName} numberOfLines={2}>
              {teacherData.name}
            </Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="school" size={14} color="#666" />
                <Text style={styles.statText}>
                  {teacherData.webinarCount || 0} دروس
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Ionicons name="star" size={14} color="#ffc107" />
                <Text style={styles.statText}>
                  {teacherData.score || 0}%
                </Text>
              </View>
            </View>
            
            <View style={[
              styles.expertiseBadge,
              { backgroundColor: getExpertiseColor(teacherData.expertise) }
            ]}>
              <Text style={styles.expertiseText}>
                {teacherData.expertise || 'مبتدئ'}
              </Text>
            </View>
          </View>
        </View>

        {/* Matière enseignée */}
        {teacherData.matiere && (
          <View style={styles.subjectContainer}>
            <Ionicons name="book" size={16} color="#0097A7" />
            <Text style={styles.subjectText}>
              يدرّس: {teacherData.matiere}
            </Text>
          </View>
        )}

        {/* Bio courte */}
        {teacherData.bio && (
          <Text style={styles.bio} numberOfLines={2}>
            {teacherData.bio}
          </Text>
        )}

        {/* Bouton pour voir le profil */}
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={handleProfilePress}
          activeOpacity={0.8}
        >
          <Ionicons name="person" size={18} color="#fff" />
          <Text style={styles.profileButtonText}>
            عرض الملف الشخصي
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
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0097A7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
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
  expertiseBadge: {
    alignSelf: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expertiseText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subjectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  subjectText: {
    fontSize: 14,
    color: '#0097A7',
    fontWeight: '600',
    marginRight: 6,
    textAlign: 'right',
  },
  bio: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
    textAlign: 'right',
  },
  profileButton: {
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
  profileButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 8,
    textAlign: 'center',
  },
});

export default TeacherRecommendationCard;
