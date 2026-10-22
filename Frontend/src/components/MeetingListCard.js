import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { logChildActivity } from '../services/activityLogger';

const MeetingListCard = ({ meetings, title = "اللقاءات المباشرة المتاحة" }) => {
  const navigation = useNavigation();

  if (!meetings || meetings.length === 0) {
    return null;
  }

  const handleMeetingPress = (meeting) => {
    // Log l'activité
    logChildActivity({
      action_type: "meeting",
      reference_id: meeting.id,
    });

    console.log('🎯 Navigation vers les détails du meeting:', meeting);

    // Naviguer vers l'écran de détails du meeting existant
    navigation.navigate("MeetingsDetails", {
      meetingId: meeting.id,
      isMeetingFromList: true
    });
  };

  const getTeacherAvatarUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    return `https://www.abajim.com/${avatar.startsWith('/') ? avatar.slice(1) : avatar}`;
  };

  const getTeacherInitials = (name) => {
    if (!name) return '؟';
    const parts = name.trim().split(' ');
    return parts.length >= 2 
      ? parts[0][0] + parts[1][0] 
      : parts[0]?.slice(0, 2) || '؟';
  };

  const formatPrice = (amount, discount) => {
    if (!amount) return 'مجاني';
    const finalPrice = discount ? amount - discount : amount;
    return `${finalPrice} د.ت`;
  };

  const getStatusColor = (rawDate) => {
    if (!rawDate) return '#6c757d';
    const now = Math.floor(Date.now() / 1000);
    const timeDiff = rawDate - now;
    
    if (timeDiff < 3600) return '#dc3545'; // Rouge si dans moins d'1h
    if (timeDiff < 86400) return '#ffc107'; // Jaune si dans moins de 24h
    return '#28a745'; // Vert sinon
  };

  const getStatusText = (rawDate) => {
    if (!rawDate) return 'غير محدد';
    const now = Math.floor(Date.now() / 1000);
    const timeDiff = rawDate - now;
    
    if (timeDiff < 0) return 'انتهى';
    if (timeDiff < 3600) return 'قريباً';
    if (timeDiff < 86400) return 'اليوم';
    return 'قادم';
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* En-tête de la carte */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="videocam" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.headerTitle}>
              {`${meetings.length} لقاء مباشر متاح`}
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{meetings.length}</Text>
          </View>
        </View>

        {/* Liste des meetings */}
        <ScrollView 
          style={styles.meetingsList}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {meetings.map((meeting, index) => {
            const teacherAvatarUrl = getTeacherAvatarUrl(meeting.teacherAvatar);
            
            return (
              <TouchableOpacity
                key={meeting.id || index}
                style={[
                  styles.meetingItem,
                  index === meetings.length - 1 && styles.lastMeetingItem
                ]}
                onPress={() => handleMeetingPress(meeting)}
                activeOpacity={0.8}
              >
                {/* Barre colorée en haut de la carte */}
                <View style={[
                  styles.topColorBar,
                  { backgroundColor: getStatusColor(meeting.rawDate) }
                ]} />

                {/* Contenu principal de la carte */}
                <View style={styles.cardMainContent}>
                  
                  {/* Section enseignant et statut */}
                  <View style={styles.headerSection}>
                    {/* Avatar de l'enseignant */}
                    <View style={styles.teacherAvatarContainer}>
                      {teacherAvatarUrl ? (
                        <Image
                          source={{ uri: teacherAvatarUrl }}
                          style={styles.teacherAvatar}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarInitials}>
                            {getTeacherInitials(meeting.teacherName)}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Informations de l'enseignant et statut */}
                    <View style={styles.teacherInfo}>
                      <Text style={styles.teacherName} numberOfLines={1}>
                        الأستاذ: {meeting.teacherName}
                      </Text>
                      <Text style={styles.subjectName} numberOfLines={1}>
                        📘 {meeting.subject}
                        {meeting.subSubject && ` - ${meeting.subSubject}`}
                      </Text>
                    </View>

                    {/* Badge de statut */}
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(meeting.rawDate) }
                    ]}>
                      <Text style={styles.statusText}>
                        {getStatusText(meeting.rawDate)}
                      </Text>
                    </View>
                  </View>

                  {/* Section date et heure */}
                  <View style={styles.timeSection}>
                    <View style={styles.timeItem}>
                      <Ionicons name="calendar" size={18} color="#0097A7" />
                      <Text style={styles.timeText} numberOfLines={1}>
                        {meeting.date}
                      </Text>
                    </View>
                    <View style={styles.timeItem}>
                      <Ionicons name="time" size={18} color="#0097A7" />
                      <Text style={styles.timeText} numberOfLines={1}>
                        {meeting.time}
                      </Text>
                    </View>
                  </View>

                  {/* Section prix et participants */}
                  <View style={styles.bottomSection}>
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceText}>
                        {formatPrice(meeting.amount, meeting.discount)}
                      </Text>
                      {meeting.discount > 0 && (
                        <Text style={styles.originalPrice}>
                          {meeting.amount} د.ت
                        </Text>
                      )}
                    </View>
                    
                    <View style={styles.participantsInfo}>
                      <Ionicons name="people" size={14} color="#666" />
                      <Text style={styles.participantsText}>
                        {meeting.minStudents}-{meeting.maxStudents} طلاب
                      </Text>
                    </View>

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

        {/* Footer avec nombre de meetings */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {meetings.length} لقاء مباشر متاح
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
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#0097A7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginRight: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  meetingsList: {
    maxHeight: 400,
  },
  meetingItem: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastMeetingItem: {
    borderBottomWidth: 0,
  },
  topColorBar: {
    height: 4,
    width: '100%',
  },
  cardMainContent: {
    padding: 16,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  teacherAvatarContainer: {
    marginRight: 12,
  },
  teacherAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0097A7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f3c88',
    marginBottom: 4,
    textAlign: 'right',
  },
  subjectName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#333',
    marginLeft: 8,
    textAlign: 'right',
    flex: 1,
    flexShrink: 1,
  },
  bottomSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  participantsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  arrowContainer: {
    padding: 4,
  },
  footer: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default MeetingListCard;
