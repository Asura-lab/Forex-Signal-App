import React, { createContext, useState, useEffect, useContext } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ThemeContextType {
  isDark: boolean;
  themeMode: string;
  setTheme: (mode: string) => Promise<void>;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  themeMode: "auto",
  setTheme: async () => {},
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme(); // 'light' or 'dark'
  const [themeMode, setThemeMode] = useState("auto"); // 'light', 'dark', 'auto'
  const [isDark, setIsDark] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Update theme when system or user preference changes
  useEffect(() => {
    if (themeMode === "auto") {
      setIsDark(systemColorScheme === "dark");
    } else {
      setIsDark(themeMode === "dark");
    }
  }, [themeMode, systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("themeMode");
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
    } catch (error) {
      console.log("Error loading theme preference:", error);
    }
  };

  const setTheme = async (mode: string): Promise<void> => {
    try {
      setThemeMode(mode);
      await AsyncStorage.setItem("themeMode", mode);
    } catch (error) {
      console.log("Error saving theme preference:", error);
    }
  };

  const toggleTheme = () => {
    const nextMode = isDark ? "light" : "dark";
    setTheme(nextMode);
  };

  const value = {
    isDark,
    themeMode,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
