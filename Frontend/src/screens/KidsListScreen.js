import React from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import BottomNavigation from "../components/BottomNavigation";
import { deleteChild } from "../reducers/auth/AuthAction";

// ✅ Fonction pour récupérer l'URL correcte de l'avatar
const getAvatarUrl = (avatar) => {
  return avatar?.startsWith("http")
    ? avatar
    : `https://www.abajim.com/${avatar?.startsWith("/") ? avatar.substring(1) : avatar}`;
};

// ✅ Fonction pour extraire les initiales du nom
const getInitials = (fullName) => {
  if (!fullName) return "؟";
  const names = fullName.split(" ");
  return names.map((n) => n[0]).join("").toUpperCase();
};

// ✅ Mapping des niveaux scolaires
const LEVELS_MAP = {
  6: "الأولى ابتدائي",
  7: "الثانية ابتدائي",
  8: "الثالثة ابتدائي",
  9: "الرابعة ابتدائي",
  10: "الخامسة ابتدائي",
  11: "السّادسة ابتدائي",
};

// ✅ Fonction pour récupérer le nom du niveau
const getLevelName = (levelId) => LEVELS_MAP[levelId] || "غير محدد";

const KidsListScreen = () => {
  const children = useSelector((state) => state.auth.children);
  const navigation = useNavigation();
  const dispatch = useDispatch();

  // ✅ Fonction pour gérer la suppression d'un enfant
  const handleDeleteChild = (childId) => {
    Alert.alert(
      "تأكيد الحذف",
      " هل أنت متأكد أنك تريد حذف هذا الطفل؟     ",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "حذف",
          style: "destructive",
          onPress: async () => {
            await dispatch(deleteChild(childId));
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* ✅ Header avec Bouton Retour */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>أطفالي</Text>
      </View>

      {/* ✅ Liste des Enfants */}
      <FlatList
        data={children}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.childWrapper}>
            {/* ✅ Avatar ou Initiales */}
            <View style={styles.avatarWrapper}>
              {item.avatar ? (
                <Image source={{ uri: getAvatarUrl(item.avatar) }} style={styles.childAvatar} />
              ) : (
                <View style={styles.initialsWrapper}>
                  <Text style={styles.initialsText}>{getInitials(item.full_name)}</Text>
                </View>
              )}
            </View>

            {/* ✅ Infos de l'enfant */}
            <View style={styles.childInfo}>
              <Text style={styles.childName}>{item.full_name}</Text>
              <Text style={styles.childLevel}>{getLevelName(item.level_id)}</Text>
            </View>

            {/* ✅ Bouton Modifier */}
            <TouchableOpacity
              onPress={() => navigation.navigate("AddKids", { child: item })}
              style={styles.iconButton}
            >
              <Ionicons name="create-outline" size={24} color="#0097A7" />
            </TouchableOpacity>

            {/* ✅ Bouton Supprimer */}
            <TouchableOpacity onPress={() => handleDeleteChild(item.id)} style={styles.iconButton}>
              <Ionicons name="trash-outline" size={24} color="red" />
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          children.length < 4 && (
            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("AddKids")}>
              <Ionicons name="add-circle" size={60} color="#0097A7" />
            </TouchableOpacity>
          )
        }
      />

      {/* ✅ Bottom Navigation */}
      <View style={styles.bottomNav}>
        <BottomNavigation />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },

  // ✅ Header Styling
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0097A7",
    paddingVertical: 50,
    paddingHorizontal: 15,
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    left: 15,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },

  listContainer: { padding: 20 },

  // ✅ Styling des cartes enfants
  childWrapper: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    elevation: 2,
  },

  // ✅ Avatar Styling
  avatarWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#0097A7",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  childAvatar: { width: 60, height: 60, borderRadius: 30 },
  initialsWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#0097A7",
    justifyContent: "center",
    alignItems: "center",
  },
  initialsText: { fontSize: 22, color: "white", fontWeight: "bold" },

  childInfo: { flex: 1, alignItems: "flex-end" },
  childName: { fontSize: 18, fontWeight: "bold", color: "#1F3B64", textAlign: "right" },
  childLevel: { fontSize: 14, color: "#707070", textAlign: "right" },

  iconButton: { marginHorizontal: 5 },

  // ✅ Position dynamique du bouton +
  addButton: {
    alignSelf: "center",
    marginVertical: 20,
    backgroundColor: "white",
    borderRadius: 50,
    padding: 10,
    elevation: 5,
  },

  bottomNav: { position: "absolute", bottom: 0, width: "100%" },
});

export default KidsListScreen;
