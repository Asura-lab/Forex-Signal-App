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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "../components/Icon";
import { verifyEmail, resendVerificationCode } from "../services/api";

/**
 * Email Verification Screen - Имэйл баталгаажуулах дэлгэц
 */
const EmailVerificationScreen = ({ route, navigation }) => {
  const { email, name, verificationCode } = route.params;

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Demo mode - Автоматаар код харуулах
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
    // Зөвхөн тоо оруулах
    if (text && !/^\d+$/.test(text)) return;

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Автоматаар дараагийн input луу шилжих
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Бүх код оруулсан бол автоматаар баталгаажуулах
    if (index === 5 && text) {
      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyPress = (e, index) => {
    // Backspace дарахад өмнөх input луу буцах
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (fullCode = null) => {
    const verificationCode = fullCode || code.join("");

    if (verificationCode.length !== 6) {
      Alert.alert("Алдаа", "6 оронтой кодыг бүрэн оруулна уу");
      return;
    }

    setLoading(true);

    try {
      const result = await verifyEmail(email, verificationCode);

      if (result.success) {
        Alert.alert("Амжилттай!", "Таны имэйл амжилттай баталгаажлаа", [
          {
            text: "OK",
            onPress: () => {
              // Main screen рүү шилжих
              navigation.reset({
                index: 0,
                routes: [{ name: "Main" }],
              });
            },
          },
        ]);
      } else {
        Alert.alert("Алдаа", result.error || "Баталгаажуулалт амжилтгүй");
        // Код цэвэрлэх
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <LinearGradient
        colors={["#1a237e", "#283593", "#3949ab"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="mail-outline" size={60} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Имэйл баталгаажуулах</Text>
            <Text style={styles.subtitle}>
              Бид {email} хаягт 6 оронтой код илгээлээ
            </Text>
          </View>

          {/* Code Input */}
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[styles.codeInput, digit && styles.codeInputFilled]}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={() => handleVerify()}
            disabled={loading || code.join("").length !== 6}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.verifyButtonText}>Баталгаажуулах</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Resend Code */}
          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Код ирсэнгүй юу?</Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={!canResend || resending}
            >
              {resending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.resendButton,
                    !canResend && styles.resendButtonDisabled,
                  ]}
                >
                  {canResend ? "Дахин илгээх" : `Дахин илгээх (${countdown}с)`}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Back to Login */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate("Login")}
          >
            <Ionicons name="arrow-back-outline" size={20} color="#FFFFFF" />
            <Text style={styles.backButtonText}>Нэвтрэх хуудас руу буцах</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#E3F2FD",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  codeInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  codeInputFilled: {
    borderColor: "#4CAF50",
    backgroundColor: "rgba(76,175,80,0.2)",
  },
  verifyButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 30,
  },
  resendText: {
    color: "#E3F2FD",
    fontSize: 14,
  },
  resendButton: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  resendButtonDisabled: {
    color: "rgba(255,255,255,0.5)",
    textDecorationLine: "none",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default EmailVerificationScreen;
