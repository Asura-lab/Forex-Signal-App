"""
Bi-LSTM + Attention Model for 30-minute Forex Prediction

This module implements:
- Bidirectional LSTM layers for capturing past and future context
- Custom attention mechanism for focusing on important time steps
- Multi-task learning (direction + confidence)

Optimized for swing trading strategies.
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers


def register_keras_serializable(package=None):
    """Decorator for backward compatibility"""
    def decorator(cls):
        try:
            return keras.saving.register_keras_serializable(package=package)(cls)
        except AttributeError:
            try:
                return keras.utils.register_keras_serializable(package=package)(cls)
            except AttributeError:
                return cls
    return decorator


@register_keras_serializable(package="backend.ml.models.bilstm_attention")
class AttentionLayer(layers.Layer):
    """
    Custom attention layer that computes attention weights over LSTM outputs
    """
    
    def __init__(self, units=128, **kwargs):
        super(AttentionLayer, self).__init__(**kwargs)
        self.units = units
        
    def build(self, input_shape):
        # Attention weight matrix
        self.W = self.add_weight(
            name='attention_weight',
            shape=(input_shape[-1], self.units),
            initializer='glorot_uniform',
            trainable=True
        )
        self.b = self.add_weight(
            name='attention_bias',
            shape=(self.units,),
            initializer='zeros',
            trainable=True
        )
        # Context vector
        self.u = self.add_weight(
            name='attention_context',
            shape=(self.units,),
            initializer='glorot_uniform',
            trainable=True
        )
        super(AttentionLayer, self).build(input_shape)
    
    def call(self, inputs):
        # inputs shape: (batch_size, time_steps, features)
        # Compute attention scores
        uit = tf.tanh(tf.tensordot(inputs, self.W, axes=1) + self.b)
        ait = tf.tensordot(uit, self.u, axes=1)
        
        # Attention weights (softmax over time dimension)
        attention_weights = tf.nn.softmax(ait, axis=1)
        attention_weights = tf.expand_dims(attention_weights, axis=-1)
        
        # Weighted sum of inputs
        weighted_input = inputs * attention_weights
        output = tf.reduce_sum(weighted_input, axis=1)
        
        return output, attention_weights
    
    def get_config(self):
        config = super(AttentionLayer, self).get_config()
        config.update({'units': self.units})
        return config


def build_bilstm_attention_model(
    sequence_length,
    n_features,
    lstm_units=[128, 64],
    attention_units=128,
    dropout_rate=0.3,
    n_classes=3
):
    """
    Build Bi-LSTM + Attention model for 30-minute predictions
    
    Architecture:
        Input → Bi-LSTM → Bi-LSTM → Attention → Dense → Output
    
    Args:
        sequence_length: Number of time steps (48 for 30-min)
        n_features: Number of features per time step
        lstm_units: List of LSTM units for each layer [128, 64]
        attention_units: Units in attention mechanism (128)
        dropout_rate: Dropout rate (0.3)
        n_classes: Number of output classes (3: SELL/NEUTRAL/BUY)
    
    Returns:
        Compiled Keras model
    """
    
    print("\n" + "="*80)
    print("🏗️  BUILDING BI-LSTM + ATTENTION MODEL (30-MIN)")
    print("="*80)
    print(f"Input shape: ({sequence_length}, {n_features})")
    print(f"Bi-LSTM layers: {lstm_units}")
    print(f"Attention units: {attention_units}")
    print(f"Dropout rate: {dropout_rate}")
    print(f"Output classes: {n_classes}")
    
    # Input
    inputs = layers.Input(shape=(sequence_length, n_features), name='input_sequence')
    x = inputs
    
    # Layer 1: First Bi-LSTM (return sequences for next layer)
    x = layers.Bidirectional(
        layers.LSTM(
            lstm_units[0],
            return_sequences=True,
            dropout=dropout_rate,
            recurrent_dropout=dropout_rate / 2
        ),
        name='bidirectional_lstm_1'
    )(x)
    x = layers.BatchNormalization(name='batch_norm_1')(x)
    
    # Layer 2: Second Bi-LSTM (return sequences for attention)
    x = layers.Bidirectional(
        layers.LSTM(
            lstm_units[1],
            return_sequences=True,
            dropout=dropout_rate,
            recurrent_dropout=dropout_rate / 2
        ),
        name='bidirectional_lstm_2'
    )(x)
    x = layers.BatchNormalization(name='batch_norm_2')(x)
    
    # Layer 3: Attention mechanism
    attention_output, attention_weights = AttentionLayer(
        units=attention_units,
        name='attention_layer'
    )(x)
    
    # Dense layers
    x = layers.Dense(128, activation='relu', name='dense_1')(attention_output)
    x = layers.Dropout(dropout_rate, name='dropout_1')(x)
    x = layers.Dense(64, activation='relu', name='dense_2')(x)
    x = layers.Dropout(dropout_rate / 2, name='dropout_2')(x)
    
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
        name='BiLSTM_Attention_30min'
    )
    
    print("\n✅ Model architecture created successfully!")
    print(f"📊 Total layers: {len(model.layers)}")
    
    return model


def get_model_summary():
    """
    Returns a text summary of the Bi-LSTM + Attention architecture
    """
    return """
    ╔════════════════════════════════════════════════════════════════╗
    ║        Bi-LSTM + ATTENTION MODEL (30-MINUTE)                   ║
    ╠════════════════════════════════════════════════════════════════╣
    ║                                                                ║
    ║  INPUT: (48, n_features)                                       ║
    ║    ↓                                                           ║
    ║  Bi-LSTM Layer 1: 128 units (forward + backward)              ║
    ║    - Captures bidirectional context                            ║
    ║    - Dropout: 0.3                                              ║
    ║    ↓                                                           ║
    ║  Batch Normalization                                           ║
    ║    ↓                                                           ║
    ║  Bi-LSTM Layer 2: 64 units (forward + backward)               ║
    ║    - Refines temporal patterns                                 ║
    ║    - Dropout: 0.3                                              ║
    ║    ↓                                                           ║
    ║  Batch Normalization                                           ║
    ║    ↓                                                           ║
    ║  ATTENTION MECHANISM: 128 units                                ║
    ║    - Focuses on important time steps                           ║
    ║    - Weighted average of sequence                              ║
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
    ║  OPTIMIZED FOR: Swing trading (30-min timeframe)               ║
    ║  TARGET ACCURACY: 85%                                          ║
    ╚════════════════════════════════════════════════════════════════╝
    """


if __name__ == '__main__':
    # Test model creation
    model = build_bilstm_attention_model(
        sequence_length=48,
        n_features=100,
        lstm_units=[128, 64],
        attention_units=128,
        dropout_rate=0.3
    )
    model.summary()
    print(get_model_summary())
