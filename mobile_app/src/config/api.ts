/**
 * API Configuration
 * Backend server холболтын тохиргоо
 */

import { Platform } from "react-native";

const getApiUrl = () => {
  return 'https://predictrix-cvhvhtheawabdahg.koreacentral-01.azurewebsites.net';
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

  // Notifications
  NOTIFICATION_REGISTER: `${API_BASE_URL}/notifications/register`,
  NOTIFICATION_UNREGISTER: `${API_BASE_URL}/notifications/unregister`,
  NOTIFICATION_PREFERENCES: `${API_BASE_URL}/notifications/preferences`,
  NOTIFICATION_TEST: `${API_BASE_URL}/notifications/test`,

  // Health check
  HEALTH: `${API_BASE_URL}/health`,
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
};
