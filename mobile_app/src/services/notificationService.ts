/**
 * Push Notification Service
 * Expo Push Notifications ашиглан мэдэгдэл хүлээн авах, бүртгэх
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

// ==================== NOTIFICATION CONFIGURATION ====================

// Configure how notifications are displayed when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ==================== PUSH TOKEN REGISTRATION ====================

/**
 * Expo Push Token авах
 * @returns {string | null} ExponentPushToken[xxx] format
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    // Physical device шаардлагатай (simulator дээр ажиллахгүй)
    if (!Device.isDevice) {
      console.log("[WARN] Push notifications require a physical device");
      return null;
    }

    // Permission шалгах / авах
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[WARN] Push notification permission denied");
      return null;
    }

    // Get the project ID
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    
    // Get actual push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    const token = tokenData.data;
    console.log("[OK] Expo Push Token:", token);

    // Android notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#00C853",
        sound: "default",
      });

      await Notifications.setNotificationChannelAsync("signals", {
        name: "Trading Signals",
        description: "High-confidence trading signal alerts",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FFD700",
        sound: "default",
      });

      await Notifications.setNotificationChannelAsync("news", {
        name: "Market News",
        description: "Major economic news alerts",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF5252",
        sound: "default",
      });
    }

    return token;
  } catch (error) {
    console.error("[ERROR] Get push token failed:", error);
    return null;
  }
}

/**
 * Push token-ийг backend-руу илгээж бүртгүүлэх
 */
export async function registerPushTokenWithServer(
  pushToken: string
): Promise<boolean> {
  try {
    const userToken = await AsyncStorage.getItem("userToken");
    if (!userToken) {
      console.log("[WARN] No auth token, skipping push token registration");
      return false;
    }

    const response = await axios.post(
      `${API_BASE_URL}/notifications/register`,
      {
        push_token: pushToken,
        platform: Platform.OS,
      },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    if (response.data?.success) {
      await AsyncStorage.setItem("@push_token", pushToken);
      console.log("[OK] Push token registered with server");
      return true;
    }
    return false;
  } catch (error: any) {
    console.error(
      "[ERROR] Register push token with server failed:",
      error.message
    );
    return false;
  }
}

/**
 * Push token-ийг серверээс устгах
 */
export async function unregisterPushTokenFromServer(): Promise<boolean> {
  try {
    const userToken = await AsyncStorage.getItem("userToken");
    if (!userToken) return false;

    const response = await axios.post(
      `${API_BASE_URL}/notifications/unregister`,
      {},
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    if (response.data?.success) {
      await AsyncStorage.removeItem("@push_token");
      console.log("[OK] Push token unregistered from server");
      return true;
    }
    return false;
  } catch (error: any) {
    console.error("[ERROR] Unregister push token failed:", error.message);
    return false;
  }
}

// ==================== NOTIFICATION PREFERENCES ====================

export interface NotificationPreferences {
  notifications_enabled: boolean;
  signal_notifications: boolean;
  news_notifications: boolean;
}

/**
 * Мэдэгдлийн тохиргоо серверээс авах
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const defaults: NotificationPreferences = {
    notifications_enabled: true,
    signal_notifications: true,
    news_notifications: true,
  };

  try {
    const userToken = await AsyncStorage.getItem("userToken");
    if (!userToken) {
      return defaults;
    }

    const response = await axios.get(
      `${API_BASE_URL}/notifications/preferences`,
      {
        headers: { Authorization: `Bearer ${userToken}` },
        timeout: 10000,
      }
    );

    if (response.data?.success) {
      return response.data.preferences;
    }
  } catch (error: any) {
    if (error?.response?.status === 401) {
      // Token expired or invalid — clear it so the user can re-authenticate
      await AsyncStorage.removeItem("userToken");
      console.warn("[WARN] Notification preferences: token expired, cleared stored token.");
    } else {
      console.error("[ERROR] Get notification preferences failed:", error.message);
    }
  }

  return defaults;
}

/**
 * Мэдэгдлийн тохиргоо серверт хадгалах
 */
export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<boolean> {
  try {
    const userToken = await AsyncStorage.getItem("userToken");
    if (!userToken) return false;

    const response = await axios.put(
      `${API_BASE_URL}/notifications/preferences`,
      preferences,
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    return response.data?.success ?? false;
  } catch (error: any) {
    if (error?.response?.status === 401) {
      // Token expired or invalid — clear it so the user can re-authenticate
      await AsyncStorage.removeItem("userToken");
      console.warn("[WARN] Update notification preferences: token expired, cleared stored token.");
    } else {
      console.error(
        "[ERROR] Update notification preferences failed:",
        error.message
      );
    }
    return false;
  }
}

// ==================== NOTIFICATION LISTENERS ====================

/**
 * Мэдэгдлийн listener-уудыг тохируулах
 * @param onNotificationReceived - foreground-д мэдэгдэл ирэхэд
 * @param onNotificationResponse - хэрэглэгч мэдэгдэл дарахад
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (
    response: Notifications.NotificationResponse
  ) => void
): () => void {
  // Foreground notification listener
  const receivedSubscription =
    Notifications.addNotificationReceivedListener((notification) => {
      console.log("[NOTIFICATION] Received:", notification.request.content.title);
      onNotificationReceived?.(notification);
    });

  // User tapped notification listener
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log("[NOTIFICATION] Tapped:", data);
      onNotificationResponse?.(response);
    });

  // Return cleanup function
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

// ==================== INITIALIZATION ====================

/**
 * Push notification бүхэлд нь тохируулах (App startup дээр дуудна)
 */
export async function initializePushNotifications(): Promise<string | null> {
  try {
    const token = await getExpoPushToken();

    if (token) {
      // Check if token changed
      const savedToken = await AsyncStorage.getItem("@push_token");
      if (savedToken !== token) {
        await registerPushTokenWithServer(token);
      }
    }

    return token;
  } catch (error) {
    console.error("[ERROR] Initialize push notifications failed:", error);
    return null;
  }
}
