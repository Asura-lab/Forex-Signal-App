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
  ScrollView,
  StatusBar,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { useAlert } from "../context/AlertContext";
import { getColors } from "../config/theme";
import { registerUser } from "../services/api";
import { NavigationProp } from "@react-navigation/native";

interface SignUpScreenProps {
  navigation: NavigationProp<any>;
}

/**
 * SignUp Screen - Professional minimal design
 */
const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const { isDark, toggleTheme } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(colors);
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
          email: email,
          name: name,
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
      "TERMS OF SERVICE\n\n" +
      "1. About Service\n" +
      "Forex Signal provides trading analytics and information. This is NOT investment advice.\n\n" +
      "2. Risk Warning\n" +
      "Forex trading involves high risk. You may lose your entire investment.\n\n" +
      "3. User Responsibility\n" +
      "You are responsible for your own trading decisions."
    );
  };

  const openPrivacyPolicy = () => {
    showAlert(
      "Privacy Policy",
      "PRIVACY POLICY\n\n" +
      "1. Data Collection\n" +
      "- Name, email address\n" +
      "- App usage data\n\n" +
      "2. Data Protection\n" +
      "- HTTPS/TLS encryption\n" +
      "- Bcrypt password hashing\n\n" +
      "3. Your Rights\n" +
      "- Access, modify, delete your data"
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <View style={styles.topRow}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Text style={styles.backText}>{"<"} Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
                {isDark ? (
                  <View style={styles.sunIcon}>
                    <View style={styles.sunCore} />
                    <View style={[styles.sunRay, { transform: [{ rotate: '0deg' }, { translateY: -10 }] }]} />
                    <View style={[styles.sunRay, { transform: [{ rotate: '45deg' }, { translateY: -10 }] }]} />
                    <View style={[styles.sunRay, { transform: [{ rotate: '90deg' }, { translateY: -10 }] }]} />
                    <View style={[styles.sunRay, { transform: [{ rotate: '135deg' }, { translateY: -10 }] }]} />
                    <View style={[styles.sunRay, { transform: [{ rotate: '180deg' }, { translateY: -10 }] }]} />
                    <View style={[styles.sunRay, { transform: [{ rotate: '225deg' }, { translateY: -10 }] }]} />
                    <View style={[styles.sunRay, { transform: [{ rotate: '270deg' }, { translateY: -10 }] }]} />
                    <View style={[styles.sunRay, { transform: [{ rotate: '315deg' }, { translateY: -10 }] }]} />
                  </View>
                ) : (
                  <View style={styles.moonIcon}>
                    <View style={styles.moonOuter} />
                    <View style={[styles.moonInner, { backgroundColor: colors.background }]} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
            <Image source={require('../../assets/icon.png')} style={styles.appIcon} />
            <Text style={styles.title}>БҮРТГҮҮЛЭХ</Text>
            <Text style={styles.subtitle}>Predictrix-д нэгдэх</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Name */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>NAME</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={colors.textSecondary}
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
                  placeholder="Min 6 characters"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.toggleButton}>
                  <Text style={styles.toggleText}>{showPassword ? "HIDE" : "SHOW"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm password"
                  placeholderTextColor={colors.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.toggleButton}>
                  <Text style={styles.toggleText}>{showConfirmPassword ? "HIDE" : "SHOW"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms Checkbox */}
            <TouchableOpacity 
              style={styles.termsContainer} 
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

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.signupButton, (loading || !acceptedTerms) && styles.disabledButton]}
              onPress={handleSignUp}
              disabled={loading || !acceptedTerms}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.signupButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 50,
  },
  headerContainer: {
    marginBottom: 32,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  themeToggle: {
    padding: 8,
  },
  sunIcon: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sunCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.textSecondary,
  },
  sunRay: {
    position: 'absolute',
    width: 2,
    height: 6,
    top: 12,
    left: 14,
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
  appIcon: {
    width: 160,
    height: 160,
    borderRadius: 40,
    marginBottom: 16,
    alignSelf: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  backButton: {
    padding: 4,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.success,
    fontWeight: '600',
  },
  signupButton: {
    backgroundColor: colors.success,
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 1,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  loginText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: colors.success,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default SignUpScreen;
