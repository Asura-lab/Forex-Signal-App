# MT5 Strategy Tester Backtest (Signal Replay)

This setup exports ML signals to CSV and replays them with an MT5 Expert Advisor.

## 1) Export signals

From the repo root:

```bash
python tools/mt5/export_mt5_signals.py \
  --input data/test/EURUSD_m1.csv \
  --output results/mt5_signals.csv \
  --min-confidence 80 \
  --signal-shift 1
```

Output CSV columns:

```
time,signal,entry,sl,tp,confidence
```

Time format is `YYYY.MM.DD HH:MM:SS` (MT5 friendly).

## 2) Copy the CSV into MT5

For Strategy Tester, MT5 reads files from:

- `MQL5/Tester/Files` (recommended), or
- `MQL5/Files`, or
- `Common/Files` (if `UseCommonFolder=true` in EA inputs)

Copy `results/mt5_signals.csv` into one of those folders.

## 3) Install the EA

Copy `mt5/experts/ForexSignalBacktestEA.mq5` into:

```
<MT5 data folder>/MQL5/Experts
```

Compile it in MetaEditor.

## 4) Run Strategy Tester

1. Open Strategy Tester.
2. Expert: `ForexSignalBacktestEA`
3. Symbol/Timeframe: match your CSV (example: EURUSD, M1).
4. Modeling: "Every tick" or "Open prices only".
5. Inputs:
   - `SignalsFile`: `mt5_signals.csv`
   - `UseCommonFolder`: `false` (unless you used `Common/Files`)
   - `TimeOffsetSeconds`: adjust if server time differs from CSV time
   - `FixedLot`: set your lot size

If trades do not fire, the most common issue is time mismatch.
Use `TimeOffsetSeconds` to align CSV times with MT5 server time.
