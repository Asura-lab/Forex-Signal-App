#!/usr/bin/env python3
"""
ProfileScreen.js-ийн hardcoded өнгийг dynamic colors руу солих script
"""

import re

# Файл унших
with open('mobile_app/src/screens/ProfileScreen.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Өнгөний mapping
replacements = [
    (r'backgroundColor:\s*"#FFFFFF"', 'backgroundColor: colors.card'),
    (r'backgroundColor:\s*"#F5F5F5"', 'backgroundColor: colors.input'),
    (r'backgroundColor:\s*"#4CAF50"', 'backgroundColor: colors.secondary'),
    (r'backgroundColor:\s*"#2196F3"', 'backgroundColor: colors.info'),
    (r'backgroundColor:\s*"#1a237e"', 'backgroundColor: colors.primary'),
    (r'backgroundColor:\s*"#E0E0E0"', 'backgroundColor: colors.borderDark'),
    (r'backgroundColor:\s*"#FAFAFA"', 'backgroundColor: colors.cardSecondary'),
    (r'color:\s*"#FFFFFF"', 'color: colors.textPrimary'),
    (r'color:\s*"#212121"', 'color: colors.textDark'),
    (r'color:\s*"#666"', 'color: colors.textMuted'),
    (r'color:\s*"#757575"', 'color: colors.textMuted'),
    (r'color:\s*"#999"', 'color: colors.textMuted'),
    (r'color:\s*"#424242"', 'color: colors.textDark'),
    (r'color:\s*"#2196F3"', 'color: colors.info'),
    (r'borderColor:\s*"#E0E0E0"', 'borderColor: colors.borderDark'),
    (r'borderTopColor:\s*"#E0E0E0"', 'borderTopColor: colors.borderDark'),
    (r'borderColor:\s*"#CCC"', 'borderColor: colors.border'),
]

# Солих
for pattern, replacement in replacements:
    content = re.sub(pattern, replacement, content)

# Файл бичих
with open('mobile_app/src/screens/ProfileScreen.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ ProfileScreen.js өнгөнүүд шинэчлэгдлээ!")
