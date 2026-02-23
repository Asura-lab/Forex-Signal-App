import React, { useState, useEffect, useRef } from "react";
import {
  StatusBar,
  ActivityIndicator,
  View,
} from "react-native";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { getColors } from "./src/config/theme";
import LoginScreen from "./src/screens/LoginScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import EmailVerificationScreen from "./src/screens/EmailVerificationScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import MainTabs from "./src/navigation/MainTabs";
import SignalScreen from "./src/screens/SignalScreen";
import {
  initializePushNotifications,
  setupNotificationListeners,
} from "./src/services/notificationService";

const Stack = createStackNavigator();
const queryClient = new QueryClient();

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Initialize push notifications after auth check
  useEffect(() => {
    if (!isLoading && userLoggedIn) {
      initializePushNotifications().then((token) => {
        if (token) {
          console.log("[OK] Push notifications initialized");
        }
      });

      // Set up notification listeners
      const cleanup = setupNotificationListeners(
        // Foreground notification received
        (notification) => {
          console.log("[NOTIFICATION]", notification.request.content.title);
        },
        // User tapped a notification
        (response) => {
          const data = response.notification.request.content.data;
          // Navigate to appropriate screen based on notification type
          if (data?.screen && navigationRef.current) {
            try {
              if (data.screen === "Signal") {
                navigationRef.current.navigate("Signal");
              } else if (data.screen === "News") {
                navigationRef.current.navigate("Main", { screen: "News" });
              }
            } catch (e) {
              console.log("[WARN] Navigation from notification failed:", e);
            }
          }
        }
      );

      return cleanup;
    }
  }, [isLoading, userLoggedIn]);

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
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.primary}
      />
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
          initialRouteName={userLoggedIn ? "Main" : "Login"}
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.primary,
            },
            headerTintColor: colors.textPrimary,
            headerTitleStyle: {
              fontWeight: "bold",
              fontSize: 20,
            },
            cardStyle: { backgroundColor: colors.background },
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
            options={{
              headerShown: false,
            }}
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
            component={SignalScreen as any}
            options={{
              headerShown: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
