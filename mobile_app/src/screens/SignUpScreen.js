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
  ScrollView,
  StatusBar,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { getColors } from "../config/theme";
import { registerUser } from "../services/api";

/**
 * SignUp Screen - Professional minimal design
 */
const SignUpScreen = ({ navigation }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (!acceptedTerms) {
      Alert.alert("Notice", "Please accept Terms of Service and Privacy Policy");
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
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
        Alert.alert("Error", result.error || "Registration failed");
      }
    } catch (error) {
      Alert.alert("Error", "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openTermsOfService = () => {
    Alert.alert(
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
    Alert.alert(
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
      <StatusBar barStyle="light-content" backgroundColor="#0D1421" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={styles.backText}>{"<"} Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>CREATE ACCOUNT</Text>
            <Text style={styles.subtitle}>Join Forex Signal</Text>
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
                  placeholderTextColor="#4A5568"
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
                  placeholder="your@email.com"
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
                  placeholder="Min 6 characters"
                  placeholderTextColor="#4A5568"
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
                  placeholderTextColor="#4A5568"
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
            <TouchableOpacity style={styles.termsContainer} onPress={() => setAcceptedTerms(!acceptedTerms)}>
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                {acceptedTerms && <Text style={styles.checkmark}>+</Text>}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1421',
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
  backButton: {
    marginBottom: 24,
  },
  backText: {
    color: '#6B7280',
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  formContainer: {
    backgroundColor: '#131C2E',
    borderRadius: 16,
    padding: 24,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#0D1421',
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
  },
  toggleButton: {
    paddingHorizontal: 8,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00C853',
    letterSpacing: 1,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#1E293B',
    backgroundColor: '#0D1421',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#00C853',
    borderColor: '#00C853',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    transform: [{ rotate: '45deg' }],
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
  },
  termsLink: {
    color: '#00C853',
    fontWeight: '600',
  },
  signupButton: {
    backgroundColor: '#00C853',
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
    borderTopColor: '#1E293B',
  },
  loginText: {
    color: '#6B7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#00C853',
    fontSize: 14,
    fontWeight: "600",
  },
});

export default SignUpScreen;
