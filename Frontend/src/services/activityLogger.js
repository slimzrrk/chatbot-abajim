import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../reducers/auth/AuthAction';

export const logChildActivity = async ({ action_type, screen_name = null, reference_id = null, duration = 0 }) => {
  try {
    const childString = await AsyncStorage.getItem('activeChild');
    const child = childString ? JSON.parse(childString) : null;

    if (!child || !child.id || !action_type) {
      console.warn('❌ Enfant actif ou action_type manquant');
      return;
    }

    const token = await AsyncStorage.getItem("token");

    const response = await fetch(`${API_URL}/parent/activity`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        child_id: child.id,
        action_type,
        screen_name,
        reference_id,
        duration,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.warn('❌ Échec de l’enregistrement de l’activité:', data);
    }
  } catch (error) {
    console.error('❌ Erreur dans logChildActivity:', error.message);
  }
};
