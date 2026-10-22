import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  DeviceEventEmitter,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const TeacherProfileNavigationCard = ({ teacherData, onNavigate, autoNavigate = true }) => {
  const navigation = useNavigation();

  if (!teacherData) {
    return null;
  }

  const handleProfilePress = () => {
    if (onNavigate) {
      onNavigate();
    }

    // Naviguer vers l'écran du professeur
    navigation.navigate('Teacher', {
      teacherId: teacherData.id,
      teacher: teacherData
    });
  };

  // Écouter l'événement de fin d'audio pour la navigation automatique
  useEffect(() => {
    if (autoNavigate && teacherData) {
      console.log('🎧 TeacherProfileNavigationCard: Écoute des événements audio pour:', teacherData.full_name);

      const audioFinishedListener = (messageData) => {
        console.log('🎧 Événement audio terminé reçu:', messageData);

        // Vérifier si c'est pour un profil de professeur avec navigation automatique
        if (messageData && messageData.action === 'NAVIGATE_TO_TEACHER_PROFILE' && messageData.payload) {
          console.log('🚀 Navigation automatique déclenchée après audio pour:', messageData.payload.teacherName);

          // Délai court pour s'assurer que l'interface est prête
          setTimeout(() => {
            handleProfilePress();
          }, 100);
        }
      };

      // S'abonner à l'événement
      const subscription = DeviceEventEmitter.addListener('audioFinished', audioFinishedListener);

      // Nettoyer l'abonnement
      return () => {
        console.log('🎧 Nettoyage de l\'écoute audio pour:', teacherData.full_name);
        subscription.remove();
      };
    }
  }, [autoNavigate, teacherData]);

  const getAvatarUrl = () => {
    if (!teacherData.avatar) return null;
    
    if (teacherData.avatar.startsWith('http')) {
      return teacherData.avatar;
    }
    
    return `https://www.abajim.com/${teacherData.avatar.startsWith('/') ? teacherData.avatar.slice(1) : teacherData.avatar}`;
  };

  const getInitials = (name) => {
    if (!name) return 'أ';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return words[0][0] + words[1][0];
    }
    return name[0] || 'أ';
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
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {getInitials(teacherData.full_name)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.teacherInfo}>
            <Text style={styles.teacherName} numberOfLines={2}>
              {teacherData.full_name || 'أستاذ غير معروف'}
            </Text>

            {/* Matière principale */}
            {teacherData.mainSubject && (
              <View style={styles.subjectContainer}>
                <Ionicons name="book" size={14} color="#0097A7" />
                <Text style={styles.subjectText}>
                  {teacherData.mainSubject}
                </Text>
              </View>
            )}

            {/* Statistiques */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="library" size={14} color="#666" />
                <Text style={styles.statText}>
                  {teacherData.webinarCount || 0} دورة
                </Text>
              </View>

              <View style={styles.statItem}>
                <Ionicons name="play-circle" size={14} color="#666" />
                <Text style={styles.statText}>
                  {teacherData.exerciseCount || 0} تمرين
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bio si disponible */}
        {teacherData.bio && (
          <View style={styles.bioContainer}>
            <Text style={styles.bioText} numberOfLines={2}>
              {teacherData.bio}
            </Text>
          </View>
        )}

        {/* Bouton d'action */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleProfilePress}
          activeOpacity={0.7}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>عرض الملف الشخصي</Text>
            <Ionicons name="person" size={18} color="#fff" />
          </View>
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
  subjectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
  },
  subjectText: {
    fontSize: 13,
    color: '#0097A7',
    fontWeight: '600',
    marginRight: 6,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
  bioContainer: {
    marginBottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  bioText: {
    fontSize: 13,
    color: '#555',
    textAlign: 'right',
    lineHeight: 18,
  },
  actionButton: {
    backgroundColor: '#0097A7',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
    textAlign: 'center',
  },
});

export default TeacherProfileNavigationCard;
