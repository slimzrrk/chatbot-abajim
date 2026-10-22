import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { getWalletBalance, fetchParentInfo } from "../reducers/auth/AuthAction";
import BottomNavigation from "../components/BottomNavigation";
import { LinearGradient } from "expo-linear-gradient";

const MyCardScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const walletBalance = useSelector((state) => state.auth.walletBalance);
  const isLoading = useSelector((state) => state.auth.isLoading);
  const parentInfo = useSelector((state) => state.auth.parentInfo);
  const animatedValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    dispatch(getWalletBalance());
    dispatch(fetchParentInfo());
  }, [dispatch]);

  const handleCardPress = () => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };

  return (
    <View style={styles.container}>
      {/* ✅ Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>بطاقتي</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ✅ Carte stylisée animée */}
        <View style={styles.cardWrapper}>
          <Animated.View style={[styles.cardShadow, { transform: [{ scale: animatedValue }] }]}>
            <TouchableOpacity activeOpacity={0.9} onPress={handleCardPress}>
              <LinearGradient
                colors={["#0097A7", "#006064"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardContent}
              >
                <View style={styles.cardTop}>
                  
                  <Text style={styles.cardLabel}>بطاقة أبجيم</Text>
                  <Text style={styles.parentName}>{parentInfo?.full_name || "اسم الولي"}</Text>
                </View>
                <View style={styles.cardBottom}>
                  <Text style={styles.balanceLabel}>الرصيد</Text>
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.balanceText}>{walletBalance} د.ت</Text>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* ✅ Bouton pour recharger */}
        <View style={styles.buttonWrapper}>
          <TouchableOpacity style={styles.rechargeBtn} onPress={() => navigation.navigate("RechargeWallet")}> 
            <Text style={styles.rechargeText}>🔄 شحن الرصيد</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ✅ Navigation inférieure */}
      <View style={styles.bottomNav}>
        <BottomNavigation />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4F8" },
  scrollContent: { paddingBottom: 120 },
  header: {
    backgroundColor: "#0097A7",
    padding: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: { position: "absolute", left: 15 },
  headerText: { fontSize: 22, fontWeight: "bold", color: "#FFF", textAlign: "center" },

  cardWrapper: { alignItems: "center", marginTop: 30 },
  cardShadow: {
    width: "90%",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 6,
    backgroundColor: "#0097A7",
  },
  cardContent: {
    padding: 40,
    borderRadius: 16,
  },
  cardTop: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  parentName: { color: "#FFF", fontSize: 18, fontWeight: "600" },
  cardLabel: { color: "#FFF", fontSize: 16, fontStyle: "italic" },

  cardBottom: { marginTop: 30, alignItems: "flex-end" },
  balanceLabel: { color: "#FFF", fontSize: 14 },
  balanceText: { color: "#FFF", fontSize: 28, fontWeight: "bold" },

  buttonWrapper: {
    paddingHorizontal: 20,
    marginTop: 80,
  },
  rechargeBtn: {
    backgroundColor: "#0097A7",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  rechargeText: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  bottomNav: { position: "absolute", bottom: 0, width: "100%" },
});

export default MyCardScreen;