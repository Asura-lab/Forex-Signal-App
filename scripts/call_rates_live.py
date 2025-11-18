import requests

try:
    r = requests.get('http://127.0.0.1:5000/rates/live?source=mt5', timeout=120)
    print('STATUS', r.status_code)
    print(r.text)
except Exception as e:
    print('ERROR', e)
