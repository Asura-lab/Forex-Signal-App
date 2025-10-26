import struct
from pathlib import Path
import zlib
import io
import zipfile

MODEL_PATH = Path(r"d:/Projects/Forex_signal_app/models/15min/multi_currency_15min_best.keras")
OUT_PATH = MODEL_PATH.with_suffix('.repaired.zip')

b = MODEL_PATH.read_bytes()
sig = b'PK\x03\x04'

offsets = []
start = 0
while True:
    idx = b.find(sig, start)
    if idx == -1:
        break
    offsets.append(idx)
    start = idx + 1

print('Found local header offsets:', offsets)
entries = []
for off in offsets:
    hdr = b[off:off+30]
    if len(hdr) < 30:
        print('Header too short at', off)
        continue
    # local header format: 4s 2H 2H 2H 2H 3I 2H => but easier via struct fields
    # Use: signature(4) version(2) flag(2) comp(2) modtime(2) moddate(2) crc32(4) comp_size(4) uncomp_size(4) fname_len(2) extra_len(2)
    (sig4, ver, flags, comp_method, modtime, moddate, crc32, comp_size, uncomp_size, fname_len, extra_len) = struct.unpack('<4sHHHHHIIIHH', hdr)
    fname_start = off + 30
    fname = b[fname_start:fname_start+fname_len]
    extra = b[fname_start+fname_len: fname_start+fname_len+extra_len]
    data_start = fname_start + fname_len + extra_len
    data_end = data_start + comp_size
    comp_data = b[data_start:data_end]
    print(f"Entry at {off}: name={fname!r}, comp_method={comp_method}, comp_size={comp_size}, uncomp_size={uncomp_size}, crc32={hex(crc32)}")
    entries.append({
        'name': fname.decode('utf-8', errors='replace'),
        'comp_method': comp_method,
        'comp_size': comp_size,
        'uncomp_size': uncomp_size,
        'crc32': crc32,
        'comp_data': comp_data
    })

# Try to decompress each entry where possible and write to new zip
with zipfile.ZipFile(OUT_PATH, 'w') as zf:
    for e in entries:
        name = e['name']
        comp_method = e['comp_method']
        comp_data = e['comp_data']
        try:
            if comp_method == 0:
                data = comp_data
            elif comp_method == 8:
                # raw deflate stream; try decompress
                try:
                    data = zlib.decompress(comp_data)
                except zlib.error:
                    # try with -MAX_WBITS
                    data = zlib.decompress(comp_data, -zlib.MAX_WBITS)
            else:
                print(f"Unknown compression method {comp_method} for {name}, skipping")
                continue
            if len(data) != e['uncomp_size']:
                print(f"Warning: uncompressed size mismatch for {name}: expected {e['uncomp_size']}, got {len(data)}")
            zf.writestr(name, data)
            print(f"Wrote {name} to {OUT_PATH}")
        except Exception as ex:
            print(f"Failed to extract {name}: {ex}")

print('Rebuild attempt complete. Output:', OUT_PATH)
