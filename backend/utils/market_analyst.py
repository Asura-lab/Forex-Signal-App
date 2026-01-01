# -*- coding: utf-8 -*-
import random
import json
import time
import requests
from datetime import datetime, timedelta, timezone
import google.generativeai as genai
from pymongo import MongoClient
from config.settings import GEMINI_API_KEY, MONGO_URI
from utils.tradingview_handler import tradingview_handler

class MarketAnalyst:
    """
    Зах зээлийн мэдээ болон AI шинжилгээг нэгтгэх класс.
    Google Gemini API ашиглан бодит дүгнэлт гаргана.
    TradingView API ашиглан бодит мэдээ авна.
    """
    
    def __init__(self):
        # Configure Gemini (Optional - Disabled by user request)
        self.api_available = False
        if GEMINI_API_KEY:
            try:
                genai.configure(api_key=GEMINI_API_KEY)
                # Use gemini-flash-latest as it points to the most stable available flash model
                model_name = 'gemini-flash-latest'
                # print(f"🤖 Initializing Gemini with model: {model_name}")
                self.model = genai.GenerativeModel(model_name)
                # self.api_available = True # Disabled to force Pollinations
            except:
                pass
        
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
        self.cache_duration = 900  # 15 minutes cache to save quota

    def get_latest_news(self, limit=10):
        """Сүүлийн үеийн мэдээг буцаах (TradingView API)"""
        try:
            # Get events for today and tomorrow
            events = tradingview_handler.get_events(days_back=1, days_forward=1)
            
            if not events:
                return []

            # Format for UI
            formatted_news = []
            
            for i, event in enumerate(events[:limit]):
                formatted_news.append(self._format_event(event))
                
            return formatted_news
            
        except Exception as e:
            print(f"Error fetching TradingView news: {e}")
            return []

    def get_news_history(self, limit=20):
        """Get past news events (History)"""
        try:
            # Get past events (last 3 days)
            events = tradingview_handler.get_events(days_back=3, days_forward=0)
            
            if not events:
                return []
                
            past_events = []
            for event in events:
                # Filter for events that have actual values (meaning they happened)
                if event.get('actual'):
                    past_events.append(self._format_event(event))
            
            # Reverse to show most recent first (TradingView usually returns chronological)
            return past_events[::-1][:limit]
        except Exception as e:
            print(f"Error getting news history: {e}")
            return []

    def get_upcoming_news(self, limit=20):
        """Get upcoming news events (Calendar)"""
        try:
            # Get upcoming events (next 7 days)
            events = tradingview_handler.get_events(days_back=0, days_forward=7)
            
            if not events:
                return []
                
            upcoming_events = []
            for event in events:
                # If no actual value, it's likely upcoming
                if not event.get('actual'):
                    upcoming_events.append(self._format_event(event))
            
            return upcoming_events[:limit]
        except Exception as e:
            print(f"Error getting upcoming news: {e}")
            return []

    def get_market_outlook(self):
        """Get market outlook using Gemini Analysis of TradingView Data"""
        try:
            # 1. Get recent high impact events
            events = tradingview_handler.get_events(days_back=2, days_forward=0)
            high_impact = [e for e in events if e.get('impact') == 'High' and e.get('actual')]
            
            smart_analysis = []
            
            # Generate simple analysis for top 5 events
            for event in high_impact[:5]:
                analysis_text = self._generate_simple_analysis(event)
                smart_analysis.append({
                    "name": event.get("event_name"),
                    "analysis": analysis_text,
                    "machine_learning": "AI Generated"
                })
            
            # 2. Generate Summary using Gemini if available
            gpt_summary = "AI Analysis unavailable."
            if high_impact:
                prompt = f"Analyze these recent forex news events and give a short market outlook summary in Mongolian language (max 3 sentences). Translate technical terms to Mongolian where appropriate: {json.dumps(high_impact[:5])}"
                
                # Try Pollinations.ai (Free, No Key)
                try:
                    # Using Pollinations.ai which is free and keyless
                    # URL encode the prompt to handle spaces and special characters correctly
                    import urllib.parse
                    encoded_prompt = urllib.parse.quote(prompt)
                    response = requests.get(f"https://text.pollinations.ai/{encoded_prompt}", timeout=10)
                    if response.status_code == 200:
                        gpt_summary = response.text
                    else:
                        raise Exception(f"Pollinations status {response.status_code}")
                except Exception as e:
                    print(f"⚠️ AI Error: {e}")
                    # Fallback to rule-based summary if AI fails
                    bullish_count = sum(1 for item in smart_analysis if "Bullish" in item['analysis'])
                    bearish_count = sum(1 for item in smart_analysis if "Bearish" in item['analysis'])
                    
                    if bullish_count > bearish_count:
                        gpt_summary = "Сүүлийн үеийн эдийн засгийн эерэг мэдээллүүдээс харахад зах зээлийн хандлага ӨСӨХ (Bullish) төлөвтэй байна."
                    elif bearish_count > bullish_count:
                        gpt_summary = "Сүүлийн үеийн эдийн засгийн сөрөг мэдээллүүдээс харахад зах зээлийн хандлага УНАХ (Bearish) төлөвтэй байна."
                    else:
                        gpt_summary = "Эдийн засгийн мэдээллүүд холимог байгаа тул зах зээлийн хандлага ТОДОРХОЙГҮЙ (Neutral) байна."

            return {
                "smart_analysis": smart_analysis,
                "gpt_summary": gpt_summary
            }
        except Exception as e:
            print(f"Error getting market outlook: {e}")
            return {}

    def _generate_simple_analysis(self, event):
        """Generate simple rule-based analysis (Mongolian) with variety"""
        try:
            actual_str = str(event.get('actual', '0')).replace('%', '').replace('K', '').replace('M', '').replace('B', '')
            forecast_str = str(event.get('forecast', '0')).replace('%', '').replace('K', '').replace('M', '').replace('B', '')
            
            # Handle empty strings
            if not actual_str or not forecast_str:
                return "Мэдээлэл дутуу байна."

            try:
                actual = float(actual_str)
                forecast = float(forecast_str)
            except ValueError:
                return "Тоон мэдээлэл тодорхойгүй."

            currency = event.get('currency')
            
            # Templates
            positive_templates = [
                f"Хүлээлтээс сайн гарлаа. {currency} чангарах төлөвтэй.",
                f"Эерэг мэдээ. {currency}-д өсөлтийн дохио болж байна.",
                f"Таамаглалыг давлаа. {currency} ханш өсөх магадлалтай.",
                f"Сайн үр дүн. {currency} худалдан авах сонирхол нэмэгдэнэ."
            ]
            
            negative_templates = [
                f"Хүлээлтээс муу гарлаа. {currency} сулрах төлөвтэй.",
                f"Сөрөг мэдээ. {currency}-д уналтын дохио болж байна.",
                f"Таамаглалд хүрсэнгүй. {currency} ханш унах магадлалтай.",
                f"Муу үр дүн. {currency} зарах сонирхол нэмэгдэнэ."
            ]
            
            neutral_templates = [
                f"Хүлээлтийн дагуу гарлаа. {currency} тогтвортой байна.",
                f"Таамаглалтай ижил. {currency} ханшид нөлөө багатай.",
                f"Өөрчлөлт багатай. {currency} савлагаа бага байна."
            ]

            if actual > forecast:
                return random.choice(positive_templates)
            elif actual < forecast:
                return random.choice(negative_templates)
            else:
                return random.choice(neutral_templates)
        except Exception as e:
            print(f"Analysis error: {e}")
            return "Тодорхойгүй."

    def analyze_specific_event(self, event_data):
        """Generate detailed analysis for a specific event using Pollinations.ai"""
        try:
            # Construct a clear prompt for the AI
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
            
            import urllib.parse
            
            # Use Pollinations.ai (Free)
            encoded_prompt = urllib.parse.quote(prompt)
            url = f"https://text.pollinations.ai/{encoded_prompt}"
            
            response = requests.get(url, timeout=15)
            
            if response.status_code == 200:
                text = response.text
                # Remove Pollinations.ai advertisement
                # 1. Remove known ad headers
                if "**Support Pollinations.AI:**" in text:
                    text = text.split("**Support Pollinations.AI:**")[0]
                if "**Ad**" in text:
                    text = text.split("**Ad**")[0]
                
                # 2. Remove anything after "---" (usually footer/ad)
                if "---" in text:
                    text = text.split("---")[0]
                
                return text.strip()
            else:
                return "AI холболт амжилтгүй боллоо. Дараа дахин оролдоно уу."
                
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
        
        # Format date nicely (TradingView returns ISO)
        try:
            dt = datetime.fromisoformat(time_str.replace('Z', '+00:00'))
            # Convert to local time (approximate, or keep UTC)
            # Let's just format it to HH:MM
            time_display = dt.strftime("%Y-%m-%d %H:%M")
        except:
            time_display = time_str

        summary = f"Impact: {impact}"
        if actual:
            summary += f" | Actual: {actual}"
        if forecast:
            summary += f" | Forecast: {forecast}"
            
        return {
            "id": str(random.randint(1000, 9999)), # Temporary ID
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
        """
        Analyze a single news item and return its market impact.
        Checks DB first, then calls AI if needed.
        """
        if getattr(self, 'db', None) is None:
            return "Database unavailable."

        # Create a unique ID for the news event
        news_id = f"{news_item.get('date')}_{news_item.get('name')}_{news_item.get('currency')}"
        
        # Check DB
        existing = self.news_collection.find_one({"_id": news_id})
        if existing:
            return existing.get('impact_analysis')

        # Generate AI Analysis
        if not self.api_available:
            return "AI unavailable."

        try:
            prompt = f"""
            Analyze this economic news event and its impact on the currency market in 1 sentence (Mongolian).
            Event: {news_item.get('name')} ({news_item.get('currency')})
            Actual: {news_item.get('actual')}
            Forecast: {news_item.get('forecast')}
            Previous: {news_item.get('previous')}
            
            Output ONLY the Mongolian sentence. No other text.
            """
            response = self.model.generate_content(prompt)
            analysis_text = response.text.strip()
            
            # Save to DB
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
        """
        Get major news from the last 7 days and their AI-generated impacts.
        """
        try:
            # Get weekly calendar
            calendar = jblanked_handler.get_calendar_week()
            if not calendar:
                return []

            # Filter: High Impact + Has Actual Data (Happened)
            major_news = []
            for event in calendar:
                if event.get('impact') == 'High' and event.get('actual'):
                    # Analyze
                    impact_text = self.analyze_news_impact(event)
                    
                    major_news.append({
                        "title": f"{event.get('currency')} - {event.get('name')}",
                        "date": event.get('time'),
                        "actual": event.get('actual'),
                        "forecast": event.get('forecast'),
                        "impact_analysis": impact_text
                    })
            
            # Sort by date descending (newest first)
            major_news.sort(key=lambda x: x['date'], reverse=True)
            return major_news[:5] # Return top 5
            
        except Exception as e:
            print(f"Error in weekly analysis: {e}")
            return []

    def _should_update_insight(self, last_update_time):
        """
        Check if insight should be updated based on Mongolia time (UTC+8).
        Updates scheduled at 12:00 PM and 00:00 AM.
        """
        if not last_update_time:
            return True
            
        # Current time in Mongolia (UTC+8)
        utc_now = datetime.now(timezone.utc)
        mongolia_now = utc_now + timedelta(hours=8)
        
        # Last update time in Mongolia
        # Use timezone.utc to ensure we get an offset-aware datetime
        last_update_dt = datetime.fromtimestamp(last_update_time, timezone.utc) + timedelta(hours=8)
        
        # Define today's checkpoints
        checkpoint_noon = mongolia_now.replace(hour=12, minute=0, second=0, microsecond=0)
        checkpoint_midnight = mongolia_now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # If current time is past noon, but last update was before noon -> Update
        if mongolia_now >= checkpoint_noon and last_update_dt < checkpoint_noon:
            return True
            
        # If current time is past midnight (new day), but last update was before midnight -> Update
        # Note: This handles the 00:00 case for the current day
        if mongolia_now >= checkpoint_midnight and last_update_dt < checkpoint_midnight:
            return True
            
        # Also check if it's been more than 12 hours just in case (safety net)
        if (mongolia_now - last_update_dt).total_seconds() > 12 * 3600:
            return True
            
        return False

    def generate_ai_insight(self, technical_signal, pair="EUR/USD"):
        """
        Техник өгөгдөл болон мэдээг нэгтгэн AI дүгнэлт гаргах.
        Gemini API ашиглана.
        """
        current_time = time.time()
        
        # Check schedule-based cache (Disabled for testing/development to force fresh AI analysis)
        # if self.last_insight and not self._should_update_insight(self.last_insight_time):
        #      # Check if cached insight matches requested pair
        #      if self.last_insight.get('pair') == pair:
        #         print("Returning cached AI insight (Schedule not met)")
        #         return self.last_insight

        # if not self.api_available:
        #     return self._generate_mock_insight(technical_signal, pair)

        try:
            # Get Real News
            news_list = self.get_latest_news(limit=5)
            news_summary = ""
            if news_list:
                news_summary = "\n".join([f"- {n['title']} ({n['date']}): {n['summary']}" for n in news_list])
            
            if not news_summary:
                news_summary = "No major economic events scheduled for today."

            # Construct Prompt
            signal_type = technical_signal.get('signal', 'NEUTRAL')
            confidence = technical_signal.get('confidence', 0)
            
            if pair == "MARKET":
                prompt = f"""
                Act as a professional Forex Market Analyst. Analyze the GLOBAL FOREX MARKET situation.
                
                Economic Calendar / News Events (JBlanked Data):
                {news_summary}
                
                Provide a detailed market analysis in JSON format with the following keys:
                - pair: "MARKET"
                - outlook: "Bullish", "Bearish", or "Neutral" (Regarding USD or General Sentiment. Translate to Mongolian)
                - summary: A detailed paragraph (3-4 sentences) explaining the global market sentiment in Mongolian.
                - recent_events: ["Event 1", "Event 2"] (List of 2-3 recent major economic events or news headlines relevant to the market in Mongolian)
                - event_impacts: "Explanation of how these events are affecting the market" (in Mongolian)
                - risk_factors: ["Factor 1", "Factor 2"] (List of 2-3 specific risk factors in Mongolian)
                - forecast: A general forecast for major pairs in Mongolian.
                - market_sentiment: "Risk-On" or "Risk-Off" (Translate explanation to Mongolian).
                
                Ensure the response is valid JSON. Do not include markdown formatting like ```json.
                """
            else:
                prompt = f"""
                Act as a professional Forex Market Analyst. Analyze the current situation for {pair}.
                
                Technical Signal: {signal_type} (Confidence: {confidence}%)
                
                Economic Calendar / News Events (JBlanked Data):
                {news_summary}
                
                Based on the technical signal and recent news, provide a detailed market analysis in JSON format with the following keys:
                - pair: "{pair}"
                - outlook: "Bullish", "Bearish", or "Neutral" (Translate to Mongolian: "Өсөх хандлагатай", "Унах хандлагатай", "Тодорхойгүй")
                - summary: A detailed paragraph (3-4 sentences) explaining the reasoning in Mongolian. Explain HOW the news impacts the pair.
                - recent_events: ["Event 1", "Event 2"] (List of 2-3 recent major economic events or news headlines relevant to the pair in Mongolian)
                - event_impacts: "Explanation of how these events are affecting the pair" (in Mongolian)
                - risk_factors: ["Factor 1", "Factor 2"] (List of 2-3 specific risk factors in Mongolian)
                - forecast: A specific forecast for the next 24 hours in Mongolian (e.g., "Ханш 1.0850 дэмжлэгийг шалгаад буцаж өсөх магадлалтай...").
                - market_sentiment: "Risk-On" or "Risk-Off" (Translate explanation to Mongolian).
                
                Ensure the response is valid JSON. Do not include markdown formatting like ```json.
                """
            
            response_text = ""
            
            # 1. Try Gemini if available (Disabled)
            # if self.api_available:
            #     try:
            #         response = self.model.generate_content(prompt)
            #         response_text = response.text.strip()
            #     except Exception as e:
            #         print(f"Gemini API Error: {e}")
            #         response_text = ""
            
            # 2. Try Pollinations.ai (Primary)
            if not response_text:
                try:
                    print(f"🤖 Using Pollinations.ai for {pair} analysis...")
                    import urllib.parse
                    # Append instruction to force JSON
                    full_prompt = prompt + " RETURN ONLY RAW JSON. NO MARKDOWN. NO EXPLANATION."
                    encoded_prompt = urllib.parse.quote(full_prompt)
                    url = f"https://text.pollinations.ai/{encoded_prompt}"
                    
                    # Pollinations might take a bit
                    response = requests.get(url, timeout=30)
                    if response.status_code == 200:
                        response_text = response.text.strip()
                        print(f"🔍 Raw Pollinations Response for {pair}: {response_text[:100]}...") # Log first 100 chars
                        # Clean up Pollinations ads/headers
                        if "**Support Pollinations.AI:**" in response_text:
                            response_text = response_text.split("**Support Pollinations.AI:**")[0]
                        if "**Ad**" in response_text:
                            response_text = response_text.split("**Ad**")[0]
                        if "---" in response_text:
                            response_text = response_text.split("---")[0]
                except Exception as e:
                    print(f"Pollinations API Error: {e}")

            if not response_text:
                raise Exception("All AI services failed")

            # Clean up potential markdown formatting
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            # Attempt to fix common JSON errors from LLMs
            response_text = response_text.strip()
            # If it doesn't end with }, try to find the last }
            last_brace = response_text.rfind('}')
            if last_brace != -1:
                response_text = response_text[:last_brace+1]

            insight = json.loads(response_text)
            
            # Normalize keys (Handle case sensitivity from AI)
            normalized_insight = {}
            for k, v in insight.items():
                normalized_insight[k.lower()] = v
            
            # Map back to expected keys if needed, or just use the normalized ones if they match
            # We expect: pair, outlook, summary, recent_events, event_impacts, risk_factors, forecast, market_sentiment
            
            # Ensure 'forecast' exists
            if 'forecast' not in normalized_insight:
                normalized_insight['forecast'] = "Таамаглал одоогоор тодорхойгүй байна."
            
            # Ensure 'outlook' exists
            if 'outlook' not in normalized_insight:
                normalized_insight['outlook'] = normalized_insight.get('market_sentiment', 'Neutral')

            # Use the normalized insight
            insight = normalized_insight

            # Inject Weekly Analysis if MARKET
            if pair == "MARKET":
                insight['weekly_analysis'] = self.get_weekly_analysis()
            
            # Add timestamp
            insight['created_at'] = datetime.now(timezone.utc).isoformat()
            
            # Save to MongoDB
            self._save_to_db(insight, pair)

            # Update cache
            self.last_insight = insight
            self.last_insight_time = current_time
            
            return insight

        except Exception as e:
            print(f"AI Analysis Error: {e}")
            # Fallback to mock if API fails
            return self._generate_mock_insight(technical_signal, pair)

    def _save_to_db(self, insight, pair):
        """Safely save insight to DB"""
        try:
            # Check if db is available without triggering bool(db) error
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
            insight["summary"] = f"Техник үзүүлэлтүүд {confidence:.1f}%-ийн магадлалтайгаар өсөлтийг зааж байна. Эдийн засгийн мэдээлэл хүлээгдэж байна."
            insight["forecast"] = "Ханш өсөх хандлагатай байна."
            insight["market_sentiment"] = "Risk-On"
        elif signal_type == "SELL":
            insight["outlook"] = "Унах хандлагатай (Bearish)"
            insight["summary"] = f"Зах зээл уналтын дохио өгч байна ({confidence:.1f}%). Эрсдэлээ тооцоолно уу."
            insight["forecast"] = "Ханш буурах хандлагатай байна."
            insight["market_sentiment"] = "Risk-Off"
            
        return insight

# Global instance
market_analyst = MarketAnalyst()
