# -*- coding: utf-8 -*-
import random
import json
import time
import requests
import urllib.parse
import re
from datetime import datetime, timedelta, timezone
from pymongo import MongoClient
from config.settings import MONGO_URI
from utils.tradingview_handler import tradingview_handler

class MarketAnalyst:
    """
    Market Analysis & AI Insights using Pollinations.ai (Free)
    Integrates with TradingView for economic data.
    """
    
    def __init__(self):
        print("🤖 Using Pollinations.ai (Free) for all analysis")

        # MongoDB Connection
        try:
            self.client = MongoClient(MONGO_URI)
            self.db = self.client.get_database()
            self.news_collection = self.db.news_analysis
            self.insights_collection = self.db.ai_insights
            print("✅ MarketAnalyst connected to MongoDB")
        except Exception as e:
            print(f"❌ MongoDB Connection Error: {e}")
            self.db = None

        # Cache settings
        self.last_insight = None
        self.last_insight_time = 0
        self.cache_duration = 900  # 15 minutes

    def _call_pollinations(self, prompt, force_json=False):
        """Helper to call Pollinations.ai API"""
        try:
            if force_json:
                prompt += " RETURN ONLY RAW JSON. NO MARKDOWN. NO EXPLANATION."
            
            encoded_prompt = urllib.parse.quote(prompt)
            url = f"https://text.pollinations.ai/{encoded_prompt}"
            
            response = requests.get(url, timeout=30)
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
            return None
        except Exception as e:
            print(f"Pollinations API Error: {e}")
            return None

    def get_latest_news(self, limit=10):
        """Get latest news from TradingView"""
        try:
            events = tradingview_handler.get_events(days_back=1, days_forward=1)
            if not events: return []
            
            formatted_news = []
            for event in events[:limit]:
                formatted_news.append(self._format_event(event))
            return formatted_news
        except Exception as e:
            print(f"Error fetching TradingView news: {e}")
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
            
            response = self._call_pollinations(prompt)
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
            
            analysis_text = self._call_pollinations(prompt)
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
        """Generate AI insight using Pollinations"""
        current_time = time.time()
        
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
                
                IMPORTANT: Return ONLY valid JSON. Do not use markdown. Do not use double quotes inside strings (use single quotes).
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
                
                IMPORTANT: Return ONLY valid JSON. Do not use markdown. Do not use double quotes inside strings (use single quotes).
                """
            
            response_text = self._call_pollinations(prompt, force_json=True)
            
            if not response_text:
                raise Exception("AI service failed")

            # Clean up markdown
            if response_text.startswith("```json"): response_text = response_text[7:]
            if response_text.endswith("```"): response_text = response_text[:-3]
            
            # Regex to find the first JSON object
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(0)
            
            try:
                insight = json.loads(response_text)
            except json.JSONDecodeError as e:
                print(f"JSON Decode Error: {e}. Raw: {response_text[:100]}...")
                raise Exception("Invalid JSON from AI")
            
            # Normalize keys
            normalized_insight = {}
            for k, v in insight.items():
                normalized_insight[k.lower()] = v
            
            # Defaults
            if 'forecast' not in normalized_insight:
                normalized_insight['forecast'] = "Таамаглал одоогоор тодорхойгүй байна."
            if 'outlook' not in normalized_insight:
                normalized_insight['outlook'] = normalized_insight.get('market_sentiment', 'Neutral')

            insight = normalized_insight

            if pair == "MARKET":
                insight['weekly_analysis'] = self.get_weekly_analysis()
            
            insight['created_at'] = datetime.now(timezone.utc).isoformat()
            self._save_to_db(insight, pair)
            
            self.last_insight = insight
            self.last_insight_time = current_time
            
            return insight

        except Exception as e:
            print(f"AI Analysis Error: {e}")
            return self._generate_mock_insight(technical_signal, pair)

    def _save_to_db(self, insight, pair):
        """Safely save insight to DB"""
        try:
            if getattr(self, 'db', None) is not None:
                self.insights_collection.insert_one(insight.copy())
                print(f"✅ Saved AI insight for {pair} to DB")
        except Exception as e:
            print(f"❌ Error saving insight to DB: {e}")

    def _generate_mock_insight(self, technical_signal, pair="EUR/USD"):
        """Fallback simulation method"""
        print(f"⚠️ Generating MOCK insight for {pair}")
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
