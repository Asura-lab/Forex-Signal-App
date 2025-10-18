import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
  Modal,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserData, logoutUser, getAuthToken } from "../services/auth";
import { API_ENDPOINTS } from "../config/api";

/**
 * Profile Screen - Хэрэглэгчийн профайл
 */
const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [stats, setStats] = useState({
    daysUsed: 0,
    signalsReceived: 0,
    lastActive: null,
  });

  useEffect(() => {
    loadUserData();
    loadSettings();
    loadStats();
  }, []);

  const loadUserData = async () => {
    const data = await getUserData();
    if (data) {
      setUserData(data);
      setName(data.name);
      setEmail(data.email);
    }
  };

  const loadSettings = async () => {
    try {
      const savedNotifications = await AsyncStorage.getItem(
        "@notification_settings"
      );
      const savedDarkMode = await AsyncStorage.getItem("@dark_mode");

      if (savedNotifications !== null) {
        setNotifications(JSON.parse(savedNotifications));
      }
      if (savedDarkMode !== null) {
        setDarkMode(JSON.parse(savedDarkMode));
      }
    } catch (error) {
      console.error("Load settings error:", error);
    }
  };

  const loadStats = async () => {
    try {
      const createdAt = await AsyncStorage.getItem("@user_created_at");
      if (createdAt) {
        const daysDiff = Math.floor(
          (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        setStats((prev) => ({
          ...prev,
          daysUsed: daysDiff,
          lastActive: new Date().toLocaleDateString("mn-MN"),
        }));
      }
    } catch (error) {
      console.error("Load stats error:", error);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Алдаа", "Нэр хоосон байж болохгүй");
      return;
    }

    setLoading(true);
    try {
      const token = await getAuthToken();

      const response = await fetch(API_ENDPOINTS.UPDATE, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local storage
        const updatedUser = { ...userData, name };
        await AsyncStorage.setItem("@user_data", JSON.stringify(updatedUser));
        setUserData(updatedUser);

        Alert.alert("Амжилттай", "Таны мэдээлэл шинэчлэгдлээ", [
          { text: "OK", onPress: () => setEditMode(false) },
        ]);
      } else {
        Alert.alert("Алдаа", data.error || "Мэдээлэл шинэчлэхэд алдаа гарлаа");
      }
    } catch (error) {
      Alert.alert("Алдаа", "Серверт холбогдох боломжгүй байна");
      console.error("Update error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    setShowPasswordModal(true);
  };

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Алдаа", "Бүх талбарыг бөглөнө үү");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Алдаа", "Шинэ нууц үг дор хаяж 6 тэмдэгттэй байх ёстой");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Алдаа", "Шинэ нууц үг таарахгүй байна");
      return;
    }

    setLoading(true);
    try {
      const token = await getAuthToken();

      const response = await fetch(API_ENDPOINTS.CHANGE_PASSWORD, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert("Амжилттай", "Нууц үг амжилттай солигдлоо", [
          {
            text: "OK",
            onPress: () => {
              setShowPasswordModal(false);
              setOldPassword("");
              setNewPassword("");
              setConfirmPassword("");
            },
          },
        ]);
      } else {
        Alert.alert("Алдаа", data.error || "Нууц үг солихоо алдаа гарлаа");
      }
    } catch (error) {
      Alert.alert("Алдаа", "Серверт холбогдох боломжгүй байна");
      console.error("Password change error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = async (value) => {
    setNotifications(value);
    try {
      await AsyncStorage.setItem(
        "@notification_settings",
        JSON.stringify(value)
      );
    } catch (error) {
      console.error("Save notification settings error:", error);
    }
  };

  const handleDarkModeToggle = async (value) => {
    setDarkMode(value);
    try {
      await AsyncStorage.setItem("@dark_mode", JSON.stringify(value));
      if (value) {
        Alert.alert(
          "Удахгүй",
          "Харанхуй горим одоогоор бэлэн биш байна. Удахгүй нэмэгдэнэ."
        );
      }
    } catch (error) {
      console.error("Save dark mode settings error:", error);
    }
  };

  const handleLogout = () => {
    Alert.alert("Гарах", "Та системээс гарахдаа итгэлтэй байна уу?", [
      {
        text: "Үгүй",
        style: "cancel",
      },
      {
        text: "Тийм",
        onPress: async () => {
          await logoutUser();
          navigation.reset({
            index: 0,
            routes: [{ name: "Login" }],
          });
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#1a237e", "#283593", "#3949ab"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={50} color="#FFFFFF" />
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{userData?.name || "Хэрэглэгч"}</Text>
          <Text style={styles.userEmail}>{userData?.email || ""}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Statistics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Статистик</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="calendar-outline" size={24} color="#4CAF50" />
              </View>
              <Text style={styles.statValue}>{stats.daysUsed}</Text>
              <Text style={styles.statLabel}>Хоног ашигласан</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color="#2196F3"
                />
              </View>
              <Text style={styles.statValue}>{stats.signalsReceived}</Text>
              <Text style={styles.statLabel}>Сигнал авсан</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={24}
                  color="#FF9800"
                />
              </View>
              <Text style={styles.statValue}>
                {stats.lastActive || "Өнөөдөр"}
              </Text>
              <Text style={styles.statLabel}>Сүүлд нэвтэрсэн</Text>
            </View>
          </View>
        </View>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Хувийн мэдээлэл</Text>
            {!editMode && (
              <TouchableOpacity
                onPress={() => setEditMode(true)}
                style={styles.editButton}
              >
                <Ionicons name="pencil" size={20} color="#2196F3" />
                <Text style={styles.editButtonText}>Засах</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="person-outline" size={22} color="#666" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Нэр</Text>
                {editMode ? (
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Нэр оруулах"
                  />
                ) : (
                  <Text style={styles.infoValue}>{name}</Text>
                )}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="mail-outline" size={22} color="#666" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Имэйл</Text>
                {editMode ? (
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Имэйл оруулах"
                    keyboardType="email-address"
                  />
                ) : (
                  <Text style={styles.infoValue}>{email}</Text>
                )}
              </View>
            </View>

            {editMode && (
              <>
                <View style={styles.divider} />
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => {
                      setEditMode(false);
                      setName(userData?.name || "");
                      setEmail(userData?.email || "");
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Цуцлах</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.saveButton]}
                    onPress={handleSave}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveButtonText}>Хадгалах</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Тохиргоо</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="notifications-outline" size={22} color="#666" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Мэдэгдэл</Text>
                <Text style={styles.infoDescription}>
                  Сигнал ирэх үед мэдэгдэнэ
                </Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: "#E0E0E0", true: "#4CAF50" }}
                thumbColor={notifications ? "#FFFFFF" : "#F5F5F5"}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="moon-outline" size={22} color="#666" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Харанхуй горим</Text>
                <Text style={styles.infoDescription}>Удахгүй нэмэгдэнэ</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={handleDarkModeToggle}
                disabled={true}
                trackColor={{ false: "#E0E0E0", true: "#424242" }}
                thumbColor={darkMode ? "#FFFFFF" : "#F5F5F5"}
              />
            </View>
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Аюулгүй байдал</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleChangePassword}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIcon}>
                <Ionicons name="lock-closed-outline" size={22} color="#666" />
              </View>
              <Text style={styles.menuItemText}>Нууц үг солих</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#999" />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Мэдээлэл</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIcon}>
                <Ionicons name="help-circle-outline" size={22} color="#666" />
              </View>
              <Text style={styles.menuItemText}>Тусламж</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIcon}>
                <Ionicons name="document-text-outline" size={22} color="#666" />
              </View>
              <Text style={styles.menuItemText}>Үйлчилгээний нөхцөл</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIcon}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={22}
                  color="#666"
                />
              </View>
              <Text style={styles.menuItemText}>Нууцлалын бодлого</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#999" />
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIcon}>
                <Ionicons
                  name="information-circle-outline"
                  size={22}
                  color="#666"
                />
              </View>
              <Text style={styles.menuItemText}>Хувилбар</Text>
            </View>
            <Text style={styles.versionText}>1.0.0</Text>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color="#F44336" />
            <Text style={styles.logoutButtonText}>Гарах</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Нууц үг солих</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPasswordModal(false);
                  setOldPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Хуучин нууц үг</Text>
                <TextInput
                  style={styles.modalInput}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  secureTextEntry
                  placeholder="Хуучин нууц үг оруулах"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Шинэ нууц үг</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="Шинэ нууц үг (дор хаяж 6 тэмдэгт)"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Нууц үг баталгаажуулах</Text>
                <TextInput
                  style={styles.modalInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="Шинэ нууц үг дахин оруулах"
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={handlePasswordChange}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>Нууц үг солих</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerContent: {
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2196F3",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#757575",
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 12,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editButtonText: {
    marginLeft: 4,
    color: "#2196F3",
    fontSize: 14,
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#212121",
    fontWeight: "500",
  },
  infoDescription: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  input: {
    fontSize: 16,
    color: "#212121",
    fontWeight: "500",
    borderBottomWidth: 1,
    borderBottomColor: "#2196F3",
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: "#212121",
    fontWeight: "500",
  },
  versionText: {
    fontSize: 14,
    color: "#999",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#F44336",
  },
  logoutButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#F44336",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#424242",
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#212121",
    backgroundColor: "#FAFAFA",
  },
  modalButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ProfileScreen;
