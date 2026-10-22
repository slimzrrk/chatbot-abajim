import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  DeviceEventEmitter,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const ManuelNavigationCard = ({ manuel, document, page, onClose, autoNavigate = false }) => {
  const navigation = useNavigation();

  const handleNavigateToManuel = () => {
    if (onClose) onClose();

    if (page && document) {
      // Navigation vers une page spécifique
      navigation.navigate("DocumentScreen", {
        documentUrl: {
          id: manuel.id,
          name: manuel.name,
          pathenfant: document.url,
          initialPage: page
        },
        title: `${manuel.name} - صفحة ${page}`
      });
    } else {
      // Navigation vers les détails du manuel
      navigation.navigate("ManuelDetail", {
        manuelId: manuel.id,
        manuelName: manuel.name
      });
    }
  };

  // Écouter l'événement de fin d'audio pour la navigation automatique
  useEffect(() => {
    if (autoNavigate && manuel) {
      console.log('🎧 ManuelNavigationCard: Écoute des événements audio pour:', manuel.name);

      const audioFinishedListener = (messageData) => {
        console.log('🎧 Événement audio terminé reçu:', messageData);

        // Vérifier si c'est pour un manuel avec navigation automatique
        if (messageData &&
            (messageData.action === 'navigate_to_manuel_page' || messageData.action === 'show_manuel_info') &&
            messageData.payload) {
          console.log('🚀 Navigation automatique déclenchée après audio pour:', manuel.name);

          // Délai court pour s'assurer que l'interface est prête
          setTimeout(() => {
            handleNavigateToManuel();
          }, 100);
        }
      };

      // S'abonner à l'événement
      const subscription = DeviceEventEmitter.addListener('audioFinished', audioFinishedListener);

      // Nettoyer l'abonnement
      return () => {
        subscription.remove();
      };
    }
  }, [autoNavigate, manuel, page, document]);

  const getManuelImage = () => {
    if (manuel.logo) {
      if (manuel.logo.startsWith('http')) {
        return { uri: manuel.logo };
      }
      return { uri: `https://www.abajim.com/${manuel.logo.startsWith('/') ? manuel.logo.slice(1) : manuel.logo}` };
    }
    return require("../../assets/images/2151103639-removebg-preview.png");
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Header avec image et informations de base */}
        <View style={styles.header}>
          <View style={styles.imageContainer}>
            <Image
              source={getManuelImage()}
              style={styles.manuelImage}
              resizeMode="cover"
            />
            
            {/* Badge de page si spécifiée */}
            {page && (
              <View style={styles.pageBadge}>
                <Text style={styles.pageText}>ص {page}</Text>
              </View>
            )}
          </View>

          <View style={styles.manuelInfo}>
            <Text style={styles.manuelTitle} numberOfLines={2}>
              {manuel.name}
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="library" size={14} color="#666" />
                <Text style={styles.statText}>
                  {manuel.material || 'مادة غير محددة'}
                </Text>
              </View>

              {document && (
                <View style={styles.statItem}>
                  <Ionicons name="document-text" size={14} color="#666" />
                  <Text style={styles.statText}>
                    {document.totalPages} صفحة
                  </Text>
                </View>
              )}
            </View>

            {page && (
              <View style={styles.pageInfo}>
                <Text style={styles.pageLabel}>الصفحة المطلوبة:</Text>
                <Text style={styles.pageNumber}>{page}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          {page 
            ? `📖 اضغط للعودة إلى الصفحة ${page} من كتاب ${manuel.name}`
            : `📚 اضغط لاستكشاف محتويات كتاب ${manuel.name}`
          }
        </Text>

        {/* Bouton d'action */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleNavigateToManuel}
          activeOpacity={0.8}
        >
          <Ionicons name="book" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>
            {page ? `العودة للصفحة ${page}` : 'فتح الكتاب'}
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
  },
  manuelImage: {
    width: '100%',
    height: '100%',
  },
  pageBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#0097A7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pageText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  manuelInfo: {
    flex: 1,
  },
  manuelTitle: {
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
  pageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pageLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  pageNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0097A7',
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

export default ManuelNavigationCard;
