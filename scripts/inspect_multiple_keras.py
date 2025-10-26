from pathlib import Path

def inspect(path: Path):
    b = path.read_bytes()
    sigs = {b'PK\x03\x04':'local_file_header', b'PK\x01\x02':'central_dir', b'PK\x05\x06':'eocd'}
    print('\n' + '='*60)
    print(f'FILE: {path}\nSize: {len(b)} bytes')
    for sig, name in sigs.items():
        cnt = b.count(sig)
        print(f'  {name}: occurrences={cnt}')
    local_offsets = []
    start=0
    while True:
        idx = b.find(b'PK\x03\x04', start)
        if idx == -1:
            break
        local_offsets.append(idx)
        start = idx+1
    if local_offsets:
        print('  local header offsets (first 10):', local_offsets[:10])
    else:
        print('  no local headers found')
    # markers
    markers = [b'keras_version', b'optimizer', b'model.weights.h5', b'model_config', b'metadata.json']
    for m in markers:
        i = b.find(m)
        print(f"  marker {m!r}: {i}")


if __name__ == '__main__':
    base = Path('d:/Projects/Forex_signal_app/models')
    for tf in ['15min','30min','60min']:
        p = base / tf / f"multi_currency_{tf}_best.keras"
        if p.exists():
            inspect(p)
        else:
            print('\n' + '='*60)
            print(f'File missing: {p}')
