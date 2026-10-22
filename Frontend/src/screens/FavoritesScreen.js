import React, { useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { fetchFavorites, toggleFavorite } from "../reducers/auth/AuthAction";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const getInitials = (fullName) => {
  if (!fullName) return "؟";
  const names = fullName.trim().split(" ");
  return names.length >= 2
    ? (names[0][0] + names[1][0]).toUpperCase()
    : names[0].slice(0, 2).toUpperCase();
};

const FavoritesScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { webinars, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchFavorites());
  }, [dispatch]);

  const favoriteWebinars = webinars.filter(webinar => webinar.isFavorite);

  const handleToggleFavorite = (webinarId) => {
    dispatch(toggleFavorite(webinarId));
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0097A7" style={styles.loading} />
      ) : (
        <FlatList
          data={favoriteWebinars}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.webinarsList}
          ListHeaderComponent={(
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={28} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerText}>دروسي الإضافية المفضلة</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.webinarCard}>
              <Image source={{ uri: `https://www.abajim.com/${item.image_cover}` }} style={styles.image} />
              <View style={styles.details}>
                <Text style={styles.title} numberOfLines={1}>{item.slug}</Text>
                <View style={styles.infoRow}>
                  {item.teacher?.avatar ? (
                    <Image
                      source={{ uri: `https://www.abajim.com/${item.teacher.avatar}` }}
                      style={styles.teacherAvatar}
                    />
                  ) : (
                    <View style={styles.initialsCircle}>
                      <Text style={styles.initialsText}>{getInitials(item.teacher?.full_name)}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Teacher", { teacherId: item.teacher?.id })}
                  >
                    <Text style={[styles.detailText, { textDecorationLine: "underline", color: "#0097A7" }]}>
                      {item.teacher?.full_name || "غير متوفر"}
                    </Text>
                  </TouchableOpacity>
                </View>  
                <Text style={styles.description} numberOfLines={2}>
                  {item.description || "لا يوجد وصف متاح لهذا الدرس."}
                </Text>

                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={18} color="#0097A7" />
                  <Text style={styles.detailText}>
                    {item.duration ? `${item.duration} دقيقة` : "غير متوفر"}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="cash-outline" size={18} color="#0097A7" />
                  <Text style={styles.detailText}>
                    {item.price ? `${item.price} د.ت` : "مجاني"}
                  </Text>
                </View>

               
              </View>
              <TouchableOpacity
                style={styles.heartButton}
                onPress={() => handleToggleFavorite(item.id)}
              >
                <Ionicons name="heart" size={28} color="red" />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.noFavorites}>🚫 لا يوجد دروس مفضلة.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    backgroundColor: "#0097A7",
    paddingHorizontal: 20,
    paddingVertical: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: "center",
    position: "relative",
    marginBottom: 15,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
  },
  backButton: { 
    position: "absolute", 
    left: 20, 
    top: 50, 
    zIndex: 10 
  },
  webinarsList: { paddingBottom: 90 },
  webinarCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 15,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    justifyContent: "space-between",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 15,
    marginRight: 15,
  },
  details: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F3B64",
    marginBottom: 4,
    textAlign: "right",
  },
  description: {
    fontSize: 14,
    color: "#777",
    textAlign: "right",
  },
  infoRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: 3,
  },
  detailText: { 
    fontSize: 14, 
    color: "#555", 
    marginRight: 6 
  },
  teacherAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginLeft: 5,
  },
  initialsCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#0097A7",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5,
  },
  initialsText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 12,
  },
  heartButton: {
    marginLeft: 10,
  },
  noFavorites: { 
    textAlign: "center", 
    fontSize: 18, 
    color: "#777", 
    marginTop: 30 
  },
});

export default FavoritesScreen;
