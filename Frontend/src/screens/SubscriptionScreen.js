import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { subscribeToPack, checkChildSubscription } from "../reducers/auth/AuthAction";

const SubscriptionScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [accessCode, setAccessCode] = useState("");

  const subscription = useSelector((state) => state.auth.subscriptionInfo);

  useEffect(() => {
    dispatch(checkChildSubscription());
  }, []);

  const handleSelectPayment = (method) => {
    setSelectedPayment(method);
  };

  const handleUploadProof = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
    });
    if (!result.canceled) {
      setPaymentProof(result.assets[0]);
    }
  };

  const handleSubscribe = () => {
    if (!selectedPayment) {
      Alert.alert("❌ خطأ", "الرجاء اختيار طريقة الدفع.");
      return;
    }

    if (selectedPayment === "cash" && (!phone || !address)) {
      Alert.alert("❌ خطأ", "يرجى ملء رقم الهاتف والعنوان.");
      return;
    }

    if (selectedPayment === "bank" && !paymentProof) {
      Alert.alert("❌ خطأ", "يرجى رفع إثبات الدفع.");
      return;
    }

    // Ici tu peux aussi utiliser accessCode si besoin !
    dispatch(subscribeToPack(selectedPayment, phone, address, paymentProof, navigation));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBack}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الإشتراك والدفع</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.packContainer}>
          <Image
            source={require("../../assets/images/2151103639-removebg-preview.png")}
            style={styles.packImage}
          />
          <Text style={styles.packTitle}>عرض الكرطابلة - إشتراك كامل في الكتب المدرسية 📚</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.oldPrice}>120 د.ت</Text>
            <Text style={styles.newPrice}>80 د.ت</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>طرق الدفع</Text>

        <View style={styles.paymentOptionsRow}>
          <TouchableOpacity
            style={[styles.paymentOption, selectedPayment === "cash" && styles.selectedOption]}
            onPress={() => handleSelectPayment("cash")}
          >
            <Text style={styles.paymentTitle}>💳 الدفع عند الاستلام</Text>
            <Text style={styles.paymentDescription}>
              يمكنك الدفع عند استلام بطاقة إشتراك "أبجيم".
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, selectedPayment === "bank" && styles.selectedOption]}
            onPress={() => handleSelectPayment("bank")}
          >
            <Text style={styles.paymentTitle}>🏦 تحويل بنكي أو بريدي</Text>
            <Text style={styles.paymentDescription}>
              قم بتحويل المبلغ، ثم ارفع إثبات الدفع لإتمام الإشتراك.
            </Text>
          </TouchableOpacity>
        </View>

        {selectedPayment === "cash" && (
          <>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>📦 سيتم تسليم البطاقة إلى عنوانك والدفع عند الاستلام.</Text>
            </View>

            <Text style={styles.sectionTitle}>معلومات الاتصال</Text>

            <View style={styles.formContainer}>
              <TextInput
                placeholder="رقم الهاتف"
                placeholderTextColor="#aaa"
                style={styles.input}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
              <TextInput
                placeholder="عنوان التوصيل"
                placeholderTextColor="#aaa"
                style={styles.input}
                value={address}
                onChangeText={setAddress}
              />
            </View>
          </>
        )}

        {selectedPayment === "bank" && (
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>📄 معلومات التحويل البنكي</Text>
            <Text style={styles.bankDetails}>اسم الحساب: SOCIETE ABAJIM</Text>
            <Text style={styles.bankDetails}>RIB: 04204067008666779780</Text>
            <Text style={styles.bankDetails}>البنك: البنك التجاري</Text>

            <TouchableOpacity onPress={handleUploadProof} style={styles.uploadButton}>
              <Ionicons name="cloud-upload" size={24} color="#0097A7" />
              <Text style={styles.uploadButtonText}>
                {paymentProof ? "✅ تم تحميل الملف" : "ارفع إثبات الدفع"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {subscription?.card_status === "approved" && (
          <View style={styles.accessCodeContainer}>
            <Text style={styles.sectionTitle}>📇 أدخل رمز البطاقة</Text>
            <TextInput
              placeholder="أدخل رمز البطاقة هنا"
              placeholderTextColor="#aaa"
              style={styles.input}
              value={accessCode}
              onChangeText={setAccessCode}
            />
          </View>
        )}

        <TouchableOpacity style={styles.confirmButton} onPress={handleSubscribe}>
          <Text style={styles.confirmButtonText}>تأكيد الإشتراك</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0097A7",
    paddingVertical: 40,
    paddingHorizontal: 15,
    justifyContent: "center",
  },
  goBack: { position: "absolute", left: 15 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  scrollContent: { padding: 20, paddingBottom: 100 },
  packContainer: {
    backgroundColor: "#F0F8FF",
    borderRadius: 15,
    padding: 15,
    alignItems: "center",
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  packImage: { width: 150, height: 140, resizeMode: "contain", marginBottom: 0 },
  packTitle: { fontSize: 18, fontWeight: "bold", color: "#1F3B64", marginBottom: 10, textAlign: "center" },
  priceContainer: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "center" },
  oldPrice: { fontSize: 16, textDecorationLine: "line-through", color: "#888", marginHorizontal: 8 },
  newPrice: { fontSize: 20, fontWeight: "bold", color: "#4CAF50" },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#1F3B64", marginBottom: 10, textAlign: "right" },
  paymentOptionsRow: { flexDirection: "row-reverse", justifyContent: "space-between", gap: 10, marginBottom: 20 },
  paymentOption: { backgroundColor: "#f0f0f0", padding: 15, borderRadius: 12, flex: 1, borderWidth: 2, borderColor: "transparent" },
  selectedOption: { backgroundColor: "#e0f7fa", borderColor: "#0097A7" },
  paymentTitle: { fontSize: 18, fontWeight: "bold", color: "#1F3B64", marginBottom: 5, textAlign: "right" },
  paymentDescription: { fontSize: 16, color: "#555", textAlign: "right" },
  infoBox: { backgroundColor: "#E0F7FA", padding: 15, borderRadius: 12, marginTop: 20, marginBottom: 10, borderWidth: 1, borderColor: "#DDD" },
  infoTitle: { fontSize: 18, fontWeight: "bold", color: "#1F3B64", marginBottom: 10, textAlign: "right" },
  infoText: { fontSize: 16, color: "#333", textAlign: "right" },
  bankDetails: { fontSize: 16, color: "#333", marginBottom: 5, textAlign: "right" },
  uploadButton: { flexDirection: "row", alignItems: "center", marginTop: 15, backgroundColor: "#d7f3f7", padding: 10, borderRadius: 8, alignSelf: "center" },
  uploadButtonText: { fontSize: 16, color: "#0097A7", marginLeft: 10 },
  formContainer: { marginBottom: 20 },
  input: { backgroundColor: "#f9f9f9", padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#ddd", marginBottom: 15, textAlign: "right", fontSize: 16 },
  accessCodeContainer: { backgroundColor: "#f0f8ff", padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: "#ddd" },
  confirmButton: { backgroundColor: "#0097A7", padding: 15, borderRadius: 12, alignItems: "center", marginTop: 20 },
  confirmButtonText: { fontSize: 18, color: "#fff", fontWeight: "bold" },
});

export default SubscriptionScreen;
