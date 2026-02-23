import requests, json, subprocess, os

resp = requests.post('https://api.expo.dev/v2/auth/loginAsync',
    json={'username': 'mmdorj08@gmail.com', 'password': '(H.f5LEs5QL6Mc8'})
# Use the FULL session secret string, not just the ID
full_session_secret = resp.json()['data']['sessionSecret']
session_id = json.loads(full_session_secret)['id']
print(f"[OK] Session ID: {session_id}")
print(f"[OK] Full session secret: {full_session_secret}")

# Write to state.json using full session secret string
state_path = os.path.expanduser(r'~\.expo\state.json')
with open(state_path, 'r') as f:
    state = json.load(f)

state['auth'] = {
    'sessionSecret': full_session_secret,  # Use full JSON string
    'userId': '',
    'username': 'mmdorj08',
    'currentConnection': 'Username-Password-Authentication'
}
with open(state_path, 'w') as f:
    json.dump(state, f, indent=2)
print(f"[OK] Written full session to {state_path}")

proc = subprocess.run(
    [r'C:\Users\Acer\.npm-global\eas.cmd', 'whoami'],
    capture_output=True, text=True,
    cwd=r'C:\Users\Acer\Desktop\Forex-Signal-App\mobile_app'
)
print("eas whoami:", proc.stdout.strip() or proc.stderr[-400:].strip())
print("exit:", proc.returncode)
















