# -*- coding: utf-8 -*-
"""
MT5 (MetaTrader 5) Integration Utility
Бодит цагийн ханшийн өгөгдөл татах
"""

import MetaTrader5 as mt5
import pandas as pd
from datetime import datetime, timedelta
import numpy as np

class MT5Handler:
    """MetaTrader 5 холболт ба өгөгдөл татах class"""
    
    def __init__(self):
        self.connected = False
        self.account_info = None
        
    def connect(self, login=None, password=None, server=None):
        """
        MT5 терминалд холбогдох
        
        Args:
            login: MT5 account number (int)
            password: MT5 password (str)
            server: MT5 server name (str)
        
        Returns:
            bool: Амжилттай эсэх
        """
        # MT5 эхлүүлэх
        if not mt5.initialize():
            print(f"MT5 эхлүүлэх алдаа: {mt5.last_error()}")
            return False
        
        # Хэрэв login өгөгдсөн бол нэвтрэх
        if login and password and server:
            authorized = mt5.login(login=login, password=password, server=server)
            if not authorized:
                print(f"MT5 нэвтрэх алдаа: {mt5.last_error()}")
                mt5.shutdown()
                return False
            
            self.account_info = mt5.account_info()
            if self.account_info is not None:
                print(f"✓ MT5 холбогдлоо:")
                print(f"  Акаунт: {self.account_info.login}")
                print(f"  Сервер: {self.account_info.server}")
                print(f"  Компани: {self.account_info.company}")
        else:
            # Demo эсвэл offline горимд ажиллах
            print("✓ MT5 эхэлсэн (нэвтрээгүй горим)")
        
        self.connected = True
        return True
    
    def disconnect(self):
        """MT5 терминал салгах"""
        if self.connected:
            mt5.shutdown()
            self.connected = False
            print("MT5 холболт тасарсан")
    
    def get_symbol_info(self, symbol):
        """
        Валютын хослолын мэдээлэл авах
        
        Args:
            symbol: Валютын код (жишээ: "EURUSD", "GBPUSD")
        
        Returns:
            dict: Symbol мэдээлэл эсвэл None
        """
        if not self.connected:
            print("MT5 холбогдоогүй байна!")
            return None
        
        symbol_info = mt5.symbol_info(symbol)
        if symbol_info is None:
            print(f"Symbol '{symbol}' олдсонгүй: {mt5.last_error()}")
            return None
        
        return {
            'name': symbol_info.name,
            'description': symbol_info.description,
            'currency_base': symbol_info.currency_base,
            'currency_profit': symbol_info.currency_profit,
            'point': symbol_info.point,
            'digits': symbol_info.digits,
            'spread': symbol_info.spread,
            'trade_contract_size': symbol_info.trade_contract_size,
        }
    
    def get_current_tick(self, symbol):
        """
        Одоогийн tick (ханш) авах
        
        Args:
            symbol: Валютын код
        
        Returns:
            dict: Одоогийн ханш мэдээлэл
        """
        if not self.connected:
            print("MT5 холбогдоогүй байна!")
            return None
        
        # Symbol-ийг идэвхжүүлэх
        if not mt5.symbol_select(symbol, True):
            print(f"Symbol '{symbol}' идэвхжүүлэх алдаа: {mt5.last_error()}")
            return None
        
        tick = mt5.symbol_info_tick(symbol)
        if tick is None:
            print(f"Tick авах алдаа: {mt5.last_error()}")
            return None
        
        return {
            'symbol': symbol,
            'time': datetime.fromtimestamp(tick.time),
            'bid': tick.bid,
            'ask': tick.ask,
            'last': tick.last,
            'volume': tick.volume,
            'spread': tick.ask - tick.bid
        }
    
    def get_live_rates(self, symbols=None):
        """
        Олон валютын бодит цагийн ханш авах
        
        Args:
            symbols: List of symbols (жишээ: ['EURUSD', 'GBPUSD'])
                    None бол үндсэн валютуудыг авна
        
        Returns:
            dict: {symbol: rate_info}
        """
        if symbols is None:
            symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'USDCHF', 'XAUUSD']
        
        rates = {}
        for symbol in symbols:
            tick_data = self.get_current_tick(symbol)
            if tick_data:
                rates[symbol] = tick_data
        
        return rates
    
    def get_historical_data(self, symbol, timeframe, count=1000, start_date=None, end_date=None):
        """
        Түүхэн өгөгдөл татах
        
        Args:
            symbol: Валютын код
            timeframe: Timeframe (M1, M5, M15, M30, H1, H4, D1, W1, MN1)
            count: Хэдэн bar татах (default: 1000)
            start_date: Эхлэх огноо (datetime object)
            end_date: Дуусах огноо (datetime object)
        
        Returns:
            pandas.DataFrame: OHLCV өгөгдөл
        """
        if not self.connected:
            print("MT5 холбогдоогүй байна!")
            return None
        
        # Timeframe хөрвүүлэх
        timeframe_map = {
            'M1': mt5.TIMEFRAME_M1,
            'M5': mt5.TIMEFRAME_M5,
            'M15': mt5.TIMEFRAME_M15,
            'M30': mt5.TIMEFRAME_M30,
            'H1': mt5.TIMEFRAME_H1,
            'H4': mt5.TIMEFRAME_H4,
            'D1': mt5.TIMEFRAME_D1,
            'W1': mt5.TIMEFRAME_W1,
            'MN1': mt5.TIMEFRAME_MN1,
        }
        
        mt5_timeframe = timeframe_map.get(timeframe, mt5.TIMEFRAME_M1)
        
        # Symbol идэвхжүүлэх
        if not mt5.symbol_select(symbol, True):
            print(f"Symbol '{symbol}' идэвхжүүлэх алдаа: {mt5.last_error()}")
            return None
        
        # Өгөгдөл татах
        if start_date and end_date:
            rates = mt5.copy_rates_range(symbol, mt5_timeframe, start_date, end_date)
        else:
            rates = mt5.copy_rates_from_pos(symbol, mt5_timeframe, 0, count)
        
        if rates is None or len(rates) == 0:
            print(f"Өгөгдөл татах алдаа: {mt5.last_error()}")
            return None
        
        # DataFrame руу хөрвүүлэх
        df = pd.DataFrame(rates)
        df['time'] = pd.to_datetime(df['time'], unit='s')
        
        return df
    
    def get_multiple_pairs_data(self, symbols=None, timeframe='M1', count=1000):
        """
        Олон валютын хослолын өгөгдөл татах
        
        Args:
            symbols: List of symbols
            timeframe: Timeframe
            count: Bar тоо
        
        Returns:
            dict: {symbol: DataFrame}
        """
        if symbols is None:
            symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'USDCHF', 'XAUUSD']
        
        data = {}
        for symbol in symbols:
            print(f"📊 {symbol} өгөгдөл татаж байна...")
            df = self.get_historical_data(symbol, timeframe, count)
            if df is not None:
                data[symbol] = df
                print(f"   ✓ {len(df)} мөр өгөгдөл татагдлаа")
            else:
                print(f"   ✗ Алдаа гарлаа")
        
        return data
    
    def convert_to_pair_format(self, rates_dict):
        """
        MT5 форматаас манай хослолын форматруу хөрвүүлэх
        
        MT5 format: {'EURUSD': {...}, 'GBPUSD': {...}}
        Our format: {'EUR_USD': rate, 'GBP_USD': rate}
        
        Args:
            rates_dict: MT5-аас авсан ханшийн dict
        
        Returns:
            dict: Хөрвүүлсэн формат
        """
        converted = {}
        
        for symbol, data in rates_dict.items():
            # EURUSD -> EUR_USD
            if len(symbol) == 6:
                base = symbol[:3]
                quote = symbol[3:]
                pair_name = f"{base}_{quote}"
                
                # Bid/Ask дундаж авах
                if isinstance(data, dict):
                    if 'bid' in data and 'ask' in data:
                        rate = (data['bid'] + data['ask']) / 2
                    elif 'last' in data:
                        rate = data['last']
                    else:
                        continue
                    
                    converted[pair_name] = {
                        'rate': rate,
                        'bid': data.get('bid'),
                        'ask': data.get('ask'),
                        'spread': data.get('spread'),
                        'time': data.get('time'),
                        'chg': data.get('chg'),
                        'source': 'MT5'
                    }
            # XAUUSD -> XAU_USD (Алт)
            elif symbol == 'XAUUSD':
                if isinstance(data, dict):
                    if 'bid' in data and 'ask' in data:
                        rate = (data['bid'] + data['ask']) / 2
                    elif 'last' in data:
                        rate = data['last']
                    else:
                        continue
                    
                    converted['XAU_USD'] = {
                        'rate': rate,
                        'bid': data.get('bid'),
                        'ask': data.get('ask'),
                        'spread': data.get('spread'),
                        'time': data.get('time'),
                        'chg': data.get('chg'),
                        'source': 'MT5'
                    }
        
        return converted

# Global instance
mt5_handler = MT5Handler()

def initialize_mt5(login=None, password=None, server=None):
    """MT5 эхлүүлэх wrapper function"""
    return mt5_handler.connect(login, password, server)

def get_mt5_live_rates(symbols=None):
    """Бодит цагийн ханш авах wrapper function"""
    rates = mt5_handler.get_live_rates(symbols)
    return mt5_handler.convert_to_pair_format(rates)

def shutdown_mt5():
    """MT5 хаах wrapper function"""
    mt5_handler.disconnect()
