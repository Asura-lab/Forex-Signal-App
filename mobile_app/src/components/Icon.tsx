import React from "react";
import { View, Text, StyleSheet } from "react-native";

/**
 * Simple Icon component using text symbols
 * Clean design without emoji
 */

const iconMap = {
  // Navigation
  "home": "⌂",
  "home-outline": "⌂",
  "person": "○",
  "person-outline": "○",
  "settings": "☰",
  "settings-outline": "☰",
  
  // Actions  
  "trending-up": "↗",
  "trending-down": "↘",
  "checkmark": "✓",
  "checkmark-circle": "✓",
  "close": "×",
  "close-circle": "×",
  "add": "+",
  "remove": "−",
  "refresh": "↻",
  "search": "◎",
  
  // Auth
  "mail": "@",
  "mail-outline": "@",
  "lock-closed": "◉",
  "lock-closed-outline": "◉",
  "eye": "◉",
  "eye-outline": "◉",
  "eye-off": "◯",
  "eye-off-outline": "◯",
  "key": "⚿",
  "key-outline": "⚿",
  
  // Info
  "information-circle": "ⓘ",
  "information-circle-outline": "ⓘ",
  "warning": "!",
  "warning-outline": "!",
  "alert-circle": "●",
  "alert-circle-outline": "○",
  "help-circle": "?",
  "help-circle-outline": "?",
  
  // Arrows
  "arrow-forward": "→",
  "arrow-back": "←",
  "arrow-up": "↑",
  "arrow-down": "↓",
  "chevron-forward": "›",
  "chevron-back": "‹",
  "chevron-up": "∧",
  "chevron-down": "∨",
  "caret-up": "▲",
  "caret-down": "▼",
  
  // Finance
  "cash": "$",
  "cash-outline": "$",
  "wallet": "▣",
  "wallet-outline": "▢",
  "card": "▭",
  "card-outline": "▭",
  "stats-chart": "▥",
  "analytics": "▦",
  "pulse": "~",
  
  // Status
  "time": "◷",
  "time-outline": "◷",
  "calendar": "▦",
  "calendar-outline": "▦",
  "notifications": "◉",
  "notifications-outline": "◎",
  "notifications-off": "◯",
  "notifications-off-outline": "◯",
  
  // Actions
  "log-out": "→",
  "log-out-outline": "→",
  "create": "✎",
  "create-outline": "✎",
  "trash": "✕",
  "trash-outline": "✕",
  "copy": "▢",
  "copy-outline": "▢",
  "share": "↗",
  "share-outline": "↗",
  
  // Misc
  "moon": "☽",
  "moon-outline": "☽",
  "sunny": "☀",
  "sunny-outline": "○",
  "contrast": "◐",
  "contrast-outline": "◐",
  "phone-portrait": "▯",
  "phone-portrait-outline": "▯",
  "globe": "◎",
  "globe-outline": "◎",
  "shield": "◇",
  "shield-checkmark": "◆",
  "document-text": "≡",
  "document-text-outline": "≡",
  "chatbubble": "◯",
  "chatbubble-outline": "○",
  "star": "★",
  "star-outline": "☆",
  "heart": "♥",
  "heart-outline": "♡",
  
  // Default
  "default": "•",
};

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

const Icon = ({ name, size = 24, color = "#000000", style }: IconProps) => {
  const symbol = iconMap[name as keyof typeof iconMap] || iconMap["default"];
  
  return (
    <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
      <Text
        style={{
          fontSize: size * 0.75,
          color: color,
          fontWeight: '300',
        }}
      >
        {symbol}
      </Text>
    </View>
  );
};

// Also export as Ionicons for easier migration
export const Ionicons = Icon;
export const MaterialCommunityIcons = Icon;

export default Icon;
