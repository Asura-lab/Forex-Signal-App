"""
Forex Signal Generator V10
7-Model Ensemble with Agreement Bonus
Best performing model: 85%+ threshold = 96.9% accuracy
"""

import os
import joblib
import numpy as np
import pandas as pd
import warnings
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime

# Suppress warnings
warnings.filterwarnings('ignore', message='.*feature names.*')
warnings.filterwarnings('ignore', category=UserWarning)

# Get the project root directory
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
V10_MODELS_DIR = os.path.join(PROJECT_ROOT, 'models', 'signal_generator_v10')


class ForexSignalGeneratorV10:
    """
    V10 Signal Generator with:
    - 7 diverse models (3 XGBoost, 2 LightGBM, 2 CatBoost)
    - Agreement bonus system (+7, +4, +2)
    - 85%+ confidence for ~97% accuracy
    - Dynamic SL/TP based on ATR
    """
    
    MODEL_NAMES = ['xgb1', 'xgb2', 'xgb3', 'lgb1', 'lgb2', 'cat1', 'cat2']
    
    def __init__(self, models_dir: str = None):
        """Load all V10 models and config"""
        self.models_dir = models_dir or V10_MODELS_DIR
        self.models = {}
        self.scaler = None
        self.feature_cols = None
        self.weights = None
        self.config = None
        self.is_loaded = False
        
    def load_models(self) -> bool:
        """Load all V10 models from disk"""
        try:
            # Load all 7 models
            for name in self.MODEL_NAMES:
                model_path = os.path.join(self.models_dir, f'{name}_v10.joblib')
                if os.path.exists(model_path):
                    self.models[name] = joblib.load(model_path)
                else:
                    print(f"[V10] Warning: {name} model not found")
            
            if len(self.models) < 5:
                print(f"[V10] Error: Only {len(self.models)} models loaded, need at least 5")
                return False
            
            # Load scaler and config
            self.scaler = joblib.load(os.path.join(self.models_dir, 'scaler_v10.joblib'))
            self.feature_cols = joblib.load(os.path.join(self.models_dir, 'feature_cols_v10.joblib'))
            self.weights = joblib.load(os.path.join(self.models_dir, 'weights_v10.joblib'))
            self.config = joblib.load(os.path.join(self.models_dir, 'config_v10.joblib'))
            
            self.is_loaded = True
            print(f"[V10] Models loaded successfully from {self.models_dir}")
            print(f"[V10] Features: {len(self.feature_cols)}")
            print(f"[V10] Models: {list(self.models.keys())}")
            return True
            
        except Exception as e:
            print(f"[V10] Error loading models: {e}")
            self.is_loaded = False
            return False
    
    def calculate_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate all V10 technical indicator features
        """
        df = df.copy()
        df.columns = df.columns.str.lower()
        
        # Ensure time column
        if 'time' not in df.columns and 'timestamp' in df.columns:
            df['time'] = pd.to_datetime(df['timestamp'])
        elif 'time' in df.columns:
            df['time'] = pd.to_datetime(df['time'])
        
        # ==================== TIME FEATURES ====================
        df['hour'] = df['time'].dt.hour
        df['day_of_week'] = df['time'].dt.dayofweek
        df['is_london'] = ((df['hour'] >= 8) & (df['hour'] < 16)).astype(int)
        df['is_ny'] = ((df['hour'] >= 13) & (df['hour'] < 21)).astype(int)
        df['is_overlap'] = ((df['hour'] >= 13) & (df['hour'] < 16)).astype(int)
        
        # ==================== MOVING AVERAGES ====================
        for p in [5, 10, 20, 50, 200]:
            df[f'sma_{p}'] = df['close'].rolling(p).mean()
            df[f'ema_{p}'] = df['close'].ewm(span=p, adjust=False).mean()
        
        # ==================== RSI ====================
        delta = df['close'].diff()
        gain = delta.where(delta > 0, 0).rolling(14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
        rs = gain / (loss + 1e-10)
        df['rsi'] = 100 - (100 / (1 + rs))
        
        # ==================== MACD ====================
        ema12 = df['close'].ewm(span=12).mean()
        ema26 = df['close'].ewm(span=26).mean()
        df['macd'] = ema12 - ema26
        df['macd_signal'] = df['macd'].ewm(span=9).mean()
        df['macd_hist'] = df['macd'] - df['macd_signal']
        df['macd_momentum'] = df['macd_hist'] - df['macd_hist'].shift(3)
        
        # ==================== BOLLINGER BANDS ====================
        df['bb_mid'] = df['close'].rolling(20).mean()
        df['bb_std'] = df['close'].rolling(20).std()
        df['bb_upper'] = df['bb_mid'] + 2 * df['bb_std']
        df['bb_lower'] = df['bb_mid'] - 2 * df['bb_std']
        df['bb_width'] = (df['bb_upper'] - df['bb_lower']) / (df['bb_mid'] + 1e-10)
        
        # ==================== ADX ====================
        df['tr0'] = abs(df['high'] - df['low'])
        df['tr1'] = abs(df['high'] - df['close'].shift())
        df['tr2'] = abs(df['low'] - df['close'].shift())
        df['tr'] = df[['tr0', 'tr1', 'tr2']].max(axis=1)
        
        df['up_move'] = df['high'] - df['high'].shift()
        df['down_move'] = df['low'].shift() - df['low']
        
        df['plus_dm'] = np.where((df['up_move'] > df['down_move']) & (df['up_move'] > 0), df['up_move'], 0)
        df['minus_dm'] = np.where((df['down_move'] > df['up_move']) & (df['down_move'] > 0), df['down_move'], 0)
        
        period = 14
        df['atr'] = df['tr'].rolling(period).mean()
        df['plus_di'] = 100 * (pd.Series(df['plus_dm']).rolling(period).mean() / (df['atr'] + 1e-10))
        df['minus_di'] = 100 * (pd.Series(df['minus_dm']).rolling(period).mean() / (df['atr'] + 1e-10))
        df['dx'] = 100 * abs(df['plus_di'] - df['minus_di']) / (df['plus_di'] + df['minus_di'] + 1e-10)
        df['adx'] = df['dx'].rolling(period).mean()
        
        # ==================== CCI ====================
        tp = (df['high'] + df['low'] + df['close']) / 3
        sma_tp = tp.rolling(20).mean()
        std_tp = tp.rolling(20).std()
        df['cci'] = (tp - sma_tp) / (0.015 * std_tp + 1e-10)
        
        # ==================== WILLIAMS %R ====================
        hh = df['high'].rolling(14).max()
        ll = df['low'].rolling(14).min()
        df['williams_r'] = -100 * (hh - df['close']) / (hh - ll + 1e-10)
        
        # ==================== VOLATILITY ====================
        df['returns'] = df['close'].pct_change()
        df['volatility'] = df['returns'].rolling(20).std() * 100
        
        # ==================== V8 COMPOSITE FEATURES ====================
        df['rsi_x_adx'] = df['rsi'] * df['adx'] / 100
        df['momentum_score'] = (
            (df['rsi'] > 50).astype(int) + 
            (df['macd'] > df['macd_signal']).astype(int) + 
            (df['plus_di'] > df['minus_di']).astype(int)
        )
        df['price_position'] = (df['close'] - df['sma_50']) / (df['atr'] + 1e-10)
        df['trend_score'] = (
            (df['close'] > df['sma_20']).astype(int) +
            (df['sma_20'] > df['sma_50']).astype(int) +
            (df['sma_50'] > df['sma_200']).astype(int) +
            (df['adx'] > 25).astype(int)
        )
        df['rsi_zone'] = pd.cut(df['rsi'], bins=[0, 30, 45, 55, 70, 100], labels=[0, 1, 2, 3, 4]).astype(float)
        df['close_vs_high'] = (df['high'].rolling(20).max() - df['close']) / (df['atr'] + 1e-10)
        df['close_vs_low'] = (df['close'] - df['low'].rolling(20).min()) / (df['atr'] + 1e-10)
        df['volume_ratio'] = 1.0  # Placeholder if no volume
        
        # ==================== V10 NEW FEATURES ====================
        # Trend Strength (0-5)
        df['trend_strength'] = (
            (df['close'] > df['ema_5']).astype(int) +
            (df['ema_5'] > df['ema_10']).astype(int) +
            (df['ema_10'] > df['ema_20']).astype(int) +
            (df['ema_20'] > df['ema_50']).astype(int) +
            (df['adx'] > 20).astype(int)
        )
        
        # Momentum Alignment (0-4)
        df['momentum_alignment'] = (
            (df['rsi'] > 55).astype(int) +
            (df['macd_hist'] > 0).astype(int) +
            (df['cci'] > 50).astype(int) +
            (df['williams_r'] > -30).astype(int)
        )
        
        # Volatility State
        df['volatility_sma'] = df['volatility'].rolling(50).mean()
        df['volatility_state'] = np.where(
            df['volatility'] > df['volatility_sma'] * 1.5, 2,
            np.where(df['volatility'] < df['volatility_sma'] * 0.5, 0, 1)
        )
        
        # Price Action Patterns
        df['body'] = df['close'] - df['open']
        df['upper_wick'] = df['high'] - df[['open', 'close']].max(axis=1)
        df['lower_wick'] = df[['open', 'close']].min(axis=1) - df['low']
        df['body_ratio'] = abs(df['body']) / (df['high'] - df['low'] + 1e-10)
        df['is_bullish'] = (df['close'] > df['open']).astype(int)
        df['bullish_streak'] = df['is_bullish'].rolling(5).sum()
        
        # Support/Resistance proximity
        df['dist_to_high20'] = (df['high'].rolling(20).max() - df['close']) / (df['atr'] + 1e-10)
        df['dist_to_low20'] = (df['close'] - df['low'].rolling(20).min()) / (df['atr'] + 1e-10)
        
        # Multi-timeframe RSI
        df['rsi_5'] = df['rsi'].rolling(5).mean()
        df['rsi_20'] = df['rsi'].rolling(20).mean()
        df['rsi_trend'] = df['rsi_5'] - df['rsi_20']
        
        # Breakout Detection
        df['above_bb_upper'] = (df['close'] > df['bb_upper']).astype(int)
        df['below_bb_lower'] = (df['close'] < df['bb_lower']).astype(int)
        df['bb_breakout'] = df['above_bb_upper'] - df['below_bb_lower']
        
        # Price Change
        df['price_change_5'] = (df['close'] - df['close'].shift(5)) / (df['atr'] + 1e-10)
        df['price_change_10'] = (df['close'] - df['close'].shift(10)) / (df['atr'] + 1e-10)
        df['price_change_20'] = (df['close'] - df['close'].shift(20)) / (df['atr'] + 1e-10)
        
        # Session Quality
        df['session_quality'] = df['is_london'].astype(int) + df['is_ny'].astype(int) + df['is_overlap'].astype(int) * 2
        
        # Cleanup temp columns
        drop_cols = ['tr0', 'tr1', 'tr2', 'tr', 'up_move', 'down_move', 'plus_dm', 'minus_dm']
        df.drop(columns=[c for c in drop_cols if c in df.columns], inplace=True)
        
        return df
    
    def prepare_features(self, df: pd.DataFrame) -> Optional[Tuple[np.ndarray, pd.DataFrame]]:
        """Prepare features for prediction"""
        try:
            # Calculate all features
            df_features = self.calculate_features(df)
            
            # Add missing columns
            for col in self.feature_cols:
                if col not in df_features.columns:
                    df_features[col] = 0
            
            # Get last row for prediction
            df_clean = df_features.dropna(subset=self.feature_cols)
            if len(df_clean) == 0:
                print("[V10] No valid data after dropna")
                return None
            
            X = df_clean[self.feature_cols].values
            X_scaled = self.scaler.transform(X)
            
            return X_scaled, df_clean
            
        except Exception as e:
            print(f"[V10] Feature preparation error: {e}")
            return None
    
    def predict_with_ensemble(self, X_scaled: np.ndarray) -> Dict[str, Any]:
        """
        Get predictions from all 7 models with agreement bonus
        """
        predictions = {}
        probabilities = {}
        
        for name, model in self.models.items():
            try:
                predictions[name] = model.predict(X_scaled)
                probabilities[name] = model.predict_proba(X_scaled)
            except Exception as e:
                print(f"[V10] {name} prediction error: {e}")
        
        if not probabilities:
            return None
        
        # Weighted ensemble probability
        first_model = list(probabilities.keys())[0]
        final_proba = np.zeros_like(probabilities[first_model])
        
        for name in probabilities.keys():
            w = self.weights.get(name, 1/len(probabilities))
            final_proba += w * probabilities[name]
        
        buy_prob = final_proba[:, 1] * 100
        
        # Model agreement analysis
        all_preds = np.array([predictions[name] for name in predictions.keys()])
        buy_votes = np.sum(all_preds == 1, axis=0)
        n_models = len(predictions)
        
        # Agreement bonus (V10: 7 models)
        confidence = buy_prob.copy()
        all_agree = buy_votes == n_models
        strong_agree = buy_votes >= (n_models - 1)  # 6+/7
        majority_agree = buy_votes >= (n_models - 2)  # 5+/7
        
        confidence[all_agree] = np.minimum(confidence[all_agree] + 7, 100)
        confidence[strong_agree & ~all_agree] = np.minimum(confidence[strong_agree & ~all_agree] + 4, 100)
        confidence[majority_agree & ~strong_agree] = np.minimum(confidence[majority_agree & ~strong_agree] + 2, 100)
        
        return {
            'confidence': confidence,
            'buy_prob': buy_prob,
            'buy_votes': buy_votes,
            'n_models': n_models,
            'model_probs': {name: probabilities[name][:, 1] * 100 for name in probabilities.keys()}
        }
    
    def generate_signal(self, df: pd.DataFrame, min_confidence: float = 85.0) -> Dict[str, Any]:
        """
        Generate trading signal from OHLCV data
        
        Args:
            df: DataFrame with OHLCV data (minimum 250 rows needed)
            min_confidence: Minimum confidence threshold (default 85% for V10)
        
        Returns:
            Signal dictionary with entry, SL, TP, confidence
        """
        if not self.is_loaded:
            return {"error": "Models not loaded", "signal": "HOLD"}
        
        if len(df) < 250:
            return {"error": f"Need at least 250 rows, got {len(df)}", "signal": "HOLD"}
        
        try:
            # Prepare features
            result = self.prepare_features(df)
            if result is None:
                return {"error": "Feature preparation failed", "signal": "HOLD"}
            
            X_scaled, df_features = result
            
            # Get ensemble predictions
            ensemble_result = self.predict_with_ensemble(X_scaled)
            if ensemble_result is None:
                return {"error": "All models failed", "signal": "HOLD"}
            
            # Get last row values
            last_idx = -1
            confidence = float(ensemble_result['confidence'][last_idx])
            buy_prob = float(ensemble_result['buy_prob'][last_idx])
            buy_votes = int(ensemble_result['buy_votes'][last_idx])
            n_models = ensemble_result['n_models']
            
            # Get current price data
            last_row = df_features.iloc[last_idx]
            current_price = float(last_row['close'])
            atr = float(last_row.get('atr', 0.0010))
            
            # Convert ATR to pips
            atr_pips = atr * 10000
            
            # Model probabilities for response
            model_probs = {
                name: round(float(probs[last_idx]), 2) 
                for name, probs in ensemble_result['model_probs'].items()
            }
            
            # Generate signal based on confidence
            if confidence >= min_confidence:
                # BUY signal
                signal_type = "BUY"
                
                # Dynamic SL/TP based on ATR
                sl_multiplier = 1.5
                tp_multiplier = 2.5
                
                sl_pips = round(atr_pips * sl_multiplier, 1)
                tp_pips = round(atr_pips * tp_multiplier, 1)
                
                # Ensure minimum SL/TP
                sl_pips = max(sl_pips, 10.0)
                tp_pips = max(tp_pips, 15.0)
                
                stop_loss = current_price - (sl_pips / 10000)
                take_profit = current_price + (tp_pips / 10000)
                risk_reward = round(tp_pips / sl_pips, 2)
                
                return {
                    "signal": signal_type,
                    "confidence": round(confidence, 2),
                    "entry_price": round(current_price, 5),
                    "stop_loss": round(stop_loss, 5),
                    "take_profit": round(take_profit, 5),
                    "sl_pips": sl_pips,
                    "tp_pips": tp_pips,
                    "risk_reward": f"1:{risk_reward}",
                    "atr_pips": round(atr_pips, 2),
                    "buy_votes": f"{buy_votes}/{n_models}",
                    "model_probabilities": model_probs,
                    "timestamp": datetime.now().isoformat(),
                    "model_version": "V10",
                    "min_confidence_used": min_confidence
                }
            
            elif confidence <= (100 - min_confidence):
                # SELL signal (low buy confidence = high sell confidence)
                signal_type = "SELL"
                sell_confidence = 100 - confidence
                
                sl_multiplier = 1.5
                tp_multiplier = 2.5
                
                sl_pips = round(atr_pips * sl_multiplier, 1)
                tp_pips = round(atr_pips * tp_multiplier, 1)
                
                sl_pips = max(sl_pips, 10.0)
                tp_pips = max(tp_pips, 15.0)
                
                # SELL: SL above, TP below
                stop_loss = current_price + (sl_pips / 10000)
                take_profit = current_price - (tp_pips / 10000)
                risk_reward = round(tp_pips / sl_pips, 2)
                
                return {
                    "signal": signal_type,
                    "confidence": round(sell_confidence, 2),
                    "entry_price": round(current_price, 5),
                    "stop_loss": round(stop_loss, 5),
                    "take_profit": round(take_profit, 5),
                    "sl_pips": sl_pips,
                    "tp_pips": tp_pips,
                    "risk_reward": f"1:{risk_reward}",
                    "atr_pips": round(atr_pips, 2),
                    "buy_votes": f"{buy_votes}/{n_models}",
                    "model_probabilities": model_probs,
                    "timestamp": datetime.now().isoformat(),
                    "model_version": "V10",
                    "min_confidence_used": min_confidence
                }
            
            else:
                # HOLD - no confident signal
                return {
                    "signal": "HOLD",
                    "confidence": round(confidence, 2),
                    "entry_price": round(current_price, 5),
                    "reason": f"Confidence ({confidence:.1f}%) between {100-min_confidence:.0f}%-{min_confidence:.0f}%",
                    "atr_pips": round(atr_pips, 2),
                    "buy_votes": f"{buy_votes}/{n_models}",
                    "model_probabilities": model_probs,
                    "timestamp": datetime.now().isoformat(),
                    "model_version": "V10",
                    "min_confidence_used": min_confidence
                }
                
        except Exception as e:
            import traceback
            traceback.print_exc()
            return {"error": str(e), "signal": "HOLD"}


# Singleton instance
_generator_v10 = None

def get_signal_generator_v10() -> ForexSignalGeneratorV10:
    """Get or create V10 signal generator singleton"""
    global _generator_v10
    if _generator_v10 is None:
        _generator_v10 = ForexSignalGeneratorV10()
        _generator_v10.load_models()
    return _generator_v10


if __name__ == "__main__":
    # Test
    generator = ForexSignalGeneratorV10()
    if generator.load_models():
        print("\n✅ V10 Signal Generator Ready")
        print(f"   Models: {list(generator.models.keys())}")
        print(f"   Features: {len(generator.feature_cols)}")
    else:
        print("\n❌ Failed to load V10 models")
