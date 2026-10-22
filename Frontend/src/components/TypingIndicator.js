import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';

const TypingIndicator = ({ isVisible = false }) => {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      // Animation d'apparition du conteneur
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Animation des points qui bougent
      const animateSequence = () => {
        const createDotAnimation = (animValue, delay) => {
          return Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ]);
        };

        return Animated.loop(
          Animated.parallel([
            createDotAnimation(dot1Anim, 0),
            createDotAnimation(dot2Anim, 200),
            createDotAnimation(dot3Anim, 400),
          ])
        );
      };

      const animation = animateSequence();
      animation.start();

      return () => {
        animation.stop();
        dot1Anim.setValue(0);
        dot2Anim.setValue(0);
        dot3Anim.setValue(0);
      };
    } else {
      // Animation de disparition
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const getDotStyle = (animValue) => ({
    opacity: animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    transform: [
      {
        scale: animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1.2],
        }),
      },
    ],
  });

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <View style={styles.messageRow}>
        {/* Avatar du bot */}
        <View style={styles.botAvatarContainer}>
          <Image
            source={require('../../assets/icons/Chatbot.png')}
            style={styles.botAvatarImage}
            resizeMode="contain"
          />
        </View>

        {/* Bulle de frappe */}
        <View style={styles.typingBubble}>
          {/* <Text style={styles.typingText}>مساعد أباجيم يكتب</Text> */}
          <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, getDotStyle(dot1Anim)]} />
            <Animated.View style={[styles.dot, getDotStyle(dot2Anim)]} />
            <Animated.View style={[styles.dot, getDotStyle(dot3Anim)]} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    marginHorizontal: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  botAvatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0097A7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  botAvatarImage: {
    width: 24,
    height: 24,
  },
  typingBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 14,
    maxWidth: '75%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typingText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
    textAlign: 'right',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0097A7',
    marginHorizontal: 2,
  },
});

export default TypingIndicator;
