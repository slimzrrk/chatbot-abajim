import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ImageBackground, Image,
  ActivityIndicator, Keyboard, TouchableWithoutFeedback, ScrollView
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { register } from "../reducers/auth/AuthAction";

export default function SignUpScreen({ navigation }) {
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});

  const dispatch = useDispatch();
  const loading = useSelector((state) => state.auth.isLoading);
  const error = useSelector((state) => state.auth.error);

  const validate = () => {
    const newErrors = {};
    if (!fullName || fullName.length < 6)
      newErrors.fullName = "الاسم يجب أن يحتوي على 6 أحرف على الأقل.";
    if (!mobile || !/^\d{8}$/.test(mobile))
      newErrors.mobile = "الرقم يجب أن يحتوي على 8 أرقام.";
    if (!password || password.length < 6)
      newErrors.password = "كلمة السر يجب أن تحتوي على 6 أحرف على الأقل.";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "كلمتا السر غير متطابقتين.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = () => {
    if (!validate()) return;
    dispatch(register(fullName, mobile, password, 3, navigation));
  };

  const inputStyle = (field) => [
    styles.input,
    errors[field] ? { borderColor: "red" } : null,
  ];

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ImageBackground
        source={require("../../assets/images/ba1.png")}
        style={styles.background}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require("../../assets/images/logocolors.png")}
            style={styles.logo}
          />
          <Text style={styles.title}> إبدأ رحلة تعلمية إستثنائية مع أبجيم 🚀 </Text>
          <Text style={styles.title}>إنشاء حساب جديد</Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Text style={styles.label}>الاسم الكامل</Text>
          <TextInput
            style={inputStyle("fullName")}
            placeholder="أدخل الاسم الكامل"
            placeholderTextColor="#888"
            value={fullName}
            onChangeText={(text) => {
              setFullName(text);
              setErrors((prev) => ({ ...prev, fullName: null }));
            }}
          />
          {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

          <Text style={styles.label}>رقم الهاتف</Text>
          <TextInput
            style={inputStyle("mobile")}
            placeholder="أدخل رقم الهاتف"
            placeholderTextColor="#888"
            keyboardType="number-pad"
            value={mobile}
            onChangeText={(text) => {
              setMobile(text);
              setErrors((prev) => ({ ...prev, mobile: null }));
            }}
          />
          {errors.mobile && <Text style={styles.errorText}>{errors.mobile}</Text>}

          <Text style={styles.label}>كلمة المرور</Text>
          <TextInput
            style={inputStyle("password")}
            placeholder="أدخل كلمة المرور"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrors((prev) => ({ ...prev, password: null }));
            }}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <Text style={styles.label}>تأكيد كلمة المرور</Text>
          <TextInput
            style={inputStyle("confirmPassword")}
            placeholder="أعد إدخال كلمة المرور"
            placeholderTextColor="#888"
            secureTextEntry
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setErrors((prev) => ({ ...prev, confirmPassword: null }));
            }}
          />
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          )}

          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>إنشاء حساب</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
            <Text style={styles.loginLink}>لديك حساب بالفعل؟ تسجيل الدخول</Text>
          </TouchableOpacity>
          {/* <TouchableOpacity onPress={() => navigation.navigate("SignUpTeacher")}>
              <Text style={[styles.loginLink, { color: "#FF5722", marginTop: 15 }]}>
                هل أنت معلم؟ سجل كمعلم هنا
              </Text>
            </TouchableOpacity> */}
        </ScrollView>
      </ImageBackground>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  scrollContainer: {
    paddingTop: 100,
    paddingBottom: 40,
    alignItems: "center",
    width: "100%",
  },
  logo: { width: 200, height: 70, marginBottom: 50 },
  title: {
    fontSize: 21,
    color: "#1F3B64",
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    alignSelf: "flex-end",
    marginRight: "5%",
    fontSize: 15,
    fontWeight: "bold",
    color: "#1F3B64",
    marginBottom: 5,
  },
  input: {
    width: "90%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 15,
    textAlign: "right",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  buttonPrimary: {
    width: "90%",
    height: 50,
    backgroundColor: "#17A2B8",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
    marginBottom: 20,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  errorText: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "right",
    width: "90%",
  },
  loginLink: {
    textAlign: "center",
    color: "#1F3B64",
    fontSize: 16,
    fontWeight: "bold",
  },
});
