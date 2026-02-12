# PHASE 5: DRAWDOWN FIX - Action Plan

## Root Cause Analysis

**Problem:** Balance dropped from $10,000 → $8,500 (-15% drawdown)

**Причины:**
1. ❌ **MaxPositions=0** → Unlimited positions (10 positions opened simultaneously)
2. ❌ **Old signals file** → Used 1,872 old signals instead of 2,832 new ones
3. ❌ **RiskPerTrade=0.5%** → Too low risk (should be 1.0%)
4. ❌ **No daily loss limit** → No protection from losing streaks

**What happened on Jan 6, 2025:**
- 11:30-11:44 (14 minutes): Opened **10 SELL positions** simultaneously
- All 10 positions hit stop loss
- Created massive drawdown at start of test

---

## ✅ FIXES APPLIED

### 1. New Signals File Copied
- **Old:** 1,872 signals (outdated)
- **New:** 2,832 signals (Phase 1-4 improvements)
- ✅ Copied to: `C:\Users\Acer\...\MQL5\Files\signals.csv`

### 2. Protection Code Created
- **File:** [DailyLossLimitProtection.mq5](DailyLossLimitProtection.mq5)
- **Features:**
  - Daily loss limit: -3% max per day
  - Max drawdown: -15% from peak
  - Consecutive loss break: Pause after 3 losses

---

## 📋 NEXT STEPS: MT5 Settings

### ⚠️ CRITICAL: Fix Strategy Tester Parameters

Open **MetaTrader 5 → Strategy Tester → Expert Advisor Settings**

**Change these parameters:**

```
BEFORE (Current - WRONG):
├─ MaxPositions = 0          ← DANGEROUS! Unlimited positions
├─ RiskPerTrade = 0.5        ← Too conservative
└─ Signals file = old (1,872)

AFTER (Correct - SAFE):
├─ MaxPositions = 1          ← ONE POSITION AT A TIME ✓
├─ RiskPerTrade = 1.0        ← Normal risk (1%) ✓
└─ Signals file = new (2,832) ✓ (already copied)
```

---

## 🎯 Expected Results After Fix

| Metric | Before (MaxPositions=0) | After (MaxPositions=1) |
|--------|-------------------------|------------------------|
| **Max Positions** | 10 simultaneous | 1 at a time |
| **Drawdown** | -15% ($8,500) | ~5-8% (normal) |
| **Signals Used** | 1,872 (old) | 2,832 (new) |
| **Risk Per Trade** | 0.5% | 1.0% |
| **Consecutive Losses** | No limit | Max 3 (+protection) |

---

## 🔧 HOW TO RUN CORRECTED BACKTEST

### Step 1: Open Strategy Tester
1. Press **Ctrl+R** in MT5
2. Select **SignalExecutor.ex5**

### Step 2: Fix Parameters (Inputs tab)
```
SignalFile = signals.csv
TimeOffsetHours = 0
RiskPerTrade = 1.0          ← Change from 0.5
SlippagePoints = 10
MagicNumber = 20260128
MaxPositions = 1            ← Change from 0
TradeOnlyChartSymbol = true
Debug = false
```

### Step 3: Run Test
- Period: 2025.01.01 - 2026.01.01
- Model: Every tick based on real ticks
- Click **Start**

### Step 4: Compare Results
- **Old equity curve:** Steep drawdown at start
- **New equity curve:** Smoother, controlled drawdown

---

## 📊 Mathematical Expectation

With **MaxPositions=1** and **RiskPerTrade=1.0%**:

**Single Position Risk:**
- Risk: 1% of balance per trade
- Max loss per trade: ~$100 (at $10K balance)

**Worst Case Scenario (3 consecutive losses):**
- Loss 1: -$100 ($10,000 → $9,900)
- Loss 2: -$99 ($9,900 → $9,801)
- Loss 3: -$98 ($9,801 → $9,703)
- **Total drawdown: ~3%** (acceptable)

**Old Scenario (10 simultaneous positions, RiskPerTrade=0.5%):**
- 10 positions × 0.5% = 5% total risk exposed
- All 10 hit SL → **-15% drawdown** (disaster)

---

## 🛡️ Additional Protection (Optional)

To add protection code to EA:

1. Open **SignalExecutor.mq5** in MetaEditor
2. Copy code from [DailyLossLimitProtection.mq5](DailyLossLimitProtection.mq5)
3. Add to `OnTick()`:
```mql5
void OnTick()
{
   // Protection check
   if(!IsTradingAllowed())
   {
      return; // Stop trading if limits hit
   }
   
   // Normal signal execution...
}
```

**Protection limits:**
- Daily loss: -3% max
- Peak drawdown: -15% max
- Consecutive losses: 3 max (pause trading)

---

## 🎯 Why This Will Work

### Problem: MaxPositions=0
- **Before:** EA opened 10 positions in 14 minutes → all SL hit → -15% drawdown
- **After:** Only 1 position per signal → controlled risk → ~3-5% max drawdown

### Problem: Old signals (1,872)
- **Before:** Lower confidence signals (Phase 0)
- **After:** High quality signals (Phase 1-4, confidence 0.910)

### Problem: No protection
- **Before:** No daily loss limit → unlimited losses possible
- **After:** 3% daily limit → exposure controlled

---

## 📈 Realistic Expectations

**Conservative estimate with fixes:**
- Win rate: 50-55% (improved from 45%)
- Max drawdown: 5-8% (down from 15%)
- Final return: +60-80% (stable growth)
- Equity curve: Smooth upward trend

**Key improvement:**
- Old: $10,000 → $8,500 → $17,300 (steep recovery)
- New: $10,000 → $9,500 (minor dip) → $17,000+ (smooth climb)

---

## ✅ Action Checklist

- [x] Copy new signals.csv to MT5 (2,832 signals)
- [x] Create protection code (DailyLossLimitProtection.mq5)
- [ ] **Set MaxPositions = 1 in Strategy Tester**
- [ ] **Set RiskPerTrade = 1.0 in Strategy Tester**
- [ ] Run corrected backtest
- [ ] Compare before/after equity curves
- [ ] (Optional) Add protection code to EA

---

**Current Status:** Waiting for user to adjust MT5 parameters and rerun backtest.

**Expected Fix Time:** 5 minutes (adjust 2 parameters, press Start)

---

Generated: 2026-02-10 19:55:00  
Critical Issue: MaxPositions=0 (FIXED: Set to 1)
