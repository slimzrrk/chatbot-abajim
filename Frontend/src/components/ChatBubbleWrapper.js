import React, { useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import ChatFloatingBubble from './ChatFloatingBubble';
import ChatOverlay from './ChatOverlay';
import { useChatBubbleContext } from '../context/ChatBubbleContext';
import { useChatHistory } from '../context/ChatHistoryContext';

const ChatBubbleWrapper = ({ bottomOffset = 0 }) => {
  const {
    isChatOpen,
    hasNewMessage,
    unreadCount,
    isAnimating,
    bubblePosition,
    bubbleScale,
    chatOpacity,
    chatTranslateY,
    toggleChat,
  } = useChatBubbleContext();

  const { clearHistory } = useChatHistory();

  const lastClickTime = useRef(0);

  // Fonction avec protection contre les clics rapides
  const handleToggleChat = React.useCallback(() => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime.current;

    // Empêcher les clics si une animation est en cours ou si le dernier clic était il y a moins de 600ms
    if (isAnimating || timeSinceLastClick < 600) {
      console.log('🚫 Clic ignoré - Animation en cours ou clic trop rapide');
      return;
    }

    lastClickTime.current = now;
    toggleChat();
  }, [isAnimating, toggleChat]);

  // Fonction pour effacer l'historique avec confirmation
  const handleClearHistory = () => {
    Alert.alert(
      "🗑️ مسح المحادثة",
      "هل أنت متأكد من أنك تريد مسح جميع الرسائل؟ لا يمكن التراجع عن هذا الإجراء.",
      [
        {
          text: "إلغاء",
          style: "cancel"
        },
        {
          text: "مسح",
          style: "destructive",
          onPress: () => {
            clearHistory();
            // Optionnel: fermer le chat après effacement
            // if (isChatOpen) {
            //   toggleChat();
            // }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Bulle flottante */}
      <ChatFloatingBubble
        bubblePosition={bubblePosition}
        bubbleScale={bubbleScale}
        hasNewMessage={hasNewMessage}
        unreadCount={unreadCount}
        onPress={handleToggleChat}
        isDraggable={isChatOpen}
        bottomOffset={bottomOffset}
      />

      {/* Overlay du chat */}
      <ChatOverlay
        chatOpacity={chatOpacity}
        chatTranslateY={chatTranslateY}
        onClose={handleToggleChat}
        onClearHistory={handleClearHistory}
        isVisible={isChatOpen}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
});

export default ChatBubbleWrapper;
