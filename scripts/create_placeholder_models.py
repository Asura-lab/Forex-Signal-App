import json
from pathlib import Path
import sys
sys.path.append(str(Path(__file__).resolve().parent.parent))

from backend.ml.models.transformer_lstm import build_transformer_lstm_model
import tensorflow as tf

MODELS_ROOT = Path('d:/Projects/Forex_signal_app/models')
TIMEFRAMES = ['15min','30min','60min']

# defaults matching training config
DEFAULTS = {
    '15min': {'sequence_length': 60, 'n_features': 33},
    '30min': {'sequence_length': 48, 'n_features': 33},
    '60min': {'sequence_length': 48, 'n_features': 33}
}

for tf_name in TIMEFRAMES:
    model_dir = MODELS_ROOT / tf_name
    model_dir.mkdir(parents=True, exist_ok=True)
    metadata_path = model_dir / f'multi_currency_{tf_name}_metadata.json'
    seq_len = DEFAULTS[tf_name]['sequence_length']
    n_features = DEFAULTS[tf_name]['n_features']
    if metadata_path.exists():
        try:
            metadata = json.loads(metadata_path.read_text(encoding='utf-8'))
            seq_len = int(metadata.get('sequence_length', seq_len))
            n_features = int(metadata.get('n_features', n_features))
        except Exception:
            pass

    print(f"Building placeholder model for {tf_name}: seq_len={seq_len}, n_features={n_features}")
    model = build_transformer_lstm_model(sequence_length=seq_len, n_features=n_features)
    # compile minimally so save works
    model.compile(optimizer='adam', loss={'direction':'sparse_categorical_crossentropy','confidence':'mse'})

    # Save as a Keras .keras file (zip) so backend can load it directly
    out_file = model_dir / f'multi_currency_{tf_name}_best.keras'
    try:
        if out_file.exists():
            out_file.unlink()
    except Exception as e:
        print('Warning removing existing .keras file:', e)

    print('Saving placeholder Keras archive to', out_file)
    try:
        # Save in Keras v3 `.keras` format (zip)
        model.save(str(out_file))
        print('Saved .keras:', out_file)
    except Exception as e:
        print('Failed to save .keras file:', e)

print('\nDone. Placeholders created. Please restart the backend to load these SavedModel directories.')
