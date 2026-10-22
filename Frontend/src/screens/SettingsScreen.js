import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  I18nManager,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchParentInfo, updateProfileImage, Logout } from "../reducers/auth/AuthAction";
import BottomNavigation from "../components/BottomNavigation";
import ChildSwitcher from "../components/ChildSwitcher";
import ChatBubbleWrapper from "../components/ChatBubbleWrapper";
import API_BASE_URL from "../utils/Config";

const BASE_URL = API_BASE_URL.replace("/api", "");

I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

const SettingsScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const parentInfo = useSelector((state) => state.auth.parentInfo);
  const isLoading = useSelector((state) => state.auth.isLoading);
  const [profileImage, setProfileImage] = useState(parentInfo?.avatar || null);

  useEffect(() => {
    dispatch(fetchParentInfo());
  }, [dispatch]);

  useEffect(() => {
    if (parentInfo?.avatar) {
      setProfileImage(parentInfo.avatar);
    }
  }, [parentInfo]);

  const getInitials = (fullName) => {
    if (!fullName) return "؟";
    const names = fullName.split(" ");
    return names.length >= 2 ? (names[0][0] + names[1][0]).toUpperCase() : names[0][0].toUpperCase();
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      const selectedImage = result.assets[0].uri;
      setProfileImage(selectedImage);
      dispatch(updateProfileImage(selectedImage, (success) => {
        Alert.alert(success ? "✅ تم تحديث الصورة بنجاح!" : "❌ فشل تحميل الصورة، حاول مرة أخرى.");
      }));
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.coverContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerText}>الإعدادات</Text>
        </View>

        <View style={styles.profileContainer}>
          <TouchableOpacity onPress={pickImage}>
            {profileImage ? (
              <Image source={{ uri: `${BASE_URL}${profileImage}` }} style={styles.avatar} />
            ) : (
              <View style={styles.initialsCircle}>
                <Text style={styles.initialsText}>{getInitials(parentInfo?.full_name)}</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.name}>{ parentInfo?.full_name || "المستخدم"}</Text>
        </View>

        <View style={styles.childSwitcherSection}>
          <Text style={styles.childSwitcherTitle}>اضغط على صورة طفلك للتغيير الحساب</Text>
          <ChildSwitcher />
        </View>

        <TouchableOpacity style={styles.option} onPress={() => navigation.navigate("ParentInfo")}>
          <Text style={styles.optionText}>معلوماتي الشخصية</Text>
          <Ionicons name="person-outline" size={24} color="#1F3B64" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => navigation.navigate("KidsList")}>
          <Text style={styles.optionText}>أطفالي</Text>
          <Ionicons name="people-outline" size={24} color="#1F3B64" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => navigation.navigate("ParentDashboardScreen")}>
        <Text style={styles.optionText}>نشاط الطفل</Text>
        <Ionicons name="bar-chart-outline" size={24} color="#1F3B64" />
      </TouchableOpacity>


        <TouchableOpacity style={styles.option} onPress={() => navigation.navigate("Favorites")}>
          <Text style={styles.optionText}>دروسي الإضافية المفضلة</Text>
          <Ionicons name="heart-outline" size={24} color="#1F3B64" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.option} onPress={() => navigation.navigate("ReservedMeetings")}>
          <Text style={styles.optionText}>حصصي المباشرة المحجوزة</Text>
          <Ionicons name="videocam-outline" size={24} color="#1F3B64" />
        </TouchableOpacity>

        {/* <TouchableOpacity style={styles.option} onPress={() => navigation.navigate("Notifications")}>
          <Text style={styles.optionText}>إشعارات</Text>
          <Ionicons name="notifications-outline" size={24} color="#1F3B64" />
        </TouchableOpacity> */}

        <TouchableOpacity style={styles.option} onPress={() => navigation.navigate("MyCard")}>
          <Text style={styles.optionText}>بطاقتي</Text>
          <Ionicons name="card-outline" size={24} color="#1F3B64" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={() => dispatch(Logout(navigation))}>
          <View style={{ flexDirection: "row-reverse", alignItems: "center" }}>
            <Ionicons name="log-out-outline" size={23} color="white" style={{ marginLeft: 7 }} />
            <Text style={styles.buttonText}>تسجيل خروج</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.bottomNav}>
        <BottomNavigation />
      </View>

      {/* ✅ Bulle de chat flottante */}
      <ChatBubbleWrapper />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  scrollContent: { alignItems: "center", paddingBottom: 100 },

  coverContainer: {
    height: 140,
    backgroundColor: "#0097A7",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  headerText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 15,
  },
  backButton: { position: "absolute", top: 50, left: 15, zIndex: 2 },

  profileContainer: {
    alignItems: "center",
    marginTop: -50,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#FFF",
    backgroundColor: "#EEE",
    zIndex: 2,
  },
  initialsCircle: {
    width: 95,
    height: 95,
    borderRadius: 50,
    backgroundColor: "#0097A7",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    borderWidth: 3,
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  initialsText: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#FFF",
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F3B64",
    marginTop: 10,
  },

  childSwitcherSection: {
    width: "90%",
    backgroundColor: "#E0F7FA",
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
  },
  childSwitcherTitle: {
    fontSize: 16,
    color: "#1F3B64",
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },

  option: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#FFF",
    width: "90%",
    padding: 15,
    marginTop: 10,
    borderRadius: 8,
    justifyContent: "space-between",
  },
  optionText: {
    fontSize: 18,
    color: "#1F3B64",
    textAlign: "right",
    flex: 1,
  },
  logoutButton: {
    flexDirection: "row-reverse",
    backgroundColor: "#f44336",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 50,
    width: "90%",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#FFF",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#E0E0E0",
  },
});

export default SettingsScreen;