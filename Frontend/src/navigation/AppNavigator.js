import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import { ActivityIndicator, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";

// Import Screens
import WelcomeScreen from "../screens/WelcomeScreen";
import SignUpScreen from "../screens/SignUpScreen";
import SignInScreen from "../screens/SignInScreen";
import ForgetPasswordScreen from "../screens/forgetPasswordScreen";
import VerificationScreen from "../screens/VerificationScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import BooksScreen from "../screens/BooksScreen";
import AddKidsScreen from "../screens/AddKidsScreen";
import DocumentScreen from "../screens/DocumentScreen";
import WebinarsScreen from "../screens/WebinarsScreen";
import LiveSessionScreen from "../screens/LiveSessionScreen";
import SettingsNavigator from "../navigation/SettingsNavigator";
import WebinarDetail from "../screens/WebinarDetailScreen";
import TeacherScreen from "../screens/TeacherScreen";
import MeetingsDetailsScreen from '../screens/MeetingsDetailsScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
// import ChatScreen from '../screens/ChatScreen'; // ❌ Supprimé - utilisation de la bulle flottante
import CartScreen from '../screens/CartScreen';
import QuizScreen from "../screens/QuizScreen";
import SignUpTeacherScreen from "../screens/teacher/SignUpTeacherScreen";
import NotificationsScreen from "../screens/NotificationsScreen";

import { Init, fetchChild, fetchChildren } from "../reducers/auth/AuthAction";
import CheckoutScreen from "../screens/CheckoutScreen";
import VideoScreen from "../screens/VideoScreen";
const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.authToken);
  const children = useSelector((state) => state.auth.children) || [];

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {


      if (token) {

        await dispatch(fetchChild());
        await dispatch(fetchChildren()); // ✅ Ensure children are loaded

      }
      await dispatch(Init());
      setLoading(false);
    };

    initializeApp();

  }, [dispatch, token, children.length]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={token ? (children.length === 0 ? "AddKids" : "Books") : "Welcome"}>
        {!token ? (
          <>
            {/* User NOT logged in */}
            <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }}/>
            <Stack.Screen name="SignUpTeacher" component={SignUpTeacherScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ForgetPasswordScreen" component={ForgetPasswordScreen} options={{ headerShown: false }} />
            <Stack.Screen name="VerificationScreen" component={VerificationScreen} options={{ headerShown: false }}/>
            <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} options={{ headerShown: false }}/>
          </>
        ) : (
          <>
            {/* If user has children, go to Books. Otherwise, show AddKids */}
            <Stack.Screen name="Books" component={BooksScreen} options={{ headerShown: false }} />
            <Stack.Screen name="DocumentScreen" component={DocumentScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Video" component={VideoScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AddKids" component={AddKidsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Settings" component={SettingsNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="Webinars" component={WebinarsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="WebinarDetail" component={WebinarDetail} options={{ headerShown: false }}/>
            <Stack.Screen name="LiveSession" component={LiveSessionScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Teacher" component={TeacherScreen} options={{ headerShown: false }} />
            <Stack.Screen name="MeetingsDetails" component={MeetingsDetailsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SubscriptionScreen" component={SubscriptionScreen} options={{ headerShown: false }} />
            {/* <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} /> */}
            {/* ❌ ChatScreen supprimé - utilisation de la bulle flottante ChatBubbleWrapper */}
            <Stack.Screen name="CartScreen" component={CartScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CheckoutScreen" component={CheckoutScreen} options={{ headerShown: false }} />
            <Stack.Screen name="QuizScreen" component={QuizScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
