import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  Animated,
  Image,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { getWalletBalance, fetchCart, checkout , fetchWebinarsByLevel} from "../reducers/auth/AuthAction";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

const CheckoutScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const walletBalance = useSelector((state) => state.auth.walletBalance);
  const cartItems = useSelector((state) => state.auth.cartItems);
  const isLoading = useSelector((state) => state.auth.isLoading);
  const [checkoutDone, setCheckoutDone] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const activeChild = useSelector((state) => state.auth.activeChild);


  useEffect(() => {
    dispatch(getWalletBalance());
    dispatch(fetchCart());
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [dispatch]);

  const calculateTotal = () => {
    return cartItems.reduce((acc, item) => {
      const content = item?.webinar || item?.meeting;
      return acc + (parseFloat(content?.price || 0));
    }, 0);
  };

  const handleConfirm = async () => {
    try {
      await dispatch(checkout());
      setCheckoutDone(true);
  
      if (activeChild?.level_id) {
        await dispatch(fetchWebinarsByLevel(activeChild.level_id));
      }      
  
      Alert.alert("🎉 تم الدفع بنجاح!", "يمكنك الآن الدخول إلى الدروس التي قمت بشرائها.");
    } catch (e) {
      console.error("Erreur checkout:", e); // utile en debug
      Alert.alert("خطأ", "حدث خطأ أثناء تنفيذ عملية الدفع.");
    }
  };
  

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#0097A7", "#0097A7"]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color="white" />
                  </TouchableOpacity>
        <Text style={styles.headerText}>تأكيد عملية الدفع</Text>
      </LinearGradient>

      <View style={{ alignItems: "center", marginTop: 10 }}>
        <Image
          source={require("../../assets/images/checkout.png")}
          style={{ width: 160, height: 160, resizeMode: "contain" }}
        />
      </View>

      <Animated.View style={[styles.summaryBox, { opacity: fadeAnim }]}>
        <LinearGradient colors={["#e0f7fa", "#ffffff"]} style={styles.innerSummary}>
          <View style={styles.summaryRow}>
            <Ionicons name="card" size={20} color="#0097A7" style={styles.icon} />
            <Text style={styles.label}>الرصيد المتاح:</Text>
            <Text style={styles.value}>{typeof walletBalance === 'number' ? walletBalance.toFixed(3) : "..."} د.ت</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="cart" size={20} color="#0097A7" style={styles.icon} />
            <Text style={styles.label}>مجموع المشتريات:</Text>
            <Text style={styles.value}>{calculateTotal().toFixed(3)} د.ت</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id?.toString()}
        renderItem={({ item }) => {
          const content = item.webinar || item.meeting;
          return (
            <Animated.View style={[styles.itemBox, { opacity: fadeAnim }]}>
              <Text style={styles.itemText}>{content?.translations?.[0]?.title || content?.title}</Text>
              <Text style={styles.price}>{parseFloat(content?.price || 0).toFixed(3)} د.ت</Text>
            </Animated.View>
          );
        }}
        contentContainerStyle={{ paddingBottom: 40 }}
      />

      <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} disabled={isLoading}>
        <LinearGradient colors={["#0097A7", "#0097A7"]} style={styles.gradient}>
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.confirmText}>✔️ إتمام العملية الآن</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {checkoutDone && (
        <Animated.View style={[styles.successMessage, { opacity: fadeAnim }]}>
          <Ionicons name="checkmark-circle" size={24} color="#0097A7" />
          <Text style={styles.successText}>✅ تمت العملية بنجاح! يمكنك الآن مشاهدة دروسك.</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9" },
  header: {
    paddingVertical: 50,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 30,
  },
  backButton: { padding: 5 },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
    flex: 1,
  },
  summaryBox: {
    margin: 20,
    borderRadius: 20,
    elevation: 5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  innerSummary: {
    padding: 25,
  },
  summaryRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  icon: {
    marginLeft: 8,
  },
  label: {
    fontSize: 20,
    color: "#333",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  value: {
    fontSize: 20,
    fontWeight: "700",
    color: "#00796B",
    textAlign: "left",
    minWidth: 80,
  },
  itemBox: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  itemText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    textAlign: "right",
    flex: 1,
  },
  price: { fontSize: 16, color: "#00796B", fontWeight: "bold" },
  confirmBtn: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 6,
  },
  gradient: {
    paddingVertical: 18,
    alignItems: "center",
  },
  confirmText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  successMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginHorizontal: 20,
    padding: 12,
    backgroundColor: "#e0f2f1",
    borderRadius: 12,
  },
  successText: {
    marginLeft: 8,
    color: "#2e7d32",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default CheckoutScreen;
