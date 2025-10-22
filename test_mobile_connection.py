#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Mobile Connection Test
Утаснаас backend API-д холбогдож байгаа эсэхийг шалгах
"""

import requests
import json

# Your IP address
API_URL = "http://192.168.60.49:5000"

print("=" * 60)
print("📱 MOBILE CONNECTION TEST")
print("=" * 60)
print(f"\n🔗 Testing connection to: {API_URL}")

# Test 1: Health Check
print("\n1️⃣ Health Check...")
try:
    response = requests.get(f"{API_URL}/health", timeout=5)
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Status: {data.get('status')}")
        print(f"   ✅ Database: {data.get('database')}")
        print(f"   ✅ ML Model: {data.get('ml_model')}")
        print(f"   ✅ Users: {data.get('users_count')}")
    else:
        print(f"   ❌ Failed: {response.status_code}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 2: API Info
print("\n2️⃣ API Info...")
try:
    response = requests.get(f"{API_URL}/", timeout=5)
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Name: {data.get('name')}")
        print(f"   ✅ Version: {data.get('version')}")
        print(f"   ✅ Auth: {data.get('auth')}")
    else:
        print(f"   ❌ Failed: {response.status_code}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 3: Currencies List
print("\n3️⃣ Currencies List...")
try:
    response = requests.get(f"{API_URL}/currencies", timeout=5)
    if response.status_code == 200:
        data = response.json()
        currencies = data.get('currencies', [])
        print(f"   ✅ Count: {len(currencies)}")
        print(f"   ✅ Pairs: {', '.join(currencies)}")
    else:
        print(f"   ❌ Failed: {response.status_code}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 4: Live Rates
print("\n4️⃣ Live Rates (MT5)...")
try:
    response = requests.get(f"{API_URL}/rates/live", timeout=10)
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            rates = data.get('rates', {})
            print(f"   ✅ Source: {data.get('source')}")
            print(f"   ✅ Count: {len(rates)}")
            print(f"   ✅ Timestamp: {data.get('timestamp')}")
            # Show first rate
            if rates:
                first_pair = list(rates.keys())[0]
                first_rate = rates[first_pair]
                print(f"   ✅ Sample: {first_pair} = {first_rate.get('bid', 'N/A')}")
        else:
            print(f"   ⚠️  MT5 not connected or error: {data.get('error')}")
    else:
        print(f"   ❌ Failed: {response.status_code}")
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n" + "=" * 60)
print("✅ CONNECTION TEST COMPLETED")
print("=" * 60)
print("\n📌 Next steps:")
print("   1. Make sure Windows Firewall allows port 5000")
print("   2. Ensure phone and computer are on same WiFi")
print("   3. Try accessing from phone browser: http://192.168.60.49:5000")
print()
