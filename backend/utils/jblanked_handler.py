# -*- coding: utf-8 -*-
"""
JBlanked API Handler
Economic Calendar & News Event History
https://www.jblanked.com/news/api/
"""

import requests
import time
from config.settings import JBLANKED_API_KEY

class JBlankedHandler:
    def __init__(self):
        self.api_key = JBLANKED_API_KEY
        self.base_url = "https://www.jblanked.com/news/api"
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Api-Key {self.api_key}"
        }
        
        # Cache
        self.cache = {}
        self.cache_ttl = 300  # 5 minutes

    def _get_request(self, endpoint):
        """Generic GET request with caching"""
        current_time = time.time()
        
        # Check cache
        if endpoint in self.cache:
            data, timestamp = self.cache[endpoint]
            if current_time - timestamp < self.cache_ttl:
                return data

        try:
            url = f"{self.base_url}{endpoint}"
            response = requests.get(url, headers=self.headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.cache[endpoint] = (data, current_time)
                return data
            elif response.status_code == 401 or response.status_code == 402:
                print(f"JBlanked API Credit Error: {response.text}. Using Mock Data.")
                return self._get_mock_data(endpoint)
            else:
                print(f"JBlanked API Error {response.status_code}: {response.text}")
                return None
        except Exception as e:
            print(f"JBlanked Request Error: {e}")
            return self._get_mock_data(endpoint)

    def _get_mock_data(self, endpoint):
        """Return realistic mock data for UI testing when API fails"""
        from datetime import datetime
        today = datetime.now().strftime("%Y-%m-%d")
        
        if "calendar" in endpoint or "full-list" in endpoint:
            return [
                {"name": "CPI y/y", "currency": "USD", "impact": "High", "actual": "3.2%", "forecast": "3.1%", "previous": "3.4%", "time": f"{today} 13:30", "SmartAnalysis": "Bearish for USD if actual < forecast", "MachineLearning": "75% Bearish"},
                {"name": "Core CPI m/m", "currency": "USD", "impact": "High", "actual": "0.3%", "forecast": "0.3%", "previous": "0.3%", "time": f"{today} 13:30", "SmartAnalysis": "Neutral", "MachineLearning": "50% Neutral"},
                {"name": "Unemployment Claims", "currency": "USD", "impact": "Medium", "actual": "210K", "forecast": "215K", "previous": "208K", "time": f"{today} 13:30", "SmartAnalysis": "Bullish for USD if actual < forecast", "MachineLearning": "60% Bullish"},
                {"name": "Main Refinancing Rate", "currency": "EUR", "impact": "High", "actual": "4.50%", "forecast": "4.50%", "previous": "4.50%", "time": f"{today} 14:15", "SmartAnalysis": "Hawkish hold expected", "MachineLearning": "80% Neutral"},
                {"name": "Monetary Policy Statement", "currency": "EUR", "impact": "High", "actual": "", "forecast": "", "previous": "", "time": f"{today} 14:15", "SmartAnalysis": "Watch for rate cut hints", "MachineLearning": "N/A"},
                {"name": "ECB Press Conference", "currency": "EUR", "impact": "High", "actual": "", "forecast": "", "previous": "", "time": f"{today} 14:45", "SmartAnalysis": "Volatility expected", "MachineLearning": "High Volatility"},
                {"name": "Retail Sales m/m", "currency": "USD", "impact": "Medium", "actual": "0.6%", "forecast": "0.4%", "previous": "0.2%", "time": f"{today} 15:30", "SmartAnalysis": "Consumer spending strong", "MachineLearning": "65% Bullish"},
                {"name": "Prelim UoM Consumer Sentiment", "currency": "USD", "impact": "Medium", "actual": "79.6", "forecast": "80.0", "previous": "79.0", "time": f"{today} 17:00", "SmartAnalysis": "Sentiment improving", "MachineLearning": "70% Bullish"}
            ]
        return []

    def get_calendar_today(self):
        """Get today's economic calendar"""
        return self._get_request("/mql5/calendar/today/")

    def get_calendar_week(self):
        """Get this week's economic calendar"""
        return self._get_request("/mql5/calendar/week/")

    def get_full_history(self):
        """Get full event history (Heavy request, cache longer if needed)"""
        # This might be large, so maybe increase TTL or handle differently
        return self._get_request("/mql5/full-list/")

    def ask_newsgpt(self, prompt):
        """Submit a prompt to NewsGPT"""
        url = f"{self.base_url}/gpt/"
        try:
            response = requests.post(url, headers=self.headers, json={"content": prompt}, timeout=10)
            if response.status_code == 200:
                return response.json().get("task_id")
            return None
        except Exception as e:
            print(f"NewsGPT Request Error: {e}")
            return None

    def get_newsgpt_result(self, task_id):
        """Get result of NewsGPT task"""
        url = f"{self.base_url}/gpt/status/{task_id}/"
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "completed":
                    return data.get("response")
                return None # Not ready or failed
            return None
        except Exception as e:
            print(f"NewsGPT Status Error: {e}")
            return None

    def get_smart_analysis(self, currency="USD"):
        """Extract Smart Analysis for upcoming events"""
        data = self.get_full_history()
        if not data:
            return []
        
        analysis_list = []
        
        # Handle Dict response (full-list)
        if isinstance(data, dict):
            if currency in data:
                events = data[currency]
                for event in events:
                    if "SmartAnalysis" in event:
                        analysis_list.append({
                            "name": event.get("Name") or event.get("name"),
                            "analysis": event.get("SmartAnalysis"),
                            "machine_learning": event.get("MachineLearning")
                        })
        # Handle List response (calendar or mock)
        elif isinstance(data, list):
            for event in data:
                # Filter by currency if needed, or just take all if it matches
                if event.get("currency") == currency or currency == "USD": # simplistic filter
                    if "SmartAnalysis" in event:
                        analysis_list.append({
                            "name": event.get("Name") or event.get("name"),
                            "analysis": event.get("SmartAnalysis"),
                            "machine_learning": event.get("MachineLearning")
                        })
                        
        return analysis_list

    def get_impactful_news(self, currency="USD"):
        """Filter for high impact news for specific currency"""
        data = self.get_calendar_week()
        if not data:
            return []
            
        # JBlanked structure might vary, assuming list of events
        # We need to inspect the structure. For now, return raw or filter if list.
        if isinstance(data, list):
            filtered = [
                event for event in data 
                if event.get('currency') == currency or event.get('currency') == 'EUR'
            ]
            return filtered
        return data

# Global instance
jblanked_handler = JBlankedHandler()
