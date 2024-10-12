import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';

// Define the types for the props
interface CustomButtonProps {
  title: string;
  handlePress: () => void; // Function with no arguments and no return value
  containerStyles?: StyleProp<ViewStyle>; // Optional container styles
  otherStyles?: StyleProp<ViewStyle>;
  textStyles?: StyleProp<TextStyle>; // Optional text styles
  isLoading: boolean; // Indicates if the button is in loading state
}

const CustomButtonproduct: React.FC<CustomButtonProps> = ({
  title,
  handlePress,
  containerStyles,
  otherStyles,
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

export default CustomButtonproduct;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#32DF81', // Secondary color
    borderRadius: 10,
    paddingVertical: 12, // Vertical padding
    paddingHorizontal: 30, // Horizontal padding
    height: 45, // Fixed height for the button
    width: 110,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff', // Primary color, replace with actual value
    fontFamily: 'Poppins-Regular', // Replace with actual font family
    fontSize: 15, // Font size for text
  },
  loader: {
    marginLeft: 8, // Space between text and loader
  },
});
