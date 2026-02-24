# -*- coding: utf-8 -*-
"""
Push Notification Service using Expo Push Notifications API
Sends notifications for:
  1. Trading signals (high-confidence BUY/SELL)
  2. News alerts (configurable impact: high / medium / all, 10 min before event)
  3. Security alerts (login from new device)
"""

import requests
import json
from datetime import datetime, timezone
from pymongo import MongoClient
from config.settings import MONGO_URI

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

# Impact level hierarchy for filtering
IMPACT_LEVELS = {"high": 3, "medium": 2, "low": 1}


class PushNotificationService:
    """Expo Push Notification-ийг удирдах сервис"""

    def __init__(self):
        try:
            self.client = MongoClient(MONGO_URI)
            self.db = self.client['users_db']
            self.push_tokens = self.db['push_tokens']
            self.notified_events = self.db['notified_events']  # Track sent news notifications
            # Ensure index on user_id for fast lookups
            self.push_tokens.create_index("user_id", unique=True)
            # TTL index: auto-delete notified events after 24 hours
            self.notified_events.create_index("notified_at", expireAfterSeconds=86400)
            print("[OK] PushNotificationService initialized")
        except Exception as e:
            print(f"[ERROR] PushNotificationService init failed: {e}")
            self.push_tokens = None
            self.notified_events = None

    def register_token(self, user_id: str, push_token: str, platform: str = "unknown",
                       device_id: str = "") -> bool:
        """
        Push token бүртгэх / шинэчлэх
        Args:
            user_id: Хэрэглэгчийн ID
            push_token: ExponentPushToken[xxx]
            platform: 'ios' | 'android'
            device_id: Unique device identifier
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
                        "device_id": device_id,
                        "notifications_enabled": True,
                        "signal_notifications": True,
                        "news_notifications": True,
                        "news_impact_filter": "high",     # "high" | "medium" | "all"
                        "security_notifications": True,
                        "signal_threshold": 0.9,          # 0.9-1.0 (user's personal confidence threshold)
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
        preferences: {
            notifications_enabled, signal_notifications, news_notifications,
            news_impact_filter, security_notifications
        }
        """
        try:
            update_fields = {"updated_at": datetime.now(timezone.utc)}
            allowed_keys = [
                "notifications_enabled", "signal_notifications",
                "news_notifications", "news_impact_filter",
                "security_notifications", "signal_threshold"
            ]
            # Validate signal_threshold range
            if "signal_threshold" in preferences:
                val = float(preferences["signal_threshold"])
                preferences["signal_threshold"] = max(0.9, min(1.0, val))
            for key in allowed_keys:
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
                {
                    "_id": 0,
                    "notifications_enabled": 1,
                    "signal_notifications": 1,
                    "news_notifications": 1,
                    "news_impact_filter": 1,
                    "security_notifications": 1,
                    "signal_threshold": 1
                }
            )
            if doc:
                # Ensure defaults for new fields
                doc.setdefault("news_impact_filter", "high")
                doc.setdefault("security_notifications", True)
                doc.setdefault("signal_threshold", 0.9)
                return doc
            return {
                "notifications_enabled": True,
                "signal_notifications": True,
                "news_notifications": True,
                "news_impact_filter": "high",
                "security_notifications": True,
                "signal_threshold": 0.9
            }
        except Exception as e:
            print(f"[ERROR] Get preferences failed: {e}")
            return {}

    def _get_active_tokens(self, notification_type: str = "all") -> list:
        """
        Идэвхтэй push token-уудыг авах
        notification_type: 'signal' | 'news' | 'security' | 'all'
        """
        try:
            query = {"notifications_enabled": True}
            if notification_type == "signal":
                query["signal_notifications"] = True
            elif notification_type == "news":
                query["news_notifications"] = True
            elif notification_type == "security":
                query["security_notifications"] = {"$ne": False}

            tokens = self.push_tokens.find(query, {"push_token": 1, "_id": 0})
            return [t["push_token"] for t in tokens if t.get("push_token")]
        except Exception as e:
            print(f"[ERROR] Get active tokens failed: {e}")
            return []

    def _get_news_tokens_by_impact(self, impact_level: str) -> list:
        """
        Мэдээний impact-д тохирох хэрэглэгчдийн token авах.
        impact_level: 'high' | 'medium' | 'low'
        Returns tokens of users whose news_impact_filter allows this impact level.
        """
        try:
            event_priority = IMPACT_LEVELS.get(impact_level.lower(), 1)

            query = {
                "notifications_enabled": True,
                "news_notifications": True
            }
            # Find all news-enabled users and filter by their preference
            docs = self.push_tokens.find(query, {
                "push_token": 1, "news_impact_filter": 1, "_id": 0
            })

            tokens = []
            for doc in docs:
                if not doc.get("push_token"):
                    continue
                user_filter = doc.get("news_impact_filter", "high")
                if user_filter == "all":
                    tokens.append(doc["push_token"])
                elif user_filter == "medium" and event_priority >= IMPACT_LEVELS["medium"]:
                    tokens.append(doc["push_token"])
                elif user_filter == "high" and event_priority >= IMPACT_LEVELS["high"]:
                    tokens.append(doc["push_token"])
            return tokens
        except Exception as e:
            print(f"[ERROR] Get news tokens by impact failed: {e}")
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

    def is_event_notified(self, event_key: str) -> bool:
        """Энэ мэдээний мэдэгдэл аль хэдийн илгээсэн эсэхийг шалгах"""
        try:
            return self.notified_events.find_one({"_id": event_key}) is not None
        except Exception:
            return False

    def mark_event_notified(self, event_key: str):
        """Мэдээний мэдэгдэл илгээснийг бүртгэх"""
        try:
            self.notified_events.update_one(
                {"_id": event_key},
                {"$set": {"notified_at": datetime.now(timezone.utc)}},
                upsert=True
            )
        except Exception as e:
            print(f"[WARN] Mark event notified failed: {e}")

    def _get_signal_tokens_by_threshold(self, confidence: float) -> list:
        """
        Хэрэглэгчийн signal_threshold-д тохирох token-уудыг авах.
        confidence: Сигналын итгэлцүүр (0-1 хооронд, жишээ нь 0.95)
        Зөвхөн итгэлцүүр >= хэрэглэгчийн босго үед илгээнэ.
        """
        try:
            # Convert confidence to 0-1 range if needed
            if confidence > 1:
                confidence = confidence / 100.0

            query = {
                "notifications_enabled": True,
                "signal_notifications": True
            }
            docs = self.push_tokens.find(query, {
                "push_token": 1, "signal_threshold": 1, "_id": 0
            })

            tokens = []
            for doc in docs:
                if not doc.get("push_token"):
                    continue
                user_threshold = doc.get("signal_threshold", 0.9)
                if confidence >= user_threshold:
                    tokens.append(doc["push_token"])
            return tokens
        except Exception as e:
            print(f"[ERROR] Get signal tokens by threshold failed: {e}")
            return []

    def send_signal_notification(self, signal_data: dict) -> dict:
        """
        Арилжааны сигнал мэдэгдэл илгээх (хэрэглэгч бүрийн босгоор шүүнэ)
        signal_data: { signal_type, pair, confidence, entry_price, sl, tp }
        confidence >= хэрэглэгчийн signal_threshold үед л мэдэгдэл илгээнэ.
        """
        confidence_raw = signal_data.get("confidence", 0)
        tokens = self._get_signal_tokens_by_threshold(confidence_raw)
        if not tokens:
            print(f"[INFO] No active tokens for signal notifications (conf={confidence_raw})")
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
                "channelId": "signals",
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
        Мэдээний мэдэгдэл илгээх (impact-д тохируулан хэрэглэгч бүрд шүүнэ)
        news_data: { title, impact, currency, description, event_time }
        """
        impact = news_data.get("impact", "medium").lower()
        currency = news_data.get("currency", "USD")
        news_title = news_data.get("title", "Economic News")
        event_time = news_data.get("event_time", "")

        # Get tokens filtered by each user's impact preference
        tokens = self._get_news_tokens_by_impact(impact)
        if not tokens:
            print(f"[INFO] No active tokens for {impact} impact news notifications")
            return {"success": True, "sent": 0}

        impact_emoji = "🔴" if impact == "high" else "🟡" if impact == "medium" else "🟢"

        title = f"{impact_emoji} {currency} - News Alert"
        body = news_title
        if event_time:
            body = f"⏰ {event_time}\n{body}"
        if news_data.get("description"):
            body += f"\n{news_data['description'][:100]}"

        messages = [
            {
                "to": token,
                "title": title,
                "body": body,
                "sound": "default",
                "priority": "high" if impact == "high" else "default",
                "channelId": "news",
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

    def send_security_alert(self, user_id: str, login_info: dict) -> dict:
        """
        Аюулгүй байдлын мэдэгдэл илгээх (шинэ төхөөрөмжөөс нэвтрэхэд)
        login_info: { ip, platform, device_name, login_time }
        """
        try:
            doc = self.push_tokens.find_one({
                "user_id": user_id,
                "notifications_enabled": True,
                "security_notifications": {"$ne": False}
            })
            if not doc or not doc.get("push_token"):
                print(f"[INFO] No active token for security alert (user: {user_id})")
                return {"success": True, "sent": 0}

            platform = login_info.get("platform", "Unknown device")
            ip = login_info.get("ip", "Unknown IP")
            login_time = login_info.get("login_time", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"))

            title = "🔐 New Login Detected"
            body = f"New login from {platform}\nIP: {ip}\nTime: {login_time}"

            messages = [{
                "to": doc["push_token"],
                "title": title,
                "body": body,
                "sound": "default",
                "priority": "high",
                "channelId": "security",
                "data": {
                    "type": "security",
                    "screen": "Profile"
                }
            }]

            return self._send_expo_notifications(messages)
        except Exception as e:
            print(f"[ERROR] Send security alert failed: {e}")
            return {"success": False, "error": str(e)}

    def get_user_device(self, user_id: str) -> dict:
        """Хэрэглэгчийн бүртгэлтэй төхөөрөмжийн мэдээлэл авах"""
        try:
            doc = self.push_tokens.find_one(
                {"user_id": user_id},
                {"_id": 0, "push_token": 1, "device_id": 1, "platform": 1}
            )
            return doc or {}
        except Exception:
            return {}


# Singleton instance
push_service = PushNotificationService()
