"""
ML Models Module

This module contains 3 different deep learning architectures:

1. Transformer + LSTM (15-min): For scalping strategies
2. Bi-LSTM + Attention (30-min): For swing trading
3. CNN-LSTM Hybrid (60-min): For trend following

Each architecture is optimized for its specific timeframe and trading style.
"""

from .transformer_lstm import build_transformer_lstm_model
from .bilstm_attention import build_bilstm_attention_model
from .cnn_lstm import build_cnn_lstm_model

__all__ = [
    'build_transformer_lstm_model',
    'build_bilstm_attention_model',
    'build_cnn_lstm_model'
]
