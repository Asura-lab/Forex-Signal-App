import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTheme } from "../context/ThemeContext";
import { getColors } from "../config/theme";
import HomeScreen from "../screens/HomeScreen";
import NewsScreen from "../screens/NewsScreen";
import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

/**
 * Simple Tab Icon - Using SF Symbols-like Unicode
 */
const TabIcon = ({ name, focused, colors }) => {
  const activeColor = colors.success;
  const inactiveColor = colors.textSecondary;
  const iconColor = focused ? activeColor : inactiveColor;
  
  return (
    <View style={styles.iconContainer}>
      {name === 'HomeTab' ? (
        // Chart/Market icon - 3 bars
        <View style={styles.chartIcon}>
          <View style={[styles.bar, styles.bar1, { backgroundColor: iconColor }]} />
          <View style={[styles.bar, styles.bar2, { backgroundColor: iconColor }]} />
          <View style={[styles.bar, styles.bar3, { backgroundColor: iconColor }]} />
        </View>
      ) : name === 'NewsTab' ? (
        // News icon - simple document
        <View style={[styles.newsIcon, { borderColor: iconColor }]}>
           <View style={[styles.newsLine, { backgroundColor: iconColor }]} />
           <View style={[styles.newsLine, { backgroundColor: iconColor, width: '60%' }]} />
        </View>
      ) : (
        // Profile icon - person silhouette
        <View style={styles.profileIcon}>
          <View style={[styles.head, { backgroundColor: iconColor }]} />
          <View style={[styles.body, { backgroundColor: iconColor }]} />
        </View>
      )}
    </View>
  );
};

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
          return <TabIcon name={route.name} focused={focused} colors={colors} />;
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

const styles = StyleSheet.create({
  iconContainer: {
    width: 28,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Chart icon styles (3 bars)
  chartIcon: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 18,
    gap: 3,
  },
  bar: {
    width: 4,
    borderRadius: 1,
  },
  bar1: {
    height: 8,
  },
  bar2: {
    height: 14,
  },
  bar3: {
    height: 10,
  },
  // News icon styles
  newsIcon: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  newsLine: {
    height: 2,
    width: '80%',
    borderRadius: 1,
  },
  // Profile icon styles (head + body)
  profileIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
  },
  head: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  body: {
    width: 14,
    height: 8,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
  },
});

export default MainTabs;
