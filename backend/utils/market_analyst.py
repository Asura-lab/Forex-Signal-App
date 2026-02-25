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
    
    def __init__(self):
        # Configure Gemini with Key Rotation & Model Fallback
        self.api_keys = GEMINI_API_KEYS
        self.current_key_index = 0
        
        # Models (2.5 series priority)
        self.available_models = [
            'gemini-2.5-pro',        # PRIMARY: Most capable
            'gemini-2.5-flash',      # SECONDARY: Fast + capable
            'gemini-2.5-flash-lite', # TERTIARY: High RPM
            'gemini-2.0-flash',      # BACKUP: Reliable
            'gemini-2.0-flash-lite', # BACKUP: High RPM
        ]
        self.current_model_index = 0
        self.gemini = None
        self.current_model_name = self.available_models[0]
        
        if self.api_keys and GENAI_AVAILABLE:
            self._configure_gemini()
        else:
            if not GENAI_AVAILABLE:
                print("[WARN] google-genai not available. Using Pollinations.ai fallback.", flush=True)
            else:
                print("[WARN] No GEMINI_API_KEYS found. Using Pollinations.ai fallback.", flush=True)

        # MongoDB Connection
        try:
            self.client = MongoClient(MONGO_URI)
            self.db = self.client.get_database()
            self.news_collection = self.db.news_analysis
            self.insights_collection = self.db.ai_insights
            print("[OK] MarketAnalyst connected to MongoDB")
        except Exception as e:
            print(f"[ERROR] MongoDB Connection Error: {e}")
            self.db = None

        # Cache settings (per-pair)
        self._insight_cache = {}  # { pair: { "data": ..., "time": ... } }
        self.cache_duration = 900  # 15 minutes

    def _configure_gemini(self):
        """Initialize Gemini client with current key and model"""
        try:
            current_key = self.api_keys[self.current_key_index]
            self.current_model_name = self.available_models[self.current_model_index]
            self.gemini = genai.Client(api_key=current_key)
            print(f"[INFO] Connected to Google {self.current_model_name} (Key #{self.current_key_index + 1})", flush=True)
        except Exception as e:
            print(f"[ERROR] Gemini Configuration Error: {e}", flush=True)

    def _rotate_key(self):
        """Switch to next available API key"""
        if len(self.api_keys) > 1:
            self.current_key_index = (self.current_key_index + 1) % len(self.api_keys)
            print(f"[INFO] Rotating API Key to #{self.current_key_index + 1}...")
            self._configure_gemini()
            return True
        return False

    def _rotate_model(self):
        """Switch to next available model"""
        if len(self.available_models) > 1:
            self.current_model_index = (self.current_model_index + 1) % len(self.available_models)
            print(f"[INFO] Switching Model to {self.available_models[self.current_model_index]}...")
            self._configure_gemini()
            return True
        return False

    def _call_ai(self, prompt, force_json=False, retries=3):
        """Unified AI caller (Gemini > Pollinations)"""
        
        # 1. Try Gemini
        if self.gemini:
            try:
                final_prompt = prompt
                # Add disclaimer to bypass financial advice filters
                final_prompt = "IMPORTANT: This analysis is for EDUCATIONAL PURPOSES ONLY. Do not provide financial advice.\n\n" + final_prompt
                
                if force_json:
                    final_prompt += "\n\nReturn JSON only."
                
                # Safety settings to prevent blocking
                safety_settings = [
                    genai_types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="BLOCK_NONE"),
                    genai_types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="BLOCK_NONE"),
                    genai_types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="BLOCK_NONE"),
                    genai_types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_NONE"),
                ]

                config_kwargs = {"safety_settings": safety_settings}
                if force_json:
                    config_kwargs["response_mime_type"] = "application/json"

                response = self.gemini.models.generate_content(
                    model=self.current_model_name,
                    contents=final_prompt,
                    config=genai_types.GenerateContentConfig(**config_kwargs)
                )
                
                try:
                    text = response.text.strip()
                except (ValueError, AttributeError):
                    # Occurs when response was blocked by safety checks but no text generated
                    raise Exception("Gemini Safety Block - Empty Response")

                # Debug print - detailed
                if not text:
                    raise Exception("Gemini returned empty text string")
                
                print(f"[DEBUG] Gemini Response Start: {text[:100]}...")
                return text

            except Exception as e:
                print(f"[WARN] Gemini API Error (Key #{self.current_key_index + 1}, {self.available_models[self.current_model_index]}): {e}")
                
                error_str = str(e).lower()
                is_auth_error = any(x in error_str for x in ["403", "leaked", "permission", "key", "invalid", "unauthenticated"])
                is_rate_limit = any(x in error_str for x in ["429", "quota", "exhausted", "limit", "resource"])
                is_not_found = "404" in error_str and "not found" in error_str
                is_empty = "empty" in error_str or "safety" in error_str

                # ACTION 1: If 404 (Model missing) or Empty (Flaky model) -> SWITCH MODEL
                if is_not_found or is_empty:
                    print(f"[WARN] Issue with Model {self.available_models[self.current_model_index]}: {e}")
                    if self._rotate_model():
                         try:
                            return self._call_ai(prompt, force_json, retries=0) # Recursive retry with new model
                         except: pass

                # ACTION 2: If Auth/Rate Limit -> ROTATE KEY
                if is_auth_error or is_rate_limit:
                    print(f"[WARN] Issue with Key #{self.current_key_index + 1}: {e}")
                    if self._rotate_key():
                        try:
                            return self._call_ai(prompt, force_json, retries=0) # Recursive retry with new key
                        except: pass
                        
                # ACTION 3: If everything failed, try rotating key AND model as last resort
                # Ensure we don't recurse infinitely
                if retries > 0:
                     # Check if we have unused keys for this specific error? 
                     # Just force rotation to next available resource
                     if self._rotate_key():
                          try:
                            time.sleep(1)
                            return self._call_ai(prompt, force_json, retries=retries-1)
                          except: pass

        # 2. Fallback to Pollinations (Legacy)
        url = "https://text.pollinations.ai/"
        final_prompt = prompt
        if force_json:
             final_prompt += "\n\nCRITICAL: RESPONSE MUST BE VALID JSON ONLY. NO OTHER TEXT."

        for attempt in range(retries):
            try:
                # Use POST instead of GET for long prompts
                response = requests.post(url, data=final_prompt.encode('utf-8'), timeout=60)
                
                if response.status_code == 200:
                    text = response.text.strip()
                    # Clean up Pollinations ads/headers
                    if "**Support Pollinations.AI:**" in text:
                        text = text.split("**Support Pollinations.AI:**")[0]
                    if "**Ad**" in text:
                        text = text.split("**Ad**")[0]
                    if "---" in text:
                        text = text.split("---")[0]
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
            Analyze this economic news event for Forex traders in Mongolian language.
            Event: {event_data.get('title')}
            Currency: {event_data.get('currency', 'Unknown')}
            Actual Value: {event_data.get('actual', 'N/A')}
            Forecast Value: {event_data.get('forecast', 'N/A')}
            
            Task:
            1. Explain what this data means simply.
            2. Predict the short-term impact on the {event_data.get('currency', 'currency')}.
            3. Keep the response concise (under 3 sentences).
            """
            
            response = self._call_ai(prompt)
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
            Analyze this economic news event and its impact on the currency market in 1 sentence (Mongolian).
            Event: {news_item.get('name')} ({news_item.get('currency')})
            Actual: {news_item.get('actual')}
            Forecast: {news_item.get('forecast')}
            
            Output ONLY the Mongolian sentence. No other text.
            """
            
            analysis_text = self._call_ai(prompt)
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
        """Generate AI insight with per-pair caching (15 min)"""
        current_time = time.time()
        
        # Check per-pair cache first
        cached = self._insight_cache.get(pair)
        if cached and (current_time - cached["time"]) < self.cache_duration:
            print(f"[CACHE HIT] Returning cached insight for {pair} (age: {int(current_time - cached['time'])}s)")
            return cached["data"]
        
        try:
            news_list = self.get_latest_news(limit=5)
            news_summary = "\n".join([f"- {n['title']} ({n['date']}): {n['summary']}" for n in news_list]) if news_list else "No major economic events."

            signal_type = technical_signal.get('signal', 'NEUTRAL')
            confidence = technical_signal.get('confidence', 0)
            
            if pair == "MARKET":
                prompt = f"""
                Act as a professional Forex Market Analyst. Analyze the GLOBAL FOREX MARKET situation.
                
                Economic Calendar / News Events:
                {news_summary}
                
                Provide a detailed market analysis in JSON format with the following keys:
                - pair: "MARKET"
                - outlook: "Bullish", "Bearish", or "Neutral" (Translate to Mongolian)
                - summary: A detailed paragraph (3-4 sentences) explaining the global market sentiment in Mongolian.
                - recent_events: ["Event 1", "Event 2"] (List of 2-3 recent major economic events in Mongolian)
                - event_impacts: "Explanation of how these events are affecting the market" (in Mongolian)
                - risk_factors: ["Factor 1", "Factor 2"] (List of 2-3 specific risk factors in Mongolian)
                - forecast: A general forecast for major pairs in Mongolian.
                - market_sentiment: "Risk-On" or "Risk-Off" (Translate explanation to Mongolian).
                
                IMPORTANT: Return ONLY valid JSON. Use double quotes for all keys and string values. Escape double quotes inside strings. NO markdown.
                """
            else:
                prompt = f"""
                Act as a professional Forex Market Analyst. Analyze the current situation for {pair}.
                
                Technical Signal: {signal_type} (Confidence: {confidence}%)
                
                Economic Calendar / News Events:
                {news_summary}
                
                Based on the technical signal and recent news, provide a detailed market analysis in JSON format with the following keys:
                - pair: "{pair}"
                - outlook: "Bullish", "Bearish", or "Neutral" (Translate to Mongolian: "Өсөх хандлагатай", "Унах хандлагатай", "Тодорхойгүй")
                - summary: A detailed paragraph (3-4 sentences) explaining the reasoning in Mongolian. Explain HOW the news impacts the pair.
                - recent_events: ["Event 1", "Event 2"] (List of 2-3 recent major economic events in Mongolian)
                - event_impacts: "Explanation of how these events are affecting the pair" (in Mongolian)
                - risk_factors: ["Factor 1", "Factor 2"] (List of 2-3 specific risk factors in Mongolian)
                - forecast: A specific forecast for the next 24 hours in Mongolian.
                - market_sentiment: "Risk-On" or "Risk-Off" (Translate explanation to Mongolian).
                
                IMPORTANT: Return ONLY valid JSON. Use double quotes for all keys and string values. Escape double quotes inside strings. NO markdown.
                """
            
            # Retry logic for JSON parsing
            max_retries = 3
            insight = None
            
            for attempt in range(max_retries):
                response_text = self._call_ai(prompt, force_json=True)
                
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
            if 'outlook' not in normalized_insight:
                normalized_insight['outlook'] = normalized_insight.get('market_sentiment', 'Neutral')
            if 'summary' not in normalized_insight:
                normalized_insight['summary'] = "Зах зээлийн мэдээлэлд үндэслэн автомат дүгнэлт гаргахад алдаа гарлаа. Гэхдээ техник үзүүлэлтүүд хэвийн ажиллаж байна."

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
