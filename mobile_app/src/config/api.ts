/**
 * API Configuration
 * Backend server холболтын тохиргоо
 */

import { Platform } from "react-native";

// WiFi IP хаяг - утас болон компьютер ижил WiFi-д байх ёстой
const WIFI_IP = "192.168.20.115";

// Автоматаар тогтоох
const getApiUrl = () => {
  // Android Emulator ашиглаж байгаа бол true болгоно уу
  const IS_ANDROID_EMULATOR = false; 

  if (Platform.OS === 'android' && IS_ANDROID_EMULATOR) {
    return 'http://10.0.2.2:5000';
  }
  
  // iOS simulator эсвэл physical device
  return `http://${WIFI_IP}:5000`;
};

export const API_URL = getApiUrl(); // Export API_URL directly as well for convenience
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
