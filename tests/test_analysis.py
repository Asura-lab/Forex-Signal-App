
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).resolve().parent.parent / 'backend'))

from utils.market_analyst import market_analyst

def test_analysis():
    print("Testing Market Analyst...")
    
    # Mock signal data
    signal = {
        "signal": "BUY",
        "confidence": 85
    }
    
    try:
        # Force analysis for EUR/USD
        print("Generating analysis for EUR/USD...")
        # Correct argument order: technical_signal, pair
        insight = market_analyst.generate_ai_insight(signal, pair="EUR/USD")
        
        print("\n--- Result ---")
        import json
        print(json.dumps(insight, indent=2, ensure_ascii=False))
        
        print("\nChecking keys:")
        required_keys = ['summary', 'outlook', 'forecast', 'risk_factors']
        for key in required_keys:
            if key in insight and insight[key]:
                print(f"[OK] {key}: Present")
            else:
                print(f"[MISSING] {key}: Missing or Empty")
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_analysis()
