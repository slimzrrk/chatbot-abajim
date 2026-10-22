import React from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Text,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";

const BottomNavigation = () => {
  const navigation = useNavigation();
  const activeChild = useSelector((state) => state.auth.activeChild);

  const avatarUrl = activeChild?.avatar?.startsWith("http")
  // ? activeChild.avatar
  // : `https://www.abajim.com/${activeChild?.avatar?.startsWith("/") ? activeChild.avatar.slice(1) : activeChild?.avatar}`;

  const getInitials = (name) => {
    if (!name) return "؟";
    const parts = name.trim().split(" ");
    return parts.map((p) => p[0]).join("").toUpperCase();
  };

  return (
    <View style={styles.wrapper}>
      {/* ✅ Espace réservé pour la bulle flottante (invisible) */}
      <View style={styles.avatarWrapper}>
        {/* La bulle sera positionnée par ChatBubbleSystem */}
      </View>

      {/* ✅ Navigation en bas */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => navigation.navigate("Settings")} style={styles.navItem}>
          <Image source={require("../../assets/icons/user (4).png")} style={styles.navIcon} />
          <Text style={styles.navText} numberOfLines={1}>الإعدادات</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("LiveSession")} style={styles.navItem}>
          <Image source={require("../../assets/icons/live-stream (4).png")} style={styles.navIcon} />
          <Text style={styles.navText} numberOfLines={1}>الدروس المباشرة</Text>
        </TouchableOpacity>



        {/* 🧒 Avatar = vide mais espace réservé */}
        {/* <View style={styles.avatarSpacer} /> */}

        <TouchableOpacity onPress={() => navigation.navigate("Webinars")} style={styles.navItem}>
          <Image source={require("../../assets/icons/study (1).png")} style={styles.navIcon} />
          <Text style={styles.navText} numberOfLines={1}>الدروس الإضافية</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Books")} style={styles.navItem}>
          <Image source={require("../../assets/icons/books-stack-of-three.png")} style={styles.navIcon} />
          <Text style={styles.navText} numberOfLines={1}>الكتب المدرسية</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "transparent",
  },

  // avatarWrapper: {
  //   position: "absolute",
  //   top: -26,
  //   left: "50%",
  //   transform: [{ translateX: -30 }],
  //   backgroundColor: "#fff",
  //   borderRadius: 35,
  //   borderWidth: 2,
  //   borderColor: "#22bec8",
  //   padding: 2,
  //   width: 60,
  //   height: 60,
  //   zIndex: 10,
  //   alignItems: "center",
  //   justifyContent: "center",
  //   elevation: 5,
  //   shadowColor: "#002",
  //   shadowOpacity: 0,
  //   shadowOffset: { width: 0, height: 1 },
  //   shadowRadius: 3,
  // },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#E0E0E0",
  },

  initialsWrapper: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#4caf50",
    alignItems: "center",
    justifyContent: "center",
  },

  initialsText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  // activeDot: {
  //   position: "absolute",
  //   bottom: 4,
  //   right: 4,
  //   width: 10,
  //   height: 10,
  //   backgroundColor: "#4caf50",
  //   borderRadius: 5,
  //   borderWidth: 1.5,
  //   borderColor: "#fff",
  // },

  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFF",
    paddingTop: 20,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  navItem: {
    alignItems: "center",
    width: 80, // augmenté depuis 60
  },

  navIcon: {
    width: 26,
    height: 26,
    marginBottom: 2,
  },

  navText: {
    fontSize: 10,
    color: "#1F3B64",
    textAlign: "center",
    fontWeight: "600",
    flexWrap: "nowrap",
    maxWidth: 80,
  },

  avatarSpacer: {
    width: 60,
  },
});

export default BottomNavigation;
