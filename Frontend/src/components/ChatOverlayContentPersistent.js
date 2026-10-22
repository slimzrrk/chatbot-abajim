import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';

import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import { askChatbot, uploadAudioToWhisper } from '../services/api';
import { speakText } from '../utils/audioHelper';
import { useChatHistory } from '../context/ChatHistoryContext';
import { useAudio } from '../context/AudioContext';

const ChatOverlayContentPersistent = () => {
  const [textInput, setTextInput] = useState('');
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true); // Toujours afficher les timestamps
  const [currentBotMessageId, setCurrentBotMessageId] = useState(null); // ID du message bot en cours
  const flatListRef = useRef();

  const activeChild = useSelector((state) => state.auth.activeChild);
  const userId = activeChild?.id;
  const { playAudio, stopCurrentAudio } = useAudio();
  const navigation = useNavigation();

  // Utiliser le contexte d'historique du chat
  const {
    messages,
    isLoading,
    hasHistory,
    hasWelcomeMessageBeenShown,
    addMessage,
    updateTypingMessage,
    finishTyping,
    addAudioToMessage,
    addWelcomeMessage,
  } = useChatHistory();

  // ✅ Gestion spécialisée du clavier pour overlay
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Fonction pour générer le message de bienvenue dynamique
  const generateDynamicWelcome = async () => {
    try {
      console.log('🤖 Génération du message de bienvenue dynamique...');

      // Afficher l'indicateur de frappe pendant la génération
      setIsTyping(true);

      // Appeler l'API pour générer un message de bienvenue personnalisé
      const welcomePrompt = "Génère un message de bienvenue chaleureux et personnalisé pour l'assistant éducatif Abajim. Le message doit être en arabe, accueillant, et inviter l'utilisateur à poser ses questions sur l'éducation. Garde le message court et engageant.";

      const { reply, audio, tts } = await askChatbot(userId, welcomePrompt, null, 'welcome');

      console.log('🎵 Message de bienvenue reçu:', {
        reply: reply?.substring(0, 50) + '...',
        audio: audio,
        tts: tts,
        audioPath: audio || tts
      });

      // Masquer l'indicateur de frappe et afficher le message avec effet de frappe et audio
      setIsTyping(false);
      const audioPath = audio || tts;
      typeMessage(reply, audioPath);

    } catch (error) {
      console.error('❌ Erreur génération message de bienvenue:', error);
      // Masquer l'indicateur de frappe en cas d'erreur
      setIsTyping(false);
      // Fallback vers message statique
      typeMessage('👋 أهلاً بك! أنا مساعد أبجيم الذكي كيف يمكنني مساعدتك؟');
    }
  };

  // Ajouter le message de bienvenue si nécessaire (avec protection contre duplication)
  useEffect(() => {
    if (!isLoading && !hasHistory && !hasWelcomeMessageBeenShown) {
      setTimeout(() => {
        addWelcomeMessage(generateDynamicWelcome);
      }, 500);
    }
  }, [isLoading, hasHistory, hasWelcomeMessageBeenShown, addWelcomeMessage]);

  // Scroll automatique quand les messages changent
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length]);

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  // Fonction pour fermer le clavier quand on tape sur les messages
  const handleMessageAreaPress = () => {
    Keyboard.dismiss();
  };

  // Fonction pour gérer la navigation automatique
  const handleAutoNavigation = (navigationData) => {
    if (!navigationData || !navigationData.screen) {
      return;
    }

    console.log('🧭 Navigation automatique déclenchée:', navigationData);

    try {
      switch (navigationData.screen) {
        case 'WebinarDetailScreen':
          if (navigationData.params?.webinarId) {
            console.log('🎯 Navigation vers WebinarDetail avec ID:', navigationData.params.webinarId);
            // Délai court pour permettre à l'utilisateur de voir le message avant la navigation
            setTimeout(() => {
              navigation.navigate('WebinarDetail', {
                webinarId: navigationData.params.webinarId
              });
            }, 1500); // 1.5 secondes de délai
          } else {
            console.warn('⚠️ ID de webinaire manquant pour la navigation');
          }
          break;

        case 'CourseList':
          // Pour les listes de cours, pas de navigation automatique
          // L'utilisateur doit choisir dans la liste affichée
          console.log('📋 Liste de cours affichée, pas de navigation automatique');
          break;

        case 'DocumentScreen':
          if (navigationData.params?.documentUrl) {
            console.log('📖 Navigation vers DocumentScreen avec paramètres:', navigationData.params);
            setTimeout(() => {
              navigation.navigate('DocumentScreen', {
                documentUrl: navigationData.params.documentUrl,
                title: navigationData.params.title
              });
            }, 1500);
          } else {
            console.warn('⚠️ URL de document manquante pour la navigation');
          }
          break;

        default:
          console.warn('⚠️ Type de navigation non supporté:', navigationData.screen);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la navigation automatique:', error);
    }
  };

  const typeMessage = (text, audioPath = null, recommendationData = null) => {
    console.log('⌨️ TypeMessage appelé:', {
      text: text?.substring(0, 50) + '...',
      audioPath: audioPath,
      hasAudio: !!audioPath,
      hasRecommendation: !!recommendationData
    });

    // Créer directement le message avec l'audio et les données de recommandation
    const messageId = `msg_bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const words = text.split(' ');
    let current = '';
    let index = 0;

    const typeNext = () => {
      if (index < words.length) {
        current += words[index] + ' ';
        index++;
        // Passer les données de recommandation lors de la mise à jour du message
        updateTypingMessage(current.trim(), messageId, recommendationData);
        setTimeout(typeNext, 100);
      } else {
        // Terminer la frappe
        finishTyping();
        console.log('✅ Frappe terminée, messageId:', messageId);
        setTimeout(scrollToBottom, 100);

        // Ajouter l'audio au message après la frappe si fourni
        if (audioPath) {
          console.log('🎵 Ajout audio au message:', { messageId, audioPath });
          addAudioToMessage(messageId, audioPath);
          console.log('🎵 Audio ajouté au message, sera lancé automatiquement par ChatMessage');
        } else {
          console.log('⚠️ Pas d\'audio à ajouter pour le message:', messageId);
        }

        // Déclencher la navigation automatique si des données de navigation sont disponibles
        if (recommendationData?.navigation) {
          console.log('🧭 Données de navigation détectées:', recommendationData.navigation);
          handleAutoNavigation(recommendationData.navigation);
        }
      }
    };

    typeNext();
  };

  const playTTS = async (url) => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false
      });

      const BASE_URL = Constants.expoConfig.extra.BASE_URL.replace('/api', '');
      const fullUrl = `${BASE_URL}${url.startsWith('/') ? url : '/' + url}`;

      const { sound } = await Audio.Sound.createAsync(
        { uri: fullUrl },
        { shouldPlay: false, progressUpdateIntervalMillis: 100 }
      );

      await sound.setVolumeAsync(1.0);
      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
        }
      });

      return true;
    } catch (error) {
      console.error("❌ Erreur lecture audio:", error);
      return false;
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;

    const message = textInput.trim();
    setTextInput('');

    // ✅ Fermer le clavier après l'envoi
    Keyboard.dismiss();

    // 🔇 Arrêter l'audio du bot en cours
    await stopCurrentAudio();

    // Ajouter le message utilisateur
    addMessage('user', message);

    // Afficher l'indicateur de frappe
    setIsTyping(true);

    // 🕐 Enregistrer le moment où l'indicateur de frappe a commencé
    const typingStartTime = Date.now();
    const MINIMUM_TYPING_DURATION = 1500; // 1.5 secondes minimum

    try {
      // Appeler le chatbot
      const { reply, audio, tts, recommendationType, teacherData, exerciseData, courseData, navigation, courseListData, action, payload } = await askChatbot(userId, message);

      // Préparer les données de recommandation et de navigation
      const recommendationData = {
        recommendationType,
        teacherData,
        exerciseData,
        courseData,
        navigation,
        courseListData,
        action,
        payload
      };

      // 🕐 Calculer le temps écoulé et attendre le minimum si nécessaire
      const elapsedTime = Date.now() - typingStartTime;
      const remainingTime = Math.max(0, MINIMUM_TYPING_DURATION - elapsedTime);

      if (remainingTime > 0) {
        console.log(`⏱️ Attente de ${remainingTime}ms pour respecter la durée minimum d'affichage de l'indicateur de frappe`);
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      // Masquer l'indicateur de frappe et afficher la réponse avec effet de frappe
      setIsTyping(false);
      const audioPath = audio || tts;
      typeMessage(reply, audioPath, recommendationData);
    } catch (error) {
      console.error('❌ Erreur chatbot:', error);

      // 🕐 Respecter le délai minimum même en cas d'erreur
      const elapsedTime = Date.now() - typingStartTime;
      const remainingTime = Math.max(0, MINIMUM_TYPING_DURATION - elapsedTime);

      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      setIsTyping(false);
      typeMessage("عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.");
    }
  };

  const startRecording = async () => {
    try {
      console.log('🎤 Démarrage de l\'enregistrement audio...');

      // 🔇 Arrêter l'audio du bot en cours avant d'enregistrer
      await stopCurrentAudio();

      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });

      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
      });

      setRecording(recording);
      setIsRecording(true);
      console.log('✅ Enregistrement démarré avec succès');
    } catch (error) {
      console.error('❌ Erreur démarrage enregistrement:', error);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const fileInfo = await FileSystem.getInfoAsync(uri);

      if (!fileInfo.exists || fileInfo.size === 0) {
        setRecording(null);
        return;
      }

      setRecording(null);

      console.log('🎵 Informations d\'enregistrement:', {
        uri: uri,
        fileSize: fileInfo.size
      });

      // Transcrire l'audio et obtenir le chemin serveur + durée calculée côté backend
      const transcriptionResult = await uploadAudioToWhisper(uri);
      console.log('🎵 Résultat de transcription:', transcriptionResult);

      if (transcriptionResult && transcriptionResult.transcription && transcriptionResult.transcription.trim()) {
        const transcription = transcriptionResult.transcription;
        const serverAudioPath = transcriptionResult.audioPath; // Chemin serveur retourné par l'upload
        const audioDuration = transcriptionResult.audioDuration; // Durée calculée côté backend

        // Préparer les données audio pour l'interface
        const audioData = {
          audioPath: serverAudioPath, // Utiliser le chemin serveur
          audioDuration: audioDuration, // Utiliser la durée calculée côté backend
          audioSize: fileInfo.size,
        };

        console.log('🎵 Ajout du message vocal à l\'interface:', audioData);
        // Ajouter le message vocal à l'interface
        addMessage('user', transcription, 'audio', audioData);

        // 🕐 Afficher l'indicateur de frappe pour les messages vocaux aussi
        setIsTyping(true);
        const typingStartTime = Date.now();
        const MINIMUM_TYPING_DURATION = 1500; // 1.5 secondes minimum

        // Appeler le chatbot avec les données audio (qui sauvegarde automatiquement l'interaction)
        const { reply, audio, tts, recommendationType, teacherData, exerciseData, courseData, navigation, courseListData, action, payload } = await askChatbot(userId, transcription, serverAudioPath, 'audio', audioDuration, fileInfo.size);

        // Préparer les données de recommandation et de navigation
        const recommendationData = {
          recommendationType,
          teacherData,
          exerciseData,
          courseData,
          navigation,
          courseListData,
          action,
          payload
        };

        // 🕐 Respecter le délai minimum d'affichage de l'indicateur de frappe
        const elapsedTime = Date.now() - typingStartTime;
        const remainingTime = Math.max(0, MINIMUM_TYPING_DURATION - elapsedTime);

        if (remainingTime > 0) {
          console.log(`⏱️ Attente de ${remainingTime}ms pour l'indicateur de frappe (message vocal)`);
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }

        setIsTyping(false);
        const audioPath = audio || tts;
        typeMessage(reply, audioPath, recommendationData);
      }
    } catch (error) {
      console.error('❌ Erreur arrêt enregistrement:', error);
      setIsRecording(false);
      setRecording(null);
    }
  };

  // Afficher un indicateur de chargement si nécessaire
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <View style={styles.loadingText}>
          <Ionicons name="chatbubble-ellipses" size={24} color="#0097A7" />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* ✅ Zone de messages - Scroll libre */}
      <View style={styles.messagesContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => `${item.timestamp || index}-${index}`}
          renderItem={({ item }) => (
            <ChatMessage
              message={item}
              showTimestamp={showTimestamps}
              onReaction={(messageId, reaction) => {
                // TODO: Sauvegarder la réaction en base de données
                console.log('Réaction:', messageId, reaction);
              }}
            />
          )}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={scrollToBottom}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
          nestedScrollEnabled={true}
          onScrollBeginDrag={handleMessageAreaPress}
          ListFooterComponent={() => <TypingIndicator isVisible={isTyping} />}
        />
      </View>

      {/* ✅ Zone de saisie - Reste toujours visible */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="اكتب سؤالك هنا.."
          value={textInput}
          onChangeText={setTextInput}
          onSubmitEditing={handleTextSubmit}
          onBlur={() => {
            // Le clavier se ferme automatiquement quand on perd le focus
          }}
          returnKeyType="send"
          multiline={false}
          textAlignVertical="center"
        />
        {textInput.trim() === '' ? (
          <TouchableOpacity
            style={[styles.micButton, isRecording && styles.recording]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Ionicons name={isRecording ? 'stop' : 'mic'} size={24} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.sendButton} onPress={handleTextSubmit}>
            <Ionicons name="send" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    padding: 20,
  },
  messagesContainer: {
    flex: 1,
  },
  messageList: {
    padding: 12,
    paddingBottom: 20,
    flexGrow: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },

  input: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    maxHeight: 100,
    textAlignVertical: 'center',
    borderWidth: 1,
    borderColor: '#e1e5e9',
    textAlign: 'right', // RTL pour l'arabe
  },
  micButton: {
    backgroundColor: '#0097A7',
    padding: 14,
    marginLeft: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  recording: {
    backgroundColor: '#ff4757',
    transform: [{ scale: 1.1 }],
  },
  sendButton: {
    backgroundColor: '#0097A7',
    padding: 14,
    marginLeft: 12,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default ChatOverlayContentPersistent;
