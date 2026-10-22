import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ImageBackground } from "react-native";
import { useSelector } from "react-redux";

export default function WelcomeScreen({ navigation }) {
  const token = useSelector((state) => state.auth.authToken);

  // ✅ Auto-redirect to HomeScreen if user is already logged in
  useEffect(() => {
    if (token) {
      navigation.replace("Home");
    }
  }, [token, navigation]);

  return (
    <ImageBackground source={require("../../assets/images/b3.png")} style={styles.background}>
      <View style={styles.container}>
        <Image source={require("../../assets/images/logocolors.png")} style={styles.logo} />
        <View style={styles.spacing} />
        <Text style={styles.subtitle}>أبجيم: متعة التعلّم والتعليم</Text>
        <Text style={styles.subtitle}>الشّبكة التّعليميّة الأولى في تونس</Text>
        <View style={styles.spacing} />
        <TouchableOpacity style={styles.buttonPrimary} onPress={() => navigation.navigate("SignUp")}>
          <Text style={styles.buttonPrimaryText}>سجل مجانًا</Text>
        </TouchableOpacity>
        <View style={styles.spacing} />
        <TouchableOpacity style={styles.buttonSecondary} onPress={() => navigation.navigate("SignIn")}>
          <Text style={styles.buttonSecondaryText}>تسجيل الدخول</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  logo: {
    width: 250,
    height: 90,
    marginBottom: 30,
  },
  spacing: {
    height: 20,
  },
  subtitle: {
    fontSize: 19,
    textAlign: "center",
    color: "#1F3B64",
    fontWeight: "bold",
    marginBottom: 25,
    fontFamily: "Tajawal-Bold",
  },
  buttonPrimary: {
    width: "85%",
    height: 55,
    backgroundColor: "#17A2B8",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
    marginBottom: 20,
  },
  buttonPrimaryText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Tajawal-Bold",
  },
  buttonSecondary: {
    width: "85%",
    height: 55,
    backgroundColor: "#E3E3EA",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
  },
  buttonSecondaryText: {
    color: "#1F3B64",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Tajawal-Bold",
  },
});







































































// import React from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, Image, ImageBackground } from 'react-native';

// export default function WelcomeScreen({ navigation }) {
//   return (
//     <ImageBackground
//       source={require("../../assets/images/b3.png")}
//       style={styles.background}
//     >
//       <View style={styles.container}>
//         <Image source={require("../../assets/images/logocolors.png")} style={styles.logo} />
//         <View style={styles.spacing} />
//         <Text style={styles.subtitle}>أبجيم: متعة التعلّم والتعليم</Text>
//         <Text style={styles.subtitle}>الشّبكة التّعليميّة الأولى في تونس</Text>
//         <View style={styles.spacing} />
//         <TouchableOpacity style={styles.buttonPrimary} onPress={() => navigation.navigate('SignUp')}>
//           <Text style={styles.buttonPrimaryText}>سجل مجانًا</Text>
//         </TouchableOpacity>
//         <View style={styles.spacing} />
//         <TouchableOpacity style={styles.buttonSecondary} onPress={() => navigation.navigate('SignIn')}>
//           <Text style={styles.buttonSecondaryText}>تسجيل الدخول</Text>
//         </TouchableOpacity>
//       </View>
//     </ImageBackground>
//   );
// }

// const styles = StyleSheet.create({
//   background: {
//     flex: 1,
//     width: '100%',
//     height: '100%',
//   },
//   container: { 
//     flex: 1, 
//     justifyContent: 'center', 
//     alignItems: 'center', 
//     backgroundColor: 'transparent',
//   },
//   logo: { 
//     width: 250, 
//     height: 90, 
//     marginBottom: 30 
//   },
//   spacing: {
//     height: 20,
//   },
//   subtitle: { 
//     fontSize: 19, 
//     textAlign: 'center', 
//     color: '#1F3B64',
//     fontWeight: 'bold',
//     marginBottom: 25,
//     fontFamily: 'Tajawal-Bold',
//   },
//   buttonPrimary: { 
//     width: '85%', 
//     height: 55, 
//     backgroundColor: '#17A2B8',  
//     justifyContent: 'center', 
//     alignItems: 'center', 
//     borderRadius: 30, 
//     marginBottom: 20,
//   },
//   buttonPrimaryText: {
//     color: '#FFFFFF',  
//     fontSize: 18,
//     fontWeight: 'bold',
//     fontFamily: 'Tajawal-Bold',
//   },
//   buttonSecondary: { 
//     width: '85%', 
//     height: 55, 
//     backgroundColor: '#E3E3EA',  
//     justifyContent: 'center', 
//     alignItems: 'center', 
//     borderRadius: 30,
//   },
//   buttonSecondaryText: {
//     color: '#1F3B64',  
//     fontSize: 18,
//     fontWeight: 'bold',
//     fontFamily: 'Tajawal-Bold',
//   }
// });
