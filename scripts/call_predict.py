import requests
import json

url = 'http://127.0.0.1:5000/predict'
payload = {'currency_pair': 'GBP/USD'}
try:
    r = requests.post(url, json=payload, timeout=120)
    print('STATUS', r.status_code)
    print(r.text)
except Exception as e:
    print('ERROR', e)
