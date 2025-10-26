"""
Transformer + LSTM Hybrid Model for 15-minute Forex Prediction

This module implements a hybrid architecture combining:
- Multi-head self-attention (Transformer) for pattern recognition
- LSTM layers for temporal dependencies
- Multi-task learning (direction + confidence)
"""

import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers


# Decorator for custom layer serialization
# Compatible with both TF 2.x versions
def register_keras_serializable(package=None):
    """Decorator for backward compatibility"""
    def decorator(cls):
        # Try new API first (TF 2.13+)
        try:
            return keras.saving.register_keras_serializable(package=package)(cls)
        except AttributeError:
            # Fall back to old API (TF 2.x < 2.13)
            try:
                return keras.utils.register_keras_serializable(package=package)(cls)
            except AttributeError:
                # If neither works, just return the class as-is
                return cls
    return decorator


@register_keras_serializable(package="backend.ml.models.transformer_lstm")
class TransformerBlock(layers.Layer):
    """
    Transformer block with multi-head self-attention and feed-forward network
    """
    
    def __init__(self, embed_dim, num_heads, ff_dim, dropout_rate=0.1, **kwargs):
        super(TransformerBlock, self).__init__(**kwargs)
        self.embed_dim = embed_dim
        self.num_heads = num_heads
        self.ff_dim = ff_dim
        self.dropout_rate = dropout_rate
        
        self.att = layers.MultiHeadAttention(
            num_heads=num_heads, 
            key_dim=embed_dim // num_heads,
            dropout=dropout_rate
        )
        self.ffn = keras.Sequential([
            layers.Dense(ff_dim, activation="relu"),
            layers.Dropout(dropout_rate),
            layers.Dense(embed_dim),
        ])
        self.layernorm1 = layers.LayerNormalization(epsilon=1e-6)
        self.layernorm2 = layers.LayerNormalization(epsilon=1e-6)
        self.dropout1 = layers.Dropout(dropout_rate)
        self.dropout2 = layers.Dropout(dropout_rate)

    def call(self, inputs, training=False):
        # Multi-head attention
        attn_output = self.att(inputs, inputs, training=training)
        attn_output = self.dropout1(attn_output, training=training)
        out1 = self.layernorm1(inputs + attn_output)
        
        # Feed forward network
        ffn_output = self.ffn(out1, training=training)
        ffn_output = self.dropout2(ffn_output, training=training)
        out2 = self.layernorm2(out1 + ffn_output)
        
        return out2

    def get_config(self):
        config = super().get_config()
        config.update({
            "embed_dim": self.embed_dim,
            "num_heads": self.num_heads,
            "ff_dim": self.ff_dim,
            "dropout_rate": self.dropout_rate
        })
        return config


def build_transformer_lstm_model(
    sequence_length=60,
    n_features=100,
    n_heads=8,
    ff_dim=256,
    lstm_units=[128, 64],
    dropout_rate=0.3,
    n_classes=3
):
    """
    Build Transformer + LSTM hybrid model for forex prediction
    
    Architecture:
    1. Input: (batch, sequence_length, n_features)
    2. Positional embedding
    3. Transformer block (multi-head attention)
    4. LSTM layers (2 layers)
    5. Multi-task outputs:
       - Direction: BUY/NEUTRAL/SELL (3 classes)
       - Confidence: 0-1 (regression)
    
    Args:
        sequence_length: Length of input sequence (e.g., 60 minutes)
        n_features: Number of features per timestep (e.g., 100+ technical indicators)
        n_heads: Number of attention heads (default: 8)
        ff_dim: Feed-forward dimension (default: 256)
        lstm_units: List of LSTM units per layer (default: [128, 64])
        dropout_rate: Dropout rate (default: 0.3)
        n_classes: Number of output classes (default: 3 - BUY/NEUTRAL/SELL)
    
    Returns:
        Keras Model with two outputs: direction and confidence
    """
    
    # Input layer
    inputs = layers.Input(shape=(sequence_length, n_features), name='input')
    
    # Positional embedding (add position information)
    positions = tf.range(start=0, limit=sequence_length, delta=1)
    position_embedding = layers.Embedding(
        input_dim=sequence_length,
        output_dim=n_features
    )(positions)
    x = inputs + position_embedding
    
    # Transformer block
    x = TransformerBlock(
        embed_dim=n_features,
        num_heads=n_heads,
        ff_dim=ff_dim,
        dropout_rate=dropout_rate
    )(x)
    
    # LSTM layers
    for i, units in enumerate(lstm_units):
        return_sequences = (i < len(lstm_units) - 1)  # Last layer doesn't return sequences
        x = layers.LSTM(
            units,
            return_sequences=return_sequences,
            dropout=dropout_rate,
            recurrent_dropout=dropout_rate,
            name=f'lstm_{i+1}'
        )(x)
        x = layers.BatchNormalization(name=f'bn_lstm_{i+1}')(x)
    
    # Dense layers
    x = layers.Dense(128, activation='relu', name='dense_1')(x)
    x = layers.Dropout(dropout_rate, name='dropout_1')(x)
    x = layers.Dense(64, activation='relu', name='dense_2')(x)
    x = layers.Dropout(dropout_rate, name='dropout_2')(x)
    
    # Output 1: Direction prediction (BUY/NEUTRAL/SELL)
    direction_output = layers.Dense(
        n_classes,
        activation='softmax',
        name='direction'
    )(x)
    
    # Output 2: Confidence score (0-1)
    confidence_output = layers.Dense(
        1,
        activation='sigmoid',
        name='confidence'
    )(x)
    
    # Create model
    model = keras.Model(
        inputs=inputs,
        outputs=[direction_output, confidence_output],
        name='Transformer_LSTM_Hybrid'
    )
    
    return model


def compile_model(model, learning_rate=0.0001):
    """
    Compile model with appropriate loss functions and metrics
    
    Args:
        model: Keras model to compile
        learning_rate: Learning rate for Adam optimizer (default: 0.0001)
    
    Returns:
        Compiled model
    """
    
    # Optimizer
    optimizer = keras.optimizers.Adam(learning_rate=learning_rate)
    
    # Loss functions
    losses = {
        'direction': 'categorical_crossentropy',  # For classification
        'confidence': 'mse'  # For regression
    }
    
    # Loss weights (direction is more important)
    loss_weights = {
        'direction': 1.0,
        'confidence': 0.3
    }
    
    # Metrics
    metrics = {
        'direction': ['accuracy', keras.metrics.AUC(name='auc')],
        'confidence': ['mae', 'mse']
    }
    
    # Compile
    model.compile(
        optimizer=optimizer,
        loss=losses,
        loss_weights=loss_weights,
        metrics=metrics
    )
    
    return model


def create_callbacks(model_dir, patience=10, reduce_lr_patience=5):
    """
    Create training callbacks
    
    Args:
        model_dir: Directory to save model checkpoints
        patience: Early stopping patience (default: 10)
        reduce_lr_patience: ReduceLROnPlateau patience (default: 5)
    
    Returns:
        List of callbacks
    """
    from pathlib import Path
    
    model_path = Path(model_dir)
    model_path.mkdir(parents=True, exist_ok=True)
    
    callbacks = [
        # Save best model
        keras.callbacks.ModelCheckpoint(
            filepath=str(model_path / 'best_model.keras'),
            monitor='val_direction_accuracy',
            mode='max',
            save_best_only=True,
            verbose=1
        ),
        
        # Early stopping
        keras.callbacks.EarlyStopping(
            monitor='val_direction_accuracy',
            mode='max',
            patience=patience,
            restore_best_weights=True,
            verbose=1
        ),
        
        # Reduce learning rate
        keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=reduce_lr_patience,
            min_lr=1e-7,
            verbose=1
        ),
        
        # TensorBoard
        keras.callbacks.TensorBoard(
            log_dir=str(model_path / 'logs'),
            histogram_freq=1
        )
    ]
    
    return callbacks


# Example usage
if __name__ == '__main__':
    # Build model
    model = build_transformer_lstm_model(
        sequence_length=60,
        n_features=100,
        n_heads=8,
        ff_dim=256,
        lstm_units=[128, 64],
        dropout_rate=0.3
    )
    
    # Compile
    model = compile_model(model, learning_rate=0.0001)
    
    # Print summary
    model.summary()
    
    print("\n✅ Model created successfully!")
    print(f"   Total parameters: {model.count_params():,}")
    print(f"   Trainable parameters: {sum([tf.size(w).numpy() for w in model.trainable_weights]):,}")
