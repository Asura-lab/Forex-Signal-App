#property strict

input string SignalFile      = "signals.csv";   // Terminal\Common\Files\
input int    TimeOffsetHours = 0;               // CSV time дээр нэмэх цаг
input double RiskPerTrade    = 1;             // Balance-ийн % (0.5 = 0.5%)
input int    SlippagePoints  = 10;
input long   MagicNumber     = 60609688;
input int    MaxPositions    = 1;               
input bool   TradeOnlyChartSymbol = true;       // true бол зөвхөн chart symbol дээрх сигналуудыг ажиллуулна
input double MinConfidence   = 0.90;            // confidence босго (0.0-1.0)
input bool   Debug           = false;

struct Signal
{
   datetime time;
   string   symbol;
   string   dir;          // "BUY" / "SELL"
   double   conf;
   double   sl_pips;
   double   tp_pips;
   int      time_stop_min;
};

Signal signals[];
int next_idx = 0;

// *** ШИНЭ: Ажиллуулсан сигналуудыг тэмдэглэх array ***
bool processed_signals[];

//---------------- helpers ----------------//
string Trim(string s)
{
   StringTrimLeft(s);
   StringTrimRight(s);
   return s;
}

// "2025-01-20 15:00:00" -> StringToTime("2025.01.20 15:00:00")
bool ParseTimeExact(string t, datetime &out_dt)
{
   t = Trim(t);

   // BOM remove (зарим csv эхний талбарт байдаг)
   if(StringLen(t) > 0 && (ushort)StringGetCharacter(t, 0) == 0xFEFF)
      t = StringSubstr(t, 1);

   if(StringLen(t) < 19) return false; // YYYY-MM-DD HH:MM:SS

   StringReplace(t, "-", ".");
   datetime dt = StringToTime(t);
   if(dt <= 0) return false;

   out_dt = dt;
   return true;
}

double PipSizeForSymbol(const string sym)
{
   int digits = (int)SymbolInfoInteger(sym, SYMBOL_DIGITS);
   double pt  = SymbolInfoDouble(sym, SYMBOL_POINT);
   if(digits == 5 || digits == 3) return pt * 10.0;
   return pt;
}

int VolumeDigitsFromStep(double step)
{
   // step=0.01 -> 2, step=0.1 -> 1, step=1.0 -> 0
   string s = DoubleToString(step, 8);
   int dot = StringFind(s, ".");
   if(dot < 0) return 0;

   int end = StringLen(s) - 1;
   while(end > dot && StringGetCharacter(s, end) == '0') end--;
   return (end - dot);
}

double ClampVolumeForSymbol(const string sym, double vol)
{
   double vmin = SymbolInfoDouble(sym, SYMBOL_VOLUME_MIN);
   double vmax = SymbolInfoDouble(sym, SYMBOL_VOLUME_MAX);
   double step = SymbolInfoDouble(sym, SYMBOL_VOLUME_STEP);

   if(vol < vmin) vol = vmin;
   if(vol > vmax) vol = vmax;

   if(step > 0.0)
   {
      vol = MathFloor(vol / step) * step;
      if(vol < vmin) vol = vmin;
   }

   int vd = VolumeDigitsFromStep(step);
   return NormalizeDouble(vol, vd);
}

double CalcLotByRisk(const string sym, double sl_pips)
{
   double vmin = SymbolInfoDouble(sym, SYMBOL_VOLUME_MIN);
   if(sl_pips <= 0.0) return vmin;

   double bal  = AccountInfoDouble(ACCOUNT_BALANCE);
   double risk = bal * (RiskPerTrade / 100.0);

   double tick_val = SymbolInfoDouble(sym, SYMBOL_TRADE_TICK_VALUE);
   double tick_sz  = SymbolInfoDouble(sym, SYMBOL_TRADE_TICK_SIZE);
   double pt       = SymbolInfoDouble(sym, SYMBOL_POINT);
   if(tick_sz <= 0.0) tick_sz = pt;

   double pip = PipSizeForSymbol(sym);
   double pip_val_per_lot = tick_val * (pip / tick_sz);
   if(pip_val_per_lot <= 0.0) pip_val_per_lot = 1.0;

   double vol = risk / (sl_pips * pip_val_per_lot);
   return ClampVolumeForSymbol(sym, vol);
}

int CountOpenPositions(const string sym)
{
   // Hedging дээр олон позиц тоолно. Netting дээр ихэнхдээ 0/1 л байна.
   int cnt = 0;
   for(int i=0; i<PositionsTotal(); i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket == 0) continue;

      string psym = PositionGetString(POSITION_SYMBOL);
      long   pmag = (long)PositionGetInteger(POSITION_MAGIC);
      if(psym == sym && pmag == MagicNumber) cnt++;
   }
   return cnt;
}

//---------------- CSV load (ANSI/UNICODE fallback) ----------------//
bool TryLoadSignalsWithFlags(uint flags)
{
   ArrayResize(signals, 0);
   next_idx = 0;

   int h = FileOpen(SignalFile, flags | FILE_COMMON);
   if(h == INVALID_HANDLE) return false;

   int line_no = 0;
   while(!FileIsEnding(h))
   {
      string line = FileReadString(h);
      line_no++;

      if(FileIsEnding(h) && line == "") break;

      // CR устгах
      StringReplace(line, "\r", "");
      line = Trim(line);
      if(line == "") continue;

      // BOM устгах
      if(StringLen(line) > 0 && (ushort)StringGetCharacter(line, 0) == 0xFEFF)
         line = StringSubstr(line, 1);

      // header skip
      string low = line;
      StringToLower(low);
      if(StringFind(low, "time,symbol,direction") == 0) continue;

      string parts[];
      int n = StringSplit(line, ',', parts);
      if(n != 7)
      {
         if(Debug) PrintFormat("Skip line#%d bad columns n=%d line=%s", line_no, n, line);
         continue;
      }

      string t   = Trim(parts[0]);
      string sym = Trim(parts[1]);
      string dir = Trim(parts[2]);

      datetime dt;
      if(!ParseTimeExact(t, dt))
      {
         if(Debug) PrintFormat("Skip line#%d bad time=%s", line_no, t);
         continue;
      }

      // strict direction (BUY/SELL)
      if(dir=="BUY" || dir=="Buy" || dir=="buy") dir = "BUY";
      else if(dir=="SELL" || dir=="Sell" || dir=="sell") dir = "SELL";
      else
      {
         if(Debug) PrintFormat("Skip line#%d bad dir=%s", line_no, parts[2]);
         continue;
      }

      double conf = StringToDouble(Trim(parts[3]));
      double slp  = StringToDouble(Trim(parts[4]));
      double tpp  = StringToDouble(Trim(parts[5]));
      int    tst  = (int)StringToInteger(Trim(parts[6]));

      Signal s;
      s.time   = dt + (datetime)(TimeOffsetHours * 3600);
      s.symbol = sym;
      s.dir    = dir;
      s.conf   = conf;
      s.sl_pips= slp;
      s.tp_pips= tpp;
      s.time_stop_min = tst;

      int k = ArraySize(signals);
      ArrayResize(signals, k + 1);
      signals[k] = s;
   }

   FileClose(h);

   // sort by time
   int N = ArraySize(signals);
   for(int i=0;i<N-1;i++)
      for(int j=i+1;j<N;j++)
         if(signals[j].time < signals[i].time)
         {
            Signal tmp = signals[i];
            signals[i] = signals[j];
            signals[j] = tmp;
         }

   return (N > 0);
}

bool LoadSignals()
{
   Print("Reading COMMON\\Files: ", SignalFile);

   // 1) ANSI/UTF-8 гэж үзэж уншина
   if(TryLoadSignalsWithFlags(FILE_READ | FILE_TXT | FILE_ANSI))
   {
      Print("Loaded signals=", ArraySize(signals), " (ANSI/UTF-8)");
      
      // *** ШИНЭ: processed_signals array-г signals-тай ижил хэмжээтэй үүсгэх ***
      int N = ArraySize(signals);
      ArrayResize(processed_signals, N);
      ArrayInitialize(processed_signals, false);
      
      return true;
   }

   // 2) UTF-16 (UNICODE) fallback
   if(TryLoadSignalsWithFlags(FILE_READ | FILE_TXT | FILE_UNICODE))
   {
      Print("Loaded signals=", ArraySize(signals), " (UNICODE/UTF-16)");
      
      // *** ШИНЭ: processed_signals array-г signals-тай ижил хэмжээтэй үүсгэх ***
      int N = ArraySize(signals);
      ArrayResize(processed_signals, N);
      ArrayInitialize(processed_signals, false);
      
      return true;
   }

   Print("Loaded signals=0 (cannot parse). Check file path/encoding/format.");
   return false;
}

//---------------- trade ----------------//
bool SendMarketOrderForSymbol(const string sym, const string dir, double sl_pips, double tp_pips)
{
   // optional: limit positions
   if(MaxPositions > 0)
   {
      int open_cnt = CountOpenPositions(sym);
      if(open_cnt >= MaxPositions)
      {
         if(Debug) PrintFormat("Skip: MaxPositions reached (%d) for %s", open_cnt, sym);
         return false;
      }
   }

   // ensure symbol is available
   if(!SymbolSelect(sym, true))
   {
      Print("SymbolSelect failed: ", sym);
      return false;
   }

   double pip = PipSizeForSymbol(sym);
   double ask = SymbolInfoDouble(sym, SYMBOL_ASK);
   double bid = SymbolInfoDouble(sym, SYMBOL_BID);
   double price = (dir=="BUY") ? ask : bid;

   double vol = CalcLotByRisk(sym, sl_pips);

   // minimum stop distance
   int stops_level = (int)SymbolInfoInteger(sym, SYMBOL_TRADE_STOPS_LEVEL); // points
   double pt       = SymbolInfoDouble(sym, SYMBOL_POINT);
   double min_dist = stops_level * pt;

   double sl=0.0, tp=0.0;
   if(dir=="BUY")
   {
      sl = price - sl_pips * pip;
      tp = price + tp_pips * pip;

      if(min_dist > 0)
      {
         if((price - sl) < min_dist) sl = price - min_dist;
         if((tp - price) < min_dist) tp = price + min_dist;
      }
   }
   else
   {
      sl = price + sl_pips * pip;
      tp = price - tp_pips * pip;

      if(min_dist > 0)
      {
         if((sl - price) < min_dist) sl = price + min_dist;
         if((price - tp) < min_dist) tp = price - min_dist;
      }
   }

   MqlTradeRequest req;
   MqlTradeResult  res;

   // filling fallback chain
   ENUM_ORDER_TYPE_FILLING fills[3] = { ORDER_FILLING_RETURN, ORDER_FILLING_IOC, ORDER_FILLING_FOK };

   for(int k=0;k<3;k++)
   {
      ZeroMemory(req);
      ZeroMemory(res);

      req.action      = TRADE_ACTION_DEAL;
      req.symbol      = sym;
      req.magic       = MagicNumber;
      req.volume      = vol;
      req.type        = (dir=="BUY") ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
      req.price       = price;
      req.sl          = sl;
      req.tp          = tp;
      req.deviation   = SlippagePoints;
      req.type_time   = ORDER_TIME_GTC;
      req.type_filling= fills[k];

      ResetLastError();
      bool ok = OrderSend(req, res);

      if(ok && (res.retcode==10008 || res.retcode==10009))
      {
         PrintFormat("OrderSend OK retcode=%d fill=%d %s %s vol=%.2f sl=%.5f tp=%.5f",
                     (int)res.retcode, (int)fills[k], sym, dir, vol, sl, tp);
         return true;
      }

      int err = (int)GetLastError();
      if(Debug)
         PrintFormat("OrderSend FAIL fill=%d retcode=%d err=%d", (int)fills[k], (int)res.retcode, err);

      // Unsupported filling mode / invalid filling → дараагийн filling рүү шилжинэ
      if(err == 4756 || res.retcode == 10030)
         continue;

      // бусад алдаа бол шууд буцаана
      break;
   }

   PrintFormat("OrderSend FAILED for %s %s (check Journal).", sym, dir);
   return false;
}

//---------------- entry points ----------------//
int OnInit()
{
   Print("SignalExecutor init. DataPath=", TerminalInfoString(TERMINAL_DATA_PATH));

   if(!LoadSignals())
   {
      Print("No signals loaded.");
      return INIT_FAILED;
   }

   // tester эхлэх мөчөөс өмнөх сигналуудыг алгасах (ихэнхдээ зөв)
   datetime start = TimeCurrent();
   int N = ArraySize(signals);

   int i = 0;
   while(i < N && signals[i].time < start) i++;
   next_idx = i;

   PrintFormat("Test start=%s, next_idx=%d, next_time=%s",
               TimeToString(start),
               next_idx,
               (next_idx < N ? TimeToString(signals[next_idx].time) : "NONE"));

   return INIT_SUCCEEDED;
}

void OnTick()
{
   int N = ArraySize(signals);
   if(next_idx >= N) return;

   datetime now = TimeCurrent();

   // *** ЗАСВАР: Нэг удаад зөвхөн 1 сигнал ажиллуулах ***
   while(next_idx < N && now >= signals[next_idx].time)
   {
      // *** ШИНЭ: Энэ сигналыг өмнө нь ажиллуулсан эсэхийг шалгах ***
      if(processed_signals[next_idx])
      {
         next_idx++;
         continue;  // Аль хэдийн ажиллуулсан бол алгасах
      }
      
      Signal s = signals[next_idx];
      string sym = s.symbol;

      // хүсвэл зөвхөн chart symbol дээр ажиллуулна
      if(TradeOnlyChartSymbol && sym != _Symbol)
      {
         processed_signals[next_idx] = true;  // *** Тэмдэглэх ***
         next_idx++;
         continue;
      }

      // *** ШИНЭ: Confidence босго шалгалт ***
      if(s.conf < MinConfidence)
      {
         if(Debug)
            PrintFormat("Signal skipped: conf=%.4f < MinConfidence=%.2f", s.conf, MinConfidence);
         processed_signals[next_idx] = true;
         next_idx++;
         continue;
      }

      // *** Debug: ижил цагтай олон сигнал байвал анхааруулга ***
      if(Debug)
      {
         int same_time_count = 0;
         for(int i = next_idx; i < N && signals[i].time == s.time; i++)
         {
            if(signals[i].symbol == sym && !processed_signals[i])
               same_time_count++;
         }
         
         if(same_time_count > 1)
            PrintFormat("Warning: %d signals at same time %s for %s", same_time_count, TimeToString(s.time), sym);
      }
      
      // signal бүр дээр order илгээнэ - зөвхөн нэг удаа
      SendMarketOrderForSymbol(sym, s.dir, s.sl_pips, s.tp_pips);
      
      // *** ШИНЭ: Энэ сигналыг ажиллуулсан гэж тэмдэглэх ***
      processed_signals[next_idx] = true;
      
      next_idx++;
      
      // *** ШИНЭ: Нэг tick-д зөвхөн 1 сигнал ажиллуулах (чухал!) ***
      break;
   }
}
