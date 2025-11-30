/**
 * App Theme Configuration
 * Light & Dark mode дэмжсэн theme system
 */

// Light Mode Colors - Soft gray theme (not pure white)
export const lightColors = {
  // Primary Colors
  primary: "#3B82F6",
  primaryLight: "#60A5FA",
  primaryDark: "#2563EB",
  primaryGradientStart: "#2563EB",
  primaryGradientEnd: "#3B82F6",

  // Secondary Colors
  secondary: "#10B981",
  secondaryLight: "#34D399",
  secondaryDark: "#059669",

  // Accent Colors
  accent: "#F59E0B",
  accentLight: "#FBBF24",
  accentDark: "#D97706",

  // Status Colors
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",

  // Text Colors
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  textMuted: "rgba(0,0,0,0.4)",
  textDark: "#111827",
  textLabel: "#6B7280",
  textInput: "#1F2937",
  placeholderText: "#9CA3AF",
  icon: "#6B7280",

  // Background Colors - Soft gray (гэгээлэг харин цагаан биш)
  background: "#E5E7EB",
  backgroundDark: "#D1D5DB",
  card: "#F3F4F6",
  cardSecondary: "#E5E7EB",
  overlay: "rgba(0,0,0,0.5)",

  // UI Elements
  border: "#D1D5DB",
  borderDark: "#9CA3AF",
  input: "#F9FAFB",
  disabled: "rgba(0,0,0,0.3)",

  // Trend Colors
  bullish: "#10B981",
  bearish: "#EF4444",
  neutral: "#6B7280",
};

// Dark Mode Colors
export const darkColors = {
  // Primary Colors
  primary: "#3B82F6",
  primaryLight: "#60A5FA",
  primaryDark: "#2563EB",
  primaryGradientStart: "#2563EB",
  primaryGradientEnd: "#3B82F6",

  // Secondary Colors
  secondary: "#10B981",
  secondaryLight: "#34D399",
  secondaryDark: "#059669",

  // Accent Colors
  accent: "#FBBF24",
  accentLight: "#FCD34D",
  accentDark: "#F59E0B",

  // Status Colors
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",

  // Text Colors - DARK MODE
  textPrimary: "#F9FAFB",
  textSecondary: "#9CA3AF",
  textMuted: "rgba(255,255,255,0.5)",
  textDark: "#F9FAFB",
  textLabel: "#9CA3AF",
  textInput: "#F9FAFB",
  placeholderText: "#6B7280",
  icon: "#9CA3AF",

  // Background Colors - DARK MODE (deep dark blue)
  background: "#0F172A",
  backgroundDark: "#020617",
  card: "#1E293B",
  cardSecondary: "#334155",
  overlay: "rgba(0,0,0,0.8)",

  // UI Elements
  border: "#334155",
  borderDark: "#475569",
  input: "#1E293B",
  disabled: "rgba(255,255,255,0.3)",

  // Trend Colors
  bullish: "#10B981",
  bearish: "#EF4444",
  neutral: "#6B7280",
};

// Backward compatibility
export const colors = lightColors;

export const gradients = {
  primary: ["#1a237e", "#283593", "#3949ab"],
  primaryDark: ["#5E35B1", "#7C4DFF", "#9575CD"],
  secondary: ["#4CAF50", "#66BB6A", "#81C784"],
  accent: ["#FF9800", "#FFA726", "#FFB74D"],
  error: ["#d84315", "#e64a19", "#ff5722"],
};

// Function to get colors based on theme
export const getColors = (isDark) => {
  return isDark ? darkColors : lightColors;
};

// Function to get gradients based on theme
export const getGradients = (isDark) => {
  if (isDark) {
    return {
      ...gradients,
      primary: gradients.primaryDark,
    };
  }
  return gradients;
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

export const getCommonStyles = (colors) => ({
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
});

// Backward compatibility - use lightColors as default
export const commonStyles = getCommonStyles(lightColors);

export default {
  colors,
  lightColors,
  darkColors,
  getColors,
  gradients,
  getGradients,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
  commonStyles,
  getCommonStyles,
};
