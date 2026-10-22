import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';
const BASE_URL = Constants.expoConfig.extra.BASE_URL;

export const uploadAudioToWhisper = async (uri) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) throw new Error("Fichier audio introuvable");

    console.log('🎵 Upload vers Whisper:', {
      uri: uri,
      fileSize: fileInfo.size,
      exists: fileInfo.exists
    });

    const extension = uri.split('.').pop();
    const mimeMap = {
      mp4: 'audio/mp4',
      m4a: 'audio/m4a',
      wav: 'audio/wav',
      mp3: 'audio/mpeg',
    };
    const fileType = mimeMap[extension] || 'audio/m4a';

    const formData = new FormData();
    formData.append('audio', {
      uri,
      name: `audio.${extension}`,
      type: fileType,
    });

    console.log('🎵 Envoi vers:', `${BASE_URL}/whisper/transcribe`);

    const response = await axios.post(`${BASE_URL}/whisper/transcribe`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('🎵 Réponse Whisper:', response.data);

    // Retourner l'objet complet avec transcription et chemin audio
    return {
      transcription: response.data.transcription,
      audioPath: response.data.audioPath,
      audioSize: response.data.audioSize,
      audioDuration: response.data.audioDuration
    };
  } catch (error) {
    console.error('❌ Erreur upload Whisper :', error);
    throw error;
  }
};
export const askChatbot = async (userId, message, audioPath = null, messageType = 'text', audioDuration = null, audioSize = null) => {
  console.log('Envoi message au chatbot :', BASE_URL);
  console.log('🎵 Données envoyées au chatbot:', {
    userId,
    message,
    audioPath,
    messageType,
    audioDuration,
    audioSize
  });

  try {
    const response = await axios.post(`${BASE_URL}/chatbot/ask`, {
      userId,
      message,
      audioPath,
      messageType,
      audioDuration,
      audioSize,
    });

    console.log('🔄 Réponse brute du backend:', JSON.stringify(response.data));

    // Récupérer tous les champs possibles liés à l'audio et aux recommandations
    return {
      reply: response.data.reply,
      audio: response.data.audio, // Le champ principal pour l'audio
      tts: response.data.tts,     // Champ alternatif pour l'audio
      // Données de recommandation
      recommendationType: response.data.recommendationType,
      teacherId: response.data.teacherId,
      teacherData: response.data.teacherData,
      // Autres données de recommandation (pour les exercices et cours futurs)
      exerciseData: response.data.exerciseData,
      courseData: response.data.courseData,
      // Données de navigation intelligente
      navigation: response.data.navigation,
      courseListData: response.data.courseListData,
      // Nouvelles données pour voir_exercice (action et payload)
      action: response.data.action,
      payload: response.data.payload,
    };

  } catch (error) {
    console.error('Erreur envoi chatbot :', error);
    throw error;
  }
};

// ❌ Fonction supprimée - la sauvegarde se fait automatiquement via askChatbot
// export const saveVoiceMessage = async (userId, transcription, audioPath, audioDuration, audioSize) => {
//   try {
//     const response = await axios.post(`${BASE_URL}/chatbot/save-voice`, {
//       userId,
//       transcription,
//       audioPath,
//       audioDuration,
//       audioSize,
//     });

//     console.log('🎵 Message vocal sauvegardé:', response.data);
//     return response.data;

//   } catch (error) {
//     console.error('❌ Erreur sauvegarde message vocal:', error);
//     throw error;
//   }
// };