import React, { useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  Image,
  StyleSheet,
  View,
  Text,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const ChatFloatingBubble = React.memo(({
  bubblePosition,
  bubbleScale,
  hasNewMessage,
  unreadCount = 0,
  onPress,
  isDraggable = true,
  bottomOffset = 0,
}) => {
  const dragOffset = useRef(new Animated.ValueXY()).current;
  const isDragging = useRef(false);

  // PanResponder pour rendre la bulle draggable
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isDraggable,
      onMoveShouldSetPanResponder: () => isDraggable,

      onPanResponderGrant: () => {
        isDragging.current = true;
        dragOffset.setOffset({
          x: dragOffset.x._value,
          y: dragOffset.y._value,
        });
        dragOffset.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: Animated.event(
        [null, { dx: dragOffset.x, dy: dragOffset.y }],
        { useNativeDriver: false }
      ),

      onPanResponderRelease: (evt, gestureState) => {
        dragOffset.flattenOffset();

        // Si c'est un tap (pas un drag), déclencher onPress avec un délai
        if (Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10) {
          // Délai plus long pour éviter les conflits avec les animations
          setTimeout(() => {
            if (onPress) onPress();
          }, 100);
        }

        // Snap to edges (optionnel)
        const currentX = bubblePosition.x._value + dragOffset.x._value;
        const currentY = bubblePosition.y._value + dragOffset.y._value;

        // Contraintes pour rester dans l'écran
        const constrainedX = Math.max(20, Math.min(width - 80, currentX));
        const constrainedY = Math.max(80, Math.min(height - 200, currentY)); // Marge plus haute pour éviter d'être trop bas

        // Snap vers le bord le plus proche (gauche ou droite)
        const snapX = constrainedX < width / 2 ? 20 : width - 80;

        Animated.spring(dragOffset, {
          toValue: {
            x: snapX - bubblePosition.x._value,
            y: constrainedY - bubblePosition.y._value
          },
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start(() => {
          // Mettre à jour la position de base
          bubblePosition.setValue({
            x: snapX,
            y: constrainedY,
          });
          dragOffset.setValue({ x: 0, y: 0 });
        });

        isDragging.current = false;
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.bubbleContainer,
        {
          transform: [
            { translateX: Animated.add(bubblePosition.x, dragOffset.x) },
            { translateY: Animated.add(Animated.add(bubblePosition.y, dragOffset.y), bottomOffset) },
            { scale: bubbleScale },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={styles.bubble}
        activeOpacity={0.8}
        onPress={onPress} // Toujours actif pour permettre le re-clic
      >
        {/* Image du chatbot */}
        <Image
          source={require('../../assets/icons/Chatbot.png')}
          style={styles.chatbotImage}
          resizeMode="contain"
        />

        {/* Badge de notification pour nouveau message */}
        {hasNewMessage && (
          <Animated.View style={styles.badge}>
            {unreadCount > 0 ? (
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            ) : (
              <View style={styles.badgeInner} />
            )}
          </Animated.View>
        )}

        {/* Icône de fermeture quand le chat est ouvert (optionnel) */}
        {/* <View style={styles.closeIcon}>
          <Ionicons name="close" size={16} color="#fff" />
        </View> */}
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  bubbleContainer: {
    position: 'absolute',
    zIndex: 1000,
  },
  bubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0097A7',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 3,
    borderColor: '#fff',
  },
  chatbotImage: {
    width: 35,
    height: 35,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  badgeInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF4444',
  },
  badgeText: {
    color: '#FF4444',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  closeIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatFloatingBubble;
