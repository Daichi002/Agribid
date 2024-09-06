import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, StyleProp, TextInputProps, ViewStyle } from "react-native";
import { icons } from "../constants";

interface FormFieldProps extends TextInputProps {
    title: string;
    value: string;
    placeholder?: string;
    handleChangeText: (e: string) => void;
    otherStyles?: StyleProp<ViewStyle>; // Use StyleProp for styles
  }
  

  const FormField: React.FC<FormFieldProps> = ({
  title,
  value,
  placeholder,
  handleChangeText,
  otherStyles,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, otherStyles]}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#1F1F1F"
          onChangeText={handleChangeText}
          secureTextEntry={title === "Password" && !showPassword}
          {...props}
        />

        {title === "Password" && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Image
              source={!showPassword ? icons.eye : icons.eyeHide}
              style={styles.icon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}   
        {title === "ConfirmPassword" && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Image
              source={!showPassword ? icons.eye : icons.eyeHide}
              style={styles.icon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}   
      </View>
    </View>
  );
};

export default FormField;

const styles = StyleSheet.create({
  container: {
    marginBottom: 8, // Adjust space between fields
  },
  title: {
    fontSize: 12, // Equivalent to 'text-base'
    color: '#F5F5F5', // Equivalent to 'text-gray-100'
    fontFamily: 'Poppins-Regular', // Adjust based on your font family
  },
  inputContainer: {
    width: '100%',
    maxWidth: '100%',
    height: 50,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff', // Equivalent to 'bg-black-100'
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#bdc8d6', // Equivalent to 'border-black-200'
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: '#1F1F1F', // Equivalent to 'text-white'
    fontFamily: 'Poppins-Regular', // Adjust based on your font family
    fontSize: 16, // Equivalent to 'text-base'
  },
  icon: {
    width: 24,
    height: 24,
  },
});
