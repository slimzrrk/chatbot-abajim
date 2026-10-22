import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, Animated, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import VoiceMessage from './VoiceMessage';
import MessageReactions from './MessageReactions';
import TeacherRecommendationCard from './TeacherRecommendationCard';
import TeacherProfileNavigationCard from './TeacherProfileNavigationCard';
import ExerciseRecommendationCard from './ExerciseRecommendationCard';
import CourseRecommendationCard from './CourseRecommendationCard';
import CourseNavigationCard from './CourseNavigationCard';
import CourseListCard from './CourseListCard';
import ExerciseNavigationCard from './ExerciseNavigationCard';
import ExerciseListCard from './ExerciseListCard';
import ExerciseSelectionCard from './ExerciseSelectionCard';
import MeetingListCard from './MeetingListCard';
import SubscriptionOffersCard from './SubscriptionOffersCard';
import ManuelNavigationCard from './ManuelNavigationCard';
import { useAudio } from '../context/AudioContext';
import { useNavigation } from '@react-navigation/native';

const ChatMessage = ({ message, showTimestamp = false, onReaction }) => {
  const isUser = message.sender === 'user';
  const activeChild = useSelector((state) => state.auth.activeChild);
  const { toggleAudio, playAudio, currentMessageId, isPlaying, isLoading } = useAudio();
  const navigation = useNavigation();

  // État local pour forcer le re-render quand l'audio est ajouté
  const [audioProperties, setAudioProperties] = useState({
    tts: message.tts,
    audio: message.audio,
    audio_path: message.audio_path
  });

  // Animations
  const slideAnim = useRef(new Animated.Value(isUser ? 50 : -50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;

  // Déterminer si c'est un message vocal
  const isVoiceMessage = message.message_type === 'audio' || message.audio_path;

  // Déterminer si c'est une recommandation de professeur
  const isTeacherRecommendation = message.recommendationType === 'teacher' && message.teacherData;

  // Déterminer si c'est une recommandation d'exercice
  const isExerciseRecommendation = message.recommendationType === 'exercise' && message.exerciseData;

  // Déterminer si c'est une recommandation de cours
  const isCourseRecommendation = message.recommendationType === 'course' && message.courseData;

  // Déterminer si c'est une liste de cours trouvés
  const isCourseList = message.courseListData && message.courseListData.courses && message.courseListData.courses.length > 0;

  // Déterminer si c'est un cours avec navigation automatique (cours trouvé + navigation)
  const isCourseWithNavigation = message.navigation && message.navigation.screen === 'WebinarDetailScreen' && message.courseData;

  // Déterminer si c'est une liste d'exercices trouvés
  const isExerciseList = message.exercisesList && message.exercisesList.length > 0;

  // Déterminer si c'est un exercice avec navigation automatique (exercice trouvé + navigation)
  const isExerciseWithNavigation = message.navigation && message.navigation.screen === 'ExerciseDetailScreen' && message.exerciseData;

  // Nouvelles détections pour les réponses structurées de voir_exercice
  const isExerciseNavigationAction = message.action === 'NAVIGATE_TO_EXERCISE' && message.payload;
  const isExerciseSelectionAction = message.action === 'SHOW_EXERCISES_LIST' && message.payload && message.payload.exercises;

  // Détection pour les meetings
  const isMeetingListAction = message.action === 'SHOW_MEETING_LIST' && message.payload && message.payload.meetings && message.payload.meetings.length > 0;

  // Détection pour les offres d'abonnement
  const isSubscriptionOffersAction = message.action === 'show_subscription_offers' && message.payload && message.payload.offers;

  // Détection pour la navigation vers un manuel
  const isManuelNavigationAction = (message.action === 'navigate_to_manuel_page' || message.action === 'show_manuel_info') && message.payload && message.payload.manuel;

  // Détection pour le profil du professeur avec navigation automatique
  const isTeacherProfileNavigation = message.navigation?.action === 'NAVIGATE_TO_TEACHER_PROFILE' && message.navigation?.teacherData && !isUser;

  // Note: Navigation automatique gérée par ExerciseNavigationCard après l'audio

  // Debug: Log des données de recommandation
  if (message.recommendationType === 'exercise') {
    console.log('🎯 Message avec recommandation d\'exercice détecté:', {
      recommendationType: message.recommendationType,
      hasExerciseData: !!message.exerciseData,
      exerciseData: message.exerciseData
    });
  }

  // État pour suivre si l'audio a déjà été lancé pour ce message
  const [audioAlreadyPlayed, setAudioAlreadyPlayed] = useState(false);

  // Surveiller les changements des propriétés audio
  useEffect(() => {
    const newAudioProperties = {
      tts: message.tts,
      audio: message.audio,
      audio_path: message.audio_path
    };

    // Vérifier si les propriétés audio ont changé
    if (JSON.stringify(newAudioProperties) !== JSON.stringify(audioProperties)) {
      console.log('🎵 Propriétés audio mises à jour pour le message:', message.id, newAudioProperties);
      setAudioProperties(newAudioProperties);

      // Lancer automatiquement l'audio pour les messages du bot qui ne sont plus en cours de frappe
      if (!isUser && !message.typing && !audioAlreadyPlayed && (newAudioProperties.tts || newAudioProperties.audio || newAudioProperties.audio_path)) {
        const audioPath = newAudioProperties.tts || newAudioProperties.audio || newAudioProperties.audio_path;
        console.log('🎵 Lecture automatique de l\'audio pour le message:', message.id);

        // Délai pour s'assurer que le message est complètement affiché
        setTimeout(async () => {
          try {
            // Passer les données du message pour la navigation automatique
            const messageDataForAudio = isExerciseNavigationAction ? {
              action: message.action,
              payload: message.payload,
              messageId: message.id
            } : isTeacherProfileNavigation ? {
              action: 'NAVIGATE_TO_TEACHER_PROFILE',
              payload: {
                teacherId: message.navigation.teacherData.id,
                teacherName: message.navigation.teacherData.full_name
              },
              messageId: message.id
            } : isManuelNavigationAction ? {
              action: message.action,
              payload: message.payload,
              messageId: message.id
            } : null;

            console.log('🎵 Données pour audio:', { hasData: !!messageDataForAudio, action: message.action });

            // Utiliser message.id au lieu de messageId qui n'est pas défini
            const success = await playAudio(audioPath, message.id, messageDataForAudio);
            if (success) {
              setAudioAlreadyPlayed(true);
              console.log('✅ Audio lancé automatiquement pour le message:', message.id);
              if (messageDataForAudio) {
                console.log('🎯 Données de navigation configurées pour la fin de l\'audio');
              }
            } else {
              console.warn('⚠️ Échec de lecture automatique pour le message:', message.id);
              // Retenter avec un délai supplémentaire
              setTimeout(async () => {
                const retrySuccess = await playAudio(audioPath, message.id, messageDataForAudio);
                if (retrySuccess) {
                  setAudioAlreadyPlayed(true);
                  console.log('✅ Audio lancé après nouvelle tentative pour:', message.id);
                }
              }, 1000);
            }
          } catch (error) {
            console.error('❌ Erreur lecture automatique:', error);
          }
        }, 300);
      }
    }
  }, [message.tts, message.audio, message.audio_path, audioProperties, isUser, message.typing, messageId, playAudio, audioAlreadyPlayed]);

  // Déterminer si le message du bot a un audio TTS
  // Afficher le bouton pour TOUS les messages du bot (l'audio sera généré si nécessaire)
  const hasBotAudio = !isUser && message.sender === 'bot' && message.text && !message.typing;

  // État de lecture pour ce message
  const messageId = message.id || `temp_${message.timestamp || Date.now()}`;
  const isThisMessagePlaying = currentMessageId === messageId && isPlaying;

  // Debug détaillé pour comprendre le problème des boutons audio
  if (!isUser && message.text) {
    console.log('🎵 Message du bot - Debug détaillé:', {
      messageId: messageId,
      realId: message.id,
      text: message.text?.substring(0, 30) + '...',
      originalProps: {
        tts: message.tts,
        audio: message.audio,
        audio_path: message.audio_path,
      },
      localAudioProps: audioProperties,
      hasBotAudio,
      sender: message.sender,
      timestamp: message.timestamp,
      currentMessageId: currentMessageId,
      isThisMessagePlaying: isThisMessagePlaying,
      messageType: message.message_type,
      typing: message.typing
    });
  }
  const isThisMessageLoading = currentMessageId === messageId && isLoading;

  // Fonction pour gérer le clic sur le bouton audio (play/pause)
  const handleAudioToggle = async () => {
    let audioPath = audioProperties.tts || audioProperties.audio || audioProperties.audio_path;

    // Si pas d'audio disponible, générer l'audio à la demande
    if (!audioPath && message.text) {
      console.log('🎵 Génération audio à la demande pour:', message.text.substring(0, 50) + '...');

      try {
        // Appeler l'API pour générer l'audio
        const response = await fetch(`${Constants.expoConfig.extra.BASE_URL}/chatbot/generate-audio`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: message.text
          }),
        });

        if (response.ok) {
          const data = await response.json();
          audioPath = data.audioPath;

          // Mettre à jour les propriétés audio du message
          setAudioProperties(prev => ({
            ...prev,
            tts: audioPath
          }));

          console.log('✅ Audio généré à la demande:', audioPath);
        } else {
          console.error('❌ Erreur génération audio à la demande');
          return;
        }
      } catch (error) {
        console.error('❌ Erreur génération audio à la demande:', error);
        return;
      }
    }

    if (audioPath) {
      console.log('🎵 Contrôle audio (play/pause):', { messageId, audioPath });
      toggleAudio(audioPath, messageId);
    }
  };

  // Animation d'apparition
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animation des ondes audio
  useEffect(() => {
    if (isThisMessagePlaying) {
      const createWaveAnimation = (animValue, delay) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const wave1 = createWaveAnimation(waveAnim1, 0);
      const wave2 = createWaveAnimation(waveAnim2, 300);
      const wave3 = createWaveAnimation(waveAnim3, 600);

      wave1.start();
      wave2.start();
      wave3.start();

      return () => {
        wave1.stop();
        wave2.stop();
        wave3.stop();
      };
    } else {
      waveAnim1.setValue(0);
      waveAnim2.setValue(0);
      waveAnim3.setValue(0);
    }
  }, [isThisMessagePlaying, waveAnim1, waveAnim2, waveAnim3]);

  // Formater l'heure
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  // Obtenir l'URL de l'avatar de l'enfant
  const getUserAvatarUrl = () => {
    if (!activeChild?.avatar) return null;

    return activeChild.avatar.startsWith('http')
      ? activeChild.avatar
      : `https://www.abajim.com/${activeChild.avatar.startsWith('/') ? activeChild.avatar.substring(1) : activeChild.avatar}`;
  };

  // Avatar du chatbot (robot)
  const BotAvatar = () => (
    <View style={styles.botAvatarContainer}>
      <Image
        source={require('../../assets/icons/Chatbot.png')}
        style={styles.botAvatarImage}
        resizeMode="contain"
      />
    </View>
  );

  // Bouton audio créatif pour les messages du bot
  const AudioButton = () => {
    if (!hasBotAudio) return null;

    const hasAudioFile = audioProperties.tts || audioProperties.audio || audioProperties.audio_path;
    const [isGenerating, setIsGenerating] = useState(false);

    const handlePress = async () => {
      if (isGenerating) return;

      if (!hasAudioFile) {
        setIsGenerating(true);
      }

      await handleAudioToggle();

      if (!hasAudioFile) {
        setIsGenerating(false);
      }
    };

    return (
      <TouchableOpacity
        style={styles.audioButton}
        onPress={handlePress}
        activeOpacity={0.7}
        disabled={isGenerating}
      >
        <Animated.View style={[
          styles.audioButtonInner,
          isThisMessagePlaying && styles.audioButtonPlaying,
          isGenerating && styles.audioButtonGenerating
        ]}>
          <Ionicons
            name={
              isGenerating ? 'hourglass' :
              isThisMessageLoading ? 'hourglass' :
              isThisMessagePlaying ? 'pause' : 'play'
            }
            size={16}
            color={isThisMessagePlaying ? '#FFFFFF' : '#0097A7'}
          />
        </Animated.View>

        {/* Ondes audio animées */}
        {isThisMessagePlaying && (
          <View style={styles.audioWaves}>
            <Animated.View
              style={[
                styles.audioWave,
                {
                  opacity: waveAnim1,
                  transform: [{ scale: waveAnim1 }]
                }
              ]}
            />
            <Animated.View
              style={[
                styles.audioWave,
                styles.audioWave2,
                {
                  opacity: waveAnim2,
                  transform: [{ scale: waveAnim2 }]
                }
              ]}
            />
            <Animated.View
              style={[
                styles.audioWave,
                styles.audioWave3,
                {
                  opacity: waveAnim3,
                  transform: [{ scale: waveAnim3 }]
                }
              ]}
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Avatar de l'utilisateur
  const UserAvatar = () => {
    const avatarUrl = getUserAvatarUrl();

    if (avatarUrl) {
      return (
        <Image
          source={{ uri: avatarUrl }}
          style={styles.userAvatarImage}
        />
      );
    }

    // Avatar par défaut avec initiales
    const getInitials = () => {
      const name = activeChild?.full_name || 'طفل';
      const names = name.trim().split(' ');
      return names.length >= 2
        ? names[0][0] + names[1][0]
        : names[0]?.slice(0, 2) || '؟';
    };

    return (
      <View style={styles.userAvatarContainer}>
        <Text style={styles.avatarText}>{getInitials()}</Text>
      </View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.messageRow,
        isUser ? styles.userRow : styles.botRow,
        {
          opacity: opacityAnim,
          transform: [
            { translateX: slideAnim },
            { scale: scaleAnim }
          ]
        }
      ]}
    >
      {/* Avatar à gauche pour le bot, à droite pour l'utilisateur */}
      {!isUser && <BotAvatar />}

      {/* Contenu du message */}
      <View style={styles.messageContent}>
        {isVoiceMessage ? (
          <VoiceMessage message={message} isUser={isUser} />
        ) : (
          <View style={styles.textMessageContainer}>
            <View style={[styles.bubble, isUser ? styles.user : styles.bot, !isUser && styles.bubbleWithAudio]}>
              <Text style={[styles.text, isUser ? styles.userText : styles.botText]}>
                {message.text}
              </Text>
              {/* Bouton audio pour les messages du bot - placé dans le coin */}
              {!isUser && (
                <View style={styles.audioButtonContainer}>
                  <AudioButton />
                </View>
              )}
            </View>

            {/* Carte de recommandation de professeur */}
            {isTeacherRecommendation && !isUser && (
              <TeacherRecommendationCard
                teacherData={message.teacherData}
                onProfilePress={() => {
                  console.log('🎯 Navigation vers le profil du professeur:', message.teacherData.name);
                }}
              />
            )}

            {/* Carte de profil du professeur avec navigation automatique */}
            {isTeacherProfileNavigation && !isUser && (
              <TeacherProfileNavigationCard
                teacherData={message.navigation.teacherData}
                onNavigate={() => {
                  console.log('🎯 Navigation automatique vers le profil du professeur:', message.navigation.teacherData.full_name);
                }}
              />
            )}

            {/* Carte de recommandation d'exercice */}
            {isExerciseRecommendation && !isUser && (
              <ExerciseRecommendationCard
                exerciseData={message.exerciseData}
                onExercisePress={() => {
                  console.log('🎯 Navigation vers l\'exercice:', message.exerciseData.title || message.exerciseData.titre);
                }}
              />
            )}

            {/* Carte de recommandation de cours */}
            {isCourseRecommendation && !isUser && !isCourseWithNavigation && (
              <CourseRecommendationCard
                course={message.courseData}
                onPress={() => {
                  console.log('🎯 Navigation vers le cours:', message.courseData.title);
                }}
              />
            )}

            {/* Carte de cours avec navigation automatique */}
            {isCourseWithNavigation && !isUser && (
              <CourseNavigationCard
                course={message.courseData}
                onPress={() => {
                  console.log('🎯 Retour vers le cours trouvé:', message.courseData.title);
                }}
              />
            )}

            {/* Carte de liste de cours trouvés */}
            {isCourseList && !isUser && (
              <CourseListCard
                courses={message.courseListData.courses}
                title={message.courseListData.title}
                onCoursePress={(course) => {
                  console.log('🎯 Navigation vers le cours depuis la liste:', course.title);
                }}
              />
            )}

            {/* Carte d'exercice avec navigation automatique */}
            {isExerciseWithNavigation && !isUser && (
              <ExerciseNavigationCard
                exercise={message.exerciseData}
                onPress={() => {
                  console.log('🎯 Retour vers l\'exercice trouvé:', message.exerciseData.title);
                }}
              />
            )}

            {/* Carte de liste d'exercices trouvés */}
            {isExerciseList && !isUser && (
              <ExerciseListCard
                exercises={message.exercisesList}
                title="التمارين المتاحة"
              />
            )}

            {/* Nouvelle carte pour navigation directe vers un exercice spécifique */}
            {isExerciseNavigationAction && !isUser && (
              <ExerciseNavigationCard
                exercise={{
                  id: message.payload.videoId,
                  title: message.payload.title,
                  page: message.payload.page,
                  thumbnail: message.payload.thumbnail,
                  video: message.payload.videoUrl,
                  videoUrl: message.payload.videoUrl,
                  manuel_name: message.payload.manuelName,
                  matiere_name: message.payload.matiereName,
                  teacher: message.payload.teacher
                }}
                onPress={() => {
                  console.log('🎯 Navigation vers l\'exercice spécifique:', message.payload.title);
                }}
                autoNavigate={true}
              />
            )}

            {/* Nouvelle carte pour sélection d'exercices multiples */}
            {isExerciseSelectionAction && !isUser && (
              <ExerciseSelectionCard
                exercises={message.payload.exercises}
                onPress={() => {
                  console.log('🎯 Sélection d\'exercice depuis la liste');
                }}
              />
            )}

            {/* Carte de liste des meetings */}
            {isMeetingListAction && !isUser && (
              <MeetingListCard
                meetings={message.payload.meetings}
                title="اللقاءات المباشرة المتاحة"
              />
            )}

            {/* Carte des offres d'abonnement */}
            {isSubscriptionOffersAction && !isUser && (
              <SubscriptionOffersCard
                offers={message.payload.offers}
                onClose={() => {
                  console.log('🔒 Fermeture de la carte d\'offres d\'abonnement');
                }}
              />
            )}

            {/* Carte de navigation vers un manuel */}
            {isManuelNavigationAction && !isUser && (
              <ManuelNavigationCard
                manuel={message.payload.manuel}
                document={message.payload.document}
                page={message.payload.page}
                autoNavigate={true}
                onClose={() => {
                  console.log('📖 Fermeture de la carte de navigation manuel');
                }}
              />
            )}
          </View>
        )}

        {/* Timestamp */}
        {showTimestamp && (
          <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.botTimestamp]}>
            {formatTime(message.timestamp || message.created_at)}
          </Text>
        )}

        {/* Réactions */}
        <MessageReactions
          message={message}
          isUser={isUser}
          onReaction={onReaction}
        />
      </View>

      {/* Avatar utilisateur à droite */}
      {isUser && <UserAvatar />}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  messageRow: {
    flexDirection: 'row',
    marginVertical: 6,
    marginHorizontal: 12,
    alignItems: 'flex-end',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  botRow: {
    justifyContent: 'flex-start',
  },
  messageContent: {
    flex: 1,
    maxWidth: '75%',
  },
  textMessageContainer: {
    position: 'relative',
  },
  bubble: {
    padding: 14,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  user: {
    backgroundColor: '#0097A7',
    borderBottomRightRadius: 6,
  },
  bot: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  bubbleWithAudio: {
    position: 'relative',
    paddingBottom: 12, // Un peu plus d'espace en bas
    paddingRight: 28, // Plus d'espace à droite pour éviter l'interférence
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'right', // RTL pour l'arabe
  },
  userText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  botText: {
    color: '#333333',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  },
  userTimestamp: {
    color: '#FFFFFF',
    textAlign: 'right',
  },
  botTimestamp: {
    color: '#666666',
    textAlign: 'left',
  },
  // Styles pour les avatars améliorés
  botAvatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0097A7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  botAvatarImage: {
    width: 24,
    height: 24,
  },
  userAvatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  userAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: 10,
    marginBottom: 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Conteneur pour le bouton audio dans le coin
  audioButtonContainer: {
    position: 'absolute',
    bottom: -6, // Légèrement moins en dehors
    right: -12, // Un peu plus à droite pour éviter l'interférence
    zIndex: 1,
  },
  // Styles pour le bouton audio créatif
  audioButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  audioButtonInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 151, 167, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioButtonPlaying: {
    backgroundColor: '#0097A7',
    transform: [{ scale: 1.1 }],
  },
  audioButtonGenerating: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    opacity: 0.7,
  },
  audioWaves: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioWave: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 151, 167, 0.4)',
    backgroundColor: 'transparent',
  },
  audioWave2: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderColor: 'rgba(0, 151, 167, 0.3)',
  },
  audioWave3: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderColor: 'rgba(0, 151, 167, 0.2)',
  },
});

export default ChatMessage;
