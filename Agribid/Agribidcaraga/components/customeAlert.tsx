import React, { useEffect } from 'react';
import { Text, StyleSheet, Animated, Dimensions } from 'react-native';

interface CustomAlertProps {
  message: string;
  duration: number;
  onDismiss: () => void;
  color: 'red' | 'green'; // Add a prop for color
}

const CustomAlert: React.FC<CustomAlertProps> = ({ message, duration, onDismiss, color }) => {
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
    <Animated.View
      style={[
        styles.alertContainer,
        { opacity: fadeAnim, backgroundColor: color }, // Dynamically set background color
      ]}
    >
      <Text style={styles.alertText}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  alertContainer: {
    position: 'absolute',
    top: '50%', // Center vertically
    left: '50%', // Center horizontally
    width: '80%', // Set a responsive width
    padding: 10,
    zIndex: 1000,
    alignItems: 'center',
    transform: [{ translateX: -Dimensions.get('window').width * 0.4 }, { translateY: -25 }], // Center on the screen
    borderRadius: 5,
  },
  alertText: {
    color: 'white',
    fontSize: 16,
  },
});

export default CustomAlert;
