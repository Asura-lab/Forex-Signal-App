"""
CNN-LSTM Hybrid Model for 60-minute Forex Prediction

This module implements:
- 1D Convolutional layers for feature extraction
- LSTM layers for temporal dependencies
- Multi-task learning (direction + confidence)

Optimized for trend following strategies.
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers


def build_cnn_lstm_model(
    sequence_length,
    n_features,
    cnn_filters=[64, 128, 64],
    kernel_size=3,
    lstm_units=[128, 64],
    dropout_rate=0.3,
    n_classes=3
):
    """
    Build CNN-LSTM Hybrid model for 60-minute predictions
    
    Architecture:
        Input → Conv1D → Conv1D → Conv1D → MaxPool → LSTM → LSTM → Dense → Output
    
    Args:
        sequence_length: Number of time steps (48 for 60-min)
        n_features: Number of features per time step
        cnn_filters: List of filters for each Conv1D layer [64, 128, 64]
        kernel_size: Kernel size for convolutions (3)
        lstm_units: List of LSTM units [128, 64]
        dropout_rate: Dropout rate (0.3)
        n_classes: Number of output classes (3: SELL/NEUTRAL/BUY)
    
    Returns:
        Compiled Keras model
    """
    
    print("\n" + "="*80)
    print("🏗️  BUILDING CNN-LSTM HYBRID MODEL (60-MIN)")
    print("="*80)
    print(f"Input shape: ({sequence_length}, {n_features})")
    print(f"CNN filters: {cnn_filters}")
    print(f"Kernel size: {kernel_size}")
    print(f"LSTM layers: {lstm_units}")
    print(f"Dropout rate: {dropout_rate}")
    print(f"Output classes: {n_classes}")
    
    # Input
    inputs = layers.Input(shape=(sequence_length, n_features), name='input_sequence')
    x = inputs
    
    # CNN Feature Extraction Layers
    # Layer 1: First Conv1D
    x = layers.Conv1D(
        filters=cnn_filters[0],
        kernel_size=kernel_size,
        padding='same',
        activation='relu',
        name='conv1d_1'
    )(x)
    x = layers.BatchNormalization(name='batch_norm_conv_1')(x)
    x = layers.Dropout(dropout_rate / 2, name='dropout_conv_1')(x)
    
    # Layer 2: Second Conv1D
    x = layers.Conv1D(
        filters=cnn_filters[1],
        kernel_size=kernel_size,
        padding='same',
        activation='relu',
        name='conv1d_2'
    )(x)
    x = layers.BatchNormalization(name='batch_norm_conv_2')(x)
    x = layers.Dropout(dropout_rate / 2, name='dropout_conv_2')(x)
    
    # Layer 3: Third Conv1D
    x = layers.Conv1D(
        filters=cnn_filters[2],
        kernel_size=kernel_size,
        padding='same',
        activation='relu',
        name='conv1d_3'
    )(x)
    x = layers.BatchNormalization(name='batch_norm_conv_3')(x)
    
    # Max Pooling to reduce dimensionality
    x = layers.MaxPooling1D(pool_size=2, name='max_pooling')(x)
    x = layers.Dropout(dropout_rate / 2, name='dropout_pooling')(x)
    
    # LSTM Temporal Processing Layers
    # Layer 4: First LSTM
    x = layers.LSTM(
        lstm_units[0],
        return_sequences=True,
        dropout=dropout_rate,
        recurrent_dropout=dropout_rate / 2,
        name='lstm_1'
    )(x)
    x = layers.BatchNormalization(name='batch_norm_lstm_1')(x)
    
    # Layer 5: Second LSTM
    x = layers.LSTM(
        lstm_units[1],
        return_sequences=False,
        dropout=dropout_rate,
        recurrent_dropout=dropout_rate / 2,
        name='lstm_2'
    )(x)
    x = layers.BatchNormalization(name='batch_norm_lstm_2')(x)
    
    # Dense layers
    x = layers.Dense(128, activation='relu', name='dense_1')(x)
    x = layers.Dropout(dropout_rate, name='dropout_dense_1')(x)
    x = layers.Dense(64, activation='relu', name='dense_2')(x)
    x = layers.Dropout(dropout_rate / 2, name='dropout_dense_2')(x)
    
    # Output 1: Direction prediction (SELL/NEUTRAL/BUY)
    direction_output = layers.Dense(
        n_classes,
        activation='softmax',
        name='direction'
    )(x)
    
    # Output 2: Confidence score
    confidence_output = layers.Dense(
        1,
        activation='sigmoid',
        name='confidence'
    )(x)
    
    # Create model
    model = keras.Model(
        inputs=inputs,
        outputs=[direction_output, confidence_output],
        name='CNN_LSTM_60min'
    )
    
    print("\n✅ Model architecture created successfully!")
    print(f"📊 Total layers: {len(model.layers)}")
    
    return model


def get_model_summary():
    """
    Returns a text summary of the CNN-LSTM architecture
    """
    return """
    ╔════════════════════════════════════════════════════════════════╗
    ║           CNN-LSTM HYBRID MODEL (60-MINUTE)                    ║
    ╠════════════════════════════════════════════════════════════════╣
    ║                                                                ║
    ║  INPUT: (48, n_features)                                       ║
    ║    ↓                                                           ║
    ║  Conv1D Layer 1: 64 filters, kernel=3                          ║
    ║    - Extracts local patterns                                   ║
    ║    - Batch Norm + Dropout: 0.15                                ║
    ║    ↓                                                           ║
    ║  Conv1D Layer 2: 128 filters, kernel=3                         ║
    ║    - Learns complex features                                   ║
    ║    - Batch Norm + Dropout: 0.15                                ║
    ║    ↓                                                           ║
    ║  Conv1D Layer 3: 64 filters, kernel=3                          ║
    ║    - Refines feature maps                                      ║
    ║    - Batch Normalization                                       ║
    ║    ↓                                                           ║
    ║  MaxPooling1D: pool_size=2                                     ║
    ║    - Reduces dimensionality                                    ║
    ║    - Dropout: 0.15                                             ║
    ║    ↓                                                           ║
    ║  LSTM Layer 1: 128 units                                       ║
    ║    - Captures temporal dependencies                            ║
    ║    - Dropout: 0.3, Recurrent: 0.15                             ║
    ║    ↓                                                           ║
    ║  Batch Normalization                                           ║
    ║    ↓                                                           ║
    ║  LSTM Layer 2: 64 units                                        ║
    ║    - Refines temporal patterns                                 ║
    ║    - Dropout: 0.3, Recurrent: 0.15                             ║
    ║    ↓                                                           ║
    ║  Batch Normalization                                           ║
    ║    ↓                                                           ║
    ║  Dense Layer 1: 128 units (ReLU)                               ║
    ║    - Dropout: 0.3                                              ║
    ║    ↓                                                           ║
    ║  Dense Layer 2: 64 units (ReLU)                                ║
    ║    - Dropout: 0.15                                             ║
    ║    ↓                                                           ║
    ║  OUTPUT 1: Direction (3 classes) - Softmax                     ║
    ║  OUTPUT 2: Confidence (1 value) - Sigmoid                      ║
    ║                                                                ║
    ║  OPTIMIZED FOR: Trend following (60-min timeframe)             ║
    ║  TARGET ACCURACY: 82%                                          ║
    ╚════════════════════════════════════════════════════════════════╝
    """


if __name__ == '__main__':
    # Test model creation
    model = build_cnn_lstm_model(
        sequence_length=48,
        n_features=100,
        cnn_filters=[64, 128, 64],
        kernel_size=3,
        lstm_units=[128, 64],
        dropout_rate=0.3
    )
    model.summary()
    print(get_model_summary())
