import MetaTrader5 as mt5
import pandas as pd
import time
import sys
import os
from datetime import datetime
from pathlib import Path

# Add backend to path to import signal generator
sys.path.append(str(Path(__file__).resolve().parent / 'backend'))

from ml.signal_generator_v2 import ForexSignalGeneratorV2

# --- CONFIGURATION ---
SYMBOL = "EURUSD"
TIMEFRAME = mt5.TIMEFRAME_M1
LOT_SIZE = 0.1
DEVIATION = 20
MAGIC_NUMBER = 234000

# Initialize Signal Generator
print("Loading V2 Models...")
generator = ForexSignalGeneratorV2()
if not generator.load_models():
    print("Failed to load models. Exiting.")
    sys.exit(1)
print("V2 Models Loaded Successfully.")

def get_mt5_data(symbol, timeframe, n=500):
    """Fetch data from MT5 and convert to DataFrame compatible with V2"""
    rates = mt5.copy_rates_from_pos(symbol, timeframe, 0, n)
    if rates is None:
        print(f"Failed to get rates for {symbol}")
        return None
    
    df = pd.DataFrame(rates)
    df['time'] = pd.to_datetime(df['time'], unit='s')
    
    # Rename columns to match V2 requirements
    # MT5 columns: time, open, high, low, close, tick_volume, spread, real_volume
    # V2 expects: time, open, high, low, close, volume (tick_volume is usually used for forex)
    df.rename(columns={'tick_volume': 'volume'}, inplace=True)
    
    return df[['time', 'open', 'high', 'low', 'close', 'volume']]

def execute_trade(signal, symbol, lot, deviation, magic):
    """Execute trade on MT5"""
    action = signal['signal'] # 'BUY'
    sl = signal['stop_loss']
    tp = signal['take_profit']
    price = mt5.symbol_info_tick(symbol).ask
    
    request = {
        "action": mt5.TRADE_ACTION_DEAL,
        "symbol": symbol,
        "volume": lot,
        "type": mt5.ORDER_TYPE_BUY if action == 'BUY' else mt5.ORDER_TYPE_SELL,
        "price": price,
        "sl": sl,
        "tp": tp,
        "deviation": deviation,
        "magic": magic,
        "comment": "V2 ML Signal",
        "type_time": mt5.ORDER_TIME_GTC,
        "type_filling": mt5.ORDER_FILLING_IOC,
    }
    
    # Check if we already have a position
    positions = mt5.positions_get(symbol=symbol)
    if positions and len(positions) > 0:
        print(f"Position already exists for {symbol}. Skipping.")
        return None

    print(f"Sending Order: {action} {symbol} @ {price} SL={sl} TP={tp}")
    result = mt5.order_send(request)
    return result

def main():
    # Initialize MT5
    if not mt5.initialize():
        print("initialize() failed, error code =", mt5.last_error())
        quit()
    
    print(f"Connected to MT5: {mt5.terminal_info().name}")
    print(f"Trading {SYMBOL} on M1 timeframe with V2 Model")
    
    try:
        while True:
            # 1. Get Data
            df = get_mt5_data(SYMBOL, TIMEFRAME)
            
            if df is not None:
                # 2. Generate Signal
                # V2 uses 80% confidence by default
                signal = generator.generate_signal(df, min_confidence=80.0)
                
                current_time = datetime.now().strftime("%H:%M:%S")
                
                if signal and signal['signal'] == 'BUY':
                    print(f"[{current_time}] 🟢 SIGNAL FOUND: BUY | Conf: {signal['confidence']:.1f}%")
                    
                    # 3. Execute Trade
                    result = execute_trade(signal, SYMBOL, LOT_SIZE, DEVIATION, MAGIC_NUMBER)
                    if result.retcode != mt5.TRADE_RETCODE_DONE:
                        print("Order failed, retcode={}".format(result.retcode))
                    else:
                        print("Order executed successfully!")
                else:
                    # Print status every minute
                    last_close = df['close'].iloc[-1]
                    print(f"[{current_time}] No Signal. Close: {last_close:.5f}", end='\r')
            
            # Wait for next candle (approximate)
            time.sleep(60)
            
    except KeyboardInterrupt:
        print("\nStopping Bot...")
        mt5.shutdown()

if __name__ == "__main__":
    main()
