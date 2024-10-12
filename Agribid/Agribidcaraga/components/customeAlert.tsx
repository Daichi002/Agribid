import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const CustomAlert = ({ message, duration, onDismiss }) => {
  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onDismiss();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, fadeAnim, onDismiss]);

  return (
    <Animated.View style={[styles.alertContainer, { opacity: fadeAnim }]}>
      <Text style={styles.alertText}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  alertContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'green',
    zIndex: 1000,
    alignItems: 'center',
  },
  alertText: {
    color: 'white',
    fontSize: 16,
  },
});

export default CustomAlert;
