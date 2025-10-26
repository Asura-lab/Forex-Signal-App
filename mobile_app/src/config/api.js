/**
 * API Configuration
 * Backend server холболтын тохиргоо
 */

import { Platform } from "react-native";

// Development режимд ашиглах backend URL
//
// Android Emulator:     10.0.2.2 (host машины localhost-ийг заана)
// iOS Simulator:        localhost эсвэл 127.0.0.1
// Physical Device:      Компьютерийн WiFi IP хаяг (утас болон компьютер ижил WiFi-д байх ёстой)
//
// Production:           Deploy хийсэн backend URL

// Автоматаар тогтоох
const getApiUrl = () => {
  // Development mode: Check __DEV__ flag
  if (__DEV__) {
    // Development - use emulator address
    if (Platform.OS === "android") {
      return "http://10.0.2.2:5000";
    }
    // iOS Simulator
    return "http://localhost:5000";
  }

  // Production - Physical Device with WiFi IP
  return "http://192.168.1.44:5000";
};

export const API_BASE_URL = getApiUrl();

export const API_ENDPOINTS = {
  // Authentication
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  VERIFY: `${API_BASE_URL}/auth/verify`,
  ME: `${API_BASE_URL}/auth/me`,
  UPDATE: `${API_BASE_URL}/auth/update`,
  CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password`,

  // Health check
  HEALTH: `${API_BASE_URL}/health`,
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
};
