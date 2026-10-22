import React from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import { useSelector } from "react-redux";

const ActiveChildHeaderAvatar = () => {
  const activeChild = useSelector((state) => state.auth.activeChild);

  if (!activeChild) return null;

  const getInitials = (fullName) => {
    const names = fullName?.trim().split(" ");
    return names?.length >= 2
      ? names[0][0] + names[1][0]
      : names?.[0]?.slice(0, 2) || "؟";
  };

  const avatarUrl = activeChild.avatar?.startsWith("http")
    ? activeChild.avatar
    : `https://www.abajim.com/${activeChild.avatar?.startsWith("/") ? activeChild.avatar.substring(1) : activeChild.avatar}`;

  return (
    <View style={styles.container}>
      <View style={styles.avatarWrapper}>
        {activeChild.avatar ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.initialsContainer}>
            <Text style={styles.initialsText}>{getInitials(activeChild.full_name)}</Text>
          </View>
        )}
        <View style={styles.greenDot} />
      </View>
      <Text style={styles.name} numberOfLines={1}>{activeChild.full_name}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginRight: 40,
    maxWidth: 60,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4caf50",
    borderWidth: 2,
    borderColor: "#fff",
  },
  initialsContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4caf50",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  initialsText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  name: {
    fontSize: 10,
    color: "#fff",
    marginTop: 2,
    textAlign: "center",
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "limegreen",
    position: "absolute",
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: "#fff",
  },
});

export default ActiveChildHeaderAvatar;
