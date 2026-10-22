import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import {
  Logout,
  fetchWebinarsByLevel,
  fetchWebinarsByKeyword,
  toggleFavorite,
  fetchFavorites,
  addToCart,
  fetchCart,
  removeFromCart,
} from "../reducers/auth/AuthAction";
import { Ionicons } from "@expo/vector-icons";
import BottomNavigation from "../components/BottomNavigation";
import CartIcon from "../components/CartIcon";
import NotificationIcon from "../components/NotificationIcon";
import FavoriteIcon from "../components/FavoriteIcon";
import ChatBubbleWrapper from "../components/ChatBubbleWrapper";
import Modal from "react-native-modal";
import { logChildActivity } from "../services/activityLogger";

const getInitials = (fullName) => {
  if (!fullName) return "؟";
  const names = fullName.trim().split(" ");
  return names.length >= 2 ? (names[0][0] + names[1][0]).toUpperCase() : names[0].slice(0, 2).toUpperCase();
};

const WebinarsScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const children = useSelector((state) => state.auth.children);
  const activeChild = useSelector((state) => state.auth.activeChild) || children[0];
  const { webinars, loading, cartItems } = useSelector((state) => state.auth);
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedWebinar, setSelectedWebinar] = useState(null);

  const showAccessModal = (webinar) => {
    setSelectedWebinar(webinar);
    setModalVisible(true);
  };

  const hideModal = () => {
    setModalVisible(false);
    setSelectedWebinar(null);
  };

  const handleAddToCart = () => {
    if (selectedWebinar) {
      dispatch(addToCart({ webinar_id: selectedWebinar.id })).then(() => {
        dispatch(fetchCart());
        hideModal();
      });
    }
  };
  useEffect(() => {
    logChildActivity({
      action_type: "navigation",
      screen_name: "WebinarsScreen",
    });
  }, []);

  const isInCart = (webinarId) => {
    return cartItems?.some((item) => item.webinar_id === webinarId);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => dispatch(Logout(navigation))} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="red" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, dispatch]);

  useEffect(() => {
    if (activeChild?.level_id) {
      dispatch(fetchWebinarsByLevel(activeChild.level_id));
    }
  }, [activeChild, dispatch]);

  useEffect(() => {
    if (searchText.trim() !== "" && activeChild?.level_id) {
      dispatch(fetchWebinarsByKeyword(activeChild.level_id, searchText.trim()));
    } else if (activeChild?.level_id) {
      dispatch(fetchWebinarsByLevel(activeChild.level_id));
    }
  }, [searchText]);

  useEffect(() => {
    dispatch(fetchCart());
    dispatch(fetchFavorites());
  }, [activeChild, dispatch]);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0097A7" style={styles.loading} />
      ) : (
        <FlatList
          data={webinars}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.webinarsList}
          ListHeaderComponent={
            <>
              <View style={styles.header}>
                <View style={styles.headerBottom}>
                  <Text style={styles.title}> الدروس الإضافية</Text>
                  <View style={styles.headerIcons}>
                    <NotificationIcon onPress={() => navigation.navigate("Settings", { screen: "Notifications" })} />
                    <FavoriteIcon onPress={() => navigation.navigate("Settings", { screen: "Favorites" })} />
                    <CartIcon onPress={() => navigation.navigate("CartScreen")} />
                  </View>
                </View>
              </View>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="🔎 ابحث عن درس..."
                  value={searchText}
                  onChangeText={setSearchText}
                  textAlign="right"
                />
                <TouchableOpacity
                  style={styles.searchButton}
                  onPress={() => {
                    if (searchText.trim() !== "") {
                      dispatch(fetchWebinarsByKeyword(activeChild.level_id, searchText));
                    } else {
                      dispatch(fetchWebinarsByLevel(activeChild.level_id));
                    }
                  }}
                >
                  <Ionicons name="search" size={22} color="white" />
                </TouchableOpacity>
              </View>
            </>
          }
          renderItem={({ item }) => (
            <View style={styles.webinarContainer}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  if (item.isAccessible) {
                    logChildActivity({
                      action_type: "webinar",
                      reference_id: item.id,
                    });
                    navigation.navigate("WebinarDetail", { webinarId: item.id });
                  } else {
                    showAccessModal(item);
                  }
                }}
              >
                <View style={styles.webinarCard}>
                  <Image source={{ uri: `https://www.abajim.com/${item.image_cover}` }} style={styles.webinarImage} />
                  <View style={styles.webinarDetails}>
                    <Text style={styles.webinarTitle}>
                      {item.translations?.[0]?.title || item.slug || "عنوان غير متوفر"}
                    </Text>

                    <View style={styles.infoContainer}>
                      {item.teacher?.avatar ? (
                        <Image source={{ uri: `https://www.abajim.com/${item.teacher.avatar}` }} style={styles.teacherAvatar} />
                      ) : (
                        <View style={styles.initialsCircle}>
                          <Text style={styles.initialsText}>{getInitials(item.teacher?.full_name)}</Text>
                        </View>
                      )}
                      <TouchableOpacity onPress={() => navigation.navigate("Teacher", { teacherId: item.teacher?.id })}>
                        <Text style={[styles.detailText, { textDecorationLine: "underline", color: "#0097A7" }]}>
                          {item.teacher?.full_name || "غير متوفر"}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.infoContainer}>
                      <Ionicons name="time-outline" size={18} color="#0097A7" />
                      <Text style={styles.detailText}>{item.duration ? `${item.duration} دقيقة` : "غير متوفر"}</Text>
                    </View>
                    <View style={styles.infoContainer}>
                      <Ionicons name="cash-outline" size={18} color="#0097A7" />
                      <Text style={styles.detailText}>{item.price ? `${item.price} د.ت` : "مجاني"}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.favoriteButton}
                      onPress={() => dispatch(toggleFavorite(item.id))}
                    >
                      <Ionicons
                        name={item.isFavorite ? "heart" : "heart-outline"}
                        size={22}
                        color={item.isFavorite ? "red" : "#0097A7"}
                      />
                      <Text style={styles.favoriteText}>
                        {item.isFavorite ? "إزالة من المفضلة" : "أضف إلى المفضلة"}
                      </Text>
                    </TouchableOpacity>
                    {item.price > 0 && !item.isAccessible && (
                        <TouchableOpacity
                          style={[
                            styles.cartButton,
                            isInCart(item.id) && { backgroundColor: "#e74c3c" }
                          ]}
                          onPress={() => {
                            if (isInCart(item.id)) {
                              // Si déjà dans le panier → retirer
                              const itemInCart = cartItems.find((cartItem) => cartItem.webinar_id === item.id);
                              if (itemInCart) {
                                dispatch(removeFromCart(itemInCart.id)).then(() => dispatch(fetchCart()));
                              }
                            } else {
                              // Si pas encore dans le panier → ajouter
                              dispatch(addToCart({ webinar_id: item.id })).then(() => dispatch(fetchCart()));
                            }
                          }}
                        >
                          <Ionicons name={isInCart(item.id) ? "remove-circle" : "cart"} size={20} color="#fff" />
                          <Text style={styles.cartButtonText}>
                            {isInCart(item.id) ? "إزالة من السلة" : "أضف إلى السلة"}
                          </Text>
                        </TouchableOpacity>
                      )}
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.noWebinarsText}>🚫 لا يوجد دروس متاحة لهذا المستوى</Text>}
        />
      )}

<Modal isVisible={isModalVisible} onBackdropPress={hideModal}>
  <View style={styles.modalContainer}>
    <View style={styles.iconCircle}>
      <Ionicons name="lock-closed" size={40} color="#fff" />
    </View>
    <Text style={styles.modalTitle}> 🔒 هذا الدرس غير متاح مجانا </Text>
    <Text style={styles.modalSubtitle}>
      قم بإضافته إلى السلة لتفعيله والوصول إلى محتواه المميز 🎓
    </Text>

    <View style={styles.modalActions}>
      <TouchableOpacity style={styles.confirmButton} onPress={handleAddToCart}>
        <Ionicons name="cart" size={20} color="#fff" />
        <Text style={styles.confirmText}>أضف إلى السلة الآن</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={hideModal}>
        <Text style={styles.cancelText}>🚫 لا، شكراً</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

      <BottomNavigation />
      <ChatBubbleWrapper bottomOffset={15} />
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },

  header: {
    backgroundColor: "#0097A7",
    paddingHorizontal: 20,
    paddingVertical: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: "center",
  },

  headerBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginTop: 15,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "right",
  },

  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 35,
    height: 35,
    marginLeft: 10,
  },
  searchContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 25,
    margin: 15,
    paddingHorizontal: 10,
    elevation: 3,
  },

  searchInput: { flex: 1, paddingVertical: 8, fontSize: 16, textAlign: "right" },

  searchButton: {
    backgroundColor: "#1F3B64",
    padding: 11,
    borderTopLeftRadius: 25,
    borderBottomLeftRadius: 25,
  },

  webinarsList: {
    paddingBottom: 90,
  },

  webinarContainer: {
    marginVertical: 10,
    paddingHorizontal: 15,
  },

  webinarCard: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    flexDirection: "row-reverse",
    alignItems: "center",
  },

  webinarImage: { width: 130, height: 180, borderRadius: 10 },

  webinarDetails: { marginRight: 15, flex: 1 },

  webinarTitle: { fontSize: 16, fontWeight: "bold", color: "#1F3B64", textAlign: "right" },

  infoContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },

  detailText: { fontSize: 14, color: "#555", textAlign: "right" },

  webinarDescription: { fontSize: 12, color: "#777", marginTop: 8, textAlign: "right" },

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

  noWebinarsText: {
    fontSize: 18,
    color: "#777",
    textAlign: "center",
    marginTop: 50,
  },

  logoutButton: {
    marginRight: 15,
  },

  loading: {
    marginTop: 20,
  },
  favoriteButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    marginTop: 8,
  },
  favoriteText: {
    color: "#0097A7",
    fontSize: 14,
    marginRight: 6,
  },
  addToCartButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6490ab",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 8
  },
  addToCartText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8
  },
  cartButton: {
    marginTop: 10,
    backgroundColor: "#1f3b64",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
  },
  cartButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginRight: 8,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
  },
  iconCircle: {
    backgroundColor: "#e74c3c",
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f3b64",
    textAlign: "center",
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
  },
  modalActions: {
    width: "100%",
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#1f3b64",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  confirmText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelText: {
    fontSize: 14,
    color: "#0097A7",
    marginTop: 4,
  },

});

export default WebinarsScreen;
