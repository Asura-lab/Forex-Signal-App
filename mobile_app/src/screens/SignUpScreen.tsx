import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../context/ThemeContext";
import { useAlert } from "../context/AlertContext";
import { getColors } from "../config/theme";
import { registerUser } from "../services/api";
import { NavigationProp } from "@react-navigation/native";

interface SignUpScreenProps {
  navigation: NavigationProp<any>;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const { isDark, toggleTheme } = useTheme();
  const colors = getColors(isDark);
  const { showAlert } = useAlert();

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      showAlert("Error", "Please fill all fields");
      return;
    }
    if (!acceptedTerms) {
      showAlert("Notice", "Please accept Terms of Service and Privacy Policy");
      return;
    }
    if (!email.includes("@")) {
      showAlert("Error", "Please enter a valid email");
      return;
    }
    if (password.length < 6) {
      showAlert("Error", "Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      showAlert("Error", "Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const result = await registerUser(name, email, password);
      if (result.success) {
        navigation.navigate("EmailVerification", {
          email,
          name,
          verificationCode: result.data.demo_mode ? result.data.verification_code : null,
        });
      } else {
        showAlert("Error", result.error || "Registration failed");
      }
    } catch (error: any) {
      showAlert("Error", "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openTermsOfService = () => {
    showAlert(
      "Terms of Service",
      "TERMS OF SERVICE\n\n1. About Service\nForex Signal provides trading analytics and information. This is NOT investment advice.\n\n2. Risk Warning\nForex trading involves high risk. You may lose your entire investment.\n\n3. User Responsibility\nYou are responsible for your own trading decisions."
    );
  };

  const openPrivacyPolicy = () => {
    showAlert(
      "Privacy Policy",
      "PRIVACY POLICY\n\n1. Data Collection\n- Name, email address\n- App usage data\n\n2. Data Protection\n- HTTPS/TLS encryption\n- Bcrypt password hashing\n\n3. Your Rights\n- Access, modify, delete your data"
    );
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
      <LinearGradient colors={bgGradient} locations={[0, 0.25, 0.55]} style={styles.gradient}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Top Bar ── */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backArrow}>←</Text>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
              <Text style={styles.themeEmoji}>{isDark ? "☀️" : "🌙"}</Text>
            </TouchableOpacity>
          </View>

          {/* ── Header Branding ── */}
          <View style={styles.headerSection}>
            <Text style={styles.brandName}>PREDICTRIX</Text>
            <View style={styles.titleAccent} />
            <Text style={styles.pageTitle}>Create Account</Text>
            <Text style={styles.pageSubtitle}>Join and start trading smarter</Text>
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
              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>FULL NAME</Text>
                <View style={styles.inputRow}>
                  <Text style={styles.inputIcon}>✦</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Your name"
                    placeholderTextColor={colors.placeholderText}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

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
                    placeholder="Min 6 characters"
                    placeholderTextColor={colors.placeholderText}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                    <Text style={styles.eyeText}>{showPassword ? "Hide" : "Show"}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                <View style={styles.inputRow}>
                  <Text style={styles.inputIcon}>●</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter password again"
                    placeholderTextColor={colors.placeholderText}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                    <Text style={styles.eyeText}>{showConfirmPassword ? "Hide" : "Show"}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Terms */}
              <TouchableOpacity
                style={styles.termsRow}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                  {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.termsText}>
                  I agree to the{" "}
                  <Text style={styles.termsLink} onPress={openTermsOfService}>Terms</Text>
                  {" "}and{" "}
                  <Text style={styles.termsLink} onPress={openPrivacyPolicy}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>

              {/* Create Account button */}
              <TouchableOpacity
                style={[styles.signUpWrapper, (loading || !acceptedTerms) && { opacity: 0.5 }]}
                onPress={handleSignUp}
                disabled={loading || !acceptedTerms}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#059669", "#10B981", "#34D399"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.signUpBtn}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.signUpText}>Create Account  →</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Sign In link */}
              <View style={styles.signInRow}>
                <Text style={styles.signInLabel}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text style={styles.signInLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
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

    /* Top Bar */
    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 32,
    },
    backBtn: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 7,
    },
    backArrow: {
      fontSize: 16,
      color: colors.textSecondary,
      marginRight: 4,
    },
    backText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: "500",
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

    /* Header */
    headerSection: {
      marginBottom: 28,
      paddingLeft: 2,
    },
    brandName: {
      fontSize: 12,
      fontWeight: "700",
      color: "#10B981",
      letterSpacing: 3,
      marginBottom: 6,
    },
    titleAccent: {
      width: 32,
      height: 3,
      backgroundColor: "#10B981",
      borderRadius: 2,
      marginBottom: 12,
    },
    pageTitle: {
      fontSize: 28,
      fontWeight: "800",
      color: colors.textPrimary,
      letterSpacing: 0.5,
    },
    pageSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 6,
    },

    /* Form Card */
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
      marginBottom: 24,
    },
    cardAccentBar: { height: 3 },
    formInner: { padding: 24 },

    /* Inputs */
    inputGroup: { marginBottom: 14 },
    inputLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.textSecondary,
      letterSpacing: 1.5,
      marginBottom: 7,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : colors.background,
      borderRadius: 12,
      height: 50,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputIcon: {
      fontSize: 13,
      color: "#10B981",
      marginRight: 10,
      width: 18,
      textAlign: "center",
      opacity: 0.85,
    },
    textInput: {
      flex: 1,
      fontSize: 15,
      color: colors.textPrimary,
      height: 50,
    },
    eyeButton: { paddingLeft: 8, paddingVertical: 4 },
    eyeText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#10B981",
      letterSpacing: 0.3,
    },

    /* Terms */
    termsRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 6,
      marginBottom: 20,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 7,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : colors.background,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    checkboxChecked: {
      backgroundColor: "#10B981",
      borderColor: "#10B981",
    },
    checkmark: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "bold",
    },
    termsText: {
      flex: 1,
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    termsLink: {
      color: "#10B981",
      fontWeight: "600",
    },

    /* Button */
    signUpWrapper: {
      borderRadius: 14,
      overflow: "hidden",
      shadowColor: "#10B981",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 6,
    },
    signUpBtn: {
      height: 54,
      justifyContent: "center",
      alignItems: "center",
    },
    signUpText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 0.5,
    },

    /* Sign In link */
    signInRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 20,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    signInLabel: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    signInLink: {
      color: "#10B981",
      fontSize: 14,
      fontWeight: "700",
    },

    /* Footer */
    footerText: {
      color: colors.textSecondary,
      fontSize: 11,
      textAlign: "center",
      opacity: 0.6,
    },
  });

export default SignUpScreen;