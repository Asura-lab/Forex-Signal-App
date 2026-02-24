import React, { useEffect, useRef } from "react";
import { View, Text, Image, Animated, StyleSheet, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const scale = useRef(new Animated.Value(0.75)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Phase 1: fade + scale in
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Phase 2: hold for 1.2s then fade out
      setTimeout(() => {
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }).start(() => {
          onFinish();
        });
      }, 1200);
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <Animated.View
        style={[
          styles.logoWrapper,
          { transform: [{ scale }], opacity },
        ]}
      >
        <Image
          source={require("../../assets/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={{ opacity }}>
        <Text style={styles.appName}>PREDICTRIX</Text>
        <Text style={styles.subtitle}>AI Trading Assistant</Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  logoWrapper: {
    marginBottom: 28,
    shadowColor: "#00C853",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 30,
    elevation: 20,
  },
  logo: {
    width: width * 0.38,
    height: width * 0.38,
    borderRadius: (width * 0.38) / 5,
  },
  appName: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 5,
    textAlign: "center",
  },
  subtitle: {
    color: "#4ADE80",
    fontSize: 13,
    letterSpacing: 2,
    textAlign: "center",
    marginTop: 8,
    opacity: 0.85,
  },
});

export default SplashScreen;
