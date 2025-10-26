import struct
from pathlib import Path
import zlib
import zipfile
import io
import os
import json
import traceback

# Ensure project root on path
import sys
sys.path.append(str(Path(__file__).resolve().parent.parent))

import h5py
from tensorflow import keras
from backend.ml.models.transformer_lstm import build_transformer_lstm_model

MODELS_ROOT = Path('d:/Projects/Forex_signal_app/models')
TIMEFRAMES = ['15min', '30min', '60min']


def extract_local_entries(model_file: Path, out_zip: Path):
    b = model_file.read_bytes()
    sig = b'PK\x03\x04'
    offsets = []
    start = 0
    while True:
        idx = b.find(sig, start)
        if idx == -1:
            break
        offsets.append(idx)
        start = idx + 1

    entries = []
    for off in offsets:
        if off + 30 > len(b):
            continue
        hdr = b[off:off+30]
        try:
            (sig4, ver, flags, comp_method, modtime, moddate, crc32, comp_size, uncomp_size, fname_len, extra_len) = struct.unpack('<4sHHHHHIIIHH', hdr)
        except Exception as e:
            print('Failed to unpack header at', off, e)
            continue
        fname_start = off + 30
        fname = b[fname_start:fname_start+fname_len]
        extra = b[fname_start+fname_len: fname_start+fname_len+extra_len]
        data_start = fname_start + fname_len + extra_len
        data_end = data_start + comp_size
        if data_end > len(b):
            comp_data = b[data_start:]
        else:
            comp_data = b[data_start:data_end]
        try:
            name = fname.decode('utf-8')
        except Exception:
            name = repr(fname)
        entries.append({'name': name, 'comp_method': comp_method, 'comp_data': comp_data, 'comp_size': comp_size, 'uncomp_size': uncomp_size, 'crc32': crc32})

    # write to out_zip
    with zipfile.ZipFile(out_zip, 'w') as zf:
        for e in entries:
            name = e['name']
            comp_method = e['comp_method']
            comp_data = e['comp_data']
            try:
                if comp_method == 0:
                    data = comp_data
                elif comp_method == 8:
                    try:
                        data = zlib.decompress(comp_data)
                    except Exception:
                        try:
                            data = zlib.decompress(comp_data, -zlib.MAX_WBITS)
                        except Exception:
                            print('Cannot decompress entry', name)
                            continue
                else:
                    print('Unknown comp method', comp_method, 'for', name)
                    continue
                zf.writestr(name, data)
            except Exception as ex:
                print('Failed to write', name, ex)
    return out_zip


def try_load_weights_into_model(weights_h5_path: Path, timeframe: str, metadata: dict):
    # Build model architecture with metadata
    seq_len = int(metadata.get('sequence_length', 60))
    n_features = int(metadata.get('n_features', 33))
    print(f'Building model for {timeframe}: seq_len={seq_len}, n_features={n_features}')
    model = build_transformer_lstm_model(sequence_length=seq_len, n_features=n_features)
    # Try to load weights
    try:
        print('Attempting model.load_weights...', weights_h5_path)
        res = model.load_weights(str(weights_h5_path), by_name=True)
        print('load_weights result:', res)
        return model
    except Exception as e:
        print('model.load_weights failed:', e)
        traceback.print_exc()
        # Try manual HDF5 parsing and partial assignment
        try:
            f = h5py.File(str(weights_h5_path), 'r')
            print('h5 file opened, keys:', list(f.keys())[:10])
            # This is complex; return None to indicate failure
            f.close()
        except Exception as e2:
            print('h5py open failed:', e2)
        return None


if __name__ == '__main__':
    results = {}
    for tf in TIMEFRAMES:
        model_dir = MODELS_ROOT / tf
        model_file = model_dir / f'multi_currency_{tf}_best.keras'
        repaired_zip = model_dir / f'multi_currency_{tf}_best.repaired.zip'
        temp_weights = model_dir / f'model.weights.extracted.h5'

        print('\n' + '='*80)
        print('Processing', tf)

        if not model_file.exists():
            print('Original .keras not found:', model_file)
            results[tf] = {'status': 'missing'}
            continue

        # reconstruct repaired zip
        try:
            extract_local_entries(model_file, repaired_zip)
            print('Wrote repaired zip:', repaired_zip)
        except Exception as e:
            print('Failed to reconstruct zip:', e)
            results[tf] = {'status': 'reconstruct_failed', 'error': str(e)}
            continue

        # inspect repaired zip and extract model.weights.h5 if present
        try:
            with zipfile.ZipFile(repaired_zip) as z:
                names = z.namelist()
                print('Repaired zip contents:', names)
                # try metadata.json in file or in model_dir
                metadata = None
                if 'metadata.json' in names:
                    try:
                        metadata = json.loads(z.read('metadata.json').decode('utf-8'))
                    except Exception:
                        metadata = None
                if metadata is None and (model_dir / f'multi_currency_{tf}_metadata.json').exists():
                    with open(model_dir / f'multi_currency_{tf}_metadata.json','r',encoding='utf-8') as mf:
                        metadata = json.load(mf)
                if metadata is None:
                    metadata = {}

                if 'model.weights.h5' in names:
                    print('Extracting model.weights.h5 to', temp_weights)
                    with open(temp_weights, 'wb') as out_f:
                        out_f.write(z.read('model.weights.h5'))
                else:
                    print('No model.weights.h5 inside repaired zip')
                    results[tf] = {'status': 'no_weights'}
                    continue
        except Exception as e:
            print('Error reading repaired zip:', e)
            results[tf] = {'status': 'repaired_zip_read_failed', 'error': str(e)}
            continue

        # Try to open the extracted weights with h5py and list groups
        try:
            print('Trying to open extracted HDF5...')
            f = h5py.File(str(temp_weights), 'r')
            print('HDF5 root keys:', list(f.keys())[:20])
            f.close()
            h5_ok = True
        except Exception as e:
            print('h5py failed to open weights file:', e)
            h5_ok = False

        if not h5_ok:
            results[tf] = {'status': 'h5_open_failed'}
            continue

        # Try to load into model
        model = try_load_weights_into_model(temp_weights, tf, metadata)
        if model is None:
            print('Failed to load weights into model for', tf)
            results[tf] = {'status': 'load_weights_failed'}
            continue

        # Save model as SavedModel for backend to load
        saved_model_dir = model_dir / f'multi_currency_{tf}_saved_model'
        try:
            model.save(saved_model_dir, save_format='tf')
            print('SavedModel written to', saved_model_dir)
            results[tf] = {'status': 'savedmodel_written', 'path': str(saved_model_dir)}
        except Exception as e:
            print('Failed to save SavedModel:', e)
            results[tf] = {'status': 'save_failed', 'error': str(e)}

    print('\nSummary:')
    print(json.dumps(results, indent=2))
