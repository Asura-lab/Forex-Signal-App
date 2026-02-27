import React from "react";
import { View, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTheme } from "../context/ThemeContext";
import { getColors } from "../config/theme";
import { ChartCandlestick, Newspaper, User, TrendingUpDown } from 'lucide-react-native';
import HomeScreen from "../screens/HomeScreen";
import NewsScreen from "../screens/NewsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import PredictionScreen from "../screens/PredictionScreen";

const Tab = createBottomTabNavigator();



/**
 * Main Tabs Navigator - Bottom navigation
 */
const MainTabs = () => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          const iconColor = focused ? colors.success : colors.textSecondary;
          if (route.name === 'HomeTab') return <ChartCandlestick size={22} color={iconColor} />;
          if (route.name === 'PredictionTab') return <TrendingUpDown size={22} color={iconColor} />;
          if (route.name === 'NewsTab') return <Newspaper size={22} color={iconColor} />;
          return <User size={22} color={iconColor} />;
        },
        tabBarActiveTintColor: colors.success,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 1,
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: "MARKET",
        }}
      />
      <Tab.Screen
        name="PredictionTab"
        component={PredictionScreen}
        options={{
          tabBarLabel: "SIGNAL",
        }}
      />
      <Tab.Screen
        name="NewsTab"
        component={NewsScreen}
        options={{
          tabBarLabel: "NEWS",
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: "PROFILE",
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({});

export default MainTabs;
