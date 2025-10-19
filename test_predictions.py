#!/usr/bin/env python3
"""Test predictions API endpoint"""

import requests
import json

API_URL = "http://192.168.1.44:5000"

def test_predict_file():
    """Test predict_file endpoint"""
    print("=== Testing /predict_file endpoint ===")
    
    url = f"{API_URL}/predict_file"
    data = {
        "file_path": "data/test/EUR_USD_test.csv"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        return response.json()
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_all_predictions():
    """Test all currency pairs like mobile app does"""
    print("\n=== Testing all currency predictions ===")
    
    pairs = ["EUR/USD", "GBP/USD", "USD/CAD", "USD/CHF", "USD/JPY", "XAU/USD"]
    
    for pair in pairs:
        file_name = pair.replace("/", "_") + "_test.csv"
        file_path = f"data/test/{file_name}"
        
        print(f"\n{pair}:")
        url = f"{API_URL}/predict_file"
        data = {"file_path": file_path}
        
        try:
            response = requests.post(url, json=data)
            if response.status_code == 200:
                result = response.json()
                print(f"  ✓ Signal: {result['signal_name']} ({result['signal']})")
                print(f"  ✓ Confidence: {result['confidence']}")
            else:
                print(f"  ✗ Error: {response.status_code}")
                print(f"  {response.text}")
        except Exception as e:
            print(f"  ✗ Exception: {e}")

if __name__ == "__main__":
    test_predict_file()
    test_all_predictions()
