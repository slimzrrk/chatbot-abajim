import React, { createContext, useContext, useState, useRef } from 'react';
import { Audio } from 'expo-av';
import Constants from 'expo-constants';
import { DeviceEventEmitter } from 'react-native';

const AudioContext = createContext();

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

export const AudioProvider = ({ children }) => {
  const [currentSound, setCurrentSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMessageData, setCurrentMessageData] = useState(null);

  // Arrêter l'audio actuel
  const stopCurrentAudio = async () => {
    if (currentSound) {
      try {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
      } catch (error) {
        console.error('❌ Erreur arrêt audio:', error);
      }
      setCurrentSound(null);
      setIsPlaying(false);
      setCurrentMessageId(null);
      setIsLoading(false);
    }
  };

  // Jouer un audio avec données de message optionnelles
  const playAudio = async (audioPath, messageId, messageData = null) => {
    try {
      console.log('🎵 playAudio appelé avec:', { audioPath, messageId });

      // Arrêter l'audio actuel s'il y en a un
      await stopCurrentAudio();

      if (!audioPath) {
        console.warn('⚠️ Aucun chemin audio fourni');
        return false;
      }

      console.log('🎵 Démarrage lecture audio...');
      console.log('🎯 Données message:', { hasMessageData: !!messageData, messageId });
      setIsLoading(true);
      setCurrentMessageId(messageId);
      setCurrentMessageData(messageData);

      // Configurer l'audio
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false
      });

      // Construire l'URL
      const BASE_URL = Constants.expoConfig.extra.BASE_URL.replace('/api', '');
      const fullUrl = audioPath.startsWith('http')
        ? audioPath
        : `${BASE_URL}${audioPath.startsWith('/') ? audioPath : '/' + audioPath}`;

      console.log('🎵 URL audio construite:', fullUrl);

      const { sound } = await Audio.Sound.createAsync(
        { uri: fullUrl },
        { shouldPlay: true, progressUpdateIntervalMillis: 100 }
      );

      console.log('✅ Audio créé et lecture démarrée');
      setCurrentSound(sound);
      setIsPlaying(true);
      setIsLoading(false);

      console.log('🎵 Audio en cours de lecture, callback en attente...');

      // Écouter les changements de statut
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          console.log('🎵 Audio terminé - didJustFinish détecté');

          // Sauvegarder les données avant de nettoyer l'état
          const messageDataToEmit = messageData;
          console.log('🎯 Données à émettre:', { hasMessageData: !!messageDataToEmit });

          // Nettoyer l'état audio
          setIsPlaying(false);
          setCurrentMessageId(null);
          setCurrentMessageData(null);
          sound.unloadAsync();
          setCurrentSound(null);

          // Émettre un événement global si des données sont disponibles
          if (messageDataToEmit) {
            console.log('🎯 Émission événement audio terminé...');
            setTimeout(() => {
              console.log('🚀 ÉMISSION ÉVÉNEMENT MAINTENANT');
              DeviceEventEmitter.emit('audioFinished', messageDataToEmit);
            }, 50);
          } else {
            console.log('ℹ️ Pas de données à émettre');
          }
        }
      });

      return true;
    } catch (error) {
      console.error('❌ Erreur lecture audio global:', error);
      setIsLoading(false);
      setCurrentMessageId(null);
      return false;
    }
  };

  // Basculer play/pause pour un message spécifique
  const toggleAudio = async (audioPath, messageId) => {
    if (currentMessageId === messageId && currentSound) {
      // Même message - basculer play/pause
      if (isPlaying) {
        await currentSound.pauseAsync();
        setIsPlaying(false);
      } else {
        await currentSound.playAsync();
        setIsPlaying(true);
      }
    } else {
      // Nouveau message - jouer
      await playAudio(audioPath, messageId);
    }
  };

  const value = {
    currentSound,
    isPlaying,
    currentMessageId,
    isLoading,
    playAudio,
    stopCurrentAudio,
    toggleAudio,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
};
