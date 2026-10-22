import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';

const SubscriptionOffersCard = ({ offers = [], onClose }) => {
  const navigation = useNavigation();

  const handleSubscribe = () => {
    if (onClose) onClose();
    navigation.navigate("SubscriptionScreen");
  };

  const formatPrice = (price) => {
    return `${price} د.ت`;
  };

  const formatDays = (days) => {
    if (days === 365) return "سنة كاملة";
    if (days === 30) return "شهر واحد";
    if (days === 90) return "3 أشهر";
    if (days === 180) return "6 أشهر";
    return `${days} يوم`;
  };

  // Afficher seulement l'offre الكرطابلة
  const kartablaOffer = offers.length > 0 ? offers[0] : {
    id: 3,
    price: 80,
    oldPrice: 120,
    days: 365,
    name: "عرض الكرطابلة - إشتراك كامل في الكتب المدرسية"
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header avec image et titre */}
        <View style={styles.header}>
          <View style={styles.imageContainer}>
            <Image
              source={require("../../assets/images/2151103639-removebg-preview.png")}
              style={styles.offerImage}
              resizeMode="contain"
            />

            {/* Badge de réduction */}
            {kartablaOffer.oldPrice && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  خصم {Math.round(((kartablaOffer.oldPrice - kartablaOffer.price) / kartablaOffer.oldPrice) * 100)}%
                </Text>
              </View>
            )}
          </View>

          <View style={styles.offerInfo}>
            <Text style={styles.offerTitle} numberOfLines={2}>
              {kartablaOffer.name}
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="time" size={14} color="#666" />
                <Text style={styles.statText}>
                  {formatDays(kartablaOffer.days)}
                </Text>
              </View>

              <View style={styles.statItem}>
                <Ionicons name="library" size={14} color="#666" />
                <Text style={styles.statText}>
                  جميع الكتب
                </Text>
              </View>
            </View>

            <View style={styles.priceContainer}>
              {kartablaOffer.oldPrice && (
                <Text style={styles.oldPrice}>{formatPrice(kartablaOffer.oldPrice)}</Text>
              )}
              <Text style={styles.newPrice}>{formatPrice(kartablaOffer.price)}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          📚 اشتراك كامل للوصول إلى جميع الكتب المدرسية والدروس التفاعلية لمدة سنة كاملة
        </Text>

        {/* Bouton d'action */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSubscribe}
          activeOpacity={0.8}
        >
          <Ionicons name="card" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>
            اشترك الآن
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerImage: {
    width: '90%',
    height: '90%',
  },
  discountBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#dc3545',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  offerInfo: {
    flex: 1,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f3c88',
    marginBottom: 6,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    textAlign: 'right',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  oldPrice: {
    fontSize: 14,
    color: '#dc3545',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  newPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
  },
  description: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
    textAlign: 'right',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0097A7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#0097A7',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 8,
    textAlign: 'center',
  },
});

export default SubscriptionOffersCard;
