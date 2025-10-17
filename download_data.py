from datetime import datetime
import dukascopy_python as duka

# Валютын хос
instrument = "USD/JPY"

# 1 минутын интервал
interval = duka.INTERVAL_MIN_1

start_date = datetime(2025, 1, 1)
end_date = datetime(2025, 12, 31)

# Өгөгдөл татах
df = duka.fetch(
    instrument=instrument,
    interval=interval,
    offer_side="bid",
    start=start_date,
    end=end_date
)

# Индексийг (цаг хугацааг) багана болгон хувиргах
df.reset_index(inplace=True)

# CSV-д хадгалах (цаг хугацаатай хамт)
filename = f"{instrument.replace('/', '_')}_test.csv"
df.to_csv(filename, index=False)
print("✅ 1 минутын дата цаг хугацаатай нь хамт амжилттай татагдлаа.")
print(f"� Файл: {filename}")
print(f"�📊 Нийт мөрийн тоо: {len(df)}")
print(f"� Багануудын нэр: {list(df.columns)}")
print(f"📅 Эхний мөр:")
print(df.head(1))
