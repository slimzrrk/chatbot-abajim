import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  Alert
} from 'react-native';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { resetPassword } from "../reducers/auth/AuthAction";

export default function ResetPasswordScreen({ route, navigation }) {
  const dispatch = useDispatch();
  const { phone } = route.params || {};
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleResetPassword = () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    dispatch(resetPassword(phone, newPassword, navigation));
  };

  return (
    <ImageBackground source={require("../../assets/images/ba1.png")} style={styles.background}>
      <View style={styles.container}>
        {/* ✅ Bouton retour */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>

        <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
        <Text style={styles.title}>إعادة تعيين كلمة المرور</Text>
        <Text style={styles.subtitle}>أدخل كلمة المرور الجديدة لحسابك</Text>

        {/* Nouveau mot de passe */}
        <Text style={styles.label}>كلمة المرور الجديدة</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="********"
            placeholderTextColor="#888"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
        </View>

        {/* Confirmation */}
        <Text style={styles.label}>تأكيد كلمة المرور</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="********"
            placeholderTextColor="#888"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
          <Text style={styles.buttonText}>تحديث كلمة المرور</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    width: '100%',
    alignItems: 'center',
    paddingTop: 170,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 15,
    zIndex: 999,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F3B64',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    width: '80%',
  },
  label: {
    alignSelf: 'flex-end',
    color: '#1F3B64',
    fontSize: 16,
    marginBottom: 10,
    marginRight: '10%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    paddingHorizontal: 15,
    width: '80%',
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  input: {
    flex: 1,
    height: 50,
    textAlign: 'right',
    fontSize: 16,
  },
  button: {
    width: '80%',
    height: 50,
    backgroundColor: '#1F3B64',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
