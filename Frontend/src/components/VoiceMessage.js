import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import { useAudio } from '../context/AudioContext';

const { width } = Dimensions.get('window');

const VoiceMessage = ({ message, isUser }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showSpeedControl, setShowSpeedControl] = useState(false);
  const waveAnimation = useRef(new Animated.Value(0)).current;
  const speedControlAnim = useRef(new Animated.Value(0)).current;

  // Utiliser le contexte audio global pour arrêter l'audio du bot
  const { stopCurrentAudio } = useAudio();

  // Animation des ondes audio
  useEffect(() => {
    if (isPlaying) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(waveAnimation, {
            toValue: 0,
            duration: 800,
            useNativeDriver: false,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [isPlaying, waveAnimation]);

  // Nettoyer le son quand le composant se démonte
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playAudio = async () => {
    try {
      // Éviter les appels multiples
      if (isLoading) {
        console.log('🎵 Lecture déjà en cours, ignorer...');
        return;
      }

      // 🔇 Arrêter l'audio du bot en cours avant de jouer le message vocal de l'utilisateur
      await stopCurrentAudio();

      console.log('🎵 Tentative de lecture audio pour:', {
        isUser,
        audio_path: message.audio_path,
        message_type: message.message_type
      });

      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
        return;
      }

      // Vérifier si le chemin audio est valide
      if (!message.audio_path) {
        console.warn('⚠️ Aucun chemin audio disponible');
        return;
      }

      // Bloquer seulement les chemins locaux temporaires (file://) pour les messages utilisateur
      // Permettre la lecture des messages utilisateur qui ont un chemin serveur valide
      if (message.audio_path.startsWith('file://')) {
        console.warn('⚠️ Chemin audio local temporaire détecté, lecture impossible:', message.audio_path);
        return;
      }

      setIsLoading(true);

      // Configurer l'audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
      });

      // Construire l'URL du fichier audio
      const BASE_URL = Constants.expoConfig.extra.BASE_URL.replace('/api', '');
      const audioUrl = message.audio_path?.startsWith('http')
        ? message.audio_path
        : `${BASE_URL}${message.audio_path?.startsWith('/') ? message.audio_path : '/' + message.audio_path}`;

      console.log('🎵 Lecture audio:', audioUrl);

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        {
          shouldPlay: true,
          progressUpdateIntervalMillis: 100,
          rate: playbackRate,
          shouldCorrectPitch: true
        }
      );

      setSound(newSound);
      setIsPlaying(true);
      setIsLoading(false);

      // Écouter les changements de statut
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setDuration(status.durationMillis || 0);
          setPosition(status.positionMillis || 0);

          if (status.didJustFinish) {
            setIsPlaying(false);
            setPosition(0);
            // Nettoyer le son quand il se termine pour permettre la relecture
            newSound.unloadAsync();
            setSound(null);
          }
        }
      });

    } catch (error) {
      console.error('❌ Erreur lecture audio:', error);
      setIsPlaying(false);
      setIsLoading(false);
    }
  };

  const formatTime = (milliseconds) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Gérer l'affichage du contrôle de vitesse
  const toggleSpeedControl = () => {
    const toValue = showSpeedControl ? 0 : 1;
    setShowSpeedControl(!showSpeedControl);

    Animated.spring(speedControlAnim, {
      toValue,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  // Changer la vitesse de lecture
  const changePlaybackRate = async (rate) => {
    setPlaybackRate(rate);
    if (sound) {
      await sound.setRateAsync(rate, true);
    }
    toggleSpeedControl();
  };

  const progress = duration > 0 ? position / duration : 0;
  const isLocalFile = !message.audio_path || message.audio_path.startsWith('file://');
  const isDisabled = isLocalFile || isLoading; // Désactiver si fichier local ou en cours de chargement

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.botContainer]}>
      {/* Ligne principale avec bouton et ondes */}
      <View style={styles.mainRow}>
        {/* Bouton de lecture */}
        <TouchableOpacity
          style={[
            styles.playButton,
            isUser ? styles.userPlayButton : styles.botPlayButton,
            isDisabled && styles.disabledButton
          ]}
          onPress={isDisabled ? null : playAudio}
          disabled={isDisabled}
        >
          <Ionicons
            name={isLocalFile ? 'warning' : isLoading ? 'hourglass' : (isPlaying ? 'pause' : 'play')}
            size={22}
            color={isUser ? "#0097A7" : "#FFFFFF"}
          />
        </TouchableOpacity>

        {/* Visualisation des ondes audio */}
        <View style={styles.waveContainer}>
          {[...Array(12)].map((_, index) => {
            const animatedHeight = waveAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [4, Math.random() * 20 + 8],
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.waveBars,
                  {
                    height: isPlaying ? animatedHeight : 4,
                    backgroundColor: isUser ? 'rgba(255, 255, 255, 0.8)' : '#0097A7',
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Bouton de vitesse à droite */}
        <TouchableOpacity
          style={styles.speedButton}
          onPress={toggleSpeedControl}
        >
          <Text style={[styles.speedText, { color: isUser ? 'rgba(255, 255, 255, 0.9)' : '#666' }]}>
            {playbackRate}x
          </Text>
        </TouchableOpacity>
      </View>

      {/* Ligne du bas : Temps et progression */}
      <View style={styles.bottomRow}>
        <Text style={[styles.timeText, { color: isUser ? 'rgba(255, 255, 255, 0.9)' : '#666' }]}>
          {formatTime(position)} / {formatTime(duration || message.audio_duration || 0)}
        </Text>

        {/* Barre de progression */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: isUser ? 'rgba(255, 255, 255, 0.3)' : '#E0E0E0' }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: isUser ? 'rgba(255, 255, 255, 0.9)' : '#0097A7'
                }
              ]}
            />
          </View>
        </View>
      </View>

      {/* Contrôles de vitesse (overlay) */}
      {showSpeedControl && (
        <Animated.View
          style={[
            styles.speedControls,
            {
              opacity: speedControlAnim,
              transform: [
                {
                  scale: speedControlAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                },
              ],
            }
          ]}
        >
          {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
            <TouchableOpacity
              key={rate}
              style={[
                styles.speedOption,
                playbackRate === rate && styles.activeSpeedOption,
              ]}
              onPress={() => changePlaybackRate(rate)}
            >
              <Text
                style={[
                  styles.speedOptionText,
                  playbackRate === rate && { color: '#FFFFFF', fontWeight: 'bold' }
                ]}
              >
                {rate}x
              </Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 18,
    marginVertical: 4,
    marginHorizontal: 10,
    maxWidth: width * 0.75,
    minWidth: width * 0.5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  userContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#0097A7',
  },
  botContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  userPlayButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  botPlayButton: {
    backgroundColor: '#0097A7',
    borderWidth: 2,
    borderColor: 'rgba(0, 151, 167, 0.3)',
  },
  disabledButton: {
    backgroundColor: '#999',
    opacity: 0.6,
    borderColor: 'transparent',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    height: 24,
    marginHorizontal: 8,
  },
  waveBars: {
    width: 3,
    marginHorizontal: 1,
    borderRadius: 1.5,
  },
  speedButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 32,
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
    marginRight: 8,
  },
  speedText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  progressContainer: {
    flex: 1,
  },
  progressBar: {
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  speedControls: {
    position: 'absolute',
    top: -55,
    left: 5,
    right: 5,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 6,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxWidth: '95%',
  },
  speedOption: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 30,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    margin: 2,
  },
  activeSpeedOption: {
    backgroundColor: '#0097A7',
  },
  speedOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333333',
  },
});

export default VoiceMessage;
