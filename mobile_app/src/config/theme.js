/**
 * App Theme Configuration
 * Бүх аппликейшн дахь дизайн, өнгө, хэмжээсийг нэг газраас удирдана
 * Дараа нь dark mode-той болгоход хялбар болно
 */

export const colors = {
  // Primary Colors - Үндсэн өнгөнүүд
  primary: "#1a237e",
  primaryLight: "#283593",
  primaryDark: "#0d1757",
  primaryGradientStart: "#1a237e",
  primaryGradientEnd: "#3949ab",

  // Secondary Colors
  secondary: "#4CAF50",
  secondaryLight: "#81C784",
  secondaryDark: "#388E3C",

  // Accent Colors
  accent: "#FF9800",
  accentLight: "#FFB74D",
  accentDark: "#F57C00",

  // Status Colors
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",
  info: "#2196F3",

  // Text Colors
  textPrimary: "#FFFFFF",
  textSecondary: "#E3F2FD",
  textMuted: "rgba(255,255,255,0.6)",
  textDark: "#333333",

  // Background Colors
  background: "#F5F5F5",
  backgroundDark: "#1a237e",
  card: "#FFFFFF",
  overlay: "rgba(0,0,0,0.5)",

  // UI Elements
  border: "rgba(255,255,255,0.3)",
  borderDark: "#E0E0E0",
  input: "rgba(255,255,255,0.15)",
  disabled: "rgba(255,255,255,0.5)",

  // Trend Colors
  bullish: "#4CAF50",
  bearish: "#F44336",
  neutral: "#9E9E9E",
};

export const gradients = {
  primary: ["#1a237e", "#283593", "#3949ab"],
  secondary: ["#4CAF50", "#66BB6A", "#81C784"],
  accent: ["#FF9800", "#FFA726", "#FFB74D"],
  error: ["#d84315", "#e64a19", "#ff5722"],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 50,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  display: 32,
};

export const fontWeight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "bold",
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const commonStyles = {
  // Container Styles
  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    padding: spacing.lg,
  },

  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },

  // Card Styles
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.md,
  },

  // Input Styles
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.input,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  input: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },

  // Button Styles
  primaryButton: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    ...shadows.lg,
  },

  primaryButtonText: {
    color: colors.textPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },

  secondaryButton: {
    paddingVertical: spacing.sm,
    alignItems: "center",
  },

  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textDecorationLine: "underline",
  },

  // Text Styles
  title: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: "center",
  },

  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },

  // Header Styles
  headerContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },

  iconContainer: {
    marginBottom: spacing.lg,
  },
};

export default {
  colors,
  gradients,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
  commonStyles,
};
