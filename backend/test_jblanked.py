
import requests
import json
from config.settings import JBLANKED_API_KEY

def test_jblanked():
    url = "https://www.jblanked.com/news/api/mql5/calendar/today/"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Api-Key {JBLANKED_API_KEY}"
    }
    
    print(f"Fetching from: {url}")
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            data = response.json()
            print("Successfully fetched data.")
            if isinstance(data, list) and len(data) > 0:
                print("First item structure:")
                print(json.dumps(data[0], indent=2))
            else:
                print("Data is empty or not a list:", data)
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_jblanked()
