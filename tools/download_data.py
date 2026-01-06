import yfinance as yf
import pandas as pd
import os
from pathlib import Path

# Paths
BASE_DIR = Path(r'c:\Users\Acer\Desktop\Forex-Signal-App')
DATA_DIR = BASE_DIR / 'data'
DATA_DIR.mkdir(parents=True, exist_ok=True)

print(f"Saving data to: {DATA_DIR}")

# 1. Download Daily Data (2000 - Present)
print("Downloading Daily Data (2000-2025)...")
try:
    df_daily = yf.download("EURUSD=X", start="2000-01-01", end="2025-12-31", interval="1d")
    
    # Clean up MultiIndex columns if present
    if isinstance(df_daily.columns, pd.MultiIndex):
        df_daily.columns = df_daily.columns.get_level_values(0)
        
    df_daily.columns = df_daily.columns.str.lower()
    if 'adj close' in df_daily.columns:
        df_daily = df_daily.drop(columns=['adj close'])
        
    print(f"Daily Data: {len(df_daily):,} rows")
    df_daily.to_csv(DATA_DIR / "EUR_USD_1d_2000_2025.csv")
    print("Saved Daily data.")
except Exception as e:
    print(f"Error downloading daily data: {e}")

# 2. Download Hourly Data (Max available ~730 days)
print("\nDownloading Hourly Data (Last 730 days)...")
try:
    df_hourly = yf.download("EURUSD=X", period="730d", interval="1h")
    
    # Clean up MultiIndex columns if present
    if isinstance(df_hourly.columns, pd.MultiIndex):
        df_hourly.columns = df_hourly.columns.get_level_values(0)
        
    df_hourly.columns = df_hourly.columns.str.lower()
    if 'adj close' in df_hourly.columns:
        df_hourly = df_hourly.drop(columns=['adj close'])

    print(f"Hourly Data: {len(df_hourly):,} rows")
    df_hourly.to_csv(DATA_DIR / "EUR_USD_1h_recent.csv")
    print("Saved Hourly data.")
except Exception as e:
    print(f"Error downloading hourly data: {e}")

# 3. Combine with Existing 1-Minute Data (if available)
csv_1min = DATA_DIR / 'EUR_USD_1min.csv'
if csv_1min.exists():
    print("\nResampling existing 1m data to 1h to extend history...")
    try:
        df_1m = pd.read_csv(csv_1min)
        if 'timestamp' in df_1m.columns:
            df_1m.rename(columns={'timestamp': 'time'}, inplace=True)
            
        df_1m['time'] = pd.to_datetime(df_1m['time'])
        df_1m.set_index('time', inplace=True)
        
        # Resample to 1h
        agg_dict = {
            'open': 'first',
            'high': 'max',
            'low': 'min',
            'close': 'last'
        }
        if 'tick_volume' in df_1m.columns:
            agg_dict['tick_volume'] = 'sum'
        elif 'volume' in df_1m.columns:
            agg_dict['volume'] = 'sum'
            
        df_1h_resampled = df_1m.resample('1h').agg(agg_dict).dropna()
        
        print(f"Resampled 1h Data: {len(df_1h_resampled):,} rows")
        print(f"Range: {df_1h_resampled.index.min()} to {df_1h_resampled.index.max()}")
        
        df_1h_resampled.to_csv(DATA_DIR / "EUR_USD_1h_2019_2024.csv")
        print("Saved Resampled 1h data.")
    except Exception as e:
        print(f"Error resampling data: {e}")
else:
    print("Existing 1m data not found.")