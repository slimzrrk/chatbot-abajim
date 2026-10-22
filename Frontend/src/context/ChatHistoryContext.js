import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';

// Fonctions pour générer des clés spécifiques à chaque enfant
const getChatHistoryKey = (childId) => `@abajim_chat_history_${childId}`;
const getWelcomeShownKey = (childId) => `@abajim_welcome_shown_${childId}`;

// Actions pour le reducer
const CHAT_ACTIONS = {
  LOAD_HISTORY: 'LOAD_HISTORY',
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_TYPING_MESSAGE: 'UPDATE_TYPING_MESSAGE',
  FINISH_TYPING: 'FINISH_TYPING',
  ADD_AUDIO_TO_MESSAGE: 'ADD_AUDIO_TO_MESSAGE',
  CLEAR_HISTORY: 'CLEAR_HISTORY',
  SET_LOADING: 'SET_LOADING',
  SET_WELCOME_SHOWN: 'SET_WELCOME_SHOWN',
};

// État initial
const initialState = {
  messages: [],
  isLoading: true,
  hasHistory: false,
  hasWelcomeMessageBeenShown: false,
  lastFinishedMessageId: null,
};

// Reducer pour gérer l'état du chat
const chatHistoryReducer = (state, action) => {
  switch (action.type) {
    case CHAT_ACTIONS.LOAD_HISTORY:
      return {
        ...state,
        messages: action.payload.messages || [],
        hasHistory: (action.payload.messages || []).length > 0,
        hasWelcomeMessageBeenShown: action.payload.hasWelcomeMessageBeenShown || false,
        isLoading: false,
      };

    case CHAT_ACTIONS.ADD_MESSAGE:
      const newMessages = [...state.messages, action.payload];
      return {
        ...state,
        messages: newMessages,
        hasHistory: true,
      };

    case CHAT_ACTIONS.UPDATE_TYPING_MESSAGE:
      const updatedMessages = [...state.messages];
      const lastMessage = updatedMessages[updatedMessages.length - 1];

      if (lastMessage && lastMessage.sender === 'bot' && lastMessage.typing) {
        lastMessage.text = action.payload.text;
        // Mettre à jour les données de recommandation si fournies
        if (action.payload.recommendationData) {
          Object.assign(lastMessage, action.payload.recommendationData);
        }
      } else {
        const newBotMessage = {
          id: action.payload.messageId || `msg_bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Utiliser l'ID fourni ou générer un nouveau
          sender: 'bot',
          text: action.payload.text,
          typing: true,
          timestamp: Date.now(),
          // Ajouter les données de recommandation si fournies
          ...(action.payload.recommendationData || {})
        };
        updatedMessages.push(newBotMessage);
      }

      return {
        ...state,
        messages: updatedMessages,
      };

    case CHAT_ACTIONS.FINISH_TYPING:
      const finishedMessages = [...state.messages];
      const lastTypingMessage = finishedMessages[finishedMessages.length - 1];

      if (lastTypingMessage && lastTypingMessage.typing) {
        lastTypingMessage.typing = false;
        console.log('✅ Message terminé:', lastTypingMessage.id);
      }

      return {
        ...state,
        messages: finishedMessages,
        lastFinishedMessageId: lastTypingMessage?.id, // Stocker l'ID du dernier message terminé
      };

    case CHAT_ACTIONS.ADD_AUDIO_TO_MESSAGE:
      const messagesWithAudio = state.messages.map(msg => {
        if (msg.id === action.payload.messageId) {
          console.log('✅ Audio ajouté au message:', msg.id, 'audioPath:', action.payload.audioPath);
          return {
            ...msg,
            tts: action.payload.audioPath,
            audio: action.payload.audioPath, // Ajouter aussi dans audio pour compatibilité
          };
        }
        return msg;
      });

      console.log('🎵 ADD_AUDIO_TO_MESSAGE reducer:', {
        messageId: action.payload.messageId,
        audioPath: action.payload.audioPath,
        totalMessages: messagesWithAudio.length,
        messageFound: messagesWithAudio.some(msg => msg.id === action.payload.messageId)
      });

      return {
        ...state,
        messages: messagesWithAudio,
      };

    case CHAT_ACTIONS.CLEAR_HISTORY:
      return {
        ...state,
        messages: [],
        hasHistory: false,
        hasWelcomeMessageBeenShown: false,
      };

    case CHAT_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case CHAT_ACTIONS.SET_WELCOME_SHOWN:
      return {
        ...state,
        hasWelcomeMessageBeenShown: true,
      };

    default:
      return state;
  }
};

// Contexte
const ChatHistoryContext = createContext();

// Provider
export const ChatHistoryProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatHistoryReducer, initialState);

  // Récupérer l'enfant actif depuis Redux
  const activeChild = useSelector((state) => state.auth.activeChild);
  const currentChildId = activeChild?.id;

  // Charger l'historique depuis AsyncStorage au démarrage et quand l'enfant change
  useEffect(() => {
    if (currentChildId) {
      console.log(`📱 Chargement de l'historique pour l'enfant ${currentChildId}`);
      loadChatHistory(currentChildId);
    }
  }, [currentChildId]); // Recharger quand l'enfant actif change

  // Sauvegarder automatiquement quand les messages changent
  useEffect(() => {
    if (!state.isLoading && state.messages.length > 0 && currentChildId) {
      saveChatHistory(currentChildId);
    }
  }, [state.messages, state.isLoading, currentChildId]);

  // Charger l'historique depuis AsyncStorage pour un enfant spécifique
  const loadChatHistory = async (childId) => {
    try {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });

      if (!childId) {
        console.warn('⚠️ Aucun ID d\'enfant fourni pour charger l\'historique');
        dispatch({ type: CHAT_ACTIONS.LOAD_HISTORY, payload: { messages: [], hasWelcomeMessageBeenShown: false } });
        return;
      }

      const [savedHistory, welcomeShown] = await Promise.all([
        AsyncStorage.getItem(getChatHistoryKey(childId)),
        AsyncStorage.getItem(getWelcomeShownKey(childId))
      ]);

      const parsedHistory = savedHistory ? JSON.parse(savedHistory) : { messages: [] };
      const hasWelcomeMessageBeenShown = welcomeShown === 'true';

      // Nettoyer les messages en cours de frappe au chargement et ajouter des IDs si manquants
      const cleanMessages = parsedHistory.messages.map((msg, index) => ({
        ...msg,
        id: msg.id || `msg_legacy_${msg.timestamp || Date.now()}_${index}`, // Ajouter ID si manquant
        typing: false,
      }));

      dispatch({
        type: CHAT_ACTIONS.LOAD_HISTORY,
        payload: {
          messages: cleanMessages,
          hasWelcomeMessageBeenShown
        },
      });

      console.log(`📱 Historique du chat chargé pour l'enfant ${childId}:`, cleanMessages.length, 'messages');
      console.log('👋 Message de bienvenue déjà affiché:', hasWelcomeMessageBeenShown);
    } catch (error) {
      console.error(`❌ Erreur lors du chargement pour l'enfant ${childId}:`, error);
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Sauvegarder l'historique dans AsyncStorage pour un enfant spécifique
  const saveChatHistory = async (childId) => {
    try {
      if (!childId) {
        console.warn('⚠️ Aucun ID d\'enfant fourni pour sauvegarder l\'historique');
        return;
      }

      const historyToSave = {
        messages: state.messages.map(msg => ({
          ...msg,
          typing: false, // Ne pas sauvegarder l'état de frappe
        })),
        lastUpdated: Date.now(),
      };

      await AsyncStorage.setItem(getChatHistoryKey(childId), JSON.stringify(historyToSave));
      console.log(`💾 Historique du chat sauvegardé pour l'enfant ${childId}:`, state.messages.length, 'messages');
    } catch (error) {
      console.error(`❌ Erreur lors de la sauvegarde pour l'enfant ${childId}:`, error);
    }
  };

  // Ajouter un message (texte ou vocal)
  const addMessage = (sender, text, messageType = 'text', audioData = null) => {
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // ID unique
      sender,
      text,
      message_type: messageType,
      timestamp: Date.now(),
      typing: false,
      // Données audio si c'est un message vocal
      ...(messageType === 'audio' && audioData && {
        audio_path: audioData.audioPath,
        audio_duration: audioData.audioDuration,
        audio_size: audioData.audioSize,
      }),
    };

    dispatch({
      type: CHAT_ACTIONS.ADD_MESSAGE,
      payload: message,
    });

    return message;
  };

  // Mettre à jour un message en cours de frappe
  const updateTypingMessage = (text, messageId = null, recommendationData = null) => {
    dispatch({
      type: CHAT_ACTIONS.UPDATE_TYPING_MESSAGE,
      payload: { text, messageId, recommendationData },
    });
  };

  // Terminer la frappe et retourner l'ID du message
  const finishTyping = () => {
    // Récupérer l'ID du dernier message en cours de frappe AVANT de dispatcher
    const lastBotMessage = state.messages.filter(msg => msg.sender === 'bot' && msg.typing).pop();
    const messageId = lastBotMessage?.id;

    console.log('🔄 finishTyping appelé:', {
      totalMessages: state.messages.length,
      botMessages: state.messages.filter(msg => msg.sender === 'bot').length,
      typingMessages: state.messages.filter(msg => msg.typing).length,
      lastBotMessage: lastBotMessage ? { id: lastBotMessage.id, text: lastBotMessage.text?.substring(0, 30) + '...' } : null,
      messageId
    });

    dispatch({ type: CHAT_ACTIONS.FINISH_TYPING });

    // Retourner l'ID trouvé AVANT le dispatch
    return messageId;
  };

  // Ajouter l'audio à un message existant
  const addAudioToMessage = (messageId, audioPath) => {
    console.log('🎵 addAudioToMessage appelé:', { messageId, audioPath });
    dispatch({
      type: CHAT_ACTIONS.ADD_AUDIO_TO_MESSAGE,
      payload: { messageId, audioPath }
    });
  };

  // Effacer l'historique pour l'enfant actuel
  const clearHistory = async () => {
    try {
      if (!currentChildId) {
        console.warn('⚠️ Aucun enfant actif pour effacer l\'historique');
        return;
      }

      await Promise.all([
        AsyncStorage.removeItem(getChatHistoryKey(currentChildId)),
        AsyncStorage.removeItem(getWelcomeShownKey(currentChildId))
      ]);
      dispatch({ type: CHAT_ACTIONS.CLEAR_HISTORY });
      console.log(`🗑️ Historique du chat effacé pour l'enfant ${currentChildId}`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'effacement pour l'enfant ${currentChildId}:`, error);
    }
  };

  // Ajouter le message de bienvenue dynamique si nécessaire
  const addWelcomeMessage = async (generateDynamicWelcome) => {
    if (!state.hasHistory && !state.isLoading && !state.hasWelcomeMessageBeenShown) {
      // Marquer le message de bienvenue comme affiché immédiatement pour éviter les doublons
      dispatch({ type: CHAT_ACTIONS.SET_WELCOME_SHOWN });

      // Sauvegarder le flag dans AsyncStorage pour cet enfant
      try {
        if (currentChildId) {
          await AsyncStorage.setItem(getWelcomeShownKey(currentChildId), 'true');
          console.log(`👋 Génération du message de bienvenue dynamique pour l'enfant ${currentChildId}...`);
        }
      } catch (error) {
        console.error('❌ Erreur sauvegarde flag bienvenue:', error);
      }

      // Générer le message de bienvenue dynamique via l'API
      if (generateDynamicWelcome && typeof generateDynamicWelcome === 'function') {
        try {
          await generateDynamicWelcome();
        } catch (error) {
          console.error('❌ Erreur génération message dynamique:', error);
          // Fallback vers le message statique en cas d'erreur
          const fallbackMessage = {
            id: `msg_welcome_${Date.now()}`,
            sender: 'bot',
            text: '👋 أهلاً بك! أنا مساعد أبجيم الذكي، كيف يمكنني مساعدتك؟',
            timestamp: Date.now(),
            typing: false,
          };

          dispatch({
            type: CHAT_ACTIONS.ADD_MESSAGE,
            payload: fallbackMessage,
          });
        }
      } else {
        // Message statique par défaut si pas de fonction fournie
        const welcomeMessage = {
          id: `msg_welcome_${Date.now()}`,
          sender: 'bot',
          text: '👋 أهلاً بك! أنا مساعد أبجيم الذكي، كيف يمكنني مساعدتك؟',
          timestamp: Date.now(),
          typing: false,
        };

        dispatch({
          type: CHAT_ACTIONS.ADD_MESSAGE,
          payload: welcomeMessage,
        });
      }
    }
  };

  // Valeurs du contexte
  const contextValue = {
    // État
    messages: state.messages,
    isLoading: state.isLoading,
    hasHistory: state.hasHistory,
    hasWelcomeMessageBeenShown: state.hasWelcomeMessageBeenShown,

    // Actions
    addMessage,
    updateTypingMessage,
    finishTyping,
    addAudioToMessage,
    clearHistory,
    addWelcomeMessage,
    loadChatHistory,
  };

  return (
    <ChatHistoryContext.Provider value={contextValue}>
      {children}
    </ChatHistoryContext.Provider>
  );
};

// Hook pour utiliser le contexte
export const useChatHistory = () => {
  const context = useContext(ChatHistoryContext);
  if (!context) {
    throw new Error('useChatHistory doit être utilisé dans un ChatHistoryProvider');
  }
  return context;
};

export default ChatHistoryContext;
