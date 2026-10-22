import { useRef } from 'react';
import { Animated, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const useStableAnimatedValues = () => {
  // Position initiale : position intermédiaire quand le chat est fermé
  const initialPosition = {
    x: width / 2 - 30,
    y: height - 120, // Position intermédiaire - pas trop haut, pas trop bas
  };

  // Position flottante : très haut à droite quand le chat est ouvert
  const floatingPosition = {
    x: width - 80,
    y: 40, // Encore plus haut pour ne pas gêner l'interface de chat
  };

  // Créer les valeurs animées une seule fois
  const animatedValues = useRef({
    bubblePosition: new Animated.ValueXY(initialPosition),
    bubbleScale: new Animated.Value(1),
    chatOpacity: new Animated.Value(0),
    chatTranslateY: new Animated.Value(-height),
    initialPosition,
    floatingPosition,
  }).current;

  return animatedValues;
};
