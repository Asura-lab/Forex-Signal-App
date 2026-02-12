from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
MODELS_DIR = BASE_DIR / "models"
OUTPUT_DIR = BASE_DIR / "outputs"

SYMBOL = "EURUSD"
START_DATE = "2015-01-01"
END_DATE = "2025-12-31"  # 2025 оныг багтаана
TEST_START_DATE = "2025-01-01"  # Test split: 2025 он (2015-2024 сургалт)
SIGNAL_START_DATE = "2025-01-01"  # Сигнал: 2025 он
SIGNAL_END_DATE = "2025-12-31"
SIGNAL_MIN_GAP_MIN = 0  # *** 0 = бүх сигнал (өдөр бүр 2 минут) ***

BASE_TIMEFRAME_MIN = 1
TIMEFRAMES = ["1min", "5min", "15min", "30min", "1H", "4H", "1D"]
SIGNAL_TIMEFRAME = "1min"  # Өдөр бүр 00:00, 00:01 минутууд (Dukascopy data limit)

LABEL_HORIZON_MIN = 240  # 4 цаг (30-60 pips-д хүрэхэд урт хугацаа хэрэгтэй)
LABEL_THRESHOLD_PIPS = 30.0  # 30 pips minimum movement for signal

SL_MULT = 5.0  # ATR × 5 = өргөн SL (урт хугацаа, noise зайлсхийх)
TP_MULT = 15.0  # TP = SL × 3 (1:3 risk/reward)
MIN_SL_PIPS = 15.0  # 15-20 pips SL for 45-60 pips TP
MIN_TP_PIPS = 45.0  # 45-60 pips profit target
TIME_STOP_MIN = 0  # 0 = хаалт байхгүй, зөвхөн TP/SL дээр хаагдана
CONF_THRESHOLD = 0.60  # 0.60 = илүү олон сигнал (доогуур чанар)

RANDOM_STATE = 7
