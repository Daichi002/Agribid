import React, { createContext, useContext, useState, useEffect } from 'react';
import { Image, Animated, StyleSheet, View } from 'react-native';

// Create a context for managing glow state
const GlowContext = createContext();

// GlowProvider to wrap the app or specific sections
export const GlowProvider = ({ children }) => {
  const [glow, setGlow] = useState(false);

  return (
    <GlowContext.Provider value={{ glow, setGlow }}>
      {children}
    </GlowContext.Provider>
  );
};

// Hook to use the glow state
export const useGlow = () => useContext(GlowContext);

// GlowingImage component
export const GlowingImage = ({ source, style }) => {
  const { glow } = useContext(GlowContext);
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    if (glow) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      animatedValue.stopAnimation();
      animatedValue.setValue(0);
    }
  }, [glow]);

  const animatedStyle = {
    shadowOpacity: animatedValue,
    shadowRadius: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 10],
    }),
    shadowColor: 'green',
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Image source={source} style={[styles.image, style]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 90,
    height: 60,
  },
});
