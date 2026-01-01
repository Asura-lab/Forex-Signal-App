import requests
import datetime
from typing import List, Dict, Optional

class TradingViewHandler:
    def __init__(self):
        self.base_url = "https://economic-calendar.tradingview.com/events"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Origin": "https://www.tradingview.com",
            "Referer": "https://www.tradingview.com/"
        }

    def get_events(self, days_back: int = 3, days_forward: int = 7, countries: Optional[List[str]] = None) -> List[Dict]:
        """
        Fetch economic events from TradingView.
        
        Args:
            days_back: Number of days to look back.
            days_forward: Number of days to look forward.
            countries: List of country codes (e.g., ['US', 'EU']).
            
        Returns:
            List of dictionaries with event details.
        """
        today = datetime.datetime.now()
        start_date = (today - datetime.timedelta(days=days_back)).strftime("%Y-%m-%dT%H:%M:%S.000Z")
        end_date = (today + datetime.timedelta(days=days_forward)).strftime("%Y-%m-%dT%H:%M:%S.000Z")
        
        params = {
            "from": start_date,
            "to": end_date
        }
        
        if countries:
            params["countries"] = ",".join(countries)
            
        try:
            response = requests.get(self.base_url, headers=self.headers, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            if isinstance(data, dict) and 'result' in data:
                data = data['result']
                
            events = []
            for item in data:
                events.append({
                    "date": item.get("date"),
                    "currency": item.get("currency", ""),
                    "event_name": item.get("title", ""),
                    "impact": self._map_importance(item.get("importance")),
                    "actual": item.get("actual"),
                    "forecast": item.get("forecast"),
                    "previous": item.get("previous")
                })
            
            return events
            
        except Exception as e:
            print(f"Error fetching TradingView events: {e}")
            return []

    def _map_importance(self, importance: int) -> str:
        """
        Map TradingView importance to text.
        -1: Low
        0: Medium
        1: High
        """
        if importance == -1:
            return "Low"
        elif importance == 0:
            return "Medium"
        elif importance == 1:
            return "High"
        return "Low" # Default to Low if unknown

# Global instance
tradingview_handler = TradingViewHandler()

if __name__ == "__main__":
    events = tradingview_handler.get_events(countries=['US'])
    print(f"Fetched {len(events)} events")
    if events:
        print(events[0])
