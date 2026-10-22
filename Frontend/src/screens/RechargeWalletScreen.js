import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  I18nManager,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useDispatch } from "react-redux";
import { subscribeToPack } from "../reducers/auth/AuthAction";
import { LinearGradient } from "expo-linear-gradient";

I18nManager.forceRTL(false);

const RechargeWalletScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [method, setMethod] = useState("bank");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentProof, setPaymentProof] = useState(null);

  const handlePickProof = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled) {
      setPaymentProof(result.assets[0]);
    }
  };

  const handleSubmit = () => {
    if (method === "bank" && !paymentProof) {
      return Alert.alert("⚠️ الرجاء تحميل صورة لإثبات الدفع البنكي.");
    }
    if (method === "cash" && (!phone || !address)) {
      return Alert.alert("⚠️ الرجاء إدخال رقم الهاتف والعنوان لتوصيل البطاقة.");
    }

    dispatch(subscribeToPack(method, phone, address, paymentProof, navigation));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 160 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerText}>شحن الرصيد</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.intro}>اختر الطريقة التي تفضلها لإعادة شحن رصيدك بسهولة:</Text>

        <View style={styles.toggleRow}>
          <TouchableOpacity onPress={() => setMethod("bank")} style={[styles.methodBtn, method === "bank" && styles.selectedMethod]}>
            <Text style={[styles.methodText, method === "bank" && styles.whiteText]}>💳 تحويل بنكي</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMethod("cash")} style={[styles.methodBtn, method === "cash" && styles.selectedMethod]}>
            <Text style={[styles.methodText, method === "cash" && styles.whiteText]}>🚚 توصيل البطاقة</Text>
          </TouchableOpacity>
        </View>

        {method === "cash" && (
          <View>
            <Text style={styles.label}>📞 رقم الهاتف للتواصل</Text>
            <TextInput
              placeholder="مثال: 20 123 456"
              style={styles.inputLarge}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <Text style={styles.label}>🏠 العنوان الكامل</Text>
            <TextInput
              placeholder="مثال: شارع الحبيب بورقيبة، تونس العاصمة"
              style={styles.inputLarge}
              value={address}
              onChangeText={setAddress}
            />
          </View>
        )}

        {method === "bank" && (
          <View>
            <Text style={styles.label}>📤 تحميل صورة إثبات الدفع</Text>
            <TouchableOpacity onPress={handlePickProof} style={styles.uploadBtn}>
              <Ionicons name="cloud-upload-outline" size={24} color="#00796B" />
              <Text style={styles.uploadText}>اختيار ملف</Text>
            </TouchableOpacity>
            {paymentProof && (
              <Image source={{ uri: paymentProof.uri }} style={styles.preview} />
            )}
            <Text style={styles.notice}>💡 الرجاء التأكد من أن الصورة تحتوي على جميع تفاصيل التحويل.</Text>
          </View>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <LinearGradient colors={["#00796B", "#004D40"]} style={styles.gradientBtn}>
          <Text style={styles.submitText}>
  {method === "bank" ? "✔️ تأكيد التحويل البنكي" : "✔️ تأكيد طلب التوصيل"}
</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4f8" },
  header: {
    backgroundColor: "#0097A7",
    padding: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: { position: "absolute", left: 15 },
  headerText: { fontSize: 24, fontWeight: "bold", color: "#FFF" },
  content: { padding: 20 },
  intro: { fontSize: 18, color: "#333", marginBottom: 25, textAlign: "right", lineHeight: 28 },
  toggleRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 25 },
  methodBtn: {
    borderWidth: 1,
    borderColor: "#0097A7",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 25,
    backgroundColor: "#fff",
  },
  selectedMethod: {
    backgroundColor: "#0097A7",
  },
  methodText: { color: "#006064", fontWeight: "bold", fontSize: 16 },
  whiteText: { color: "#FFF" },
  label: { fontSize: 17, marginTop: 12, marginBottom: 6, color: "#333", textAlign: "right" },
  inputLarge: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 12,
    textAlign: "right",
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#00796B",
    borderRadius: 10,
    padding: 14,
    backgroundColor: "#e0f2f1",
    marginTop: 8,
    gap: 10,
  },
  uploadText: { color: "#00796B", fontWeight: "bold", fontSize: 16 },
  preview: { width: "100%", height: 240, marginTop: 12, borderRadius: 10 },
  notice: { marginTop: 12, fontStyle: "italic", color: "#666", fontSize: 15, textAlign: "right" },
  submitBtn: { marginTop: 40 },
  gradientBtn: { padding: 16, borderRadius: 12, alignItems: "center" },
  submitText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
});

export default RechargeWalletScreen;