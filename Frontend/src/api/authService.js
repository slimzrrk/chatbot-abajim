import Constants from 'expo-constants';
const API_URL = Constants.expoConfig.extra.BASE_URL;
console.log("API_URL utilisé:", API_URL);
// Function to register a new user
export const register = async (fullName, mobile, password) => {
  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName, mobile, password, role_id: 3 }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur enregistrement utilisateur:', error);
    throw error;
  }
};

// Function to login a user
export const login = async (mobile, password) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, password }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur connexion utilisateur:', error);
    throw error;
  }
};

// Function to send OTP for mobile verification
export const sendOTP = async (mobile) => {
  try {
    const response = await fetch(`${API_URL}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erreur envoi OTP:", error);
    throw error;
  }
};

// Fonction pour vérifier l'OTP
// authService.js

export const verifyOTP = async (mobile, otp) => {
  try {
    const response = await fetch(`${API_URL}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, otp }),
    });

    const data = await response.json();
    return data; // Return the response data
  } catch (error) {
    throw new Error("Error verifying OTP: " + error.message);
  }
};
// Function to reset the password
export const resetPassword = async (mobile, newPassword) => {
  try {
    const response = await fetch(`${API_URL}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, newPassword }),
    });

    if (!response.ok) {
      throw new Error('Failed to reset password');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erreur réinitialisation mot de passe:', error);
    throw error;
  }
};


