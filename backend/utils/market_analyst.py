# -*- coding: utf-8 -*-
import sys
import random
import json
import ast
import time
import requests
import urllib.parse
import re

# google-genai import (failsafe)
try:
    from google import genai
    from google.genai import types as genai_types
    GENAI_AVAILABLE = True
    print("[OK] google-genai imported successfully", flush=True)
except Exception as e:
    print(f"[ERROR] google-genai import failed: {e}", flush=True)
    GENAI_AVAILABLE = False
    genai = None
    genai_types = None

from datetime import datetime, timedelta, timezone
from pymongo import MongoClient
from config.settings import MONGO_URI, GEMINI_API_KEYS
from utils.tradingview_handler import tradingview_handler
from utils.alphavantage_handler import alphavantage_handler

class MarketAnalyst:
    """
    Market Analysis & AI Insights using Google Gemini (Free Tier)
    Integrates with AlphaVantage (Sentiment) & TradingView (Calendar).
    """
    
    # Model constants
    FLASH_MODEL = 'gemini-2.5-flash'       # Хослол болон зах зээлийн тойм
    LITE_MODEL  = 'gemini-2.5-flash-lite'  # Бусад (мэдээний шинжилгээ гэх мэт)

    def __init__(self):
        # Configure Gemini with Key Rotation (21 keys)
        self.api_keys = GEMINI_API_KEYS
        self.current_key_index = 0
        self.gemini = None

        if self.api_keys and GENAI_AVAILABLE:
            self._configure_gemini()
            print(f"[INFO] {len(self.api_keys)} Gemini API key бэлэн байна.", flush=True)
        else:
            if not GENAI_AVAILABLE:
                print("[WARN] google-genai суулгаагүй. Pollinations fallback ашиглана.", flush=True)
            else:
                print("[WARN] GEMINI_API_KEYS олдсонгүй. Pollinations fallback ашиглана.", flush=True)

        # MongoDB Connection
        try:
            self.client = MongoClient(
                MONGO_URI,
                serverSelectionTimeoutMS=5000,   # 5 секунд хүлээнэ
                connectTimeoutMS=5000,
                socketTimeoutMS=10000,
            )
            # Холболтыг verify хийнэ (timeout дотор)
            self.client.admin.command('ping')
            self.db = self.client.get_database()
            self.news_collection = self.db.news_analysis
            self.insights_collection = self.db.ai_insights
            print("[OK] MarketAnalyst connected to MongoDB")
        except Exception as e:
            print(f"[WARN] MongoDB холбогдсонгүй, offline горимд ажиллана: {e}", flush=True)
            self.client = None
            self.db = None
            self.news_collection = None
            self.insights_collection = None

        # Cache settings (per-pair)
        self._insight_cache = {}  # { pair: { "data": ..., "time": ... } }
        self.cache_duration_market = 3600  # 1 цаг — зах зээлийн ерөнхий төлөв
        self.cache_duration_pair   = 600  # 10 минут — хосолсон шинжилгээ

        # ─── Flash exhaustion tracking ───
        # Тойрог: key#1→key#21→key#1 (circular)
        # Key#21 нь тойргийн сүүлийн sentinel болж ажиллана:
        #   5мин дотор 2 удаа key#21 Flash 429 → Flash exhausted гэж тэмдэглэнэ
        # 2 цаг тутамд key#1-ээр probe хийж Flash сэргэсэн эсэхийг шалгана
        self._flash_exhausted        = False
        self._flash_last_probe_at    = None   # сүүлийн probe цаг (None=probe хийгдээгүй)
        self._flash_key21_fail_times = []     # key#21 Flash 429 timestamp-ууд
        self.FLASH_EXHAUSTION_WINDOW = 5 * 60   # 5 минут
        self.FLASH_EXHAUSTION_COUNT  = 2        # 5мин дотор хэдэн удаа fail бол exhausted
        self.FLASH_PROBE_INTERVAL    = 2 * 3600 # 2 цаг тутамд probe

    def _configure_gemini(self):
        """Initialize Gemini client with current API key"""
        try:
            current_key = self.api_keys[self.current_key_index]
            self.gemini = genai.Client(api_key=current_key)
            print(f"[INFO] Gemini client: Key #{self.current_key_index + 1}/{len(self.api_keys)}", flush=True)
        except Exception as e:
            print(f"[ERROR] Gemini Configuration Error: {e}", flush=True)

    def _probe_flash(self):
        """Key#1-ээр Flash-г туршиж сэргэсэн эсэхийг шалгана.
        Returns True хэрэв Flash ажилласан бол, False бол.
        """
        if not self.gemini or not GENAI_AVAILABLE:
            return False
        saved_index = self.current_key_index
        try:
            self.current_key_index = 0
            self._configure_gemini()
            response = self.gemini.models.generate_content(
                model=self.FLASH_MODEL,
                contents="Say 'ok'",
                config=genai_types.GenerateContentConfig(
                    safety_settings=[
                        genai_types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="BLOCK_NONE"),
                    ]
                )
            )
            text = response.text.strip() if response.text else ""
            if text:
                print(f"[INFO] Flash probe key#1 OK: '{text[:30]}'", flush=True)
                return True
            return False
        except Exception as e:
            error_str = str(e).lower()
            if any(x in error_str for x in ["429", "quota", "resource_exhausted"]):
                print(f"[INFO] Flash probe key#1: 429 → хоёр цаг болоогүй.", flush=True)
            else:
                print(f"[WARN] Flash probe error: {e}", flush=True)
            # Probe амжилтгүй → index-ийг сэргээ
            self.current_key_index = saved_index
            self._configure_gemini()
            return False

    def _call_ai(self, prompt, force_json=False, model=None, retries=3):
        """Unified AI caller: Gemini (key circular rotation) → Pollinations.

        Flash логик:
          • Key#1→Key#21→Key#1 тойрог хэлбэрээр ажиллана
          • Key#21 Flash 429: sentinel болж 5мин дотор 2x гарвал Flash exhausted
          • Flash exhausted: Lite-д key#1-ээс тойрог эхэлнэ
          • 2 цаг тутамд key#1-ээр probe → сэргэсэн бол Flash тойрогт буцна
        """
        use_model = model or self.LITE_MODEL

        # ─── Flash exhausted үед: 2ц probe эсвэл Lite руу шилжих ───
        if use_model == self.FLASH_MODEL and self._flash_exhausted:
            now = time.time()
            elapsed = now - self._flash_last_probe_at if self._flash_last_probe_at else self.FLASH_PROBE_INTERVAL + 1

            if elapsed >= self.FLASH_PROBE_INTERVAL:
                print(f"[INFO] Flash probe эхэлнэ (өмнөх probe-оос {elapsed/60:.0f}мин өнгөрсөн)...", flush=True)
                if self._probe_flash():
                    # Flash сэргэсэн → tühül state-г цэвэрлэж тойрогт буцна
                    self._flash_exhausted        = False
                    self._flash_last_probe_at    = None
                    self._flash_key21_fail_times = []
                    # current_key_index = 0 аль хэдийн probe дотор тохируулсан
                    print(f"[INFO] Flash сэргэсэн → Flash тойрогт буцлаа.", flush=True)
                    # use_model = FLASH_MODEL хэвээрээ → доорх тойрог логик ажиллана
                else:
                    # Probe амжилтгүй → probe timer шинэчил, Lite ашиглана
                    self._flash_last_probe_at = now
                    remaining_min = int(self.FLASH_PROBE_INTERVAL / 60)
                    print(f"[INFO] Flash probe амжилтгүй → {remaining_min}мин-д дахин туршина. Lite ашиглана.", flush=True)
                    return self._call_ai(prompt, force_json=force_json, model=self.LITE_MODEL, retries=retries)
            else:
                remaining_min = int((self.FLASH_PROBE_INTERVAL - elapsed) / 60)
                print(f"[INFO] Flash exhausted (probe-д үлдсэн: {remaining_min}мин) → Lite ашиглана.", flush=True)
                return self._call_ai(prompt, force_json=force_json, model=self.LITE_MODEL, retries=retries)

        # 1. Try Gemini — тойрог: key#1→key#21→key#1
        if self.gemini:
            keys_tried = 0
            total_keys = len(self.api_keys)

            while keys_tried < total_keys:
                try:
                    final_prompt = (
                        "IMPORTANT: This analysis is for EDUCATIONAL PURPOSES ONLY. "
                        "Do not provide financial advice.\n\n" + prompt
                    )
                    if force_json:
                        final_prompt += "\n\nReturn JSON only."

                    safety_settings = [
                        genai_types.SafetySetting(category="HARM_CATEGORY_HARASSMENT",        threshold="BLOCK_NONE"),
                        genai_types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH",       threshold="BLOCK_NONE"),
                        genai_types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="BLOCK_NONE"),
                        genai_types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_NONE"),
                    ]
                    config_kwargs = {"safety_settings": safety_settings}
                    if force_json:
                        config_kwargs["response_mime_type"] = "application/json"

                    response = self.gemini.models.generate_content(
                        model=use_model,
                        contents=final_prompt,
                        config=genai_types.GenerateContentConfig(**config_kwargs)
                    )

                    try:
                        text = response.text.strip()
                    except (ValueError, AttributeError):
                        raise Exception("Gemini Safety Block - Empty Response")

                    if not text:
                        raise Exception("Gemini returned empty text string")

                    print(f"[DEBUG] Gemini [{use_model}] Key#{self.current_key_index+1} OK: {text[:80]}...", flush=True)
                    return text

                except Exception as e:
                    error_str = str(e).lower()
                    is_rate_limit = any(x in error_str for x in ["429", "quota", "resource_exhausted", "exhausted"])
                    is_auth_error = any(x in error_str for x in ["403", "leaked", "permission", "invalid", "unauthenticated"])

                    print(f"[WARN] Gemini [{use_model}] Key#{self.current_key_index+1}: {e}", flush=True)

                    if is_rate_limit or is_auth_error:
                        was_last_key = (self.current_key_index == total_keys - 1)

                        # ─── Key#21 sentinel: Flash exhaustion шалгах ───
                        if use_model == self.FLASH_MODEL and is_rate_limit and was_last_key:
                            now = time.time()
                            self._flash_key21_fail_times.append(now)
                            # 5 минут хуучирсан fail-уудыг арилга
                            self._flash_key21_fail_times = [
                                t for t in self._flash_key21_fail_times
                                if now - t <= self.FLASH_EXHAUSTION_WINDOW
                            ]
                            fail_count = len(self._flash_key21_fail_times)
                            print(f"[WARN] Key#21 Flash 429: {fail_count}/{self.FLASH_EXHAUSTION_COUNT} (5мин дотор)", flush=True)

                            if fail_count >= self.FLASH_EXHAUSTION_COUNT:
                                # Flash exhausted — Lite тойрогт шилж
                                self._flash_exhausted        = True
                                self._flash_last_probe_at    = now
                                self._flash_key21_fail_times = []
                                self.current_key_index       = 0
                                self._configure_gemini()
                                print(f"[WARN] Flash exhausted (key#21 5мин дотор {self.FLASH_EXHAUSTION_COUNT}x 429) → 2ц-д probe. Lite ашиглана.", flush=True)
                                return self._call_ai(prompt, force_json=force_json, model=self.LITE_MODEL, retries=retries)

                        # Тойрог: дараагийн key рүү шилж (circular)
                        self.current_key_index = (self.current_key_index + 1) % total_keys
                        self._configure_gemini()
                        keys_tried += 1
                        print(f"[INFO] Key#{self.current_key_index+1}-рүү шилжлээ ({keys_tried}/{total_keys})", flush=True)
                        continue

                    # Загвар/safety алдаа → Pollinations руу
                    print(f"[WARN] Model/Safety error → Pollinations fallback.", flush=True)
                    break

            if keys_tried >= total_keys:
                print(f"[WARN] [{use_model}] Бүх {total_keys} key хязгаар тулсан → Pollinations fallback.", flush=True)

        # 2. Fallback to Pollinations
        url = "https://text.pollinations.ai/"
        final_prompt = prompt
        if force_json:
            final_prompt += "\n\nCRITICAL: RESPONSE MUST BE VALID JSON ONLY. NO OTHER TEXT."

        for attempt in range(retries):
            try:
                response = requests.post(url, data=final_prompt.encode('utf-8'), timeout=60)
                if response.status_code == 200:
                    text = response.text.strip()
                    for marker in ["**Support Pollinations.AI:**", "**Ad**", "---"]:
                        if marker in text:
                            text = text.split(marker)[0]
                    return text.strip()
                time.sleep(1)
            except Exception as e:
                print(f"Pollinations API Error (Attempt {attempt+1}/{retries}): {e}")
                time.sleep(1)
        return None

    def get_latest_news(self, limit=10):
        """Get latest news from Alpha Vantage (Priority) or TradingView (Fallback)"""
        try:
            # 1. Try Alpha Vantage for News + Sentiment
            print("[INFO] Fetching Alpha Vantage News...")
            av_news = alphavantage_handler.get_forex_news(limit=limit)
            if av_news:
                print(f"[OK] Loaded {len(av_news)} news items from Alpha Vantage")
                return av_news

            # 2. Fallback to TradingView if AV fails or empty
            print("[WARN] Alpha Vantage empty/failed, falling back to TradingView")
            events = tradingview_handler.get_events(days_back=1, days_forward=1)
            if not events: return []
            
            formatted_news = []
            for event in events[:limit]:
                formatted_news.append(self._format_event(event))
            return formatted_news
        except Exception as e:
            print(f"Error fetching news: {e}")
            return []

    def get_news_history(self, limit=20):
        """Get past news events"""
        try:
            events = tradingview_handler.get_events(days_back=3, days_forward=0)
            if not events: return []
            
            past_events = []
            for event in events:
                if event.get('actual'):
                    past_events.append(self._format_event(event))
            return past_events[::-1][:limit]
        except Exception as e:
            print(f"Error getting news history: {e}")
            return []

    def get_upcoming_news(self, limit=20):
        """Get upcoming news events"""
        try:
            events = tradingview_handler.get_events(days_back=0, days_forward=7)
            if not events: return []
            
            upcoming_events = []
            for event in events:
                if not event.get('actual'):
                    upcoming_events.append(self._format_event(event))
            return upcoming_events[:limit]
        except Exception as e:
            print(f"Error getting upcoming news: {e}")
            return []

    def get_market_outlook(self):
        """Get general market outlook"""
        # Dummy signal for general market
        dummy_signal = {'signal': 'NEUTRAL', 'confidence': 50}
        return self.generate_ai_insight(dummy_signal, pair="MARKET")

    def _generate_simple_analysis(self, event):
        """Generate simple rule-based analysis (Mongolian)"""
        try:
            actual_str = str(event.get('actual', '0')).replace('%', '').replace('K', '').replace('M', '').replace('B', '')
            forecast_str = str(event.get('forecast', '0')).replace('%', '').replace('K', '').replace('M', '').replace('B', '')
            
            if not actual_str or not forecast_str: return "Мэдээлэл дутуу байна."

            try:
                actual = float(actual_str)
                forecast = float(forecast_str)
            except ValueError: return "Тоон мэдээлэл тодорхойгүй."

            currency = event.get('currency')
            
            positive_templates = [
                f"Хүлээлтээс сайн гарлаа. {currency} чангарах төлөвтэй.",
                f"Эерэг мэдээ. {currency}-д өсөлтийн дохио болж байна.",
                f"Таамаглалыг давлаа. {currency} ханш өсөх магадлалтай."
            ]
            negative_templates = [
                f"Хүлээлтээс муу гарлаа. {currency} сулрах төлөвтэй.",
                f"Сөрөг мэдээ. {currency}-д уналтын дохио болж байна.",
                f"Таамаглалд хүрсэнгүй. {currency} ханш унах магадлалтай."
            ]
            neutral_templates = [
                f"Хүлээлтийн дагуу гарлаа. {currency} тогтвортой байна.",
                f"Таамаглалтай ижил. {currency} ханшид нөлөө багатай."
            ]

            if actual > forecast: return random.choice(positive_templates)
            elif actual < forecast: return random.choice(negative_templates)
            else: return random.choice(neutral_templates)
        except Exception as e:
            return "Тодорхойгүй."

    def analyze_specific_event(self, event_data):
        """Generate detailed analysis for a specific event"""
        try:
            prompt = f"""
ROLE: Senior Macroeconomic Analyst & Institutional Forex Strategist.
TASK: Provide a highly professional, institutional-grade analysis of the following economic event in MONGOLIAN (Cyrillic).

EVENT DETAILS:
- Event: {event_data.get('title')}
- Currency: {event_data.get('currency', 'Unknown')}
- Actual Value: {event_data.get('actual', 'N/A')}
- Forecast Value: {event_data.get('forecast', 'N/A')}

STRICT FORMATTING REQUIREMENTS:
You must output EXACTLY three sections using the exact headers below. Do not add any introductory or concluding remarks. Use highly professional financial terminology.

**1. Үзүүлэлтийн танилцуулга:**
(Explain the macroeconomic significance of this indicator in 1-2 precise sentences. What does it measure and why do central banks care?)

**2. Үр дүнгийн шинжилгээ:**
(Analyze the Actual vs Forecast deviation. Explain the fundamental transmission mechanism: how this specific result impacts inflation expectations, monetary policy (interest rates), and consequently the {event_data.get('currency', 'Unknown')} valuation. Be highly logical and objective.)

**3. Зах зээлийн хүлээлт:**
(What is the immediate market implication? What subsequent data points or central bank actions should traders monitor next?)

TONE: Institutional, analytical, objective. No financial advice.
"""
            response = self._call_ai(prompt, model=self.LITE_MODEL)
            return response if response else "AI холболт амжилтгүй боллоо."
        except Exception as e:
            print(f"Detailed analysis error: {e}")
            return "Дэлгэрэнгүй мэдээлэл авахад алдаа гарлаа."

    def _format_event(self, event):
        """Helper to format TradingView event for UI"""
        title = event.get('event_name', 'Economic Event')
        currency = event.get('currency', '')
        impact = event.get('impact', 'Low')
        actual = event.get('actual', '')
        forecast = event.get('forecast', '')
        time_str = event.get('date', '')
        
        try:
            dt = datetime.fromisoformat(time_str.replace('Z', '+00:00'))
            time_display = dt.strftime("%Y-%m-%d %H:%M")
        except:
            time_display = time_str

        summary = f"Impact: {impact}"
        if actual: summary += f" | Actual: {actual}"
        if forecast: summary += f" | Forecast: {forecast}"
            
        return {
            "id": str(random.randint(1000, 9999)),
            "title": f"{currency} - {title}",
            "summary": summary,
            "source": "TradingView",
            "sentiment": impact,
            "date": time_display,
            "actual": actual,
            "forecast": forecast,
            "impact_analysis": self._generate_simple_analysis(event) if actual else "",
            "raw": event
        }

    def analyze_news_impact(self, news_item):
        """Analyze a single news item using Pollinations"""
        if getattr(self, 'db', None) is None: return "Database unavailable."

        news_id = f"{news_item.get('date')}_{news_item.get('name')}_{news_item.get('currency')}"
        
        existing = self.news_collection.find_one({"_id": news_id})
        if existing: return existing.get('impact_analysis')

        try:
            prompt = f"""
ROLE: Institutional Quantitative Macro Strategist.
TASK: Write EXACTLY ONE highly professional, analytical sentence in MONGOLIAN explaining the fundamental impact of this event.

NEWS EVENT:
- Title: {news_item.get('name')} ({news_item.get('currency')})
- Actual: {news_item.get('actual')}
- Forecast: {news_item.get('forecast')}

INSTRUCTION:
Analyze the Actual vs Forecast deviation. State the logical macroeconomic consequence (e.g., impact on yield spreads, central bank policy divergence) and the resulting directional pressure on the {news_item.get('currency')}.
Use advanced financial terminology.
CRITICAL: Output ONLY the single Mongolian sentence. No markdown, no bullet points, no intro/outro.
"""
            analysis_text = self._call_ai(prompt, model=self.LITE_MODEL)
            if not analysis_text: return "Analysis failed."
            
            self.news_collection.insert_one({
                "_id": news_id,
                "news_data": news_item,
                "impact_analysis": analysis_text,
                "created_at": datetime.now(timezone.utc)
            })
            
            return analysis_text
        except Exception as e:
            print(f"Error analyzing news impact: {e}")
            return "Analysis failed."

    def get_weekly_analysis(self):
        """Get major news from the last 7 days"""
        try:
            events = tradingview_handler.get_events(days_back=7, days_forward=0)
            if not events: return []

            major_news = []
            for event in events:
                if event.get('impact') == 'High' and event.get('actual'):
                    impact_text = self.analyze_news_impact(event)
                    major_news.append({
                        "title": f"{event.get('currency')} - {event.get('event_name')}",
                        "date": event.get('date'),
                        "actual": event.get('actual'),
                        "forecast": event.get('forecast'),
                        "impact_analysis": impact_text
                    })
            
            major_news.sort(key=lambda x: x['date'], reverse=True)
            return major_news[:5]
        except Exception as e:
            print(f"Error in weekly analysis: {e}")
            return []

    def generate_ai_insight(self, technical_signal, pair="EUR/USD"):
        """Generate AI insight with per-pair caching (30 min pair / 1h market)"""
        current_time = time.time()
        cache_ttl = self.cache_duration_market if pair == "MARKET" else self.cache_duration_pair
        
        # Check per-pair cache first
        cached = self._insight_cache.get(pair)
        if cached and (current_time - cached["time"]) < cache_ttl:
            age = int(current_time - cached['time'])
            print(f"[CACHE HIT] {pair} (age: {age}s / TTL: {cache_ttl}s)")
            return cached["data"]
        
        try:
            news_list = self.get_latest_news(limit=6)
            if news_list:
                news_lines = []
                for n in news_list:
                    line = f"- [{n.get('date','')}] {n['title']}"
                    actual   = n.get('actual', '')
                    forecast = n.get('forecast', '')
                    impact   = n.get('sentiment', n.get('impact', ''))
                    if actual or forecast:
                        line += f" | Гарсан: {actual}, Хүлээлт: {forecast}"
                    if impact:
                        line += f" | Impact: {impact}"
                    news_lines.append(line)
                news_summary = "\n".join(news_lines)
            else:
                news_summary = "Тухайн үеийн томоохон эдийн засгийн мэдээ байхгүй байна."

            signal_type = technical_signal.get('signal', 'NEUTRAL')
            confidence = technical_signal.get('confidence', 0)
            
            if pair == "MARKET":
                prompt = f"""
ROLE: Chief Global Macro Strategist at a Tier-1 Investment Bank.
TASK: Provide an institutional-grade macroeconomic analysis of the current GLOBAL FOREX MARKET based on the provided data.

ECONOMIC DATA / NEWS INPUT:
{news_summary}

INSTRUCTIONS:
Generate a highly analytical, data-driven market analysis JSON in PROFESSIONAL MONGOLIAN (Cyrillic).
Focus on central bank monetary policy divergence, yield curve dynamics, macroeconomic indicators, and global risk sentiment. Avoid retail trading clichés.

REQUIRED JSON STRUCTURE:
{{
  "pair": "MARKET",
  "outlook": "BULLISH USD / BEARISH USD / MIXED / RISK-ON / RISK-OFF (Choose one that best fits the macro environment)",
  "summary": "Write a dense, professional 4-5 sentence macroeconomic summary in Mongolian. Synthesize how recent data impacts central bank rate expectations (Fed, ECB, BOE, BOJ) and global liquidity. Explain the fundamental drivers behind current currency valuations.",
  "key_drivers": [
    "List 3-4 highly specific fundamental drivers in Mongolian (e.g., 'АНУ-ын инфляцын өсөлтөөс шалтгаалсан Холбооны Нөөцийн Сангийн бодлогын хүүгийн хүлээлт', 'Евро бүсийн аж үйлдвэрийн салбарын уналт')."
  ],
  "recent_events": [
    "List 2-3 critical recent macroeconomic events."
  ],
  "event_impacts": "Explain in Mongolian the transmission mechanism of recent events into the FX market (e.g., how a specific CPI print altered bond yields and consequently the USD index).",
  "risk_factors": [
    "List 2-3 specific systemic or event-driven risks (e.g., 'Ойрх Дорнодын геополитикийн хурцадмал байдал', 'Удахгүй гарах АНУ-ын хөдөлмөрийн зах зээлийн тайлан')."
  ],
  "forecast": "Provide a 24-48 hour institutional outlook in Mongolian. Focus on expected capital flows, yield differentials, and potential volatility catalysts. Do not predict exact prices.",
  "market_sentiment": "State the current sentiment (e.g., 'Risk-Off: Хөрөнгө оруулагчид эрсдэлээс зайлсхийж, алт болон ам.доллар руу шилжиж байна') in 1-2 professional sentences in Mongolian."
}}

CRITICAL CONSTRAINTS:
1. Return ONLY valid JSON. No markdown blocks (```json), no introductory text.
2. All text values MUST be in highly professional, grammatically correct Mongolian (Cyrillic).
3. Use institutional financial terminology (e.g., мөнгөний бодлого, өгөөжийн муруй, инфляцын дарамт, хөрвөх чадвар).
"""
            else:
                # Хосолсон валютын шинжилгээ — ЧИГЛЭЛ ЗААХГҮЙ
                base, quote = (pair.split("/") + [""])[:2]
                prompt = f"""
ROLE: Institutional Quantitative Macro Strategist specializing in {pair}.
TASK: Provide a deep, institutional-grade fundamental and technical synthesis for {pair}.
DO NOT provide retail trade signals. Focus on macroeconomic drivers, yield differentials, and institutional order flow context.

INPUTS:
- Pair: {pair}
- Algorithmic Technical Bias: {signal_type} (Confidence: {confidence}%)
- Macroeconomic Context:
{news_summary}

INSTRUCTIONS:
Generate a highly analytical JSON response in PROFESSIONAL MONGOLIAN (Cyrillic).

REQUIRED JSON STRUCTURE:
{{
  "pair": "{pair}",
  "outlook": "BULLISH / BEARISH / NEUTRAL (Based on combined macro & technical view)",
  "summary": "Write a dense 3-4 sentence institutional summary in Mongolian. Synthesize the algorithmic technical bias ({signal_type}) with the fundamental macroeconomic context. Explain the interaction between {base} monetary policy/data and {quote} monetary policy/data.",
  "key_drivers": [
    "List 3-4 highly specific fundamental drivers for {base} and {quote} in Mongolian (e.g., '{base} төв банкны бодлогын хүүгийн зөрүү', '{quote} инфляцын дарамт')."
  ],
  "recent_events": [
    "List 2-3 critical recent macroeconomic events affecting {pair}."
  ],
  "event_impacts": "Explain in Mongolian the fundamental transmission mechanism of recent data into {pair}'s valuation and yield spread.",
  "risk_factors": [
    "List 2-3 specific systemic or event-driven risks for {pair} (e.g., 'Удахгүй гарах хөдөлмөрийн зах зээлийн тайлангийн савалгаа')."
  ],
  "forecast": "Provide a scenario-based institutional outlook in Mongolian for the next 24h. Focus on key macroeconomic catalysts and structural resistance/support zones. (e.g., 'Хэрэв инфляцын мэдээлэл хүлээлтээс давбал...').",
  "market_sentiment": "State the current sentiment relevance to {pair} in 1-2 professional sentences in Mongolian."
}}

CRITICAL CONSTRAINTS:
1. Return ONLY valid JSON. No markdown blocks (```json), no introductory text.
2. All text values MUST be in highly professional, grammatically correct Mongolian (Cyrillic).
3. Use institutional financial terminology.
"""
            
            # Retry logic for JSON parsing
            max_retries = 3
            insight = None
            
            for attempt in range(max_retries):
                response_text = self._call_ai(prompt, force_json=True, model=self.FLASH_MODEL)
                
                if not response_text:
                    print(f"[WARN] Attempt {attempt+1}: Empty response from AI")
                    continue

                # Clean up markdown
                clean_text = response_text
                if "```json" in clean_text:
                    clean_text = clean_text.split("```json")[1].split("```")[0]
                elif "```" in clean_text:
                    clean_text = clean_text.split("```")[1].split("```")[0]
                
                clean_text = clean_text.strip()
                
                # Regex to find the first JSON object
                json_match = re.search(r'\{[\s\S]*\}', clean_text)
                if json_match:
                    clean_text = json_match.group(0)
                
                try:
                    insight = json.loads(clean_text)
                    break # Success
                except json.JSONDecodeError as e:
                    print(f"JSON Decode Error (Attempt {attempt+1}): {e}")
                    # Try ast.literal_eval for single-quoted JSON (Python dict)
                    try:
                        insight = ast.literal_eval(clean_text)
                        if isinstance(insight, dict):
                            print("[OK] Successfully parsed using ast.literal_eval")
                            break
                    except Exception as ast_e:
                        print(f"AST Parse Error: {ast_e}")
                    
                    if attempt == max_retries - 1:
                        print(f"[ERROR] FAILED JSON: {clean_text[:500]}...") # Log the failed text
                        raise Exception("Invalid JSON from AI after retries")
                    time.sleep(1)
            
            if not insight:
                # IMPORTANT: If AI failed, use Mock Generator explicitly for MARKET
                if pair == "MARKET":
                    print("[WARN] Market Analysis JSON failed - Switching to Mock Market Analysis")
                    return self._generate_mock_market_insight()
                raise Exception("Failed to generate valid JSON")
            
            # Normalize keys
            normalized_insight = {}
            for k, v in insight.items():
                normalized_insight[k.lower()] = v

            # Defaults
            if 'forecast' not in normalized_insight:
                normalized_insight['forecast'] = "Таамаглал одоогоор тодорхойгүй байна."
            if 'summary' not in normalized_insight:
                normalized_insight['summary'] = "Зах зээлийн мэдээлэлд үндэслэн автомат дүгнэлт гаргахад алдаа гарлаа."
            if 'key_drivers' not in normalized_insight:
                normalized_insight['key_drivers'] = []
            # outlook — зөвхөн MARKET-т байна, хосолсонд шаардахгүй
            if pair == "MARKET" and 'outlook' not in normalized_insight:
                normalized_insight['outlook'] = normalized_insight.get('market_sentiment', 'Тодорхойгүй')

            insight = normalized_insight

            if pair == "MARKET":
                insight['weekly_analysis'] = self.get_weekly_analysis()
            
            insight['created_at'] = datetime.now(timezone.utc).isoformat()
            self._save_to_db(insight, pair)
            
            # Save to per-pair cache
            self._insight_cache[pair] = {"data": insight, "time": current_time}
            
            return insight

        except Exception as e:
            print(f"AI Analysis Error: {e}")
            
            # CRITICAL: Do not mock EUR/USD if user requested
            if pair == "EUR/USD":
                print("[WARN] EUR/USD Analysis Failed - Returning Error State (No Mocking)")
                return {
                    "pair": pair,
                    "outlook": "Analysis Unavailable",
                    "summary": "AI System is currently offline. Unable to generate real-time analysis.",
                    "recent_events": [],
                    "event_impacts": "N/A",
                    "risk_factors": [],
                    "forecast": "N/A",
                    "market_sentiment": "Neutral",
                    "error": True
                }
                
            return self._generate_mock_insight(technical_signal, pair)

    def _generate_mock_market_insight(self):
        """Fallback for general market analysis"""
        return {
            "pair": "MARKET",
            "outlook": "Тодорхойгүй (Neutral)",
            "summary": "AI систем ачаалалтай байгаа тул автомат дүгнэлт хийхэд саатал гарлаа. Гэхдээ зах зээл ерөнхийдөө тогтвортой, хүлээлтийн байдалтай байна.",
            "recent_events": ["AI холболт саатлаа", "Техник үзүүлэлт хэвийн"],
            "event_impacts": "Тодорхойлох боломжгүй",
            "risk_factors": ["Мэдээллийн хомсдол"],
            "forecast": "Техник шинжилгээг гол болгоно уу.",
            "market_sentiment": "Neutral",
            "weekly_analysis": self.get_weekly_analysis()
        }

    def _save_to_db(self, insight, pair):
        """Safely save insight to DB"""
        try:
            if getattr(self, 'db', None) is not None:
                self.insights_collection.insert_one(insight.copy())
                print(f"[OK] Saved AI insight for {pair} to DB")
        except Exception as e:
            print(f"[ERROR] Error saving insight to DB: {e}")

    def _generate_mock_insight(self, technical_signal, pair="EUR/USD"):
        """Fallback simulation method"""
        print(f"[WARN] Generating MOCK insight for {pair}")
        signal_type = technical_signal.get('signal', 'NEUTRAL')
        confidence = technical_signal.get('confidence', 0)
        
        insight = {
            "pair": pair,
            "outlook": "Тодорхойгүй",
            "summary": "AI холболт түр саатсан тул автомат дүгнэлт гаргах боломжгүй байна. Техник үзүүлэлтүүдийг харна уу.",
            "recent_events": ["Мэдээлэл байхгүй"],
            "event_impacts": "Мэдээлэл байхгүй",
            "risk_factors": ["Зах зээлийн тодорхойгүй байдал", "Мэдээллийн хомсдол"],
            "forecast": "Тодорхойгүй",
            "market_sentiment": "Neutral",
            "weekly_analysis": []
        }
        
        if signal_type == "BUY":
            insight["outlook"] = "Өсөх хандлагатай (Bullish)"
            insight["summary"] = f"Техник үзүүлэлтүүд {confidence:.1f}%-ийн магадлалтайгаар өсөлтийг зааж байна."
            insight["forecast"] = "Ханш өсөх хандлагатай байна."
            insight["market_sentiment"] = "Risk-On"
        elif signal_type == "SELL":
            insight["outlook"] = "Унах хандлагатай (Bearish)"
            insight["summary"] = f"Зах зээл уналтын дохио өгч байна ({confidence:.1f}%)."
            insight["forecast"] = "Ханш буурах хандлагатай байна."
            insight["market_sentiment"] = "Risk-Off"
            
        return insight

market_analyst = MarketAnalyst()
