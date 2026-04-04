# Mobile Copy Guide

_Last updated: 2026-04-03_

## 1) Language System

- Canonical UI locale: `mn` (Mongolian).
- `mobile_app/src/config/copy.ts` is the single source of truth for user-facing copy in critical navigation/auth/news flows.
- Do not mix Mongolian and English copy in one screen state (titles, CTA labels, empty states).

## 2) Information Architecture (IA)

- Canonical signal destination: `Main -> SignalTab`.
- `PredictionTab` now renders the same signal analysis experience as home card tap (single mental model).
- Signal entry points that must stay consistent:
  - Home pair tap (EUR/USD) -> signal analysis screen
  - Bottom tab "Сигнал" -> signal analysis screen
  - Notification type `signal` -> signal analysis screen

## 3) Tone and Wording

- Keep copy concise and actionable.
- Use consistent CTA verbs:
  - `Нэвтрэх`
  - `Бүртгэл үүсгэх`
  - `Профайл засах`
- Use consistent status/empty-state phrasing:
  - `Төлөвлөгдсөн үйл явдал алга`
  - `Мэдээлэл байхгүй байна`

## 4) Accessibility Copy Rules

- Every actionable control must have an explicit `accessibilityLabel`.
- If action intent is not obvious, add `accessibilityHint`.
- Touch targets should include `hitSlop` for small icons.
- Text should support dynamic text scaling (`allowFontScaling` and sensible `maxFontSizeMultiplier`).

## 5) Extension Rules

When adding a new screen:

1. Add copy keys to `mobile_app/src/config/copy.ts` first.
2. Use the same locale bundle in component text.
3. Avoid hard-coded literals unless strictly technical/debug text.
4. Validate screen with larger system font sizes and TalkBack/VoiceOver labels.
