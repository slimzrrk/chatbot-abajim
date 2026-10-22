import AsyncStorage from '@react-native-async-storage/async-storage';

// Enregistrer une donnée dans le stockage
export const saveToStorage = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Erreur lors de l'enregistrement :", error);
  }
};

// Récupérer une donnée du stockage
export const getFromStorage = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error("Erreur lors de la récupération :", error);
    return null;
  }
};

// Supprimer une donnée du stockage
export const removeFromStorage = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error("Erreur lors de la suppression :", error);
  }
};

// Effacer tout le stockage (utile pour la déconnexion)
export const clearStorage = async () => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error("Erreur lors du nettoyage du stockage :", error);
  }
};
