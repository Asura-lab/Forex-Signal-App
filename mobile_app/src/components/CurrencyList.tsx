import React from "react";
import { View, StyleSheet } from "react-native";
import CurrencyCard from "./CurrencyCard";
import { CURRENCY_PAIRS, CurrencyPair } from "../utils/helpers";

interface CurrencyListProps {
  liveRates: Record<string, any>;
  onPairPress: (pair: CurrencyPair) => void;
  loading: boolean;
  colors: any;
}

/**
 * Currency List Component - Professional style
 */
const CurrencyList: React.FC<CurrencyListProps> = ({ liveRates, onPairPress, loading, colors }) => {
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

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors?.background || "#0D1421",
  },
});

export default CurrencyList;
