import React from 'react';
import {
  Animated,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ChatOverlayContentPersistent from './ChatOverlayContentPersistent';

const { width, height } = Dimensions.get('window');

const ChatOverlay = ({
  chatOpacity,
  chatTranslateY,
  onClose,
  onClearHistory,
  isVisible,
}) => {
  // Rendu conditionnel plus stable
  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: chatOpacity,
        },
      ]}
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      {/* Background semi-transparent */}
      <TouchableOpacity
        style={styles.background}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Container du chat */}
      <Animated.View
        style={[
          styles.chatContainer,
          {
            transform: [{ translateY: chatTranslateY }],
          },
        ]}
      >
        {/* Header du chat */}
        <View style={styles.chatHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.chatTitle}>Jimini</Text>
              <Text style={styles.chatSubtitle}>متصل الآن</Text>
            </View>
          </View>

          {/* Bouton d'effacement de l'historique */}
          <TouchableOpacity
            style={styles.clearButton}
            onPress={onClearHistory}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Contenu du chat avec gestion optimisée du clavier */}
        <KeyboardAvoidingView
          style={styles.chatContent}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 115 : 180}
        >
          <View style={styles.chatScreenWrapper}>
            <ChatOverlayContentPersistent />
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    justifyContent: 'center', // Centrer le chat au milieu de l'écran
    alignItems: 'center', // Centrer horizontalement aussi
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  chatContainer: {
    height: height * 0.75, // Augmenté pour plus d'espace avec le clavier
    width: width - 20, // Largeur avec marges
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4, // Ombre vers le bas
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#0097A7',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'right',
  },
  chatSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    textAlign: 'right',
  },
  clearButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContent: {
    flex: 1,
    minHeight: 0, // Important pour permettre la compression avec le clavier
  },
  chatScreenWrapper: {
    flex: 1,
    backgroundColor: '#fff',
    minHeight: 0, // Important pour permettre la compression avec le clavier
  },
});

export default React.memo(ChatOverlay);
