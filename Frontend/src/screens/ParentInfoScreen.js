import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, Animated,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { updateParentInfo, fetchParentInfo, uploadParentAvatar } from "../reducers/auth/AuthAction";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import API_BASE_URL from "../utils/Config";

const BASE_URL = API_BASE_URL.replace("/api", "");

const ParentInfoScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const parentInfo = useSelector((state) => state.auth.parentInfo);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  useEffect(() => {
    dispatch(fetchParentInfo());
  }, [dispatch]);

  useEffect(() => {
    if (parentInfo) {
      setName(parentInfo.full_name || "");
      setMobile(parentInfo.mobile || "");
    }
  }, [parentInfo]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 10,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSave = () => {
    if (!name.trim() || !mobile.trim()) {
      Alert.alert("⚠️ يرجى إدخال جميع البيانات المطلوبة");
      return;
    }
    dispatch(updateParentInfo({ full_name: name, mobile }, (success) => {
      Alert.alert(success ? "✅ تم تحديث المعلومات بنجاح" : "❌ فشل التحديث");
    }));
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("❌", "صلاحيات المعرض مطلوبة");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const fileName = uri.split("/").pop();
        const ext = /\.(\w+)$/.exec(fileName)?.[1]?.toLowerCase();
        const mimeType = ext === "png" ? "image/png" : "image/jpeg";

        const formData = new FormData();
        formData.append("avatar", {
          uri,
          name: fileName,
          type: mimeType,
        });

        dispatch(uploadParentAvatar(formData));
      }
    } catch (error) {
      console.error("Erreur ImagePicker:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>معلوماتي الشخصية</Text>
      </View>

      <Animated.View style={[styles.avatarContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        {parentInfo?.avatar ? (
          <Image source={{ uri: `${BASE_URL}${parentInfo.avatar}` }} style={styles.avatar} />
        ) : (
          <View style={styles.initialsCircle}>
            <Text style={styles.initialsText}>
              {parentInfo?.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase()}
            </Text>
          </View>
        )}
        <TouchableOpacity style={styles.cameraButton} onPress={handlePickImage}>
          <Ionicons name="camera" size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
        <Text style={styles.label}>الاسم</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          textAlign="right"
          placeholder="أدخل اسمك"
          placeholderTextColor="#6B7280"
        />

        <Text style={styles.label}>رقم الهاتف</Text>
        <TextInput
          style={styles.input}
          value={mobile}
          onChangeText={setMobile}
          keyboardType="numeric"
          textAlign="right"
          placeholder="أدخل رقم هاتفك"
          placeholderTextColor="#6B7280"
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.buttonText}>حفظ التعديلات</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resetPasswordButton}
          onPress={() => navigation.navigate("ForgetPasswordScreen")}
        >
          <Text style={styles.buttonText}>إعادة تعيين كلمة المرور</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0097A7",
    paddingVertical: 50,
    paddingHorizontal: 15,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  backButton: {
    position: "absolute",
    left: 15,
    borderRadius: 20,
    padding: 10,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  avatarContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "#fff",
  },
  initialsCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#0097A7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  initialsText: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "700",
  },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 160,
    backgroundColor: "#1F3B64",
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  formContainer: {
    paddingHorizontal: 20,
    marginHorizontal: 15,
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  label: {
    fontSize: 16,
    color: "#1F3B64",
    textAlign: "right",
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
    fontSize: 16,
    marginBottom: 15,
    textAlign: "right",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButton: {
    backgroundColor: "#0097A7",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  resetPasswordButton: {
    backgroundColor: "#1F3B64",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ParentInfoScreen;