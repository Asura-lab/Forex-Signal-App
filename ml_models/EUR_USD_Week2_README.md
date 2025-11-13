# EUR/USD Week 2 Training - Quick Start Guide

## 🎯 Асуудлын тайлбар (Problem Statement)

**Previous Result**: Accuracy 33.46% (33.46%) - Энэ нь 3 ангиллын санамсаргүй таамаглалаас бага байна.

**Goal**: Модель accuracy-г 65%+ хүртэл сайжруулах.

---

## ✅ Юу хийгдсэн вэ? (What Was Done)

### 1. EUR_USD_Week2.ipynb Notebook
Шинэ сургалтын notebook үүсгэсэн бөгөөд дараах сайжруулалт орсон:

#### Моделийн архитектур (Model Architecture)
- **LSTM units**: [128, 64] → [256, 128] (2x илүү хүчтэй)
- **Feed-forward dim**: 256 → 512 (2x илүү хүчтэй)
- **Dropout**: 0.5 → 0.4 (оновчтой болгосон)

#### Өгөгдлийн боловсруулалт (Data Processing)
- **Sequence length**: 60 → 120 минут (илүү их контекст)
- **Step size**: 5 → 3 (илүү олон сургалтын өгөгдөл)
- **Label threshold**: 0.05% → 0.03% (илүү мэдрэмтгий)

#### Сургалтын процесс (Training Process)
- **Class weights**: Balanced (ангиллын тэнцвэрийг хангах)
- **Learning rate**: 0.0001 (оновчтой)
- **Batch size**: 64 (оновчтой)
- **Early stopping patience**: 10 → 15 epochs
- **LR reduction patience**: 5 → 7 epochs

### 2. Requirements.txt
Дараах санг нэмсэн:
- `tensorflow>=2.13.0` - Deep learning framework
- `ta>=0.11.0` - Technical analysis indicators

### 3. HYPERPARAMETER_TUNING_GUIDE.md
Нарийвчилсан заавар (Монгол + Англи хэлээр):
- Бүх өөрчлөлтийн тайлбар
- Цаашдын сайжруулалтын заавар
- Troubleshooting guide
- Best practices

---

## 🚀 Хэрхэн ашиглах вэ? (How to Use)

### Алхам 1: Dependencies суулгах

```bash
cd /path/to/Forex-Signal-App
pip install -r requirements.txt
```

### Алхам 2: Jupyter Notebook эхлүүлэх

```bash
cd ml_models
jupyter notebook EUR_USD_Week2.ipynb
```

### Алхам 3: Notebook-г ажиллуулах

Notebook нь автоматаар:
1. ✅ Өгөгдөл байгаа эсэхийг шалгана
2. ✅ Хэрэв байхгүй бол synthetic data үүсгэнэ (demo хувьд)
3. ✅ Technical indicators тооцоолно
4. ✅ Моделийг сургана
5. ✅ Үр дүнг харуулна

### Алхам 4: Жинхэнэ өгөгдөл ашиглах

Хэрэв Kaggle эсвэл UniRate API-аас өгөгдөл авсан бол:

```bash
mkdir -p data/processed
# Өгөгдлөө data/processed/EUR_USD_features.csv хавтаст хуулах
```

Notebook автоматаар энэ файлыг уншина.

---

## 📊 Хүлээгдэж буй үр дүн (Expected Results)

### Хамгийн бага (Minimum)
- Test accuracy: **55-60%**
- Өөрчлөлт: **+22-27% improvement**

### Зорилтот (Target)
- Test accuracy: **65-70%**
- Өөрчлөлт: **+32-37% improvement**

### Оптимал (Optimal)
- Test accuracy: **70%+**
- Өөрчлөлт: **+37% improvement**

⚠️ **Анхааруулга**: Хэрэв 80%+ accuracy гарвал overfitting шалгах!

---

## 🔧 Цаашид сайжруулах (Further Improvements)

### Хэрэв accuracy бага байвал:

1. **Model capacity нэмэх**:
```python
lstm_units = [512, 256, 128]  # 3 давхарга
ff_dim = 1024
```

2. **Sequence length нэмэх**:
```python
SEQUENCE_LENGTH = 240  # 4 цаг
```

3. **Learning rate бууруулах**:
```python
LEARNING_RATE = 0.00005
```

4. **Илүү их өгөгдөл**:
```python
STEP = 1  # Илүү олон дараалал
```

Нарийвчилсан заавар: `HYPERPARAMETER_TUNING_GUIDE.md` уншина уу.

---

## 📁 Үүссэн файлууд (Generated Files)

Notebook ажиллах үед дараах файлууд үүснэ:

```
models/EUR_USD_Week2/
├── best_model.keras           # Хамгийн сайн модель
├── training_history.csv       # Сургалтын түүх
├── training_history.png       # График
├── confusion_matrix.png       # Confusion matrix
├── config.json                # Тохиргоо
└── logs/                      # TensorBoard logs
```

---

## 🐛 Асуудал гарвал (Troubleshooting)

### 1. ModuleNotFoundError: No module named 'ta'
```bash
pip install ta>=0.11.0
```

### 2. ModuleNotFoundError: No module named 'tensorflow'
```bash
pip install tensorflow>=2.13.0
```

### 3. Memory Error
```python
# Batch size бууруулах
BATCH_SIZE = 32

# Эсвэл sequence length бууруулах
SEQUENCE_LENGTH = 60
```

### 4. Training-д удаан орж байна
```python
# Epochs бууруулах (туршилтын хувьд)
EPOCHS = 50

# Эсвэл step size нэмэгдүүлэх
STEP = 5
```

### 5. Overfitting (train acc >> val acc)
```python
# Dropout нэмэгдүүлэх
dropout_rate = 0.5

# Эсвэл model capacity бууруулах
lstm_units = [128, 64]
```

---

## 📚 Нэмэлт материал (Additional Resources)

### Файлууд:
- `EUR_USD_Week2.ipynb` - Main training notebook
- `HYPERPARAMETER_TUNING_GUIDE.md` - Detailed tuning guide
- `ARCHITECTURE_GUIDE.md` - Architecture explanations
- `backend/ml/models/transformer_lstm.py` - Model implementation

### External Resources:
- [TensorFlow Documentation](https://www.tensorflow.org/)
- [Keras Guide](https://keras.io/guides/)
- [Technical Analysis Library](https://technical-analysis-library-in-python.readthedocs.io/)

---

## ❓ FAQ

**Q: Яагаад synthetic data ашигладаг вэ?**
A: Demo болон туршилтын зорилгоор. Жинхэнэ өгөгдөл байвал автоматаар уншина.

**Q: Notebook хэчнээн хугацаанд ажиллах вэ?**
A: Synthetic data дээр: ~30-60 минут. Жинхэнэ өгөгдөл дээр: 1-3 цаг.

**Q: GPU шаардлагатай юу?**
A: Биш, гэхдээ GPU-тай бол 5-10x хурдан.

**Q: Accuracy 80%+ гарвал юу хийх вэ?**
A: Overfitting эсэхийг шалгах! Test set дээр дахин үнэлэх.

**Q: Accuracy-г цаашид сайжруулах боломжтой юу?**
A: Тийм! `HYPERPARAMETER_TUNING_GUIDE.md` заавар уншина уу.

---

## 🎓 Амжилт хүсье! (Good Luck!)

Асуулт байвал GitHub issue нээнэ үү эсвэл `HYPERPARAMETER_TUNING_GUIDE.md` уншина уу.

**Happy Trading! 🚀📈**
