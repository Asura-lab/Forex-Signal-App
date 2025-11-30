import React, { useState, useRef } from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "../components/Icon";
import {
  forgotPassword,
  verifyResetCode,
  resetPassword,
} from "../services/api";

/**
 * Forgot Password Screen - Нууц үг сэргээх 3 алхмын дэлгэц
 * Step 1: Имэйл оруулах
 * Step 2: Код шалгах
 * Step 3: Шинэ нууц үг оруулах
 */
const ForgotPasswordScreen = ({ navigation }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: New Password
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [demoCode, setDemoCode] = useState(null);

  const inputRefs = useRef([]);

  // Step 1: Имэйл илгээх
  const handleSendEmail = async () => {
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Алдаа", "Зөв имэйл хаяг оруулна уу");
      return;
    }

    setLoading(true);

    try {
      const result = await forgotPassword(email);

      if (result.success) {
        if (result.data.demo_mode) {
          setDemoCode(result.data.reset_code);
          Alert.alert(
            "Demo Mode",
            `Таны сэргээх код: ${result.data.reset_code}\n\n(Имэйл тохиргоо хийгдээгүй учир demo горимд ажиллаж байна)`,
            [{ text: "OK", onPress: () => setStep(2) }]
          );
        } else {
          Alert.alert(
            "Амжилттай",
            "Сэргээх код таны имэйл хаяг руу илгээгдлээ",
            [{ text: "OK", onPress: () => setStep(2) }]
          );
        }
      } else {
        Alert.alert("Алдаа", result.error || "Код илгээх амжилтгүй");
      }
    } catch (error) {
      Alert.alert("Алдаа", "Код илгээх явцад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Код шалгах
  const handleVerifyCode = async () => {
    const verificationCode = code.join("");

    if (verificationCode.length !== 6) {
      Alert.alert("Алдаа", "6 оронтой кодыг бүрэн оруулна уу");
      return;
    }

    setLoading(true);

    try {
      const result = await verifyResetCode(email, verificationCode);

      if (result.success) {
        Alert.alert("Амжилттай", "Код баталгаажлаа", [
          { text: "OK", onPress: () => setStep(3) },
        ]);
      } else {
        Alert.alert("Алдаа", result.error || "Буруу код");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      Alert.alert("Алдаа", "Код шалгах явцад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Нууц үг солих
  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Алдаа", "Нууц үгээ оруулна уу");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Алдаа", "Нууц үг дор хаяж 6 тэмдэгттэй байх ёстой");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Алдаа", "Нууц үг таарахгүй байна");
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword(email, code.join(""), newPassword);

      if (result.success) {
        Alert.alert("Амжилттай!", "Таны нууц үг амжилттай солигдлоо", [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login"),
          },
        ]);
      } else {
        Alert.alert("Алдаа", result.error || "Нууц үг солих амжилтгүй");
      }
    } catch (error) {
      Alert.alert("Алдаа", "Нууц үг солих явцад алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (text, index) => {
    if (text && !/^\d+$/.test(text)) return;

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const renderStep1 = () => (
    <>
      <View style={styles.stepHeader}>
        <Ionicons name="mail" size={48} color="#1a237e" />
        <Text style={styles.stepTitle}>Алхам 1: Имэйл хаяг</Text>
        <Text style={styles.stepSubtitle}>
          Бүртгэлтэй имэйл хаягаа оруулна уу
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Ionicons
          name="mail-outline"
          size={20}
          color="#666"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Имэйл хаяг"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.disabledButton]}
        onPress={handleSendEmail}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Код илгээх</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderStep2 = () => (
    <>
      <View style={styles.stepHeader}>
        <Ionicons name="shield-checkmark" size={48} color="#1a237e" />
        <Text style={styles.stepTitle}>Алхам 2: Код баталгаажуулах</Text>
        <Text style={styles.stepSubtitle}>
          {email} хаягт илгээсэн 6 оронтой кодыг оруулна уу
        </Text>
      </View>

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

      <TouchableOpacity
        style={[
          styles.primaryButton,
          (loading || code.join("").length !== 6) && styles.disabledButton,
        ]}
        onPress={handleVerifyCode}
        disabled={loading || code.join("").length !== 6}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Үргэлжлүүлэх</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => {
          setStep(1);
          setCode(["", "", "", "", "", ""]);
        }}
      >
        <Text style={styles.secondaryButtonText}>← Буцах</Text>
      </TouchableOpacity>
    </>
  );

  const renderStep3 = () => (
    <>
      <View style={styles.stepHeader}>
        <Ionicons name="key" size={48} color="#1a237e" />
        <Text style={styles.stepTitle}>Алхам 3: Шинэ нууц үг</Text>
        <Text style={styles.stepSubtitle}>Шинэ нууц үгээ оруулна уу</Text>
      </View>

      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color="#666"
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, styles.passwordInput]}
          placeholder="Шинэ нууц үг"
          placeholderTextColor="#999"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showNewPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          onPress={() => setShowNewPassword(!showNewPassword)}
          style={styles.eyeIcon}
        >
          <Ionicons
            name={showNewPassword ? "eye-outline" : "eye-off-outline"}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color="#666"
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, styles.passwordInput]}
          placeholder="Нууц үг давтах"
          placeholderTextColor="#999"
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
            name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.disabledButton]}
        onPress={handleResetPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Нууц үг солих</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setStep(2)}
      >
        <Text style={styles.secondaryButtonText}>← Буцах</Text>
      </TouchableOpacity>
    </>
  );

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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Logo/Title */}
            <View style={styles.logoContainer}>
              <Ionicons name="lock-closed" size={60} color="#FFFFFF" />
              <Text style={styles.logoTitle}>Форекс Сигнал</Text>
              <Text style={styles.logoSubtitle}>Нууц үг сэргээх</Text>
            </View>

            {/* Form Container */}
            <View style={styles.formContainer}>
              {/* Progress Indicator */}
              <View style={styles.progressContainer}>
                {[1, 2, 3].map((s) => (
                  <View
                    key={s}
                    style={[
                      styles.progressDot,
                      s <= step && styles.progressDotActive,
                    ]}
                  />
                ))}
              </View>

              {/* Render current step */}
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
            </View>

            {/* Back to Login */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate("Login")}
            >
              <Ionicons name="arrow-back-outline" size={20} color="#FFFFFF" />
              <Text style={styles.backButtonText}>
                Нэвтрэх хуудас руу буцах
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 16,
  },
  logoSubtitle: {
    fontSize: 16,
    color: "#B0BEC5",
    marginTop: 8,
  },
  formContainer: {
    backgroundColor: "#FFFFFF",
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
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 30,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E0E0E0",
  },
  progressDotActive: {
    backgroundColor: "#1a237e",
    width: 30,
  },
  stepHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a237e",
    marginTop: 12,
    marginBottom: 8,
    textAlign: "center",
  },
  stepSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
  },
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 8,
  },
  codeInput: {
    flex: 1,
    height: 60,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    color: "#333",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  codeInputFilled: {
    borderColor: "#1a237e",
    backgroundColor: "#E8EAF6",
  },
  primaryButton: {
    backgroundColor: "#1a237e",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#BDBDBD",
    opacity: 0.7,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    marginTop: 16,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default ForgotPasswordScreen;
