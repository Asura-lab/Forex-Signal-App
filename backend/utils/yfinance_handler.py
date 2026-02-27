"""
Yahoo Finance (yfinance) forex data handler.

Давуу тал:
- API key хэрэггүй, credit limit байхгүй
- Бүх timeframe дата тус тусдаа татна (resample байхгүй)
- H4 нь yfinance-д native support байхгүй тул 1H → 4H resample хийнэ (цорын ганц exception)

Interval бодит татах хязгаар (yfinance):
  1m  → max 7 хоног (~7*1440 = 10080 bar)
  5m  → max 60 хоног (~60*288  = 17280 bar)
  15m → max 60 хоног (~60*96   =  5760 bar)
  30m → max 60 хоног (~60*48   =  2880 bar)
  1h  → max 730 хоног (~730*24 = 17520 bar)
"""

import time
import threading
from datetime import datetime

import pandas as pd
import yfinance as yf


# ---------------------------------------------------------------------------
# Symbol mapping
# ---------------------------------------------------------------------------

FOREX_MAP: dict[str, str] = {
    "EUR/USD": "EURUSD=X",
    "GBP/USD": "GBPUSD=X",
    "USD/JPY": "USDJPY=X",
    "USD/CHF": "USDCHF=X",
    "AUD/USD": "AUDUSD=X",
    "USD/CAD": "USDCAD=X",
    "NZD/USD": "NZDUSD=X",
    "EUR/GBP": "EURGBP=X",
    "EUR/JPY": "EURJPY=X",
    "GBP/JPY": "GBPJPY=X",
    "EUR/CHF": "EURCHF=X",
    "EUR/AUD": "EURAUD=X",
    "GBP/CHF": "GBPCHF=X",
    "AUD/JPY": "AUDJPY=X",
    "CHF/JPY": "CHFJPY=X",
    "NZD/JPY": "NZDJPY=X",
    "AUD/NZD": "AUDNZD=X",
    "EUR/CAD": "EURCAD=X",
    "GBP/AUD": "GBPAUD=X",
    "GBP/CAD": "GBPCAD=X",
}

# TwelveData interval → yfinance interval
_INTERVAL_MAP: dict[str, str] = {
    "1min":  "1m",
    "5min":  "5m",
    "15min": "15m",
    "30min": "30m",
    "1h":    "1h",
    "4h":    "1h",   # 4H native support байхгүй → 1H татаж resample хийнэ
    "1day":  "1d",
}

# yfinance interval → татах period
_PERIOD_MAP: dict[str, str] = {
    "1m":  "7d",
    "5m":  "60d",
    "15m": "60d",
    "30m": "60d",
    "1h":  "730d",
    "1d":  "max",
}


def _to_yf_symbol(symbol: str) -> str:
    """EUR/USD  →  EURUSD=X"""
    sym = symbol.replace("_", "/").upper()
    return FOREX_MAP.get(sym, sym.replace("/", "") + "=X")


def _clean_df(df: pd.DataFrame) -> pd.DataFrame:
    """Timezone strip + column rename + sort"""
    df = df.rename(columns={
        "Open": "open", "High": "high",
        "Low": "low", "Close": "close", "Volume": "volume",
    })
    # index → column
    df.index.name = "time"
    df = df.reset_index()
    df = df[["time", "open", "high", "low", "close", "volume"]]
    # timezone хасна
    df["time"] = pd.to_datetime(df["time"]).dt.tz_localize(None)
    df = df.sort_values("time").reset_index(drop=True)
    return df


# ---------------------------------------------------------------------------
# Handler class
# ---------------------------------------------------------------------------

class YFinanceHandler:
    """
    Yahoo Finance (yfinance) ашиглан forex OHLCV + live rate авах handler.
    TwelveDataHandler-тай яг ижил public interface-тэй тул app.py-д
    импортын нэрийг солиход хангалттай.
    """

    FOREX_PAIRS = list(FOREX_MAP.keys())

    def __init__(self, symbol: str = "EUR/USD"):
        self.symbol = symbol
        self.cache: dict = {}
        self.cache_ttl = 60          # live rate cache: 60 секунд
        self.historical_cache_ttl = 120  # historical cache: 2 минут
        self._lock = threading.Lock()
        print("[OK] YFinanceHandler initialized (no API key, no credit limit)")

    # ------------------------------------------------------------------
    # Live rate
    # ------------------------------------------------------------------

    def get_live_rate(self) -> dict:
        """
        EUR/USD (эсвэл self.symbol) бодит цагийн ханш авах.
        fast_info.last_price → татна; байхгүй бол 1m history-аас авна.
        """
        cache_key = f"{self.symbol}_live"
        now = time.time()

        with self._lock:
            if cache_key in self.cache:
                cached, cached_at = self.cache[cache_key]
                age = now - cached_at
                if age < self.cache_ttl:
                    cached["cached"] = True
                    cached["cache_age"] = round(age, 1)
                    return cached

        try:
            yf_sym = _to_yf_symbol(self.symbol)
            ticker = yf.Ticker(yf_sym)

            rate = None
            try:
                rate = ticker.fast_info.last_price
            except Exception:
                pass

            if not rate:
                df_tmp = ticker.history(period="1d", interval="1m")
                if not df_tmp.empty:
                    rate = float(df_tmp["Close"].iloc[-1])

            if not rate:
                return {"success": False, "error": "No price data from Yahoo Finance"}

            is_jpy = "JPY" in self.symbol
            spread = 0.001 if is_jpy else 0.00001

            result = {
                "success": True,
                "pair": self.symbol.replace("/", "_"),
                "rate": round(float(rate), 3 if is_jpy else 5),
                "bid": round(float(rate) - spread, 3 if is_jpy else 5),
                "ask": round(float(rate) + spread, 3 if is_jpy else 5),
                "spread": 0.1,
                "time": datetime.now().isoformat(),
                "source": "Yahoo Finance",
                "cached": False,
                "cache_age": 0,
                "next_update_in": self.cache_ttl,
            }

            with self._lock:
                self.cache[cache_key] = (result.copy(), now)

            print(f"[OK] {self.symbol}: {result['rate']} (fresh, yfinance)")
            return result

        except Exception as e:
            print(f"[ERROR] YFinance live rate error: {e}")
            with self._lock:
                if cache_key in self.cache:
                    cached, _ = self.cache[cache_key]
                    cached["cached"] = True
                    cached["api_error"] = str(e)
                    return cached
            return {"success": False, "error": str(e)}

    # ------------------------------------------------------------------
    # All rates (20 pairs)
    # ------------------------------------------------------------------

    def get_all_rates(self) -> dict:
        """
        20 forex pairs-ийн ханш нэгэн зэрэг авах.
        yf.download() batch call ашиглана.
        """
        cache_key = "all_rates"
        now = time.time()

        with self._lock:
            if cache_key in self.cache:
                cached, cached_at = self.cache[cache_key]
                if now - cached_at < self.cache_ttl:
                    cached["cached"] = True
                    return cached

        try:
            yf_symbols = list(FOREX_MAP.values())
            raw = yf.download(
                " ".join(yf_symbols),
                period="2d",
                interval="5m",
                auto_adjust=True,
                progress=False,
                threads=True,
            )

            rates: dict = {}
            for pair, yf_sym in FOREX_MAP.items():
                pair_key = pair.replace("/", "_")
                try:
                    # Multi-ticker → (metric, ticker) multi-level columns
                    if isinstance(raw.columns, pd.MultiIndex):
                        closes = raw["Close"][yf_sym].dropna()
                    else:
                        closes = raw["Close"].dropna()

                    if len(closes) >= 2:
                        r = float(closes.iloc[-1])
                        prev = float(closes.iloc[-2])
                        chg = round(r - prev, 5)
                        pct = round((chg / prev) * 100, 2) if prev else 0.0
                    else:
                        r, chg, pct = 0.0, 0.0, 0.0

                    rates[pair_key] = {
                        "rate": round(r, 5),
                        "change": chg,
                        "change_percent": pct,
                    }
                except Exception:
                    rates[pair_key] = {"rate": 0.0, "change": 0.0, "change_percent": 0.0}

            result = {
                "success": True,
                "rates": rates,
                "time": datetime.now().isoformat(),
                "source": "Yahoo Finance",
                "cached": False,
                "count": len(rates),
            }

            with self._lock:
                self.cache[cache_key] = (result.copy(), now)

            print(f"[OK] {len(rates)} pairs fetched from Yahoo Finance")
            return result

        except Exception as e:
            print(f"[ERROR] YFinance all_rates error: {e}")
            with self._lock:
                if cache_key in self.cache:
                    cached, _ = self.cache[cache_key]
                    cached["cached"] = True
                    return cached
            return {"success": False, "error": str(e)}

    # ------------------------------------------------------------------
    # Historical OHLCV
    # ------------------------------------------------------------------

    def get_historical_data(
        self,
        interval: str = "1min",
        outputsize: int = None,
        symbol: str = None,
    ) -> pd.DataFrame:
        """
        OHLCV data авах.

        interval: "1min" | "5min" | "15min" | "30min" | "1h" | "4h" | "1day"
        outputsize: None → бүх боломжит дата (дээд хэмжээ). int → tail хязгаар.
        symbol: "EUR/USD" гэх мэт (default: self.symbol)

        Бүх TF тус тусдаа татна — resample байхгүй.
        H4 нь yfinance-д support байхгүй тул 1H → 4H resample хийгдэнэ.
        """
        target_sym = symbol or self.symbol
        is_4h = (interval.lower() == "4h")

        # yfinance interval & period тодорхойлох
        fetch_interval = "1h" if is_4h else interval
        yf_interval = _INTERVAL_MAP.get(fetch_interval, fetch_interval)
        period = _PERIOD_MAP.get(yf_interval, "60d")

        cache_key = f"hist_{target_sym}_{interval}_max"
        now = time.time()

        with self._lock:
            if cache_key in self.cache:
                cached_df, cached_at = self.cache[cache_key]
                if now - cached_at < self.historical_cache_ttl:
                    print(f"📦 Cache hit: {target_sym} {interval} ({len(cached_df)} bars)")
                    return cached_df

        try:
            yf_sym = _to_yf_symbol(target_sym)
            ticker = yf.Ticker(yf_sym)

            print(f"🌐 Fetching {target_sym} {interval} → yfinance({yf_interval}/{period})...")

            raw = ticker.history(
                period=period,
                interval=yf_interval,
                auto_adjust=True,
                prepost=False,
            )

            if raw.empty:
                print(f"[WARN] Empty data: {target_sym} {interval}")
                return pd.DataFrame()

            df = _clean_df(raw)

            # H4: 1H → 4H resample (yfinance-д 4H native байхгүй тул)
            if is_4h:
                df = (
                    df.set_index("time")
                    .resample("4h")
                    .agg({"open": "first", "high": "max", "low": "min",
                          "close": "last", "volume": "sum"})
                    .dropna()
                    .reset_index()
                )
                print(f"   → H4 resampled from 1H: {len(df)} bars")

            # outputsize өгөгдсөн үед л tail хязгаар хэрэглэнэ
            # (None = бүх боломжит дата)
            if outputsize and len(df) > outputsize:
                df = df.tail(outputsize).reset_index(drop=True)

            if not df.empty:
                print(f"[OK] {target_sym} {interval}: {len(df)} bars | "
                      f"{df['time'].iloc[0]} → {df['time'].iloc[-1]}")

            with self._lock:
                self.cache[cache_key] = (df, now)

            return df

        except Exception as e:
            print(f"[ERROR] YFinance historical {target_sym} {interval}: {e}")
            import traceback; traceback.print_exc()

            with self._lock:
                if cache_key in self.cache:
                    cached_df, _ = self.cache[cache_key]
                    return cached_df
            return pd.DataFrame()

    # ------------------------------------------------------------------
    # Bars as list of dict (backward compat)
    # ------------------------------------------------------------------

    def get_historical_bars(self, count: int = 800) -> list:
        """list[dict] format – backward compatibility"""
        df = self.get_historical_data(interval="1min", outputsize=count)
        if df.empty:
            return []
        return [
            {
                "time": row["time"].isoformat() if hasattr(row["time"], "isoformat") else str(row["time"]),
                "open": float(row["open"]),
                "high": float(row["high"]),
                "low": float(row["low"]),
                "close": float(row["close"]),
                "volume": int(row.get("volume", 0)),
            }
            for _, row in df.iterrows()
        ]


# ---------------------------------------------------------------------------
# Global singleton
# ---------------------------------------------------------------------------

yfinance_handler = YFinanceHandler()


# ---------------------------------------------------------------------------
# Public helper functions (app.py-тай interface ижил — зөвхөн нэр өөр)
# ---------------------------------------------------------------------------

def get_twelvedata_live_rate() -> dict:
    """Бодит цагийн EUR/USD ханш"""
    return yfinance_handler.get_live_rate()


def get_all_forex_rates() -> dict:
    """20 forex pairs-ийн ханш"""
    return yfinance_handler.get_all_rates()


def get_twelvedata_historical(count: int = 800) -> list:
    """Түүхэн M1 bars (list of dict)"""
    return yfinance_handler.get_historical_bars(count)


def get_twelvedata_dataframe(
    interval: str = "1min",
    outputsize: int = None,
    symbol: str = "EUR/USD",
    count: int = None,
) -> pd.DataFrame:
    """DataFrame format түүхэн дата (outputsize=None → дээд хэмжээ)"""
    size = count if count is not None else outputsize
    return yfinance_handler.get_historical_data(interval=interval, outputsize=size, symbol=symbol)


def get_twelvedata_multitf(
    symbol: str = "EUR/USD",
    base_bars: int = None,   # ignored – kept for backward compat
) -> dict | None:
    """
    Multi-timeframe OHLCV data авах.
    Бүх timeframe тус тусдаа yfinance-аас татна (resample байхгүй).
    H4 нь 1H → 4H resample хийгдэнэ (yfinance-д native support байхгүй).

    Returns:
        {
          "1min": DataFrame,
          "5min": DataFrame,
          "15min": DataFrame,
          "30min": DataFrame,
          "1H":   DataFrame,
          "4H":   DataFrame,
        }
        эсвэл None (хангалттай дата байхгүй үед)
    """
    # Бүх TF — outputsize=None → yfinance-аас татаж болох дээд хэмжээ бүгдийг авна
    # yfinance max: 1m=7хоног(~10080), 5m=60хоног(~17280), 15m=60хоног(~5760),
    #               30m=60хоног(~2880), 1h=730хоног(~17520), 4h=730хоног→resample
    TF_CONFIG: dict[str, tuple[str, None]] = {
        # (interval, outputsize=None → бүх боломжит дата)
        "1min":  ("1min",  None),
        "5min":  ("5min",  None),
        "15min": ("15min", None),
        "30min": ("30min", None),
        "1H":    ("1h",    None),
        "4H":    ("4h",    None),
    }

    MIN_BARS = 55   # rolling(50) + buffer дутахгүй
    result: dict = {}

    for tf_name, (interval, outputsize) in TF_CONFIG.items():
        try:
            df = yfinance_handler.get_historical_data(
                interval=interval,
                outputsize=outputsize,
                symbol=symbol,
            )

            if df is not None and not df.empty and len(df) >= MIN_BARS:
                result[tf_name] = df
                print(f"[MULTITF] {tf_name}: {len(df)} bars ✓")
            else:
                n = len(df) if df is not None else 0
                print(f"[MULTITF] {tf_name}: {n} bars — хангалтгүй (min {MIN_BARS})")

        except Exception as e:
            print(f"[MULTITF] {tf_name} error: {e}")

    if not result:
        print("[MULTITF] Ямар ч TF-д дата байхгүй! → None")
        return None

    return result


# ---------------------------------------------------------------------------
# Self-test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("=" * 60)
    print("yfinance handler test")
    print("=" * 60)

    # 1) Live rate
    print("\n[1] Live rate...")
    r = yfinance_handler.get_live_rate()
    if r["success"]:
        print(f"   EUR/USD: {r['rate']}")
    else:
        print(f"   ERROR: {r.get('error')}")

    # 2) Historical M1
    print("\n[2] Historical M1 (300 bars)...")
    df1 = yfinance_handler.get_historical_data("1min", 300)
    print(f"   {len(df1)} bars, latest close: {df1['close'].iloc[-1]:.5f}")

    # 3) Multi-TF
    print("\n[3] Multi-TF...")
    mtf = get_twelvedata_multitf("EUR/USD")
    if mtf:
        for k, v in mtf.items():
            print(f"   {k}: {len(v)} bars")

    print("\n[Done]")
