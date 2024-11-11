// CustomAlert.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface CustomAlertProps {
  message: string;
  duration: number;
  onDismiss: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({ message, duration, onDismiss }) => {
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
    top: '50%', // Center vertically
    left: '50%', // Center horizontally
    width: '100%', // Make the alert container take up 100% width
    padding: 10,
    backgroundColor: 'green',
    zIndex: 1000,
    alignItems: 'center',
    transform: [{ translateX: -200 }], // Adjust horizontally to center
    borderRadius: 5, // Optional: rounded corners
  },
  alertText: {
    color: 'white',
    fontSize: 16,
  },
});

export default CustomAlert;
