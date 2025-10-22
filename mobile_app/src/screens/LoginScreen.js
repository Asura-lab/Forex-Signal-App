import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { getColors, getGradients } from "../config/theme";
import { loginUser } from "../services/api";
import { API_BASE_URL } from "../config/api";

/**
 * Login Screen - Нэвтрэх дэлгэц
 */
const LoginScreen = ({ navigation }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const gradients = getGradients(isDark);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    // Validation
    if (!email.trim() || !password.trim()) {
      Alert.alert("Алдаа", "Имэйл болон нууц үг оруулна уу");
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Алдаа", "Зөв имэйл хаяг оруулна уу");
      return;
    }

    setLoading(true);

    try {
      // Use the auth service to login
      const result = await loginUser(email, password);

      if (result.success) {
        // Navigate to Main tabs after successful login
        navigation.reset({
          index: 0,
          routes: [{ name: "Main" }],
        });
      } else {
        // Имэйл баталгаажаагүй бол
        if (result.requiresVerification) {
          Alert.alert(
            "Имэйл баталгаажуулах",
            "Та имэйл хаягаа баталгаажуулах шаардлагатай",
            [
              {
                text: "Баталгаажуулах",
                onPress: () =>
                  navigation.navigate("EmailVerification", { email }),
              },
              { text: "Болих", style: "cancel" },
            ]
          );
        } else {
          Alert.alert("Алдаа", result.error || "Нэвтрэх амжилтгүй боллоо");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "Нэвтрэх явцад алдаа гарлаа.";

      if (error.message === "Network Error") {
        errorMessage =
          "Сүлжээний алдаа! Backend server холбогдохгүй байна.\nТа WiFi холболтоо шалгана уу.";
      } else if (error.code === "ECONNABORTED") {
        errorMessage =
          "Хүлээх хугацаа дууслаа. Backend server-тэй холбогдож чадсангүй.";
      }

      Alert.alert("Алдаа", errorMessage + "\n\nДахин оролдоно уу.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    navigation.navigate("SignUp");
  };

  const styles = createStyles(colors, gradients);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Logo/Title */}
          <View style={styles.headerContainer}>
            <Ionicons name="trending-up" size={60} color={colors.textPrimary} />
            <Text style={styles.title}>Форекс Сигнал</Text>
            <Text style={styles.subtitle}>AI-аар хөтлөгддөг таамаглал</Text>
            <Text style={styles.apiDebug}>API: {API_BASE_URL}</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={colors.icon}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Имэйл хаяг"
                placeholderTextColor={colors.placeholderText}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.icon}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Нууц үг"
                placeholderTextColor={colors.placeholderText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={colors.icon}
                />
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.textPrimary} />
              ) : (
                <Text style={styles.loginButtonText}>Нэвтрэх</Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={styles.forgotPasswordText}>
                Нууц үгээ мартсан уу?
              </Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Бүртгэлгүй юу? </Text>
              <TouchableOpacity onPress={handleSignUp}>
                <Text style={styles.signupLink}>Бүртгүүлэх</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Энэ аппликейшн нь судалгааны зорилгоор бүтээгдсэн
            </Text>
          </View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors, gradients) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      padding: 24,
    },
    headerContainer: {
      alignItems: "center",
      marginBottom: 48,
    },
    title: {
      fontSize: 32,
      fontWeight: "bold",
      color: colors.textPrimary,
      marginTop: 16,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 8,
    },
    apiDebug: {
      fontSize: 10,
      color: colors.warning,
      marginTop: 4,
      fontFamily: "monospace",
    },
    formContainer: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.input,
      borderRadius: 12,
      marginBottom: 16,
      paddingHorizontal: 16,
      height: 56,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: colors.textInput,
    },
    passwordInput: {
      paddingRight: 40,
    },
    eyeIcon: {
      position: "absolute",
      right: 16,
      padding: 8,
    },
    loginButton: {
      backgroundColor: colors.secondary,
      borderRadius: 12,
      height: 56,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 8,
      shadowColor: colors.secondary,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
    disabledButton: {
      opacity: 0.6,
    },
    loginButtonText: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "bold",
    },
    forgotPassword: {
      alignItems: "center",
      marginTop: 16,
    },
    forgotPasswordText: {
      color: colors.info,
      fontSize: 14,
    },
    signupContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 24,
      paddingTop: 24,
      borderTopWidth: 1,
      borderTopColor: colors.borderDark,
    },
    signupText: {
      color: colors.textDark,
      fontSize: 14,
    },
    signupLink: {
      color: colors.info,
      fontSize: 14,
      fontWeight: "bold",
    },
    footer: {
      marginTop: 32,
      alignItems: "center",
    },
    footerText: {
      color: colors.textSecondary,
      fontSize: 12,
      textAlign: "center",
    },
  });

export default LoginScreen;
