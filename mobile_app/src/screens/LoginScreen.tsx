import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import { useAlert } from "../context/AlertContext";
import { getColors } from "../config/theme";
import { loginUser } from "../services/api";
import { NavigationProp } from "@react-navigation/native";

interface LoginScreenProps {
  navigation: NavigationProp<any>;
}

/**
 * Login Screen - Professional minimal design
 */
const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { isDark, toggleTheme } = useTheme();
  const colors = getColors(isDark);
  const { showAlert } = useAlert();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert("Алдаа", "Имэйл болон нууц үг оруулна уу");
      return;
    }

    if (!email.includes("@")) {
      showAlert("Алдаа", "Зөв имэйл хаяг оруулна уу");
      return;
    }

    setLoading(true);

    try {
      const result = await loginUser(email, password);

      if (result.success) {
        navigation.reset({
          index: 0,
          routes: [{ name: "Main" }],
        });
      } else {
        if (result.requiresVerification) {
          showAlert(
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
          showAlert("Алдаа", result.error || "Нэвтрэх амжилтгүй боллоо");
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "Нэвтрэх явцад алдаа гарлаа.";

      if (error.message === "Network Error") {
        errorMessage = "Сүлжээний алдаа! Backend server холбогдохгүй байна.";
      } else if (error.code === "ECONNABORTED") {
        errorMessage = "Хүлээх хугацаа дууслаа.";
      }

      showAlert("Алдаа", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors, isDark);

  const bgGradient: [string, string, string] = isDark
    ? ["#0A1929", "#0F2235", colors.background]
    : ["#D1FAE5", "#ECFDF5", colors.background];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient colors={bgGradient} locations={[0, 0.3, 0.65]} style={styles.gradient}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Top Bar ── */}
          <View style={styles.topBar}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
            <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
              <Text style={styles.themeEmoji}>{isDark ? "☀️" : "🌙"}</Text>
            </TouchableOpacity>
          </View>

          {/* ── Hero ── */}
          <View style={styles.heroSection}>
            <View style={styles.logoRing}>
              <Image
                source={require("../../assets/icon.png")}
                style={styles.appIcon}
              />
            </View>
            <Text style={styles.title}>PREDICTRIX</Text>
            <View style={styles.titleAccent} />
            <Text style={styles.subtitle}>AI-Powered Forex Trading Signals</Text>
          </View>

          {/* ── Form Card ── */}
          <View style={styles.formCard}>
            <LinearGradient
              colors={["#059669", "#10B981", "#34D399"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.cardAccentBar}
            />
            <View style={styles.formInner}>
              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                <View style={styles.inputRow}>
                  <Text style={styles.inputIcon}>✉</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="your@email.com"
                    placeholderTextColor={colors.placeholderText}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>PASSWORD</Text>
                <View style={styles.inputRow}>
                  <Text style={styles.inputIcon}>●</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter password"
                    placeholderTextColor={colors.placeholderText}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Text style={styles.eyeText}>{showPassword ? "Hide" : "Show"}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot */}
              <TouchableOpacity
                onPress={() => navigation.navigate("ForgotPassword")}
                style={styles.forgotRow}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              {/* Sign In — gradient button */}
              <TouchableOpacity
                style={[styles.signInWrapper, loading && { opacity: 0.6 }]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#059669", "#10B981", "#34D399"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.signInBtn}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.signInText}>Sign In  →</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Create Account */}
              <TouchableOpacity
                style={styles.createAccountBtn}
                onPress={() => navigation.navigate("SignUp")}
                activeOpacity={0.7}
              >
                <Text style={styles.createAccountText}>Create New Account</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.footerText}>⚡ For research & educational purposes only</Text>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    gradient: { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingBottom: 40,
      paddingTop: Platform.OS === "android" ? 52 : 64,
    },
    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 36,
    },
    liveBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(16,185,129,0.12)" : "rgba(16,185,129,0.08)",
      borderWidth: 1,
      borderColor: isDark ? "rgba(16,185,129,0.3)" : "rgba(16,185,129,0.2)",
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#10B981",
      marginRight: 6,
    },
    liveBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: "#10B981",
      letterSpacing: 1.5,
    },
    themeToggle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
      justifyContent: "center",
      alignItems: "center",
    },
    themeEmoji: { fontSize: 18 },
    heroSection: {
      alignItems: "center",
      marginBottom: 32,
    },
    logoRing: {
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 2,
      borderColor: isDark ? "rgba(16,185,129,0.4)" : "rgba(16,185,129,0.3)",
      padding: 6,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
      shadowColor: "#10B981",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: isDark ? 0.35 : 0.12,
      shadowRadius: 16,
      elevation: 6,
    },
    appIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    title: {
      fontSize: 30,
      fontWeight: "800",
      color: colors.textPrimary,
      letterSpacing: 5,
    },
    titleAccent: {
      width: 48,
      height: 3,
      backgroundColor: "#10B981",
      borderRadius: 2,
      marginTop: 10,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      letterSpacing: 0.3,
      textAlign: "center",
    },
    formCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: isDark ? "rgba(16,185,129,0.1)" : "rgba(0,0,0,0.05)",
      shadowColor: isDark ? "#10B981" : "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.12 : 0.08,
      shadowRadius: 20,
      elevation: 8,
      marginBottom: 28,
    },
    cardAccentBar: { height: 3 },
    formInner: { padding: 24 },
    inputGroup: { marginBottom: 16 },
    inputLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.textSecondary,
      letterSpacing: 1.5,
      marginBottom: 8,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : colors.background,
      borderRadius: 12,
      height: 52,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputIcon: {
      fontSize: 15,
      color: "#10B981",
      marginRight: 10,
      width: 20,
      textAlign: "center",
      opacity: 0.9,
    },
    textInput: {
      flex: 1,
      fontSize: 15,
      color: colors.textPrimary,
      height: 52,
    },
    eyeButton: { paddingLeft: 8, paddingVertical: 4 },
    eyeText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#10B981",
      letterSpacing: 0.3,
    },
    forgotRow: {
      alignSelf: "flex-end",
      marginBottom: 20,
      marginTop: 2,
    },
    forgotText: { fontSize: 13, color: colors.textSecondary },
    signInWrapper: {
      borderRadius: 14,
      overflow: "hidden",
      shadowColor: "#10B981",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 6,
    },
    signInBtn: {
      height: 54,
      justifyContent: "center",
      alignItems: "center",
    },
    signInText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 20,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: {
      fontSize: 11,
      color: colors.textSecondary,
      marginHorizontal: 14,
      fontWeight: "600",
      letterSpacing: 1,
    },
    createAccountBtn: {
      height: 52,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: isDark ? "rgba(16,185,129,0.45)" : "#10B981",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(16,185,129,0.06)" : "transparent",
    },
    createAccountText: {
      color: "#10B981",
      fontSize: 15,
      fontWeight: "600",
    },
    footerText: {
      color: colors.textSecondary,
      fontSize: 11,
      textAlign: "center",
      opacity: 0.6,
    },
  });

export default LoginScreen;
