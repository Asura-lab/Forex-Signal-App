"""
Forex Signal Generator V2
BUY-only mode with 80% confidence threshold
Dynamic SL/TP based on ATR
"""

import os
import joblib
import numpy as np
import pandas as pd
import warnings
from typing import Dict, Any, Optional, List
from datetime import datetime

# Suppress sklearn/lightgbm feature name warnings
warnings.filterwarnings('ignore', message='.*feature names.*')
warnings.filterwarnings('ignore', category=UserWarning)

# Get the project root directory
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
V2_MODELS_DIR = os.path.join(PROJECT_ROOT, 'models', 'signal_generator_v2')


class ForexSignalGeneratorV2:
    """
    V2 Signal Generator with:
    - BUY-only mode (SELL signals have low accuracy)
    - 80%+ confidence for 80% accuracy
    - Dynamic SL/TP based on ATR
    """
    
    def __init__(self, models_dir: str = None):
        """Load all V2 models and config"""
        self.models_dir = models_dir or V2_MODELS_DIR
        self.models = {}
        self.scaler = None
        self.feature_cols = None
        self.config = None
        self.is_loaded = False
        
    def load_models(self) -> bool:
        """Load all V2 models from disk"""
        try:
            # Load models with joblib
            self.models['xgboost'] = joblib.load(os.path.join(self.models_dir, 'xgboost_v2.joblib'))
            self.models['lightgbm'] = joblib.load(os.path.join(self.models_dir, 'lightgbm_v2.joblib'))
            self.models['rf'] = joblib.load(os.path.join(self.models_dir, 'rf_v2.joblib'))
            
            # Load scaler and config
            self.scaler = joblib.load(os.path.join(self.models_dir, 'scaler_v2.joblib'))
            self.feature_cols = joblib.load(os.path.join(self.models_dir, 'feature_cols_v2.joblib'))
            self.config = joblib.load(os.path.join(self.models_dir, 'config_v2.joblib'))
            
            self.is_loaded = True
            print(f"[V2] Models loaded successfully from {self.models_dir}")
            print(f"[V2] Features: {len(self.feature_cols)}")
            print(f"[V2] Models: {list(self.models.keys())}")
            return True
            
        except Exception as e:
            print(f"[V2] Error loading models: {e}")
            self.is_loaded = False
            return False
    
    def calculate_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate all 70 technical indicator features for V2 model
        MUST match exactly the features used during training in forex_signal_v2.ipynb
        """
        df = df.copy()
        
        # Ensure column names are lowercase
        df.columns = df.columns.str.lower()
        
        # ==================== TREND INDICATORS ====================
        # Moving Averages
        for period in [5, 10, 20, 50, 100, 200]:
            df[f'sma_{period}'] = df['close'].rolling(period).mean()
            df[f'ema_{period}'] = df['close'].ewm(span=period, adjust=False).mean()
        
        # MA Crossovers - BUY signals
        df['sma_5_20_cross'] = (df['sma_5'] > df['sma_20']).astype(int)
        df['sma_20_50_cross'] = (df['sma_20'] > df['sma_50']).astype(int)
        df['ema_10_50_cross'] = (df['ema_10'] > df['ema_50']).astype(int)
        df['golden_cross'] = (df['sma_50'] > df['sma_200']).astype(int)
        
        # Price vs MAs
        df['price_vs_sma20'] = (df['close'] - df['sma_20']) / df['sma_20'] * 100
        df['price_vs_sma50'] = (df['close'] - df['sma_50']) / df['sma_50'] * 100
        df['price_vs_ema20'] = (df['close'] - df['ema_20']) / df['ema_20'] * 100
        df['price_above_all_ma'] = ((df['close'] > df['sma_20']) & 
                                     (df['close'] > df['sma_50']) & 
                                     (df['close'] > df['ema_20'])).astype(int)
        
        # ==================== MOMENTUM INDICATORS ====================
        # RSI
        for period in [7, 14, 21]:
            delta = df['close'].diff()
            gain = delta.where(delta > 0, 0).rolling(period).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(period).mean()
            rs = gain / (loss + 1e-10)
            df[f'rsi_{period}'] = 100 - (100 / (1 + rs))
        
        # RSI zones
        df['rsi_oversold'] = (df['rsi_14'] < 30).astype(int)
        df['rsi_bullish'] = ((df['rsi_14'] > 50) & (df['rsi_14'] < 70)).astype(int)
        
        # MACD
        ema12 = df['close'].ewm(span=12, adjust=False).mean()
        ema26 = df['close'].ewm(span=26, adjust=False).mean()
        df['macd'] = ema12 - ema26
        df['macd_signal'] = df['macd'].ewm(span=9, adjust=False).mean()
        df['macd_hist'] = df['macd'] - df['macd_signal']
        df['macd_cross'] = (df['macd'] > df['macd_signal']).astype(int)
        df['macd_bullish'] = ((df['macd'] > df['macd_signal']) & (df['macd_hist'] > 0)).astype(int)
        
        # Stochastic
        for period in [14, 21]:
            low_min = df['low'].rolling(period).min()
            high_max = df['high'].rolling(period).max()
            df[f'stoch_k_{period}'] = 100 * (df['close'] - low_min) / (high_max - low_min + 1e-10)
            df[f'stoch_d_{period}'] = df[f'stoch_k_{period}'].rolling(3).mean()
        
        df['stoch_oversold'] = (df['stoch_k_14'] < 20).astype(int)
        
        # ROC (Rate of Change)
        for period in [5, 10, 20]:
            df[f'roc_{period}'] = df['close'].pct_change(period) * 100
        
        # Momentum
        df['momentum_10'] = df['close'] - df['close'].shift(10)
        df['momentum_20'] = df['close'] - df['close'].shift(20)
        
        # ==================== VOLATILITY INDICATORS ====================
        # ATR
        high_low = df['high'] - df['low']
        high_close = abs(df['high'] - df['close'].shift())
        low_close = abs(df['low'] - df['close'].shift())
        tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        df['atr_14'] = tr.rolling(14).mean()
        df['atr_20'] = tr.rolling(20).mean()
        df['atr_pips'] = df['atr_14'] * 10000
        df['atr_pct'] = df['atr_14'] / df['close'] * 100
        
        # Bollinger Bands
        df['bb_middle'] = df['close'].rolling(20).mean()
        bb_std = df['close'].rolling(20).std()
        df['bb_upper'] = df['bb_middle'] + 2 * bb_std
        df['bb_lower'] = df['bb_middle'] - 2 * bb_std
        df['bb_width'] = (df['bb_upper'] - df['bb_lower']) / df['bb_middle'] * 100
        df['bb_position'] = (df['close'] - df['bb_lower']) / (df['bb_upper'] - df['bb_lower'] + 1e-10)
        df['bb_squeeze'] = (df['bb_width'] < df['bb_width'].rolling(50).mean()).astype(int)
        
        # ==================== CANDLE PATTERNS ====================
        df['candle_body'] = df['close'] - df['open']
        df['candle_range'] = df['high'] - df['low']
        df['candle_body_pct'] = df['candle_body'] / (df['candle_range'] + 1e-10)
        df['upper_shadow'] = df['high'] - df[['open', 'close']].max(axis=1)
        df['lower_shadow'] = df[['open', 'close']].min(axis=1) - df['low']
        
        # Bullish patterns
        df['is_bullish'] = (df['close'] > df['open']).astype(int)
        df['is_hammer'] = ((df['lower_shadow'] > df['candle_body'].abs() * 2) & 
                           (df['upper_shadow'] < df['candle_body'].abs() * 0.5)).astype(int)
        df['bullish_engulfing'] = ((df['is_bullish'] == 1) & 
                                   (df['is_bullish'].shift(1) == 0) &
                                   (df['close'] > df['open'].shift(1))).astype(int)
        
        # ==================== SUPPORT/RESISTANCE ====================
        df['pivot'] = (df['high'].shift() + df['low'].shift() + df['close'].shift()) / 3
        df['r1'] = 2 * df['pivot'] - df['low'].shift()
        df['s1'] = 2 * df['pivot'] - df['high'].shift()
        df['r2'] = df['pivot'] + (df['high'].shift() - df['low'].shift())
        df['s2'] = df['pivot'] - (df['high'].shift() - df['low'].shift())
        df['near_support'] = (df['close'] < df['s1'] * 1.001).astype(int)
        
        # ==================== TREND STRENGTH ====================
        df['trend_short'] = np.where(df['ema_10'] > df['ema_20'], 1, -1)
        df['trend_medium'] = np.where(df['ema_20'] > df['ema_50'], 1, -1)
        df['trend_long'] = np.where(df['ema_50'] > df['ema_200'], 1, -1)
        df['trend_alignment'] = df['trend_short'] + df['trend_medium'] + df['trend_long']
        df['strong_uptrend'] = (df['trend_alignment'] == 3).astype(int)
        
        # ==================== BUY SCORE ====================
        df['buy_score'] = (
            df['macd_bullish'] +
            df['rsi_bullish'] +
            df['sma_5_20_cross'] +
            df['golden_cross'] +
            df['price_above_all_ma'] +
            df['strong_uptrend']
        )
        
        return df
    
    def prepare_features(self, df: pd.DataFrame) -> Optional[np.ndarray]:
        """Prepare features for prediction using saved feature columns"""
        if not self.is_loaded:
            print("[ERROR] Models not loaded. Call load_models() first.")
            return None
        
        # Calculate features
        df_features = self.calculate_features(df)
        
        # Drop NaN rows
        df_features = df_features.dropna()
        
        if len(df_features) == 0:
            print("[ERROR] No valid data after feature calculation")
            return None
        
        # Check if all required features exist
        missing_cols = [col for col in self.feature_cols if col not in df_features.columns]
        if missing_cols:
            print(f"[WARN] Missing features: {missing_cols[:10]}...")
            # Add missing columns with 0
            for col in missing_cols:
                df_features[col] = 0
        
        # Select and order columns - keep as DataFrame with feature names
        X = df_features[self.feature_cols].copy()
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        # Convert back to DataFrame with feature names to avoid LightGBM warning
        X_scaled_df = pd.DataFrame(X_scaled, columns=self.feature_cols)
        
        return X_scaled_df, df_features
    
    def predict_proba(self, X_scaled: pd.DataFrame) -> Dict[str, float]:
        """Get prediction probabilities from all models"""
        probas = {}
        for name, model in self.models.items():
            try:
                proba = model.predict_proba(X_scaled)[-1]  # Last row
                probas[name] = {
                    'sell_prob': float(proba[0]),  # Class 0 = SELL
                    'buy_prob': float(proba[1])    # Class 1 = BUY
                }
            except Exception as e:
                print(f"[WARN] {name} prediction error: {e}")
        return probas
    
    def generate_signal(self, df: pd.DataFrame, min_confidence: float = 80.0) -> Dict[str, Any]:
        """
        Generate trading signal from OHLCV data
        
        Args:
            df: DataFrame with OHLCV data (최소 200 rows 필요)
            min_confidence: Minimum confidence threshold (default 80%)
        
        Returns:
            Signal dictionary with entry, SL, TP, confidence
        """
        if not self.is_loaded:
            return {"error": "Models not loaded", "signal": "HOLD"}
        
        if len(df) < 200:
            return {"error": f"Need at least 200 rows, got {len(df)}", "signal": "HOLD"}
        
        try:
            # Prepare features
            result = self.prepare_features(df)
            if result is None:
                return {"error": "Feature preparation failed", "signal": "HOLD"}
            
            X_scaled, df_features = result
            
            # Get predictions from all models
            probas = self.predict_proba(X_scaled)
            
            if not probas:
                return {"error": "All models failed", "signal": "HOLD"}
            
            # Calculate ensemble BUY probability
            buy_probs = [p['buy_prob'] for p in probas.values()]
            avg_buy_prob = np.mean(buy_probs) * 100
            
            # Get current price data
            last_row = df_features.iloc[-1]
            current_price = float(last_row['close'])
            atr = float(last_row.get('atr_14', 0.0010))  # Default ~10 pips
            
            # Convert ATR to pips (EUR/USD: 1 pip = 0.0001)
            atr_pips = atr * 10000
            
            # Check if models agree (all > 50% or all < 50%)
            models_agree = all(p > 50 for p in buy_probs) or all(p < 50 for p in buy_probs)
            
            # Generate signal
            if avg_buy_prob >= min_confidence:
                # BUY signal
                signal = "BUY"
                confidence = avg_buy_prob
                
                # Dynamic SL/TP based on ATR
                sl_multiplier = self.config.get('sl_multiplier', 1.5)
                tp_multiplier = self.config.get('tp_multiplier', 2.5)
                
                sl_pips = round(atr_pips * sl_multiplier, 1)
                tp_pips = round(atr_pips * tp_multiplier, 1)
                
                # Ensure minimum SL/TP
                sl_pips = max(sl_pips, 8.0)  # Minimum 8 pips SL
                tp_pips = max(tp_pips, 12.0)  # Minimum 12 pips TP
                
                stop_loss = current_price - (sl_pips / 10000)
                take_profit = current_price + (tp_pips / 10000)
                risk_reward = round(tp_pips / sl_pips, 2)
                
                return {
                    "signal": signal,
                    "confidence": round(confidence, 2),
                    "entry_price": round(current_price, 5),
                    "stop_loss": round(stop_loss, 5),
                    "take_profit": round(take_profit, 5),
                    "sl_pips": sl_pips,
                    "tp_pips": tp_pips,
                    "risk_reward": f"1:{risk_reward}",
                    "atr_pips": round(atr_pips, 2),
                    "models_agree": models_agree,
                    "model_probabilities": {
                        name: round(p['buy_prob'] * 100, 2) 
                        for name, p in probas.items()
                    },
                    "timestamp": datetime.now().isoformat(),
                    "min_confidence_used": min_confidence
                }
            else:
                # HOLD - no confident signal
                return {
                    "signal": "HOLD",
                    "confidence": round(avg_buy_prob, 2),
                    "entry_price": round(current_price, 5),
                    "reason": f"BUY confidence ({avg_buy_prob:.1f}%) below threshold ({min_confidence}%)",
                    "atr_pips": round(atr_pips, 2),
                    "models_agree": models_agree,
                    "model_probabilities": {
                        name: round(p['buy_prob'] * 100, 2) 
                        for name, p in probas.items()
                    },
                    "timestamp": datetime.now().isoformat(),
                    "min_confidence_used": min_confidence
                }
                
        except Exception as e:
            return {"error": str(e), "signal": "HOLD"}


# Global instance for reuse
_signal_generator = None


def get_signal_generator() -> ForexSignalGeneratorV2:
    """Get or create signal generator instance"""
    global _signal_generator
    if _signal_generator is None:
        _signal_generator = ForexSignalGeneratorV2()
        _signal_generator.load_models()
    return _signal_generator


def generate_signal_from_rates(rates: List[Dict], min_confidence: float = 80.0) -> Dict[str, Any]:
    """
    Generate signal from rate data (from UniRate API or MT5)
    
    Args:
        rates: List of rate dictionaries with time, open, high, low, close, volume
        min_confidence: Minimum confidence threshold
    
    Returns:
        Signal dictionary
    """
    if not rates or len(rates) < 200:
        return {
            "error": f"Need at least 200 rates, got {len(rates) if rates else 0}",
            "signal": "HOLD"
        }
    
    # Convert to DataFrame
    df = pd.DataFrame(rates)
    
    # Ensure required columns
    required = ['open', 'high', 'low', 'close']
    for col in required:
        if col not in df.columns:
            # Try uppercase
            if col.upper() in df.columns:
                df[col] = df[col.upper()]
            else:
                return {"error": f"Missing required column: {col}", "signal": "HOLD"}
    
    # Add volume if missing
    if 'volume' not in df.columns:
        df['volume'] = 0
    
    # Get signal
    generator = get_signal_generator()
    return generator.generate_signal(df, min_confidence)
