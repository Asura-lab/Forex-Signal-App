import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useTheme } from "../context/ThemeContext";
import { getColors } from "../config/theme";
import { useAlert, AlertButton } from "../context/AlertContext";

/**
 * Global themed Alert modal.
 * Drop-in replacement for React Native's Alert.alert —
 * fully respects the app's dark / light theme.
 * Render once inside App.tsx, above NavigationContainer.
 */
const AppAlert: React.FC = () => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { alertState, hideAlert } = useAlert();
  const { visible, title, message, buttons } = alertState;

  const handlePress = (btn: AlertButton) => {
    hideAlert();
    btn.onPress?.();
  };

  const cancelBtn = buttons.find((b) => b.style === "cancel");
  const actionBtns = buttons.filter((b) => b.style !== "cancel");
  // Order: action buttons first, cancel last — but also handle single-button case
  const orderedBtns =
    buttons.length === 1 ? buttons : [...actionBtns, ...(cancelBtn ? [cancelBtn] : [])];

  const styles = createStyles(colors, isDark);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        // tap back = cancel
        const cancel = buttons.find((b) => b.style === "cancel");
        hideAlert();
        cancel?.onPress?.();
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.box}>
          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          {!!message && <Text style={styles.message}>{message}</Text>}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Buttons */}
          <View
            style={[
              styles.btnRow,
              orderedBtns.length > 2 && styles.btnColumn,
            ]}
          >
            {orderedBtns.map((btn, idx) => {
              const isCancel = btn.style === "cancel";
              const isDestructive = btn.style === "destructive";
              const isLast = idx === orderedBtns.length - 1;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.btn,
                    orderedBtns.length > 2 && styles.btnFullWidth,
                    isLast && orderedBtns.length > 1 && styles.btnLast,
                    isCancel && styles.btnCancel,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handlePress(btn)}
                >
                  <Text
                    style={[
                      styles.btnText,
                      isCancel && styles.btnTextCancel,
                      isDestructive && styles.btnTextDestructive,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: isDark ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 40,
    },
    box: {
      backgroundColor: colors.card,
      borderRadius: 16,
      width: "100%",
      maxWidth: 340,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.textPrimary,
      textAlign: "center",
      paddingTop: 22,
      paddingHorizontal: 20,
      paddingBottom: 6,
    },
    message: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      paddingHorizontal: 20,
      paddingBottom: 18,
      lineHeight: 20,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
    },
    btnRow: {
      flexDirection: "row",
    },
    btnColumn: {
      flexDirection: "column",
    },
    btn: {
      flex: 1,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    btnFullWidth: {
      flex: undefined,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    btnLast: {
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
    },
    btnCancel: {
      // slightly dimmer background for cancel
      backgroundColor: colors.background + "60",
    },
    btnText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.primary,
    },
    btnTextCancel: {
      color: colors.textSecondary,
      fontWeight: "400",
    },
    btnTextDestructive: {
      color: colors.error,
    },
  });

export default AppAlert;
