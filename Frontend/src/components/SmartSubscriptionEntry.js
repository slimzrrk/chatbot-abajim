import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import SubscriptionCard from "./SubscriptionCard";
import FloatingBubble from "./FloatingBubble";

const SmartSubscriptionEntry = () => {
  const [showCard, setShowCard] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCard(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.overlay}>
      {showCard ? (
        <SubscriptionCard
          subscribe_id={3}
          amount={120}
          onClose={() => setShowCard(false)}
        />
      ) : (
        <FloatingBubble />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    pointerEvents: "box-none",
  },
});

export default SmartSubscriptionEntry;
