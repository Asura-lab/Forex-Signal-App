/**
 * App Theme Configuration
 * Light & Dark mode дэмжсэн theme system
 */

// Light Mode Colors
export const lightColors = {
  // Primary Colors
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
  textLabel: "#757575", // Label текст (card дээр харагдах саарал)
  textInput: "#333333", // Input талбарын текст
  placeholderText: "#999999", // Placeholder текст
  icon: "#666666", // Icon өнгө (light mode дээр харанхуй)

  // Background Colors
  background: "#F5F5F5",
  backgroundDark: "#1a237e",
  card: "#FFFFFF",
  cardSecondary: "#F8F9FA",
  overlay: "rgba(0,0,0,0.5)",

  // UI Elements
  border: "rgba(255,255,255,0.3)",
  borderDark: "#E0E0E0",
  input: "#F5F5F5", // Input background өнгө
  disabled: "rgba(255,255,255,0.5)",

  // Trend Colors
  bullish: "#4CAF50",
  bearish: "#F44336",
  neutral: "#9E9E9E",
};

// Dark Mode Colors
export const darkColors = {
  // Primary Colors
  primary: "#7C4DFF",
  primaryLight: "#9575CD",
  primaryDark: "#5E35B1",
  primaryGradientStart: "#5E35B1",
  primaryGradientEnd: "#7C4DFF",

  // Secondary Colors
  secondary: "#66BB6A",
  secondaryLight: "#81C784",
  secondaryDark: "#4CAF50",

  // Accent Colors
  accent: "#FFB74D",
  accentLight: "#FFCC80",
  accentDark: "#FFA726",

  // Status Colors
  success: "#66BB6A",
  warning: "#FFB74D",
  error: "#EF5350",
  info: "#42A5F5",

  // Text Colors
  textPrimary: "#FFFFFF",
  textSecondary: "#B0B0B0",
  textMuted: "rgba(255,255,255,0.5)",
  textDark: "#FFFFFF", // Dark mode дээр цагаан текст (card дээр)
  textLabel: "#999999", // Label текст (dark card дээр харагдах цайвар саарал)
  textInput: "#FFFFFF", // Input талбарын текст
  placeholderText: "#666666", // Placeholder текст
  icon: "#B0B0B0", // Icon өнгө (dark mode дээр цайвар)

  // Background Colors
  background: "#121212",
  backgroundDark: "#1E1E1E",
  card: "#1E1E1E",
  cardSecondary: "#2C2C2C",
  overlay: "rgba(0,0,0,0.7)",

  // UI Elements
  border: "rgba(255,255,255,0.12)",
  borderDark: "#2C2C2C",
  input: "#2C2C2C", // Input background өнгө
  disabled: "rgba(255,255,255,0.3)",

  // Trend Colors
  bullish: "#66BB6A",
  bearish: "#EF5350",
  neutral: "#9E9E9E",
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
