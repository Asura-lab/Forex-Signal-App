import React from "react";
import { View, StyleSheet } from "react-native";
import CurrencyCard from "./CurrencyCard";
import { CURRENCY_PAIRS } from "../utils/helpers";

/**
 * Currency List Component - Professional style
 */
const CurrencyList = ({ liveRates, onPairPress, loading, colors }) => {
  const styles = createStyles(colors);
  
  return (
    <View style={styles.container}>
      {CURRENCY_PAIRS.map((pair) => (
        <CurrencyCard
          key={pair.id}
          pair={pair}
          liveRate={liveRates?.[pair.name]}
          onPress={() => onPairPress(pair)}
          loading={loading}
          colors={colors}
        />
      ))}
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors?.background || "#0D1421",
  },
});

export default CurrencyList;
