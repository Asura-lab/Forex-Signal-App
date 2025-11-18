# 🤖 Reinforcement Learning Forex Trading Strategy

## 📋 Тойм

**Зорилго**: Reinforcement Learning (RL) ашиглан автомат Forex арилжааны систем бүтээх

**Арга зүй**: Deep Q-Network (DQN) эсвэл Proximal Policy Optimization (PPO)

**Давуу тал**:

- ✅ Өөрөө сурдаг (no manual labeling)
- ✅ Зах зээлийн динамикт дасан зохицоно
- ✅ Risk management суралцана
- ✅ Бодит арилжааны шийдвэр гаргана

---

## 🏗️ Архитектур

### 1️⃣ **Environment (Trading Environment)**

```python
State Space:
- OHLCV өгөгдөл (1-min bars)
- 55 technical indicators
- Portfolio state (balance, position, PnL)
- Market context (session, volatility)

Action Space:
- 0: HOLD (хүлээх)
- 1: BUY (худалдан авах)
- 2: SELL (зарах)
- 3: CLOSE (позиц хаах)

Reward Function:
- Positive: Ашигтай арилжаа (+realized PnL)
- Negative: Алдагдалтай арилжаа (-realized PnL)
- Small penalty: Хураамж болон spread (-0.0002 per trade)
- Time penalty: Удаан хүлээсэн (-0.0001 per step with open position)
```

### 2️⃣ **Agent (Deep RL Agent)**

**Model Architecture:**

```
Input (State) → LSTM/Transformer → Dense Layers → Q-values/Policy
```

**Algorithms to Test:**

1. **DQN (Deep Q-Network)**: Дискрет action space
2. **PPO (Proximal Policy Optimization)**: Policy gradient
3. **A3C (Advantage Actor-Critic)**: Асинхрон сургалт

### 3️⃣ **Training Strategy**

```python
Episodes: 1000+
Steps per episode: 1440 (1 day of 1-min data)
Experience Replay: 100,000 transitions
Batch Size: 64
Learning Rate: 0.0001
Discount Factor (γ): 0.99
Exploration (ε): 1.0 → 0.01 (decay)
```

---

## 📊 Implementation Plan

### **Week 1: Environment Setup**

- ✅ Forex Trading Environment бүтээх (gym.Env)
- ✅ State space тодорхойлох
- ✅ Reward function дизайн
- ✅ Backtesting framework

### **Week 2: Agent Development**

- ✅ DQN agent implement
- ✅ Experience Replay memory
- ✅ Target network
- ✅ Training loop

### **Week 3: Training & Optimization**

- ✅ Kaggle historical data дээр сургах
- ✅ Hyperparameter tuning
- ✅ Reward function оптимизаци
- ✅ Multiple episodes

### **Week 4: Evaluation & Deployment**

- ✅ Test set дээр үнэлгээ
- ✅ Live trading simulation
- ✅ UniRate API integration
- ✅ Backend deployment

---

## 🎯 Reward Function Design

### Option 1: Simple PnL-based

```python
reward = realized_pnl - trading_fee
```

### Option 2: Sharpe Ratio

```python
reward = (returns - risk_free_rate) / volatility
```

### Option 3: Risk-adjusted (Recommended)

```python
reward = pnl - max_drawdown_penalty - trading_cost
```

### Option 4: Multi-objective

```python
reward = α × profit + β × (1 - drawdown) - γ × trades_count
```

---

## 📈 Performance Metrics

**Training:**

- Average Reward per Episode
- Win Rate (winning trades %)
- Average Trade Duration
- Exploration vs Exploitation ratio

**Backtesting:**

- Total Return (%)
- Sharpe Ratio
- Maximum Drawdown (%)
- Win Rate & Profit Factor
- Average Trade PnL

---

## 🔧 Technical Stack

**RL Framework:**

- Stable-Baselines3 (PyTorch-based)
- OpenAI Gym (Environment)
- TensorFlow/Keras (Alternative)

**Data:**

- Kaggle historical data (training)
- UniRate API (live trading)

**Deployment:**

- Flask backend
- MongoDB (trade history)
- React Native app

---

## 🚀 Getting Started

```bash
# Install RL dependencies
pip install stable-baselines3 gym

# Run training notebook
jupyter notebook ml_models/RL_Forex_Training.ipynb

# Evaluate trained agent
python backend/rl_agent/evaluate.py
```

---

## 📚 References

- [Stable-Baselines3 Documentation](https://stable-baselines3.readthedocs.io/)
- [OpenAI Gym](https://gym.openai.com/)
- [Deep Reinforcement Learning for Trading](https://arxiv.org/abs/1911.10107)

---

**Last Updated**: 2025-11-18
**Status**: 🚧 In Development
