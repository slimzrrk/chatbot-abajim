import React, { useRef } from "react";
import {
  Animated,
  PanResponder,
  Text,
  StyleSheet,
  Dimensions,
  View,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const FloatingBubble = () => {
  const navigation = useNavigation();
  const { width, height } = Dimensions.get("window");

  const pan = useRef(new Animated.ValueXY({ x: width - 100, y: height - 200 })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  const handlePress = () => {
    navigation.navigate("SubscriptionScreen");
  };

  return (
    <Animated.View
      style={[
        styles.bubble,
        { transform: [{ translateX: pan.x }, { translateY: pan.y }] }
      ]}
      {...panResponder.panHandlers}
    >
      <Pressable onPress={handlePress} style={styles.inner}>
        <Text style={styles.emoji}>✨</Text>
        <Text style={styles.label}>إشترك الأن</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1f3c88",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    elevation: 10,
    shadowColor: "#ffd700",
    shadowOpacity: 0.4,
    shadowOffset: { width: 3, height: 3 },
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: "#ffd700",
  },
  inner: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  emoji: {
    fontSize: 28,
    marginBottom: 3,
  },
  label: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
});

export default FloatingBubble;
