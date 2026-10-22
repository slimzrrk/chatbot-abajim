import React, { useEffect, useLayoutEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useNavigation,useFocusEffect } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { Logout, fetchManuelsByLevel, fetchVideoCounts,checkChildSubscription } from "../reducers/auth/AuthAction";
import { Ionicons } from "@expo/vector-icons";
import BottomNavigation from "../components/BottomNavigation";
import CartIcon from "../components/CartIcon";
import SmartSubscriptionEntry from "../components/SmartSubscriptionEntry";
import NotificationIcon from "../components/NotificationIcon";
import FavoriteIcon from "../components/FavoriteIcon";
import ChatBubbleWrapper from "../components/ChatBubbleWrapper";
import { logChildActivity } from '../services/activityLogger';
import ActiveChildHeaderAvatar from "../components/ActiveChildHeaderAvatar";
// import ModalCardInDelivery from "../components/ModalCardInDelivery";
// import ModalBankVerification from "../components/ModalBankVerification";
import { useState } from "react";

const BooksScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const manuals = useSelector((state) => state.auth.manuals);
  const videoCounts = useSelector((state) => state.auth.videoCounts);
  const isLoading = useSelector((state) => state.auth.isLoading);
  const children = useSelector((state) => state.auth.children);
  const activeChild = useSelector((state) => state.auth.activeChild) || children[0];

  // subscription modals
  const [showCardModal, setShowCardModal] = useState(false);
const [showVirementModal, setShowVirementModal] = useState(false);

// Afficher le bon modal après vérification de l'abonnement
useEffect(() => {
  if (subscription?.card_ordered && subscription?.card_status === "waiting") {
    setShowCardModal(true);
  } else if (subscription?.bank_transfer && subscription?.parent_transfer_status === "pending") {
    setShowVirementModal(true);
  }
}, [subscription]);

  const handleOpenDocument = (documentUrl) => {
    navigation.navigate("DocumentScreen", { documentUrl });
  };
 const subscription = useSelector((state) => state.auth.subscriptionInfo);
  const handleSelectPayment = (method) => {
    setSelectedPayment(method);
  };

    useEffect(() => {
      dispatch(checkChildSubscription());
    }, []);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => dispatch(Logout(navigation))}
            style={styles.logoutButton}
          >
            <Ionicons name="log-out-outline" size={24} color="red" />
          </TouchableOpacity>
          <CartIcon onPress={() => navigation.navigate("CartScreen")} />
        </View>
      ),
    });
  }, [navigation, dispatch]);


  useEffect(() => {
    if (activeChild?.level_id) {
      dispatch(fetchManuelsByLevel(activeChild.level_id));
      dispatch(fetchVideoCounts());
    }
  }, [activeChild]);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#0097A7" style={styles.loading} />
      ) : (
        <FlatList
          data={manuals}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.booksList}
          renderItem={({ item }) => {
            const count = videoCounts[item.id] || 0;
            return (
              <TouchableOpacity
              style={styles.bookContainer}
              onPress={() => {
                logChildActivity({
                  action_type: 'book',
                  reference_id: item.id,
                });
                handleOpenDocument(item);
              }}
            >
                <View style={styles.bookCard}>
                  <Image source={{ uri: "https://www.abajim.com/" + item.logo }} style={styles.bookImage} />
                  <Text style={styles.bookTitle}>{item.name}</Text>
                  <View style={styles.videoCountContainer}>
                    <Ionicons name="play-circle-outline" size={20} color="#0097A7" />
                    <Text style={styles.videoCountText}>{count} فيديو</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.headerBottom}>
              <ActiveChildHeaderAvatar/>
                <Text style={styles.title}> الكتب المدرسية</Text>
                <View style={styles.headerIcons}>

                <NotificationIcon onPress={() => navigation.navigate("Notifications")} />
                  <FavoriteIcon onPress={() =>  navigation.navigate("Settings", { screen: "Favorites" })} />
                  <CartIcon onPress={() => navigation.navigate("CartScreen")} />
                </View>
              </View>
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.noBooksText}>لا يوجد كتب متاحة لهذا المستوى</Text>
          }
        />
      )}
      {/* <ModalCardInDelivery visible={showCardModal} onClose={() => setShowCardModal(false)} />
      <ModalBankVerification visible={showVirementModal} onClose={() => setShowVirementModal(false)} /> */}

        <SmartSubscriptionEntry/>
      <BottomNavigation />
      <ChatBubbleWrapper bottomOffset={20} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },

  header: {
    backgroundColor: "#0097A7",
    paddingHorizontal: 20,
    paddingVertical: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 30,
    alignItems: "center",
  },

  headerBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginTop: 10,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
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

  booksList: {
    paddingBottom: 90,
  },

  bookContainer: {
    flex: 1,
    marginVertical: 12,
    marginHorizontal: 10,
    alignItems: "center",
  },

  bookCard: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    width: 190,
    height: 300,
  },

  bookImage: { width: 170, height: 230, borderRadius: 10 },

  bookTitle: {
    fontSize: 13,
    marginTop: 8,
    color: "#1F3B64",
    fontWeight: "900",
    textAlign: "center",
  },

  videoCountContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  videoCountText: {
    marginLeft: 4,
    color: "#0097A7",
    fontWeight: "bold",
    fontSize: 13,
  },

  logoutButton: { marginRight: 15 },
  loading: { marginTop: 20 },

  noBooksText: {
    fontSize: 18,
    color: "#777",
    textAlign: "center",
    marginTop: 50,
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
  }

});

export default BooksScreen;
