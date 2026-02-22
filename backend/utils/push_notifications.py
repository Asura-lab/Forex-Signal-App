# -*- coding: utf-8 -*-
"""
Push Notification Service using Expo Push Notifications API
Sends notifications for high-confidence signals and major news events.
"""

import requests
import json
from datetime import datetime, timezone
from pymongo import MongoClient
from config.settings import MONGO_URI

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


class PushNotificationService:
    """Expo Push Notification-ийг удирдах сервис"""

    def __init__(self):
        try:
            self.client = MongoClient(MONGO_URI)
            self.db = self.client['users_db']
            self.push_tokens = self.db['push_tokens']
            # Ensure index on user_id for fast lookups
            self.push_tokens.create_index("user_id", unique=True)
            print("[OK] PushNotificationService initialized")
        except Exception as e:
            print(f"[ERROR] PushNotificationService init failed: {e}")
            self.push_tokens = None

    def register_token(self, user_id: str, push_token: str, platform: str = "unknown") -> bool:
        """
        Push token бүртгэх / шинэчлэх
        Args:
            user_id: Хэрэглэгчийн ID
            push_token: ExponentPushToken[xxx]
            platform: 'ios' | 'android'
        """
        try:
            if not push_token or not push_token.startswith("ExponentPushToken"):
                print(f"[WARN] Invalid push token format: {push_token}")
                return False

            self.push_tokens.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "user_id": user_id,
                        "push_token": push_token,
                        "platform": platform,
                        "notifications_enabled": True,
                        "signal_notifications": True,
                        "news_notifications": True,
                        "updated_at": datetime.now(timezone.utc)
                    },
                    "$setOnInsert": {
                        "created_at": datetime.now(timezone.utc)
                    }
                },
                upsert=True
            )
            print(f"[OK] Push token registered for user {user_id}")
            return True
        except Exception as e:
            print(f"[ERROR] Register push token failed: {e}")
            return False

    def unregister_token(self, user_id: str) -> bool:
        """Push token устгах"""
        try:
            self.push_tokens.delete_one({"user_id": user_id})
            print(f"[OK] Push token removed for user {user_id}")
            return True
        except Exception as e:
            print(f"[ERROR] Unregister push token failed: {e}")
            return False

    def update_preferences(self, user_id: str, preferences: dict) -> bool:
        """
        Мэдэгдлийн тохиргоо шинэчлэх
        preferences: { notifications_enabled, signal_notifications, news_notifications }
        """
        try:
            update_fields = {"updated_at": datetime.now(timezone.utc)}
            for key in ["notifications_enabled", "signal_notifications", "news_notifications"]:
                if key in preferences:
                    update_fields[key] = preferences[key]

            result = self.push_tokens.update_one(
                {"user_id": user_id},
                {"$set": update_fields}
            )
            return result.modified_count > 0 or result.matched_count > 0
        except Exception as e:
            print(f"[ERROR] Update preferences failed: {e}")
            return False

    def get_preferences(self, user_id: str) -> dict:
        """Хэрэглэгчийн мэдэгдлийн тохиргоо авах"""
        try:
            doc = self.push_tokens.find_one(
                {"user_id": user_id},
                {"_id": 0, "notifications_enabled": 1, "signal_notifications": 1, "news_notifications": 1}
            )
            if doc:
                return doc
            return {
                "notifications_enabled": True,
                "signal_notifications": True,
                "news_notifications": True
            }
        except Exception as e:
            print(f"[ERROR] Get preferences failed: {e}")
            return {}

    def _get_active_tokens(self, notification_type: str = "all") -> list:
        """
        Идэвхтэй push token-уудыг авах
        notification_type: 'signal' | 'news' | 'all'
        """
        try:
            query = {"notifications_enabled": True}
            if notification_type == "signal":
                query["signal_notifications"] = True
            elif notification_type == "news":
                query["news_notifications"] = True

            tokens = self.push_tokens.find(query, {"push_token": 1, "_id": 0})
            return [t["push_token"] for t in tokens if t.get("push_token")]
        except Exception as e:
            print(f"[ERROR] Get active tokens failed: {e}")
            return []

    def _send_expo_notifications(self, messages: list) -> dict:
        """
        Expo Push API-руу мэдэгдэл илгээх
        messages: [{ to, title, body, data, sound, priority }]
        """
        if not messages:
            return {"success": False, "error": "No messages to send"}

        try:
            # Expo API accepts batches of up to 100
            results = []
            for i in range(0, len(messages), 100):
                batch = messages[i:i + 100]
                response = requests.post(
                    EXPO_PUSH_URL,
                    json=batch,
                    headers={
                        "Accept": "application/json",
                        "Accept-Encoding": "gzip, deflate",
                        "Content-Type": "application/json",
                    },
                    timeout=10
                )
                if response.status_code == 200:
                    data = response.json()
                    results.extend(data.get("data", []))
                else:
                    print(f"[ERROR] Expo push API error: {response.status_code} - {response.text}")

            # Check for invalid tokens and remove them
            for i, result in enumerate(results):
                if result.get("status") == "error":
                    details = result.get("details", {})
                    if details.get("error") == "DeviceNotRegistered":
                        token = messages[i]["to"] if i < len(messages) else None
                        if token:
                            self.push_tokens.delete_one({"push_token": token})
                            print(f"[INFO] Removed invalid token: {token[:30]}...")

            success_count = sum(1 for r in results if r.get("status") == "ok")
            print(f"[OK] Push notifications sent: {success_count}/{len(messages)}")
            return {"success": True, "sent": success_count, "total": len(messages)}

        except Exception as e:
            print(f"[ERROR] Send push notifications failed: {e}")
            return {"success": False, "error": str(e)}

    def send_signal_notification(self, signal_data: dict) -> dict:
        """
        Арилжааны сигнал мэдэгдэл илгээх
        signal_data: { signal_type, pair, confidence, entry_price, sl, tp }
        """
        tokens = self._get_active_tokens("signal")
        if not tokens:
            print("[INFO] No active tokens for signal notifications")
            return {"success": True, "sent": 0}

        signal_type = signal_data.get("signal_type", "HOLD").upper()
        pair = signal_data.get("pair", "EUR/USD")
        confidence = signal_data.get("confidence", 0)
        entry = signal_data.get("entry_price", "N/A")

        # Format confidence as percentage  
        if isinstance(confidence, (int, float)):
            if confidence <= 1:
                conf_pct = f"{confidence * 100:.1f}%"
            else:
                conf_pct = f"{confidence:.1f}%"
        else:
            conf_pct = str(confidence)

        # Emoji based on signal type
        emoji = "📈" if signal_type == "BUY" else "📉" if signal_type == "SELL" else "⏸️"

        title = f"{emoji} {signal_type} Signal - {pair}"
        body = f"Confidence: {conf_pct} | Entry: {entry}"

        if signal_data.get("sl") and signal_data.get("tp"):
            body += f"\nSL: {signal_data['sl']} | TP: {signal_data['tp']}"

        messages = [
            {
                "to": token,
                "title": title,
                "body": body,
                "sound": "default",
                "priority": "high",
                "data": {
                    "type": "signal",
                    "signal_type": signal_type,
                    "pair": pair,
                    "confidence": confidence,
                    "entry_price": entry,
                    "screen": "Signal"
                }
            }
            for token in tokens
        ]

        return self._send_expo_notifications(messages)

    def send_news_notification(self, news_data: dict) -> dict:
        """
        Томоохон мэдээний мэдэгдэл илгээх
        news_data: { title, impact, currency, description }
        """
        tokens = self._get_active_tokens("news")
        if not tokens:
            print("[INFO] No active tokens for news notifications")
            return {"success": True, "sent": 0}

        impact = news_data.get("impact", "medium").lower()
        currency = news_data.get("currency", "USD")
        news_title = news_data.get("title", "Economic News")

        # Only send for high impact news
        impact_emoji = "🔴" if impact == "high" else "🟡" if impact == "medium" else "🟢"

        title = f"{impact_emoji} {currency} - Major News Alert"
        body = news_title
        if news_data.get("description"):
            body += f"\n{news_data['description'][:100]}"

        messages = [
            {
                "to": token,
                "title": title,
                "body": body,
                "sound": "default",
                "priority": "high" if impact == "high" else "default",
                "data": {
                    "type": "news",
                    "impact": impact,
                    "currency": currency,
                    "screen": "News"
                }
            }
            for token in tokens
        ]

        return self._send_expo_notifications(messages)


# Singleton instance
push_service = PushNotificationService()
