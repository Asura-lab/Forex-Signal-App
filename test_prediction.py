"""
Test prediction endpoint - Cache системийг шалгах
"""
import requests
import json
import time
from datetime import datetime

API_URL = "http://localhost:5000"

def test_prediction(pair):
    """Таамаглал тестлэх"""
    file_name = pair.replace("/", "_") + "_test.csv"
    file_path = f"data/test/{file_name}"
    
    print(f"\n{'='*60}")
    print(f"🧪 TEST: {pair}")
    print(f"{'='*60}")
    
    # Request илгээх
    start_time = time.time()
    
    response = requests.post(
        f"{API_URL}/predict_file",
        json={"file_path": file_path},
        timeout=30
    )
    
    end_time = time.time()
    duration = (end_time - start_time) * 1000  # ms
    
    print(f"⏱️  Response time: {duration:.0f}ms")
    
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            print(f"✓ Success!")
            print(f"   Signal: {data.get('signal_name')} ({data.get('signal')})")
            print(f"   Confidence: {data.get('confidence'):.0%}")
            print(f"   Price: {data.get('current_price')}")
            print(f"   Change: {data.get('price_change_percent'):+.4f}%")
            print(f"   Source: {data.get('data_source')}")
            print(f"   Timestamp: {data.get('timestamp')}")
            return data
        else:
            print(f"✗ Error: {data.get('error')}")
            return None
    else:
        print(f"✗ HTTP Error: {response.status_code}")
        print(response.text)
        return None

def test_cache():
    """Cache системийг тестлэх"""
    print("\n" + "="*60)
    print("🧪 CACHE SYSTEM TEST")
    print("="*60)
    
    pairs = ["EUR/USD", "GBP/USD", "USD/JPY"]
    
    # 1st request (Cache Miss)
    print("\n📍 PHASE 1: First requests (Cache Miss expected)")
    print("-"*60)
    results1 = {}
    for pair in pairs:
        result = test_prediction(pair)
        if result:
            results1[pair] = result
        time.sleep(1)  # 1s хүлээх
    
    # 2nd request (Cache Hit)
    print("\n📍 PHASE 2: Immediate retry (Cache Hit expected)")
    print("-"*60)
    results2 = {}
    for pair in pairs:
        result = test_prediction(pair)
        if result:
            results2[pair] = result
        time.sleep(0.5)
    
    # Compare
    print("\n📊 COMPARISON:")
    print("-"*60)
    for pair in pairs:
        if pair in results1 and pair in results2:
            r1 = results1[pair]
            r2 = results2[pair]
            
            same_signal = r1['signal'] == r2['signal']
            same_confidence = r1['confidence'] == r2['confidence']
            same_timestamp = r1['timestamp'] == r2['timestamp']
            
            print(f"\n{pair}:")
            print(f"  Signal same: {'✓' if same_signal else '✗'} ({r1['signal']} vs {r2['signal']})")
            print(f"  Confidence same: {'✓' if same_confidence else '✗'} ({r1['confidence']:.2f} vs {r2['confidence']:.2f})")
            print(f"  Timestamp same: {'✓' if same_timestamp else '✗'}")
            
            if same_signal and same_confidence and same_timestamp:
                print(f"  ✅ CACHE WORKING! (ижил үр дүн)")
            else:
                print(f"  ⚠️  Cache NOT working (өөр үр дүн)")

def test_all_pairs():
    """Бүх валютын хослолуудыг тестлэх"""
    print("\n" + "="*60)
    print("🧪 ALL PAIRS TEST")
    print("="*60)
    
    pairs = ["EUR/USD", "GBP/USD", "USD/CAD", "USD/CHF", "USD/JPY", "XAU/USD"]
    
    results = []
    for pair in pairs:
        result = test_prediction(pair)
        if result:
            results.append({
                'pair': pair,
                'signal': result['signal'],
                'signal_name': result['signal_name'],
                'confidence': result['confidence'],
                'source': result['data_source']
            })
        time.sleep(0.5)
    
    # Summary
    print("\n📊 SUMMARY:")
    print("-"*60)
    print(f"{'Pair':<10} {'Signal':<15} {'Confidence':<12} {'Source'}")
    print("-"*60)
    for r in results:
        print(f"{r['pair']:<10} {r['signal_name']:<15} {r['confidence']:<11.0%} {r['source']}")
    
    # Check diversity
    unique_signals = len(set(r['signal'] for r in results))
    print(f"\nUnique signals: {unique_signals}/{len(results)}")
    
    if unique_signals == 1:
        print("⚠️  WARNING: Бүх хослол ижил сигналтай! (хөдөлгөөнгүй)")
    else:
        print("✅ GOOD: Өөр өөр сигналууд байна")

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🧪 FOREX SIGNAL APP - PREDICTION TEST")
    print("="*60)
    print(f"API: {API_URL}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    try:
        # Test 1: Бүх хослолууд
        test_all_pairs()
        
        # Test 2: Cache system
        print("\n\n")
        test_cache()
        
        print("\n" + "="*60)
        print("✓ TEST COMPLETED")
        print("="*60)
        
    except requests.exceptions.ConnectionError:
        print("\n✗ ERROR: Backend холбогдохгүй байна!")
        print("Backend эхлүүлсэн эсэхийг шалгана уу: python backend/app.py")
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
