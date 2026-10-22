import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TextTicker from 'react-native-text-ticker';
import API_BASE_URL from "../utils/Config";
const SubscriptionBanner = () => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [type, setType] = useState(null);
  const [accessCode, setAccessCode] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      const token = await AsyncStorage.getItem("tokenChild");
      const childData = await AsyncStorage.getItem("activeChild");
      const child = JSON.parse(childData);

      try {
        const res = await fetch(`${API_BASE_URL}/subscription/status/${child.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setStatus(data.status);
        setType(data.type);
        setAccessCode(data.access_code || null);
      } catch (err) {
        console.log("Erreur:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading || !status || status === "approved" || status === "delivered") return null;

  const message =
    type === "cash"
      ? "📦 جاري توصيل بطاقة اشتراكك إلى العنوان المحدد. الرجاء الانتظار..."
      : "📄 جاري التحقق من إثبات الدفع الخاص بك. الرجاء الانتظار...";

  return (
    <View style={styles.banner}>
      <TextTicker
  style={styles.text}
  duration={7000}
  loop
  bounce={false}
  repeatSpacer={50}
  marqueeDelay={1000}
>
  {message}
</TextTicker>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#FF9800",
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderRadius: 8,
  },
  text: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
});

export default SubscriptionBanner;
