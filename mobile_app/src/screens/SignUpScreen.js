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
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { getColors, getGradients } from "../config/theme";
import { registerUser } from "../services/api";

/**
 * SignUp Screen - Бүртгүүлэх дэлгэц
 */
const SignUpScreen = ({ navigation }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const gradients = getGradients(isDark);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleSignUp = async () => {
    // Validation
    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      Alert.alert("Алдаа", "Бүх талбаруудыг бөглөнө үү");
      return;
    }

    if (!acceptedTerms) {
      Alert.alert(
        "Анхаар",
        "Үргэлжлүүлэхийн тулд Үйлчилгээний нөхцөл болон Нууцлалын бодлогыг зөвшөөрөх шаардлагатай"
      );
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Алдаа", "Зөв имэйл хаяг оруулна уу");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Алдаа", "Нууц үг дор хаяж 6 тэмдэгттэй байх ёстой");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Алдаа", "Нууц үг таарахгүй байна");
      return;
    }

    setLoading(true);

    try {
      // Бүртгүүлэх - имэйл баталгаажуулалтын код илгээнэ
      const result = await registerUser(name, email, password);

      if (result.success) {
        // Email verification screen рүү шилжих
        navigation.navigate("EmailVerification", {
          email: email,
          name: name,
          verificationCode: result.data.demo_mode
            ? result.data.verification_code
            : null,
        });
      } else {
        Alert.alert("Алдаа", result.error || "Бүртгэл үүсгэх амжилтгүй боллоо");
      }
    } catch (error) {
      Alert.alert(
        "Алдаа",
        "Бүртгэл үүсгэх явцад алдаа гарлаа. Дахин оролдоно уу."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate("Login");
  };

  const openTermsOfService = () => {
    Alert.alert(
      "Үйлчилгээний нөхцөл",
      "📋 ҮЙЛЧИЛГЭЭНИЙ НӨХЦӨЛ\n\n" +
        "1. Үйлчилгээний тухай\n" +
        "Predictrix нь гадаад валютын арилжааны мэдээлэл, аналитик тайлан өгдөг. " +
        "Энэ нь зөвлөмж бөгөөд хөрөнгө оруулалтын зөвлөгөө БИШ.\n\n" +
        "2. Эрсдэлийн анхааруулга\n" +
        "⚠️ Forex арилжаа өндөр эрсдэлтэй. Та хөрөнгөө бүрэн алдаж болзошгүй.\n\n" +
        "3. Хэрэглэгчийн хариуцлага\n" +
        "Та өөрийн шийдвэрээ өөрөө гаргаж, эрсдэлээ өөрөө хариуцна.\n\n" +
        "Дэлгэрэнгүй унших: Профайл → Мэдээлэл → Үйлчилгээний нөхцөл"
    );
  };

  const openPrivacyPolicy = () => {
    Alert.alert(
      "Нууцлалын бодлого",
      "🔒 НУУЦЛАЛЫН БОДЛОГО\n\n" +
        "1. Цуглуулах мэдээлэл\n" +
        "• Нэр, имэйл хаяг\n" +
        "• Апп ашиглалтын мэдээлэл\n\n" +
        "2. Мэдээлэл хамгаалалт\n" +
        "• HTTPS/TLS шифрлэлт\n" +
        "• Bcrypt нууц үг хадгалалт\n" +
        "• MongoDB Atlas аюулгүй сервер\n\n" +
        "3. Таны эрх\n" +
        "• Мэдээлэл үзэх, засах, устгах эрхтэй\n" +
        "• Бидэнтэй холбогдох: contact@predictrix.com\n\n" +
        "Дэлгэрэнгүй унших: Профайл → Мэдээлэл → Нууцлалын бодлого"
    );
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Logo/Title */}
            <View style={styles.headerContainer}>
              <Ionicons
                name="trending-up"
                size={60}
                color={colors.textPrimary}
              />
              <Text style={styles.title}>Бүртгүүлэх</Text>
              <Text style={styles.subtitle}>Шинэ хэрэглэгч үүсгэх</Text>
            </View>

            {/* SignUp Form */}
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={colors.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Нэр"
                  placeholderTextColor={colors.placeholderText}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

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
                  placeholder="Нууц үг (дор хаяж 6 тэмдэгт)"
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

              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.icon}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Нууц үг дахин оруулах"
                  placeholderTextColor={colors.placeholderText}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-outline" : "eye-off-outline"
                    }
                    size={20}
                    color={colors.icon}
                  />
                </TouchableOpacity>
              </View>

              {/* Terms and Privacy Policy Checkbox */}
              <View style={styles.termsContainer}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setAcceptedTerms(!acceptedTerms)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      acceptedTerms && styles.checkboxChecked,
                    ]}
                  >
                    {acceptedTerms && (
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    )}
                  </View>
                  <View style={styles.termsTextContainer}>
                    <Text style={styles.termsLabel}>
                      Би{" "}
                      <Text
                        style={styles.termsLink}
                        onPress={openTermsOfService}
                      >
                        Үйлчилгээний нөхцөл
                      </Text>{" "}
                      болон{" "}
                      <Text
                        style={styles.termsLink}
                        onPress={openPrivacyPolicy}
                      >
                        Нууцлалын бодлого
                      </Text>
                      -той танилцаж зөвшөөрч байна
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* SignUp Button */}
              <TouchableOpacity
                style={[
                  styles.signupButton,
                  (loading || !acceptedTerms) && styles.disabledButton,
                ]}
                onPress={handleSignUp}
                disabled={loading || !acceptedTerms}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.signupButtonText}>Бүртгүүлэх</Text>
                )}
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Бүртгэлтэй юу? </Text>
                <TouchableOpacity onPress={handleLogin}>
                  <Text style={styles.loginLink}>Нэвтрэх</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
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
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      padding: 24,
      paddingTop: 60,
      paddingBottom: 40,
    },
    headerContainer: {
      alignItems: "center",
      marginBottom: 32,
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
    signupButton: {
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
    signupButtonText: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: "bold",
    },
    loginContainer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 24,
      paddingTop: 24,
      borderTopWidth: 1,
      borderTopColor: colors.borderDark,
    },
    loginText: {
      color: colors.textDark,
      fontSize: 14,
    },
    loginLink: {
      color: colors.info,
      fontSize: 14,
      fontWeight: "bold",
    },
    termsContainer: {
      marginTop: 16,
      marginBottom: 8,
    },
    checkboxContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.borderDark,
      backgroundColor: colors.card,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
      marginTop: 2,
    },
    checkboxChecked: {
      backgroundColor: colors.secondary,
      borderColor: colors.secondary,
    },
    termsTextContainer: {
      flex: 1,
    },
    termsLabel: {
      fontSize: 13,
      color: colors.textDark,
      lineHeight: 20,
    },
    termsLink: {
      color: colors.info,
      fontWeight: "600",
      textDecorationLine: "underline",
    },
    terms: {
      marginTop: 24,
      alignItems: "center",
    },
    termsText: {
      color: colors.textSecondary,
      fontSize: 12,
      textAlign: "center",
      lineHeight: 18,
    },
  });

export default SignUpScreen;
