import React, { useState, useEffect } from "react";
import { StatusBar, ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginScreen from "./src/screens/LoginScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import EmailVerificationScreen from "./src/screens/EmailVerificationScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import MainTabs from "./src/navigation/MainTabs";
import SignalScreen from "./src/screens/SignalScreen";

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userLoggedIn, setUserLoggedIn] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem("userToken");
      setUserLoggedIn(!!token);
    } catch (error) {
      setUserLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1a237e",
        }}
      >
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a237e" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={userLoggedIn ? "Main" : "Login"}
          screenOptions={{
            headerStyle: {
              backgroundColor: "#1a237e",
            },
            headerTintColor: "#FFFFFF",
            headerTitleStyle: {
              fontWeight: "bold",
              fontSize: 20,
            },
            cardStyle: { backgroundColor: "#F5F5F5" },
          }}
        >
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignUp"
            component={SignUpScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EmailVerification"
            component={EmailVerificationScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Signal"
            component={SignalScreen}
            options={{
              headerBackTitleVisible: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
