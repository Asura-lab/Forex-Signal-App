import requests
import os
from datetime import datetime

class AlphaVantageHandler:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv('ALPHAVANTAGE_API_KEY')
        self.base_url = "https://www.alphavantage.co/query"
        
    def get_forex_news(self, limit=10, currencies=["EUR", "USD", "JPY", "GBP"]):
        """
        Fetch specialized Forex news with Sentiment Analysis
        """
        if not self.api_key:
            print("[WARN] Alpha Vantage API Key missing.")
            return []

        # Convert list to supported ticker format or useful topics
        # Alpha Vantage supports 'blockchain', 'earnings', 'ipo', 'mergers_and_acquisitions', 'financial_markets', 'economy_macro', 'finance'
        # For Forex, 'financial_markets' and 'economy_macro' + specific tickers are best.
        
        params = {
            "function": "NEWS_SENTIMENT",
            "topics": "financial_markets,economy_macro",
            "sort": "LATEST",
            "limit": limit + 5, # Fetch a bit more to filter
            "apikey": self.api_key
        }
        
        try:
            response = requests.get(self.base_url, params=params)
            data = response.json()
            
            if "feed" not in data:
                print(f"[WARN] Alpha Vantage Error: {data.get('Note', data.get('Information', 'Unknown Error'))}")
                return []
                
            news_items = []
            for item in data["feed"]:
                # Parse sentiment
                sentiment_score = float(item.get("overall_sentiment_score", 0))
                sentiment_label = item.get("overall_sentiment_label", "Neutral")
                
                # Simple Logic to convert label to standardized format
                impact = "Low"
                if abs(sentiment_score) > 0.35: impact = "Medium"
                if abs(sentiment_score) > 0.6: impact = "High"
                
                # Format for our app
                formatted_item = {
                    "title": item.get("title"),
                    "summary": item.get("summary"),
                    "source": item.get("source"),
                    "url": item.get("url"),
                    "date": self._convert_date(item.get("time_published")),
                    "sentiment_score": sentiment_score,
                    "sentiment": sentiment_label, # Bullish/Bearish/Neutral
                    "impact": impact,
                    "currency": "GLOBAL" # Alpha Vantage is global, hard to pin single currency unless filtered
                }
                news_items.append(formatted_item)
                
            return news_items[:limit]
            
        except Exception as e:
            print(f"[ERROR] Alpha Vantage Request Error: {e}")
            return []
            
    def _convert_date(self, alpha_date):
        # Format: 20240405T143000
        try:
            dt = datetime.strptime(alpha_date, "%Y%m%dT%H%M%S")
            return dt.strftime("%Y-%m-%d %H:%M")
        except:
            return alpha_date

# Singleton
alphavantage_handler = AlphaVantageHandler()
