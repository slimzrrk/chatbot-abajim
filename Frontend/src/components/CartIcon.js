import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useSelector } from "react-redux";

const CartIcon = ({ onPress }) => {
  const cartCount = useSelector((state) => state.auth.cartItems?.length || 0); // Assure-toi que cartItems est bien dans Redux

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Icon name="cart-outline" size={30} color="#1f3c88" />
      {cartCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {cartCount > 9 ? "9+" : cartCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 6,
    position: "relative"
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ff3b30",
    borderRadius: 10,
    minWidth: 20,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center"
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold"
  }
});

export default CartIcon;
