import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';

// Define the types for the props
interface CustomButtonProps {
  title: string;
  handlePress: () => void; // Function with no arguments and no return value
  containerStyles?: StyleProp<ViewStyle>; // Optional container styles
  textStyles?: StyleProp<TextStyle>; // Optional text styles
  isLoading: boolean; // Indicates if the button is in loading state
}

const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  handlePress,
  containerStyles,
  textStyles,
  isLoading,
}) => {
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[
        styles.container,
        containerStyles,
        isLoading && { opacity: 0.5 }, // Apply opacity when loading
      ]}
      disabled={isLoading}
    >
      <Text style={[styles.text, textStyles]}>
        {title}
      </Text>

      {isLoading && (
        <ActivityIndicator
          animating={isLoading}
          color="#fff"
          size="small"
          style={styles.loader}
        />
      )}
    </TouchableOpacity>
  );
};

export default CustomButton;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#32DF81', // Secondary color, replace with actual value
    borderRadius: 10,
    padding: 12,
    paddingHorizontal: 30,
    minHeight: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff', // Primary color, replace with actual value
    fontFamily: 'Poppins-Regular', // Replace with actual font family
    fontSize: 18, // Font size for text
  },
  loader: {
    marginLeft: 8, // Space between text and loader
  },
});
