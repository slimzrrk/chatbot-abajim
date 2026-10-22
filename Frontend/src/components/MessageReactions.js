import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

const MessageReactions = ({ message, isUser, onReaction }) => {
  const [showReactions, setShowReactions] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState(message.reaction || null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const reactions = ['👍', '❤️', '😊', '😮', '😢', '😡'];

  // Ne pas afficher les réactions pour les messages utilisateur
  if (isUser) {
    return null;
  }

  const toggleReactions = () => {
    const toValue = showReactions ? 0 : 1;
    setShowReactions(!showReactions);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleReaction = (emoji) => {
    const newReaction = selectedReaction === emoji ? null : emoji;
    setSelectedReaction(newReaction);

    // Animation de feedback
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Callback pour sauvegarder la réaction
    if (onReaction) {
      onReaction(message.id, newReaction);
    }

    // Fermer le panneau de réactions après un délai
    setTimeout(() => {
      toggleReactions();
    }, 500);
  };

  return (
    <View style={styles.container}>
      {/* Bouton + pour ajouter une réaction */}
      {!selectedReaction && (
        <TouchableOpacity
          style={styles.addReactionButton}
          onPress={toggleReactions}
        >
          <Text style={styles.addReactionText}>+</Text>
        </TouchableOpacity>
      )}

      {/* Panneau de réactions */}
      {showReactions && (
        <Animated.View
          style={[
            styles.reactionsPanel,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {reactions.map((emoji, index) => (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.reactionOption,
                selectedReaction === emoji && styles.selectedReaction,
              ]}
              onPress={() => handleReaction(emoji)}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}

      {/* Affichage de la réaction sélectionnée */}
      {selectedReaction && !showReactions && (
        <TouchableOpacity
          style={styles.selectedReactionDisplay}
          onPress={toggleReactions}
        >
          <Text style={styles.selectedReactionEmoji}>{selectedReaction}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginTop: 4,
    alignItems: 'flex-start',
  },
  addReactionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addReactionText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  reactionsPanel: {
    position: 'absolute',
    top: -50,
    left: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  reactionOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  selectedReaction: {
    backgroundColor: '#0097A7',
    transform: [{ scale: 1.1 }],
  },
  reactionEmoji: {
    fontSize: 18,
  },
  selectedReactionDisplay: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0097A7',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  selectedReactionEmoji: {
    fontSize: 16,
  },
});

export default MessageReactions;
