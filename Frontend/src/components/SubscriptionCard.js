import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from "react-redux";
import { checkChildSubscription } from "../reducers/auth/AuthAction";

const SubscriptionCard = ({ subscribe_id = 3, amount = 80, onClose }) => {
  const navigation = useNavigation();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const dispatch = useDispatch();
  const subscription = useSelector((state) => state.auth.subscriptionInfo);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
    }).start();
  }, []);

  // useEffect(() => {
  //   dispatch(checkChildSubscription());
  // }, []);

  const isCardInDelivery = subscription?.card_ordered && subscription?.card_status !== "approved";
  const isBankTransferPending = subscription?.bank_transfer && subscription?.parent_transfer_status === "pending";

  const shouldHideCard = subscription?.subscription_active || isCardInDelivery || isBankTransferPending;

  if (shouldHideCard) {
    return null; 
  }

  const handleSubscribe = () => {
    navigation.navigate("SubscriptionScreen");
  };

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient
          colors={['#e0f7fa', '#ffffff']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.card}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>

          <Image
            source={require("../../assets/images/2151103639-removebg-preview.png")}
            style={styles.packImage}
          />

          <Text style={styles.packTitle}>
            عرض الكرطابلة - اشتراك كامل للكتب المدرسية 📚
          </Text>

          <View style={styles.priceContainer}>
            <Text style={styles.oldPrice}>120 د.ت</Text>
            <Text style={styles.newPrice}>80 د.ت</Text>
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleSubscribe}>
            <Text style={styles.btnText}>إشترك الآن</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 9999,
    justifyContent: "center",
    alignItems: "center",
  },
  cardWrapper: {
    width: width * 0.8,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  closeBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 999,
    backgroundColor: "#f5f5f5",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  closeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F3B64",
  },
  packImage: {
    width: 150,
    height: 150,
    resizeMode: "contain",
    marginBottom: 10,
  },
  packTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F3B64",
    marginBottom: 10,
    textAlign: "center",
  },
  priceContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  oldPrice: {
    fontSize: 16,
    textDecorationLine: "line-through",
    color: "#888",
    marginHorizontal: 8,
  },
  newPrice: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  btn: {
    backgroundColor: "#1F3B64",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 10,
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default SubscriptionCard;
