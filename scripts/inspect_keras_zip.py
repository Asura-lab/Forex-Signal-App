import sys
from pathlib import Path

MODEL_PATH = Path(r"d:/Projects/Forex_signal_app/models/15min/multi_currency_15min_best.keras")

if not MODEL_PATH.exists():
    print(f"File not found: {MODEL_PATH}")
    sys.exit(1)

b = MODEL_PATH.read_bytes()

signatures = {
    'local_file_header': b'PK\x03\x04',
    'central_dir_file_header': b'PK\x01\x02',
    'end_central_dir': b'PK\x05\x06'
}

print(f"File: {MODEL_PATH}\nSize: {len(b)} bytes\n")

for name, sig in signatures.items():
    offsets = []
    start = 0
    while True:
        idx = b.find(sig, start)
        if idx == -1:
            break
        offsets.append(idx)
        start = idx + 1
    print(f"{name}: found {len(offsets)} occurrences")
    if offsets:
        print("  Offsets:", offsets[:10], "..." if len(offsets)>10 else "")
    print()

# Try to find last EOCD and print following bytes
idx = b.rfind(signatures['end_central_dir'])
if idx != -1:
    print(f"EOCD (PK\x05\x06) last found at offset: {idx}")
    print("EOCD bytes (20 bytes):", b[idx:idx+20])
else:
    print("EOCD (PK\x05\x06) not found. Central directory may be missing or truncated.")

# Try to locate human-readable markers
markers = [b'keras_version', b'optimizer', b'architecture', b'model_config']
for m in markers:
    i = b.find(m)
    print(f"marker {m!r}:", i)

print('\nDone')
