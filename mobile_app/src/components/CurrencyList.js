import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { getColors } from "../config/theme";
import CurrencyCard from "./CurrencyCard";
import { CURRENCY_PAIRS } from "../utils/helpers";

/**
 * Currency List Component with Header
 */
const CurrencyList = ({ predictions, liveRates, onPairPress, loading }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  // Check screen width
  const screenWidth = Dimensions.get("window").width;
  const showChangeColumn = screenWidth > 420; // Hide CHG on small/medium screens

  const styles = createStyles(colors, showChangeColumn);

  // Debug: Check data
  console.log("📊 CurrencyList - predictions:", predictions);
  console.log("💱 CurrencyList - liveRates:", liveRates);

  return (
    <View style={styles.container}>
      {/* Table Header */}
      <View style={styles.tableHeader}>
        <View style={styles.symbolColumn}>
          <Text style={[styles.headerText, { textAlign: "left" }]}>Symbol</Text>
        </View>
        <View style={styles.dataColumn}>
          <Text style={styles.headerText}>Last</Text>
        </View>
        {showChangeColumn && (
          <View style={styles.dataColumn}>
            <Text style={styles.headerText}>Chg</Text>
          </View>
        )}
        <View style={styles.dataColumn}>
          <Text style={styles.headerText}>Chg%</Text>
        </View>
        <View style={styles.signalColumn}>
          <Text style={styles.headerText}>Signal</Text>
        </View>
      </View>

      {/* Currency Cards */}
      {CURRENCY_PAIRS.map((pair) => (
        <CurrencyCard
          key={pair.id}
          pair={pair}
          prediction={predictions?.[pair.name]}
          liveRate={liveRates?.[pair.name]}
          onPress={() => onPairPress(pair)}
          loading={loading}
          showChangeColumn={showChangeColumn}
        />
      ))}
    </View>
  );
};

const createStyles = (colors, showChangeColumn) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 12,
      overflow: "hidden",
      marginHorizontal: 16,
      marginTop: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    tableHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.background,
      borderBottomWidth: 2,
      borderBottomColor: colors.borderDark,
    },
    symbolColumn: {
      flex: 1.5,
    },
    dataColumn: {
      flex: 1,
      alignItems: "flex-end",
    },
    signalColumn: {
      flex: 1,
      alignItems: "flex-end",
    },
    headerText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textLabel,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
  });

export default CurrencyList;
