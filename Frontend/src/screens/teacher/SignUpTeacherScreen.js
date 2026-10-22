import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ImageBackground, Image,
  ActivityIndicator, Keyboard, TouchableWithoutFeedback, ScrollView
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { register } from "../../reducers/auth/AuthAction";

export default function SignUpTeacherScreen({ navigation }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});

  const dispatch = useDispatch();
  const loading = useSelector((state) => state.auth.isLoading);
  const error = useSelector((state) => state.auth.error);

  const validate = () => {
    const newErrors = {};

    // Full Name validation
    if (!fullName || fullName.trim().length < 6) {
      newErrors.fullName = "الاسم يجب أن يحتوي على 6 أحرف على الأقل.";
    }

    // Email validation
    if (!email) {
      newErrors.email = "البريد الإلكتروني مطلوب.";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "البريد الإلكتروني غير صالح.";
    }

    // Mobile validation
    if (!mobile) {
      newErrors.mobile = "رقم الهاتف مطلوب.";
    } else if (!/^\d{8}$/.test(mobile)) {
      newErrors.mobile = "رقم الهاتف يجب أن يحتوي على 8 أرقام.";
    }

    // Password validation
    if (!password) {
      newErrors.password = "كلمة المرور مطلوبة.";
    } else if (password.length < 6) {
      newErrors.password = "كلمة السر يجب أن تحتوي على 6 أحرف على الأقل.";
    }

    // Confirm Password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = "يرجى تأكيد كلمة المرور.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "كلمتا السر غير متطابقتين.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = () => {
    if (!validate()) return;

    dispatch(register(fullName, email, mobile, password, 4, navigation)); // Role 4 = Teacher
  };

  const inputStyle = (field) => [
    styles.input,
    errors[field] ? { borderColor: "red" } : null,
  ];

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ImageBackground
        source={require("../../../assets/images/ba1.png")}
        style={styles.background}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require("../../../assets/images/logocolors.png")}
            style={styles.logo}
          />
          <Text style={styles.title}>إنشاء حساب معلم جديد 🧑‍🏫</Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* Full Name */}
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

          {/* Email */}
          <Text style={styles.label}>البريد الإلكتروني</Text>
          <TextInput
            style={inputStyle("email")}
            placeholder="أدخل البريد الإلكتروني"
            placeholderTextColor="#888"
            keyboardType="email-address"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrors((prev) => ({ ...prev, email: null }));
            }}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          {/* Mobile */}
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

          {/* Password */}
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

          {/* Confirm Password */}
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

          {/* Register Button */}
          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>إنشاء حساب معلم</Text>
            )}
          </TouchableOpacity>

          {/* Go Back */}
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.loginLink}>رجوع إلى تسجيل الولي</Text>
          </TouchableOpacity>
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
    backgroundColor: "#1F3B64",
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
