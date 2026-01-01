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
  StatusBar,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { getColors } from "../config/theme";
import { loginUser } from "../services/api";

/**
 * Login Screen - Professional minimal design
 */
const LoginScreen = ({ navigation }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
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
      const result = await loginUser(email, password);

      if (result.success) {
        navigation.reset({
          index: 0,
          routes: [{ name: "Main" }],
        });
      } else {
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
        errorMessage = "Сүлжээний алдаа! Backend server холбогдохгүй байна.";
      } else if (error.code === "ECONNABORTED") {
        errorMessage = "Хүлээх хугацаа дууслаа.";
      }

      Alert.alert("Алдаа", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <View style={styles.logoLine} />
            <View style={[styles.logoLine, styles.logoLine2]} />
            <View style={[styles.logoLine, styles.logoLine3]} />
          </View>
          <Text style={styles.title}>FOREX SIGNAL</Text>
          <Text style={styles.subtitle}>AI Trading Assistant</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Email */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>EMAIL</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#4A5568"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>PASSWORD</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor="#4A5568"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.toggleButton}
              >
                <Text style={styles.toggleText}>
                  {showPassword ? "HIDE" : "SHOW"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPassword")}
            style={styles.forgotButton}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign Up */}
          <TouchableOpacity
            style={styles.signupButton}
            onPress={() => navigation.navigate("SignUp")}
          >
            <Text style={styles.signupButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          For research purposes only
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
    logoContainer: {
      width: 60,
      height: 60,
      justifyContent: 'center',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    logoLine: {
      width: 40,
      height: 3,
      backgroundColor: colors.success,
      marginVertical: 3,
      borderRadius: 2,
    },
    logoLine2: {
      width: 50,
      backgroundColor: colors.success,
      opacity: 0.8,
    },
    logoLine3: {
      width: 30,
      backgroundColor: colors.success,
      opacity: 0.6,
    },
    title: {
      fontSize: 28,
      fontWeight: "700",
      color: colors.textPrimary,
      letterSpacing: 3,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 8,
      letterSpacing: 1,
    },
    formContainer: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
    },
    inputWrapper: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8,
      letterSpacing: 1,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: 8,
      height: 50,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: colors.textPrimary,
    },
    toggleButton: {
      paddingHorizontal: 8,
    },
    toggleText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.success,
      letterSpacing: 1,
    },
    forgotButton: {
      alignSelf: 'flex-end',
      marginBottom: 24,
    },
    forgotText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    loginButton: {
      backgroundColor: colors.success,
      borderRadius: 8,
      height: 50,
      justifyContent: "center",
      alignItems: "center",
    },
    disabledButton: {
      opacity: 0.6,
    },
    loginButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: "600",
      letterSpacing: 1,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginHorizontal: 16,
    },
    signupButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      height: 50,
      justifyContent: "center",
      alignItems: "center",
    },
    signupButtonText: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: "500",
    },
    footerText: {
      color: colors.textSecondary,
      fontSize: 12,
      textAlign: "center",
      marginTop: 32,
    },
  });

export default LoginScreen;
