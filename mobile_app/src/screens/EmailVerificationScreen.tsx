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
import { Ionicons } from "@expo/vector-icons";
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
        `Таны баталгаажуулах код: ${verificationCode}\n\n(Имэйл тохиргоо хийгдээгүй учир demo горимд ажиллаж байна)`,
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
      Alert.alert("Алдаа", "6 оронтой кодыг бүрэн оруулна уу");
      return;
    }
    setLoading(true);
    try {
      const result = await verifyEmail(email, verCode);
      if (result.success) {
        Alert.alert("Амжилттай!", "Таны имэйл амжилттай баталгаажлаа", [
          {
            text: "OK",
            onPress: () =>
              navigation.reset({ index: 0, routes: [{ name: "Main" }] }),
          },
        ]);
      } else {
        Alert.alert("Алдаа", result.error || "Баталгаажуулалт амжилтгүй");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      Alert.alert("Алдаа", "Баталгаажуулах явцад алдаа гарлаа");
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
          "Илгээгдлээ",
          result.data.demo_mode
            ? `Шинэ код: ${result.data.verification_code}\n\n(Demo горим)`
            : "Шинэ баталгаажуулах код таны имэйл хаяг руу илгээгдлээ"
        );
        setCountdown(60);
        setCanResend(false);
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert("Алдаа", result.error || "Код илгээх амжилтгүй");
      }
    } catch (error) {
      Alert.alert("Алдаа", "Код илгээх явцад алдаа гарлаа");
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
            <Text style={styles.backText}>{"<"} Буцах</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleTheme} style={styles.themeToggle}>
            <Ionicons
              name={isDark ? "sunny-outline" : "moon-outline"}
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>ИМЭЙЛ БАТАЛГААЖУУЛАХ</Text>
          <Text style={styles.subtitle}>
            {email} хаяг руу илгээсэн 6 оронтой кодыг оруулна уу
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
              <Text style={styles.primaryButtonText}>Баталгаажуулах</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendLabel}>Код ирсэнгүй юу? </Text>
            <TouchableOpacity onPress={handleResend} disabled={!canResend || resending}>
              {resending ? (
                <ActivityIndicator size="small" color={colors.success} />
              ) : (
                <Text style={[styles.resendLink, !canResend && styles.resendLinkDisabled]}>
                  {canResend ? "Дахин илгээх" : `Дахин илгээх (${countdown}с)`}
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