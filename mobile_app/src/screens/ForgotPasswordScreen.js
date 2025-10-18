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
import { Ionicons } from "@expo/vector-icons";
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
      <View style={styles.headerContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="key-outline" size={60} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Нууц үг сэргээх</Text>
        <Text style={styles.subtitle}>Бүртгэлтэй имэйл хаягаа оруулна уу</Text>
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#FFFFFF" />
        <TextInput
          style={styles.input}
          placeholder="Имэйл хаяг"
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleSendEmail}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="send-outline" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Код илгээх</Text>
          </>
        )}
      </TouchableOpacity>
    </>
  );

  const renderStep2 = () => (
    <>
      <View style={styles.headerContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark-outline" size={60} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Код баталгаажуулах</Text>
        <Text style={styles.subtitle}>
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
        style={styles.primaryButton}
        onPress={handleVerifyCode}
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
            <Text style={styles.primaryButtonText}>Үргэлжлүүлэх</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => {
          setStep(1);
          setCode(["", "", "", "", "", ""]);
        }}
      >
        <Text style={styles.secondaryButtonText}>Буцах</Text>
      </TouchableOpacity>
    </>
  );

  const renderStep3 = () => (
    <>
      <View style={styles.headerContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed-outline" size={60} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Шинэ нууц үг</Text>
        <Text style={styles.subtitle}>Шинэ нууц үгээ оруулна уу</Text>
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#FFFFFF" />
        <TextInput
          style={styles.input}
          placeholder="Шинэ нууц үг"
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showNewPassword}
        />
        <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
          <Ionicons
            name={showNewPassword ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#FFFFFF" />
        <TextInput
          style={styles.input}
          placeholder="Нууц үг давтах"
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
        />
        <TouchableOpacity
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <Ionicons
            name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleResetPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="checkmark-done-outline" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Нууц үг солих</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setStep(2)}
      >
        <Text style={styles.secondaryButtonText}>Буцах</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <LinearGradient
        colors={["#d84315", "#e64a19", "#ff5722"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
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
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 40,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  progressDotActive: {
    backgroundColor: "#FFFFFF",
    width: 30,
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
    color: "#FFE0B2",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 10,
    fontSize: 16,
    color: "#FFFFFF",
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
  primaryButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginTop: 20,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default ForgotPasswordScreen;
