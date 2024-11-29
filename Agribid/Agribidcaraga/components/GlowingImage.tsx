import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

interface GlowingImageProps {
  source: { uri: string } | number;
  glow?: boolean;
  defaultColor?: string;
  glowColor?: string;
  width?: number;
  height?: number;
}

const GlowingImage: React.FC<GlowingImageProps> = ({ source, glow = false, defaultColor = 'green', glowColor = 'lime', width = 90, height = 60 }) => {
  const animatedGlow = useRef(new Animated.Value(0)).current; // Animated value for glowing effect

  useEffect(() => {
    if (glow) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedGlow, {
            toValue: 1,
            duration: 500, // Glow in duration
            useNativeDriver: false,
          }),
          Animated.timing(animatedGlow, {
            toValue: 0,
            duration: 500, // Glow out duration
            useNativeDriver: false,
          }),
        ]),
        { iterations: -1 } // Loop indefinitely
      ).start();
    } else {
      animatedGlow.stopAnimation();
      animatedGlow.setValue(0); // Reset to default color
    }
  }, [glow]);

  const interpolatedGlowColor = animatedGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [defaultColor, glowColor], // Transition between default and glow color
  });

  return (
    <View style={styles.container}>
      <Animated.Image
        source={source}
        style={[
          styles.image,
          {
            tintColor: interpolatedGlowColor,
            width,
            height,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    zIndex: 1,
  },
});

export default GlowingImage;
