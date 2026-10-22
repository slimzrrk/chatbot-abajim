import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useSelector } from "react-redux";

const NotificationIcon = ({ onPress }) => {
  const notificationCount = useSelector(
    (state) => state.auth.notifications?.length || 0
  );

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Image
        source={require("../../assets/icons/notifications.png")}
        style={styles.icon}
      />
      {notificationCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {notificationCount > 9 ? "9+" : notificationCount}
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
  icon: {
    width: 28,
    height: 28,
    resizeMode: "contain"
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

export default NotificationIcon;
