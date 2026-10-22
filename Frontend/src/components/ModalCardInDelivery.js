import React, { useEffect } from "react";
import { Modal, View, Text, StyleSheet, Image } from "react-native";

const ModalCardInDelivery = ({ visible, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Image
            source={require("../../assets/images/delivery.png")} 
            style={styles.image}
          />
          <Text style={styles.title}>🚚 جاري توصيل بطاقتك!</Text>
          <Text style={styles.subtitle}>انتظر قليلاً، سيتم تسليم البطاقة إلى عنوانك قريبا.</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    width: "80%",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F3B64",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    lineHeight: 24,
  },
});

export default ModalCardInDelivery;
