import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import SettingsScreen from "../screens/SettingsScreen";
import ParentInfoScreen from "../screens/ParentInfoScreen";
import KidsListScreen from "../screens/KidsListScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import MyCardScreen from "../screens/MyCardScreen";
import ForgetPasswordScreen from "../screens/forgetPasswordScreen";
import VerificationScreen from "../screens/VerificationScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen"; 
import SignInScreen from "../screens/SignInScreen";
import FavoritesScreen from "../screens/FavoritesScreen";
import ReservedMeetingsScreen from "../screens/ReservedMeetingsScreen";
import RechargeWalletScreen from "../screens/RechargeWalletScreen";
import ParentDashboardScreen from "../screens/ParentDashboardScreen";

const Stack = createStackNavigator();

const SettingsNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsMain" component={SettingsScreen}options={{ title: "الكتب المدرسية" }} />
      <Stack.Screen name="ParentInfo" component={ParentInfoScreen} />
      <Stack.Screen name="KidsList" component={KidsListScreen} />
      {/* <Stack.Screen name="Notifications" component={NotificationsScreen} /> */}
      <Stack.Screen name="ParentDashboardScreen" component={ParentDashboardScreen} />
      <Stack.Screen name="MyCard" component={MyCardScreen} />
      <Stack.Screen name="RechargeWallet" component={RechargeWalletScreen} />
      <Stack.Screen name="ForgetPasswordScreen" component={ForgetPasswordScreen} />
      <Stack.Screen name="VerificationScreen" component={VerificationScreen} />
      <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="Favorites" component={FavoritesScreen} /> 
      <Stack.Screen name="ReservedMeetings" component={ReservedMeetingsScreen} /> 
    </Stack.Navigator>
  );
};

export default SettingsNavigator;
