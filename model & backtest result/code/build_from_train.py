"""Build dataset from pre-processed train data"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import pandas as pd

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from config import LABEL_HORIZON_MIN, LABEL_THRESHOLD_PIPS, PROCESSED_DIR

TRAIN_DIR = ROOT_DIR / "data" / "train"


def pip_size(symbol: str) -> float:
    return 0.0001 if "JPY" not in symbol.upper() else 0.01


def rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.rolling(period).mean()
    avg_loss = loss.rolling(period).mean()
    rs = avg_gain / (avg_loss + 1e-9)
    return 100 - (100 / (1 + rs))


def atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    high = df["high"]
    low = df["low"]
    close = df["close"]
    tr = pd.concat(
        [(high - low), (high - close.shift()).abs(), (low - close.shift()).abs()],
        axis=1,
    ).max(axis=1)
    return tr.rolling(period).mean()


def compute_features(df: pd.DataFrame, suffix: str) -> pd.DataFrame:
    """Compute features for a given timeframe dataframe"""
    close = df["close"]
    
    feats = pd.DataFrame(index=df.index)
    feats[f"close_{suffix}"] = close
    feats[f"rsi_{suffix}"] = rsi(close, 14)
    feats[f"atr_{suffix}"] = atr(df, 14)
    feats[f"ma_5_{suffix}"] = close.rolling(5).mean()
    feats[f"ma_20_{suffix}"] = close.rolling(20).mean()
    feats[f"ma_50_{suffix}"] = close.rolling(50).mean()
    feats[f"volatility_{suffix}"] = close.rolling(20).std()
    feats[f"returns_{suffix}"] = close.pct_change()
    
    return feats


def build_dataset_from_train(symbol: str) -> Path:
    print(f"\n{'='*60}")
    print(f"Building Dataset from Train Data: {symbol}")
    print(f"{'='*60}\n")
    
    # Load M1 as base
    m1_path = TRAIN_DIR / f"{symbol}_m1.csv"
    print(f"Loading M1 (base): {m1_path}")
    df_base = pd.read_csv(m1_path, parse_dates=["time"])
    print(f"  Rows: {len(df_base):,}")
    
    # Compute M1 features
    print("Computing M1 features...")
    df = compute_features(df_base, "1min")
    df["time"] = df_base["time"]
    
    # Load and merge other timeframes
    timeframe_map = {
        "m5": "5min",
        "m15": "15min",
        "m30": "30min",
        "h1": "1H",
        "h4": "4H",
    }
    
    for tf_code, tf_name in timeframe_map.items():
        tf_path = TRAIN_DIR / f"{symbol}_{tf_code}.csv"
        if not tf_path.exists():
            print(f"  Skipping {tf_name} (not found)")
            continue
        
        print(f"Loading {tf_name}: {tf_path}")
        df_tf = pd.read_csv(tf_path, parse_dates=["time"])
        print(f"  Rows: {len(df_tf):,}")
        
        # Compute features
        feats_tf = compute_features(df_tf, tf_name)
        feats_tf["time"] = df_tf["time"]
        
        # Merge with M1 (forward fill)
        print(f"  Merging {tf_name} with M1...")
        df = pd.merge_asof(
            df.sort_values("time"),
            feats_tf.sort_values("time"),
            on="time",
            direction="backward"
        )
    
    print(f"\nDataset shape after all merges: {df.shape}")
    
    # Generate labels using vectorized operations (much faster!)
    print(f"\nGenerating labels (horizon={LABEL_HORIZON_MIN}min, threshold={LABEL_THRESHOLD_PIPS} pips)...")
    
    pips = pip_size(symbol)
    
    # Calculate future highs and lows efficiently
    df_base_sorted = df_base.sort_values("time").reset_index(drop=True)
    
    # Use rolling window on reversed data to get future values
    future_high = df_base_sorted["high"].iloc[::-1].rolling(LABEL_HORIZON_MIN).max().iloc[::-1]
    future_low = df_base_sorted["low"].iloc[::-1].rolling(LABEL_HORIZON_MIN).min().iloc[::-1]
    current_price = df_base_sorted["close"]
    
    up_pips = (future_high - current_price) / pips
    down_pips = (current_price - future_low) / pips
    
    # Vectorized label assignment
    labels = pd.Series(0, index=df_base_sorted.index)
    labels[(up_pips >= LABEL_THRESHOLD_PIPS) & (up_pips > down_pips * 1.5)] = 1  # BUY
    labels[(down_pips >= LABEL_THRESHOLD_PIPS) & (down_pips > up_pips * 1.5)] = -1  # SELL
    
    # Align labels with merged dataset
    df_with_time = df.copy()
    df_with_time["time"] = df_base["time"].values
    df_base_sorted["target"] = labels
    
    # Merge labels back
    df = pd.merge(df, df_base_sorted[["time", "target"]], on="time", how="left")
    df["target"] = df["target"].fillna(0).astype(int)
    
    # Remove NaNs
    print(f"Rows before dropna: {len(df):,}")
    df = df.dropna()
    print(f"Rows after dropna: {len(df):,}")
    
    # Label distribution
    buy_count = (df["target"] == 1).sum()
    sell_count = (df["target"] == -1).sum()
    neutral_count = (df["target"] == 0).sum()
    
    print(f"\nLabel Distribution:")
    print(f"  BUY:     {buy_count:,} ({buy_count/len(df)*100:.1f}%)")
    print(f"  SELL:    {sell_count:,} ({sell_count/len(df)*100:.1f}%)")
    print(f"  NEUTRAL: {neutral_count:,} ({neutral_count/len(df)*100:.1f}%)")
    
    # Save
    out_path = PROCESSED_DIR / f"{symbol}_dataset.pkl"
    
    print(f"\nSaving dataset:")
    print(f"  PKL:  {out_path}")
    df.to_pickle(out_path)
    
    print(f"\n✓ Dataset built successfully!")
    print(f"  Final shape: {df.shape}")
    print(f"  Size: {out_path.stat().st_size / 1024 / 1024:.1f} MB")
    
    return out_path


if __name__ == "__main__":
    build_dataset_from_train("EURUSD")
