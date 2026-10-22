import { useEffect, useRef } from 'react';
import { useChatBubbleContext } from '../context/ChatBubbleContext';

export const useNewMessageDetection = () => {
  const { addNewMessage, markMessagesAsRead, isChatOpen } = useChatBubbleContext();
  const lastMessageCount = useRef(0);
  
  // Fonction pour simuler la détection de nouveaux messages
  // Dans une vraie app, ceci serait connecté à votre système de chat
  const simulateNewMessage = () => {
    if (!isChatOpen) {
      addNewMessage();
    }
  };
  
  // Fonction pour marquer les messages comme lus
  const markAsRead = () => {
    markMessagesAsRead();
  };
  
  // Effet pour simuler des messages périodiques (pour test)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simuler un nouveau message toutes les 30 secondes
      if (Math.random() > 0.7) { // 30% de chance
        simulateNewMessage();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isChatOpen]);
  
  // Marquer comme lu quand le chat s'ouvre
  useEffect(() => {
    if (isChatOpen) {
      markAsRead();
    }
  }, [isChatOpen]);
  
  return {
    simulateNewMessage,
    markAsRead,
  };
};
