import MetaTrader5 as mt5
import pandas as pd
from datetime import datetime
import pytz

class MT5Handler:
    def __init__(self):
        self.initialized = False
        
    def connect(self):
        """Connect to the MetaTrader 5 terminal"""
        if not mt5.initialize():
            print("initialize() failed, error code =", mt5.last_error())
            return False
        
        self.initialized = True
        print(f"MT5 Initialized. Version: {mt5.version()}")
        return True

    def get_data(self, symbol, timeframe, n_bars=1000):
        """
        Get historical data from MT5
        
        symbol: e.g. "EURUSD"
        timeframe: e.g. mt5.TIMEFRAME_H1
        n_bars: number of bars to retrieve
        """
        if not self.initialized:
            if not self.connect():
                return None

        # Check if symbol exists
        info = mt5.symbol_info(symbol)
        if info is None:
            print(f"{symbol} not found")
            return None
            
        # Get rates
        rates = mt5.copy_rates_from_pos(symbol, timeframe, 0, n_bars)
        
        if rates is None:
            print(f"Failed to get rates for {symbol}")
            return None
            
        # Create DataFrame
        df = pd.DataFrame(rates)
        df['time'] = pd.to_datetime(df['time'], unit='s')
        
        return df

    def shutdown(self):
        """Shutdown MT5 connection"""
        mt5.shutdown()
        self.initialized = False
