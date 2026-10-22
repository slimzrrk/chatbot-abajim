import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useSelector } from "react-redux";

const FavoriteIcon = ({ onPress }) => {
  const favorites = useSelector((state) => state.auth.webinars || []);
  const favoriteCount = favorites.filter(item => item.isFavorite).length;

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Icon name="heart-outline" size={28} color="#1f3c88" />
      {favoriteCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {favoriteCount > 9 ? "9+" : favoriteCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 6,
    position: "relative",
    marginLeft: 0
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

export default FavoriteIcon;
