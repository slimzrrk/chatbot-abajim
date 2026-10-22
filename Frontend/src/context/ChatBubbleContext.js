import React, { createContext, useContext, useState, useMemo } from 'react';
import { Animated } from 'react-native';
import { useStableAnimatedValues } from '../hooks/useStableAnimatedValues';

const ChatBubbleContext = createContext();

export const useChatBubbleContext = () => {
  const context = useContext(ChatBubbleContext);
  if (!context) {
    throw new Error('useChatBubbleContext must be used within a ChatBubbleProvider');
  }
  return context;
};

export const ChatBubbleProvider = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Utiliser les valeurs animées stables
  const {
    bubblePosition,
    bubbleScale,
    chatOpacity,
    chatTranslateY,
    initialPosition,
    floatingPosition,
  } = useStableAnimatedValues();

  // Animation d'ouverture du chat
  const openChat = React.useCallback(() => {
    if (isChatOpen || isAnimating) return; // Éviter les animations multiples

    setIsAnimating(true);
    setIsChatOpen(true);
    setHasNewMessage(false);
    setUnreadCount(0);

    Animated.parallel([
      Animated.spring(bubblePosition, {
        toValue: floatingPosition,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }),
      Animated.parallel([
        Animated.timing(chatOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.spring(chatTranslateY, {
          toValue: 0,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }),
      ]),
    ]).start(() => {
      // Animation terminée
      setIsAnimating(false);
    });
  }, [isChatOpen, isAnimating, bubblePosition, chatOpacity, chatTranslateY, floatingPosition]);

  // Animation de fermeture du chat
  const closeChat = React.useCallback(() => {
    if (!isChatOpen || isAnimating) return; // Éviter les animations multiples

    setIsAnimating(true);

    Animated.parallel([
      Animated.spring(bubblePosition, {
        toValue: initialPosition,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }),
      Animated.parallel([
        Animated.timing(chatOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.spring(chatTranslateY, {
          toValue: chatTranslateY._value < 0 ? chatTranslateY._value : -500, // Retourne en haut
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }),
      ]),
    ]).start(() => {
      setIsChatOpen(false);
      setIsAnimating(false);
    });
  }, [isChatOpen, isAnimating, bubblePosition, chatOpacity, chatTranslateY, initialPosition]);

  // Toggle chat
  const toggleChat = React.useCallback(() => {
    if (isChatOpen) {
      closeChat();
    } else {
      openChat();
    }
  }, [isChatOpen, closeChat, openChat]);

  // Animation de pulsation pour nouveau message
  const pulseAnimation = React.useCallback(() => {
    Animated.sequence([
      Animated.timing(bubbleScale, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(bubbleScale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [bubbleScale]);

  // Ajouter un nouveau message
  const addNewMessage = React.useCallback(() => {
    if (!isChatOpen) {
      setHasNewMessage(true);
      setUnreadCount(prev => prev + 1);
      pulseAnimation();
    }
  }, [isChatOpen, pulseAnimation]);

  // Marquer les messages comme lus
  const markMessagesAsRead = React.useCallback(() => {
    setHasNewMessage(false);
    setUnreadCount(0);
  }, []);

  const value = useMemo(() => ({
    isChatOpen,
    hasNewMessage,
    unreadCount,
    isAnimating,
    bubblePosition,
    bubbleScale,
    chatOpacity,
    chatTranslateY,
    toggleChat,
    openChat,
    closeChat,
    addNewMessage,
    markMessagesAsRead,
    setHasNewMessage,
  }), [
    isChatOpen,
    hasNewMessage,
    unreadCount,
    isAnimating,
    bubblePosition,
    bubbleScale,
    chatOpacity,
    chatTranslateY,
    toggleChat,
    openChat,
    closeChat,
    addNewMessage,
    markMessagesAsRead,
  ]);

  return (
    <ChatBubbleContext.Provider value={value}>
      {children}
    </ChatBubbleContext.Provider>
  );
};
