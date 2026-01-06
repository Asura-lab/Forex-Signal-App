import subprocess
import os
from pathlib import Path
import pandas as pd
from datetime import datetime

# Configuration
PAIR = "EURUSD"
TIMEFRAMES = ["m1", "m5", "m15", "m30", "h1", "h4"]
START_DATE = "2015-01-01"
END_DATE = "2023-12-31" # Get everything up to now
DATA_DIR = Path("data/train")
DATA_DIR.mkdir(parents=True, exist_ok=True)

def download_data(timeframe):
    print(f"Downloading {PAIR} {timeframe} data from {START_DATE} to {END_DATE}...")
    
    output_file = DATA_DIR / f"{PAIR}_{timeframe}.csv"
    
    # Dukascopy-node command
    # npx dukascopy-node -i eurusd -t m1 -from 2015-01-01 -to 2025-12-31 -f csv -v true
    cmd = [
        "npx", "dukascopy-node",
        "-i", PAIR.lower(),
        "-t", timeframe,
        "-from", START_DATE,
        "-to", END_DATE,
        "-f", "csv",
        "-v", "true", # Include volume
        "-dir", str(DATA_DIR),
        "-fn", f"{PAIR}_{timeframe}"
    ]
    
    try:
        # Run the command
        subprocess.run(cmd, check=True, shell=True)
        
        # Check for file with .csv extension (dukascopy-node adds it)
        expected_file = DATA_DIR / f"{PAIR}_{timeframe}.csv"
        
        if expected_file.exists():
            print(f"✅ Successfully downloaded {expected_file}")
            df = pd.read_csv(expected_file)
            # Dukascopy format usually: time, open, high, low, close, volume
            # We want: time, open, high, low, close, tick_volume (or volume)
            
            # Rename columns if needed (dukascopy-node csv headers are usually lowercase)
            # Standardize column names
            df.columns = [c.lower() for c in df.columns]
            
            if 'timestamp' in df.columns:
                df.rename(columns={'timestamp': 'time'}, inplace=True)
            
            # Convert time to datetime if it's not
            # Dukascopy-node usually saves as ms timestamp or string depending on options. 
            # Let's check content later. Assuming standard CSV output.
            
            # Save back
            df.to_csv(output_file, index=False)
            print(f"✅ Processed {output_file}")
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Error downloading {timeframe}: {e}")

def main():
    print("🚀 Starting Dukascopy Data Download...")
    print(f"Pair: {PAIR}")
    print(f"Range: {START_DATE} - {END_DATE}")
    
    for tf in TIMEFRAMES:
        download_data(tf)
        
    print("\n🎉 All downloads complete!")
    print(f"Data saved to: {DATA_DIR.absolute()}")

if __name__ == "__main__":
    main()