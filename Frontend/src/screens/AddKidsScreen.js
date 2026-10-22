import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { addChild, updateChild } from "../reducers/auth/AuthAction";

const AddKidsScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.auth.isLoading);
  const childrenCount = useSelector((state) => state.auth.children.length);
  const route = useRoute();
  const existingChild = route.params?.child || null;

  const [kidsList, setKidsList] = useState([]);
  const [childName, setChildName] = useState(existingChild?.full_name || "");
  const [selectedGender, setSelectedGender] = useState(
    existingChild?.sexe === "Garçon" ? "male" :
    existingChild?.sexe === "Fille" ? "female" : null
  );
  const [selectedLevel, setSelectedLevel] = useState(existingChild ? existingChild.level_id - 5 : null);

  const levelIcons = {
    1: require("../../assets/icons/one.png"),
    2: require("../../assets/icons/two.png"),
    3: require("../../assets/icons/three.png"),
    4: require("../../assets/icons/four.png"),
    5: require("../../assets/icons/five.png"),
    6: require("../../assets/icons/six.png"),
  };

  const mapLevelToBackend = (level) => level + 5;
  const formatGender = (gender) => (gender === "male" ? "Garçon" : "Fille");

  const handleSaveChild = () => {
    if (!childName || !selectedGender || !selectedLevel) {
      Alert.alert("⚠️ خطأ", "يرجى ملء جميع الحقول قبل المتابعة");
      return;
    }

    const backendLevelId = mapLevelToBackend(selectedLevel);

    if (existingChild) {
      const updatedChild = {
        id: existingChild.id,
        nom: childName,
        level_id: backendLevelId,
        sexe: formatGender(selectedGender),
      };

      dispatch(updateChild(updatedChild, () => {
        Alert.alert("✅ تم تحديث الطفل بنجاح");
        navigation.navigate("Settings");
      }));
    } else {
      const newChild = {
        Nom: childName,
        sexe: formatGender(selectedGender),
        level_id: backendLevelId,
      };

      dispatch(addChild(newChild, navigation));
    }
  };

  const handleSubmitAll = () => {
    kidsList.forEach((child) => dispatch(addChild(child, navigation)));
    navigation.navigate("Books");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.container}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Image source={require("../../assets/icons/back.png")} style={styles.backIcon} />
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.title}>قم بملء البيانات لإضافة طفلك</Text>
            </View>

            <TouchableOpacity style={styles.avatarContainer}>
  {existingChild && existingChild.avatar ? (
    <Image source={{ uri: `https://www.abajim.com/${existingChild.avatar}` }} style={styles.avatarImage} />
  ) : (
    <Image source={require("../../assets/images/kids.jpg")} style={styles.image} />
  )}
</TouchableOpacity>


            <Text style={styles.label}>الاسم</Text>
            <View style={styles.inputContainer}>
              <Image source={require("../../assets/icons/user.png")} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="الاسم"
                placeholderTextColor="#DADADA"
                value={childName}
                onChangeText={setChildName}
              />
            </View>

            <Text style={styles.label}>الجنس</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[styles.genderButton, selectedGender === "male" && styles.selectedButton]}
                onPress={() => setSelectedGender("male")}
              >
                <Image source={require("../../assets/icons/male.png")} style={styles.genderIcon} />
                <Text style={styles.genderText}>ذكر</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderButton, selectedGender === "female" && styles.selectedButton]}
                onPress={() => setSelectedGender("female")}
              >
                <Image source={require("../../assets/icons/female.png")} style={styles.genderIcon} />
                <Text style={styles.genderText}>أنثى</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>المستوى الدراسي</Text>
            <View style={styles.levelContainer}>
              <View style={styles.levelRow}>
                {[1, 2, 3].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[styles.levelButton, selectedLevel === level && styles.selectedLevel]}
                    onPress={() => setSelectedLevel(level)}
                  >
                    <Image source={levelIcons[level]} style={styles.levelIcon} />
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.levelRow}>
                {[4, 5, 6].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[styles.levelButton, selectedLevel === level && styles.selectedLevel]}
                    onPress={() => setSelectedLevel(level)}
                  >
                    <Image source={levelIcons[level]} style={styles.levelIcon} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <FlatList
              data={kidsList}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.kidItem}>
                  <Text style={styles.kidText}>{item.Nom} - {item.sexe} - مستوى {item.level_id - 5}</Text>
                </View>
              )}
              style={{ width: '100%' }}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              scrollEnabled={false}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.addButton} onPress={handleSaveChild} disabled={loading}>
                <Text style={styles.buttonText}>
                  {loading ? "جاري الحفظ..." : existingChild ? "تحديث الطفل" : "إضافة طفل"}
                </Text>
              </TouchableOpacity>

              {kidsList.length > 0 && (
                <TouchableOpacity style={styles.addButton} onPress={handleSubmitAll}>
                  <Text style={styles.buttonText}>التالي</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F5F5F5",
    padding: 30,
    paddingBottom: 120,
    alignItems: "center",
  },
  avatarContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#1F3B64",
  },
  image: {
    width: 230,
    height: 150,
    resizeMode: "contain",
    marginBottom: 20,
  },
  
  header: { marginBottom: 30 },
  title: { fontSize: 22, fontWeight: "bold", textAlign: "center", color: "#1F3B64" },
  image: { width: 230, height: 150, resizeMode: "contain", marginBottom: 20 },
  label: { fontSize: 20, fontWeight: "bold", marginBottom: 10, alignSelf: "flex-end", color: "#1F3B64" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "#FFF",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F3B64",
    marginBottom: 15,
  },
  input: { flex: 1, fontSize: 18, textAlign: "right", color: "#1F3B64" },
  genderContainer: { flexDirection: "row", justifyContent: "center", width: "100%", marginBottom: 10 },
  genderButton: {
    backgroundColor: "#E0E0E0",
    padding: 10,
    borderRadius: 12,
    marginHorizontal: 25,
    alignItems: "center",
    flexDirection: "row",
  },
  genderIcon: { width: 35, height: 32, marginRight: 5 },
  genderText: { fontSize: 20, color: "#1F3B64" },
  selectedButton: { backgroundColor: "#0097A7" },
  levelContainer: { flexDirection: "column", alignItems: "center", marginBottom: 20 },
  levelRow: { flexDirection: "row", justifyContent: "center", marginBottom: 10 },
  levelButton: {
    width: 75,
    height: 70,
    backgroundColor: "#E0E0E0",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    margin: 10,
  },
  selectedLevel: { backgroundColor: "#0097A7" },
  levelIcon: { width: 60, height: 60 },
  buttonContainer: { flexDirection: "row", justifyContent: "center", flexWrap: "wrap", width: "100%" },
  addButton: {
    backgroundColor: "#1F3B64",
    padding: 13,
    borderRadius: 12,
    alignItems: "center",
    width: "45%",
    margin: 7,
  },
  backButton: {
    position: 'absolute',
    top: 30,
    left: 15,
    zIndex: 999,
  },
  buttonText: { fontSize: 20, color: "#FFF", fontWeight: "bold" },
  kidItem: { marginVertical: 5 },
  kidText: { color: "#1F3B64", fontSize: 16 },
});

export default AddKidsScreen;
