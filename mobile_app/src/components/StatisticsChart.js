import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SIGNAL_TYPES } from "../utils/helpers";

/**
 * Статистикийн график компонент
 */
const StatisticsChart = ({ statistics }) => {
  if (!statistics) return null;

  // Нийт дүнг тооцоолох
  const total = Object.values(statistics).reduce(
    (sum, stat) => sum + stat.count,
    0
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Таамаглалын хуваарилалт</Text>

      {Object.entries(statistics).map(([trendName, data]) => {
        // Ангилалын label олох
        const label = Object.keys(SIGNAL_TYPES).find(
          (key) => SIGNAL_TYPES[key].name === trendName
        );
        const signal = SIGNAL_TYPES[label];
        const percentage = (data.count / total) * 100;

        return (
          <View key={trendName} style={styles.row}>
            <View style={styles.labelContainer}>
              <Text style={styles.emoji}>{signal?.emoji || "❓"}</Text>
              <Text style={styles.label} numberOfLines={1}>
                {signal?.shortName || trendName}
              </Text>
            </View>

            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${percentage}%`,
                    backgroundColor: signal?.color || "#9E9E9E",
                  },
                ]}
              />
              <Text style={styles.percentage}>{percentage.toFixed(1)}%</Text>
            </View>

            <Text style={styles.count}>{data.count.toLocaleString()}</Text>
          </View>
        );
      })}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Нийт:</Text>
        <Text style={styles.totalValue}>{total.toLocaleString()} мөр</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 100,
  },
  emoji: {
    fontSize: 16,
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    color: "#424242",
    fontWeight: "600",
    flex: 1,
  },
  barContainer: {
    flex: 1,
    height: 24,
    backgroundColor: "#E0E0E0",
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 8,
    justifyContent: "center",
  },
  bar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 12,
  },
  percentage: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#212121",
    textAlign: "center",
    zIndex: 1,
  },
  count: {
    fontSize: 12,
    color: "#757575",
    width: 50,
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#424242",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2196F3",
  },
});

export default StatisticsChart;
