import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
}

const CustomButton: React.FC<CustomButtonProps> = ({ title, onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#7DC36B', // Primary color
    paddingVertical: 15, // Vertical padding for height
    paddingHorizontal: 20, // Horizontal padding for width
    borderRadius: 10, // Rounded corners
    alignItems: 'center', // Center the text
    justifyContent: 'center', // Center the text
    shadowColor: '#000', // Shadow for depth
    shadowOffset: { width: 0, height: 2 }, // Shadow position
    shadowOpacity: 0.2, // Shadow transparency
    shadowRadius: 3, // Shadow blur
    elevation: 4, // Elevation for Android
    marginVertical: 10, // Spacing between elements
  },
  buttonText: {
    color: '#FFFFFF', // Text color
    fontSize: 16, // Text size
    fontWeight: 'bold', // Bold text
    fontFamily: 'Poppins-Bold', // Use a custom font if available
  },
});

export default CustomButton;
