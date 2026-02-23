import React, { useState } from "react";
import {
  View,
  Text,
  Image,
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

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

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
    } catch (error: any) {
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
        {/* Theme Toggle */}
        <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
          {isDark ? (
            <View style={styles.sunIcon}>
              <View style={styles.sunCore} />
              <View style={[styles.sunRay, { top: 0, left: '50%', marginLeft: -1 }]} />
              <View style={[styles.sunRay, { bottom: 0, left: '50%', marginLeft: -1 }]} />
              <View style={[styles.sunRay, { left: 0, top: '50%', marginTop: -1, width: 5, height: 2 }]} />
              <View style={[styles.sunRay, { right: 0, top: '50%', marginTop: -1, width: 5, height: 2 }]} />
            </View>
          ) : (
            <View style={styles.moonIcon}>
              <View style={styles.moonOuter} />
              <View style={[styles.moonInner, { backgroundColor: colors.background }]} />
            </View>
          )}
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.headerContainer}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.appIcon}
          />
          <Text style={styles.title}>PREDICTRIX</Text>
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

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    themeToggle: {
      alignSelf: 'flex-end',
      padding: 8,
      marginBottom: 8,
    },
    sunIcon: {
      width: 22,
      height: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sunCore: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.textSecondary,
    },
    sunRay: {
      position: 'absolute',
      width: 2,
      height: 5,
      backgroundColor: colors.textSecondary,
      borderRadius: 1,
    },
    moonIcon: {
      width: 22,
      height: 22,
    },
    moonOuter: {
      position: 'absolute',
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.textSecondary,
      top: 2,
      left: 0,
    },
    moonInner: {
      position: 'absolute',
      width: 14,
      height: 14,
      borderRadius: 7,
      top: 0,
      left: 6,
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
    appIcon: {
      width: 84,
      height: 84,
      borderRadius: 20,
      marginBottom: 18,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
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
