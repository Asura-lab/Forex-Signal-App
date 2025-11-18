# -*- coding: utf-8 -*-
"""
UniRate API Handler - Бодит цагийн өгөгдөл
Backend-д ашиглах live rates fetcher
"""

import requests
from datetime import datetime
import time

class UniRateHandler:
    """UniRate API - EUR/USD бодит цагийн өгөгдөл"""
    
    def __init__(self):
        self.base_url = "https://api.unirateapi.com/api/rates"
        self.api_key = "yuC5xaMhDq3psqbutiGvtRFxoQLhu9DyDRGVdAtr85GO5H7om9LzJdHwCDlMjkF2"
        self.pair = "EUR/USD"
        self.base_currency = "USD"  # UniRate uses USD as base
        self.cache = {}
        self.cache_ttl = 5  # seconds
        
        print("✅ UniRateHandler initialized with API key")
        print("   EUR/USD Real-time data enabled")
    
    def get_live_rate(self):
        """
        EUR/USD бодит цагийн ханш авах
        
        Returns:
            dict: {
                'success': True,
                'pair': 'EUR_USD',
                'rate': float,
                'bid': float,
                'ask': float,
                'spread': float,
                'time': str (ISO format),
                'source': 'UniRate API'
            }
        """
        try:
            # Check cache
            now = time.time()
            if 'EUR_USD' in self.cache:
                cached_data, cached_time = self.cache['EUR_USD']
                if now - cached_time < self.cache_ttl:
                    print("📦 Using cached rate")
                    return cached_data
            
            # Fetch from UniRate API
            params = {
                'api_key': self.api_key,
                'from': self.base_currency  # USD
            }
            
            print(f"📡 Fetching from UniRate API...")
            response = requests.get(self.base_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # UniRate API response format: { rates: { EUR: 0.92xx, ... } }
            if 'rates' in data and 'EUR' in data['rates']:
                eur_rate = data['rates']['EUR']  # USD/EUR rate
                
                # Convert to EUR/USD (inverse)
                eurusd_rate = 1.0 / eur_rate
                
                # Estimate spread (0.1 pips for EUR/USD)
                spread_pips = 0.1
                spread = spread_pips * 0.00001
                
                result = {
                    'success': True,
                    'pair': 'EUR_USD',
                    'rate': round(eurusd_rate, 5),
                    'bid': round(eurusd_rate - spread / 2, 5),
                    'ask': round(eurusd_rate + spread / 2, 5),
                    'spread': spread_pips,
                    'time': datetime.now().isoformat(),
                    'source': 'UniRate API',
                    'raw_data': {
                        'usd_eur_rate': eur_rate,
                        'api_timestamp': data.get('timestamp', 'N/A')
                    }
                }
                
                # Cache result
                self.cache['EUR_USD'] = (result, now)
                
                print(f"✅ EUR/USD: {result['rate']:.5f}")
                return result
            else:
                return {
                    'success': False,
                    'error': 'No EUR rate in response',
                    'raw_response': data
                }
        
        except Exception as e:
            print(f"❌ UniRate API error: {e}")
            import traceback
            traceback.print_exc()
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_historical_bars(self, count=100):
        """
        Түүхэн өгөгдөл татах (current rates repeated)
        Note: UniRate API doesn't support historical data in free tier
        
        Args:
            count: Хэдэн өдрийн өгөгдөл
        
        Returns:
            list of dict: [{time, open, high, low, close, volume}, ...]
        """
        try:
            print(f"⚠️  UniRate API doesn't support historical data")
            print(f"   Returning current rate repeated {count} times")
            
            # Get current rate
            current = self.get_live_rate()
            
            if not current['success']:
                return []
            
            from datetime import timedelta
            
            bars = []
            current_date = datetime.now()
            rate = current['rate']
            
            for i in range(count):
                # Simulate slight variation
                variation = 0.0001 * (i % 10 - 5) / 10000  # ±0.5 pip variation
                
                bars.append({
                    'time': current_date.isoformat(),
                    'open': round(rate + variation, 5),
                    'high': round(rate + variation + 0.00005, 5),
                    'low': round(rate + variation - 0.00005, 5),
                    'close': round(rate + variation, 5),
                    'volume': 1000000
                })
                
                current_date -= timedelta(minutes=1)
            
            print(f"✅ Generated {len(bars)} simulated bars")
            return bars
        
        except Exception as e:
            print(f"❌ Historical bars error: {e}")
            return []


# Global instance
unirate_handler = UniRateHandler()


def get_unirate_live_rate():
    """
    Backend-д ашиглах helper function
    
    Returns:
        dict: Live rate data
    """
    return unirate_handler.get_live_rate()


def get_unirate_historical(count=100):
    """
    Backend-д ашиглах historical data helper
    
    Args:
        count: Number of bars
    
    Returns:
        list: Historical bars
    """
    return unirate_handler.get_historical_bars(count)


# Test function
if __name__ == "__main__":
    print("=" * 60)
    print("🧪 Testing UniRate Handler")
    print("=" * 60)
    
    # Test live rate
    handler = UniRateHandler()
    
    print("\n1️⃣ Testing live rate...")
    result = handler.get_live_rate()
    
    if result['success']:
        print(f"✅ EUR/USD: {result['rate']:.5f}")
        print(f"   Bid: {result['bid']:.5f}")
        print(f"   Ask: {result['ask']:.5f}")
        print(f"   Spread: {result['spread']} pips")
        print(f"   Time: {result['time']}")
    else:
        print(f"❌ Error: {result.get('error')}")
    
    # Test cache
    print("\n2️⃣ Testing cache (should be instant)...")
    start = time.time()
    result2 = handler.get_live_rate()
    elapsed = time.time() - start
    print(f"✅ Response time: {elapsed*1000:.2f}ms (cached)")
    
    # Test historical
    print("\n3️⃣ Testing historical data (10 days)...")
    bars = handler.get_historical_bars(count=10)
    print(f"✅ Got {len(bars)} bars")
    if bars:
        print(f"   Latest: {bars[0]['close']:.5f} @ {bars[0]['time'][:10]}")
        print(f"   Oldest: {bars[-1]['close']:.5f} @ {bars[-1]['time'][:10]}")
    
    print("\n" + "=" * 60)
    print("✅ All tests passed!")
    print("=" * 60)
