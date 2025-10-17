# Форекс Сигнал Аппликейшн - React Native

React Native аппликейшн хөгжүүлэхэд шаардлагатай бүх мэдээлэл энд байна.

## Файлын бүтэц

```
ForexSignalApp/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js          # Үндсэн дэлгэц
│   │   ├── PredictionScreen.js    # Таамаглал харуулах дэлгэц
│   │   └── HistoryScreen.js       # Түүх харах дэлгэц
│   ├── components/
│   │   ├── CurrencyCard.js        # Валютын хос карт
│   │   ├── TrendIndicator.js      # Хандлага үзүүлэх компонент
│   │   └── ChartView.js           # График харуулах
│   ├── services/
│   │   └── api.js                 # Backend API холболт
│   └── utils/
│       └── helpers.js             # Туслах функцууд
├── App.js
└── package.json
```

## 1. Package.json

```json
{
  "name": "ForexSignalApp",
  "version": "1.0.0",
  "main": "expo-router entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios"
  },
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.72.0",
    "expo": "~49.0.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/stack": "^6.3.0",
    "axios": "^1.6.0",
    "react-native-chart-kit": "^6.12.0",
    "react-native-svg": "13.9.0"
  }
}
```

## 2. Суулгах

```bash
# React Native Expo проект үүсгэх
npx create-expo-app ForexSignalApp
cd ForexSignalApp

# Шаардлагатай сангууд суулгах
npm install @react-navigation/native @react-navigation/stack
npm install axios react-native-chart-kit react-native-svg
```

## 3. API Service (src/services/api.js)

```javascript
import axios from "axios";

// Backend API хаяг (өөрийн backend IP хаягаа оруулна уу)
const API_BASE_URL = "http://YOUR_BACKEND_IP:5000";

// API client үүсгэх
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * API холболтыг шалгах
 */
export const checkApiStatus = async () => {
  try {
    const response = await apiClient.get("/");
    return response.data;
  } catch (error) {
    console.error("API холболт амжилтгүй:", error);
    throw error;
  }
};

/**
 * Моделийн мэдээлэл авах
 */
export const getModelInfo = async () => {
  try {
    const response = await apiClient.get("/model_info");
    return response.data;
  } catch (error) {
    console.error("Моделийн мэдээлэл авах алдаа:", error);
    throw error;
  }
};

/**
 * Форекс хөдөлгөөн таамаглах
 * @param {Array} data - OHLCV дата массив
 */
export const predictForexTrend = async (data) => {
  try {
    const response = await apiClient.post("/predict", { data });
    return response.data;
  } catch (error) {
    console.error("Таамаглал хийх алдаа:", error);
    throw error;
  }
};

/**
 * Файлаас таамаглал хийх
 * @param {string} filePath - CSV файлын зам
 */
export const predictFromFile = async (filePath) => {
  try {
    const response = await apiClient.post("/predict_file", {
      file_path: filePath,
    });
    return response.data;
  } catch (error) {
    console.error("Файлаас таамаглал хийх алдаа:", error);
    throw error;
  }
};

export default {
  checkApiStatus,
  getModelInfo,
  predictForexTrend,
  predictFromFile,
};
```

## 4. Trend Indicator Component (src/components/TrendIndicator.js)

```javascript
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const TrendIndicator = ({ trend, confidence }) => {
  // Өнгө сонгох
  const getColor = () => {
    if (trend.includes("up")) return "#4CAF50";
    if (trend.includes("down")) return "#F44336";
    return "#FFC107";
  };

  // Emoji сонгох
  const getEmoji = () => {
    if (trend === "High volatility up") return "📈🚀";
    if (trend === "Medium volatility up") return "📈";
    if (trend === "No trend") return "➡️";
    if (trend === "Medium volatility down") return "📉";
    if (trend === "High volatility down") return "📉💥";
    return "❓";
  };

  return (
    <View style={[styles.container, { backgroundColor: getColor() }]}>
      <Text style={styles.emoji}>{getEmoji()}</Text>
      <Text style={styles.trend}>{trend}</Text>
      <Text style={styles.confidence}>{confidence.toFixed(1)}% итгэлтэй</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  trend: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
  },
  confidence: {
    fontSize: 14,
    color: "#FFF",
    marginTop: 5,
    opacity: 0.9,
  },
});

export default TrendIndicator;
```

## 5. Currency Card Component (src/components/CurrencyCard.js)

```javascript
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const CurrencyCard = ({ pair, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.pair}>{pair}</Text>
      <Text style={styles.subtitle}>Таамаглал харах</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#2196F3",
    padding: 20,
    borderRadius: 10,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  pair: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
  },
  subtitle: {
    fontSize: 14,
    color: "#FFF",
    marginTop: 5,
    opacity: 0.8,
  },
});

export default CurrencyCard;
```

## 6. Home Screen (src/screens/HomeScreen.js)

```javascript
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import CurrencyCard from "../components/CurrencyCard";
import { checkApiStatus } from "../services/api";

const HomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState(null);

  const currencyPairs = [
    "EUR/USD",
    "GBP/USD",
    "USD/CAD",
    "USD/CHF",
    "USD/JPY",
    "XAU/USD",
  ];

  useEffect(() => {
    checkApi();
  }, []);

  const checkApi = async () => {
    try {
      const status = await checkApiStatus();
      setApiStatus(status);
      setLoading(false);
    } catch (error) {
      Alert.alert(
        "Холболтын алдаа",
        "Backend API-тай холбогдож чадсангүй. Сервер ажиллаж байгаа эсэхээ шалгана уу."
      );
      setLoading(false);
    }
  };

  const handleCurrencyPress = (pair) => {
    navigation.navigate("Prediction", { pair });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Холбогдож байна...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Форекс Сигнал</Text>
        <Text style={styles.subtitle}>AI-аар хөтлөгддөг таамаглал</Text>
        {apiStatus && <Text style={styles.status}>✓ Сервер ажиллаж байна</Text>}
      </View>

      <View style={styles.pairsContainer}>
        <Text style={styles.sectionTitle}>Валютын хослолууд</Text>
        {currencyPairs.map((pair) => (
          <CurrencyCard
            key={pair}
            pair={pair}
            onPress={() => handleCurrencyPress(pair)}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    backgroundColor: "#2196F3",
    padding: 30,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFF",
  },
  subtitle: {
    fontSize: 16,
    color: "#FFF",
    marginTop: 5,
    opacity: 0.9,
  },
  status: {
    fontSize: 14,
    color: "#4CAF50",
    marginTop: 10,
    fontWeight: "bold",
  },
  pairsContainer: {
    padding: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 16,
    marginTop: 10,
    marginBottom: 10,
    color: "#333",
  },
});

export default HomeScreen;
```

## 7. Prediction Screen (src/screens/PredictionScreen.js)

```javascript
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import TrendIndicator from "../components/TrendIndicator";
import { predictFromFile, getModelInfo } from "../services/api";

const PredictionScreen = ({ route }) => {
  const { pair } = route.params;
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);

  useEffect(() => {
    loadPrediction();
  }, []);

  const loadPrediction = async () => {
    try {
      // Валютын хосны файлын нэр үүсгэх
      const fileName = pair.replace("/", "_") + "_test.csv";
      const filePath = `data/test/${fileName}`;

      // Таамаглал ба модель мэдээлэл авах
      const [predResult, modelData] = await Promise.all([
        predictFromFile(filePath),
        getModelInfo(),
      ]);

      setPrediction(predResult);
      setModelInfo(modelData);
      setLoading(false);
    } catch (error) {
      Alert.alert("Алдаа", "Таамаглал хийх явцад алдаа гарлаа");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Таамаглал хийж байна...</Text>
      </View>
    );
  }

  if (!prediction) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Таамаглал хийх боломжгүй</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pair}>{pair}</Text>
        <Text style={styles.timestamp}>
          {new Date().toLocaleString("mn-MN")}
        </Text>
      </View>

      <TrendIndicator
        trend={prediction.latest_prediction.trend}
        confidence={prediction.latest_prediction.confidence}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Магадлалууд</Text>
        {Object.entries(prediction.statistics).map(([trend, data]) => (
          <View key={trend} style={styles.probabilityRow}>
            <Text style={styles.trendText}>{trend}</Text>
            <View style={styles.probabilityBar}>
              <View
                style={[
                  styles.probabilityFill,
                  { width: `${data.percentage}%` },
                ]}
              />
              <Text style={styles.probabilityText}>
                {data.percentage.toFixed(1)}%
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Статистик</Text>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Нийт дата:</Text>
          <Text style={styles.statValue}>
            {prediction.total_predictions.toLocaleString()}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.refreshButton} onPress={loadPrediction}>
        <Text style={styles.refreshText}>🔄 Шинэчлэх</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#F44336",
  },
  header: {
    backgroundColor: "#2196F3",
    padding: 20,
    alignItems: "center",
  },
  pair: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFF",
  },
  timestamp: {
    fontSize: 14,
    color: "#FFF",
    marginTop: 5,
    opacity: 0.8,
  },
  section: {
    backgroundColor: "#FFF",
    margin: 16,
    padding: 20,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  probabilityRow: {
    marginBottom: 15,
  },
  trendText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  probabilityBar: {
    height: 30,
    backgroundColor: "#E0E0E0",
    borderRadius: 5,
    overflow: "hidden",
    justifyContent: "center",
  },
  probabilityFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#2196F3",
  },
  probabilityText: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 16,
    color: "#666",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  refreshButton: {
    backgroundColor: "#4CAF50",
    margin: 16,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  refreshText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
  },
});

export default PredictionScreen;
```

## 8. Main App (App.js)

```javascript
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "./src/screens/HomeScreen";
import PredictionScreen from "./src/screens/PredictionScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: "#2196F3",
          },
          headerTintColor: "#FFF",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Prediction"
          component={PredictionScreen}
          options={{ title: "Таамаглал" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## Аппликейшн ажиллуулах заавар

### Backend эхлүүлэх:

```bash
# Python шаардлагатай сангууд суулгах
pip install flask flask-cors pandas numpy scikit-learn hmmlearn

# HMM модель сургах
jupyter notebook HMM_machine_learning.ipynb
# (Notebook дахь cell бүрийг дарааллаар ажиллуулна)

# Backend API эхлүүлэх
python backend_api.py
```

### React Native аппликейшн эхлүүлэх:

```bash
# Аппликейшн үүсгэх
npx create-expo-app ForexSignalApp
cd ForexSignalApp

# Энэ README-д байгаа кодуудыг харгалзах файлуудад хуулах

# Сангууд суулгах
npm install

# Аппликейшн эхлүүлэх
npm start

# Android эсвэл iOS эмулятор дээр ажиллуулах
npm run android  # эсвэл
npm run ios
```

### Анхааруулга:

1. `src/services/api.js` дахь `API_BASE_URL`-ийг өөрийн backend IP хаягаар солино уу
2. Backend болон аппликейшн нэг сүлжээнд байх ёстой
3. Test дата файлууд зөв замд байгаа эсэхийг шалгана уу

## Онцлогууд

✅ 5 ангилалын таамаглал (HMM модель)
✅ Real-time магадлал үзүүлэлт
✅ 6 валютын хос дэмжих
✅ Ойлгомжтой UI/UX
✅ Walking Forward сургалт
✅ Backtest шалгалт

Амжилт хүсье! 🚀
