import React, { useState, useEffect, useRef } from "react";
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
import { verifyEmail, resendVerificationCode } from "../services/api";

/**
 * Email Verification Screen - consistent design with Login/SignUp/ForgotPassword
 */
const EmailVerificationScreen = ({ route, navigation }) => {
  const { email, name, verificationCode } = route.params;
  const { isDark, toggleTheme } = useTheme();
  const colors = getColors(isDark);

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  useEffect(() => {
    if (verificationCode) {
      Alert.alert(
        "Demo Mode",
        `Ð¢Ð°Ð½Ñ‹ Ð±Ð°Ñ‚Ð°Ð»Ð³Ð°Ð°Ð¶ÑƒÑƒÐ»Ð°Ñ… ÐºÐ¾Ð´: ${verificationCode}\n\n(Ð˜Ð¼ÑÐ¹Ð» Ñ‚Ð¾Ñ…Ð¸Ñ€Ð³Ð¾Ð¾ Ñ…Ð¸Ð¹Ð³Ð´ÑÑÐ³Ò¯Ð¹ ÑƒÑ‡Ð¸Ñ€ demo Ð³Ð¾Ñ€Ð¸Ð¼Ð´ Ð°Ð¶Ð¸Ð»Ð»Ð°Ð¶ Ð±Ð°Ð¹Ð½Ð°)`,
        [{ text: "OK" }]
      );
    }
  }, [verificationCode]);

  const handleCodeChange = (text, index) => {
    if (text && !/^\d+$/.test(text)) return;
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (index === 5 && text) {
      const fullCode = newCode.join("");
      if (fullCode.length === 6) handleVerify(fullCode);
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (fullCode = null) => {
    const verCode = fullCode || code.join("");
    if (verCode.length !== 6) {
      Alert.alert("ÐÐ»Ð´Ð°Ð°", "6 Ð¾Ñ€Ð¾Ð½Ñ‚Ð¾Ð¹ ÐºÐ¾Ð´Ñ‹Ð³ Ð±Ò¯Ñ€ÑÐ½ Ð¾Ñ€ÑƒÑƒÐ»Ð½Ð° ÑƒÑƒ");
      return;
    }
    setLoading(true);
    try {
      const result = await verifyEmail(email, verCode);
      if (result.success) {
        Alert.alert("ÐÐ¼Ð¶Ð¸Ð»Ñ‚Ñ‚Ð°Ð¹!", "Ð¢Ð°Ð½Ñ‹ Ð¸Ð¼ÑÐ¹Ð» Ð°Ð¼Ð¶Ð¸Ð»Ñ‚Ñ‚Ð°Ð¹ Ð±Ð°Ñ‚Ð°Ð»Ð³Ð°Ð°Ð¶Ð»Ð°Ð°", [
          {
            text: "OK",
            onPress: () =>
              navigation.reset({ index: 0, routes: [{ name: "Main" }] }),
          },
        ]);
      } else {
        Alert.alert("ÐÐ»Ð´Ð°Ð°", result.error || "Ð‘Ð°Ñ‚Ð°Ð»Ð³Ð°Ð°Ð¶ÑƒÑƒÐ»Ð°Ð»Ñ‚ Ð°Ð¼Ð¶Ð¸Ð»Ñ‚Ð³Ò¯Ð¹");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      Alert.alert("ÐÐ»Ð´Ð°Ð°", "Ð‘Ð°Ñ‚Ð°Ð»Ð³Ð°Ð°Ð¶ÑƒÑƒÐ»Ð°Ñ… ÑÐ²Ñ†Ð°Ð´ Ð°Ð»Ð´Ð°Ð° Ð³Ð°Ñ€Ð»Ð°Ð°");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resending) return;
    setResending(true);
    try {
      const result = await resendVerificationCode(email);
      if (result.success) {
        Alert.alert(
          "Ð˜Ð»Ð³ÑÑÐ³Ð´Ð»ÑÑ",
          result.data.demo_mode
            ? `Ð¨Ð¸Ð½Ñ ÐºÐ¾Ð´: ${result.data.verification_code}\n\n(Demo Ð³Ð¾Ñ€Ð¸Ð¼)`
            : "Ð¨Ð¸Ð½Ñ Ð±Ð°Ñ‚Ð°Ð»Ð³Ð°Ð°Ð¶ÑƒÑƒÐ»Ð°Ñ… ÐºÐ¾Ð´ Ñ‚Ð°Ð½Ñ‹ Ð¸Ð¼ÑÐ¹Ð» Ñ…Ð°ÑÐ³ Ñ€ÑƒÑƒ Ð¸Ð»Ð³ÑÑÐ³Ð´Ð»ÑÑ"
        );
        setCountdown(60);
        setCanResend(false);
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert("ÐÐ»Ð´Ð°Ð°", result.error || "ÐšÐ¾Ð´ Ð¸Ð»Ð³ÑÑÑ… Ð°Ð¼Ð¶Ð¸Ð»Ñ‚Ð³Ò¯Ð¹");
      }
    } catch (error) {
      Alert.alert("ÐÐ»Ð´Ð°Ð°", "ÐšÐ¾Ð´ Ð¸Ð»Ð³ÑÑÑ… ÑÐ²Ñ†Ð°Ð´ Ð°Ð»Ð´Ð°Ð° Ð³Ð°Ñ€Ð»Ð°Ð°");
    } finally {
      setResending(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      <View style={styles.content}>
        {/* Top row: Back + Theme toggle */}
        <View style={styles.topRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            style={styles.backButton}
          >
            <Text style={styles.backText}>{"<"} Ð‘ÑƒÑ†Ð°Ñ…</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
            <Text style={styles.themeToggleText}>{isDark ? "â˜€ï¸" : "ðŸŒ™"}</Text>
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Ð˜ÐœÐ­Ð™Ð› Ð‘ÐÐ¢ÐÐ›Ð“ÐÐÐ–Ð£Ð£Ð›ÐÐ¥</Text>
          <Text style={styles.subtitle}>
            {email} Ñ…Ð°ÑÐ³ Ñ€ÑƒÑƒ Ð¸Ð»Ð³ÑÑÑÑÐ½ 6 Ð¾Ñ€Ð¾Ð½Ñ‚Ð¾Ð¹ ÐºÐ¾Ð´Ñ‹Ð³ Ð¾Ñ€ÑƒÑƒÐ»Ð½Ð° ÑƒÑƒ
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.formContainer}>
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[styles.codeInput, digit ? styles.codeInputFilled : null]}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              (loading || code.join("").length !== 6) && styles.disabledButton,
            ]}
            onPress={() => handleVerify()}
            disabled={loading || code.join("").length !== 6}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Ð‘Ð°Ñ‚Ð°Ð»Ð³Ð°Ð°Ð¶ÑƒÑƒÐ»Ð°Ñ…</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendLabel}>ÐšÐ¾Ð´ Ð¸Ñ€ÑÐ½Ð³Ò¯Ð¹ ÑŽÑƒ? </Text>
            <TouchableOpacity onPress={handleResend} disabled={!canResend || resending}>
              {resending ? (
                <ActivityIndicator size="small" color={colors.success} />
              ) : (
                <Text style={[styles.resendLink, !canResend && styles.resendLinkDisabled]}>
                  {canResend ? "Ð”Ð°Ñ…Ð¸Ð½ Ð¸Ð»Ð³ÑÑÑ…" : `Ð”Ð°Ñ…Ð¸Ð½ Ð¸Ð»Ð³ÑÑÑ… (${countdown}Ñ)`}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footerText}>For research purposes only</Text>
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
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 32,
    },
    backButton: {
      padding: 4,
    },
    backText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    themeToggle: {
      padding: 8,
    },
    themeToggleText: {
      fontSize: 22,
    },
    headerContainer: {
      alignItems: "center",
      marginBottom: 36,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.textPrimary,
      letterSpacing: 2,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 10,
      textAlign: "center",
      lineHeight: 20,
      paddingHorizontal: 8,
    },
    formContainer: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 24,
    },
    codeContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 28,
      gap: 8,
    },
    codeInput: {
      flex: 1,
      height: 56,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.background,
      color: colors.textPrimary,
      fontSize: 22,
      fontWeight: "bold",
      textAlign: "center",
    },
    codeInputFilled: {
      borderColor: colors.success,
    },
    primaryButton: {
      backgroundColor: colors.success,
      borderRadius: 8,
      height: 50,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    disabledButton: {
      opacity: 0.5,
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "600",
      letterSpacing: 1,
    },
    resendContainer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    resendLabel: {
      color: colors.textSecondary,
      fontSize: 13,
    },
    resendLink: {
      color: colors.success,
      fontSize: 13,
      fontWeight: "600",
    },
    resendLinkDisabled: {
      color: colors.textSecondary,
      fontWeight: "400",
    },
    footerText: {
      color: colors.textSecondary,
      fontSize: 12,
      textAlign: "center",
      marginTop: 32,
    },
  });

export default EmailVerificationScreen;
