import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, StyleProp, TextInputProps, ViewStyle } from "react-native";
import { icons } from "../constants";

interface FormFieldProps extends TextInputProps {
  title: string;
  value: string;
  placeholder?: string;
  handleChangeText: (e: string) => void;
  otherStyles?: StyleProp<ViewStyle>; // Use StyleProp for styles
  isRequired?: boolean; // New prop to check if the field is required
  isSubmitting?: boolean; // Prop to control when validation should be shown
}

const FormField: React.FC<FormFieldProps> = ({
  title,
  value = "",  // Make sure the default value is an empty string to avoid undefined/null
  placeholder,
  handleChangeText,
  otherStyles,
  isRequired = false, // Default to false, no validation unless explicitly required
  isSubmitting = false, // Default is false, change only after form is submitted
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // To store error messages

  // Validate the field if it's required and empty
  useEffect(() => {
    if (isRequired) {
      if (title === "Password") {
        if (value.length > 0 && value.length < 6) {
          setErrorMessage("Password must be at least 6 characters long.");
        } else {
          setErrorMessage("");
        }
      } else if (!value) {
        setErrorMessage(`${title} is required.`);
      } else {
        setErrorMessage("");
      }
    }
  }, [value, isRequired, title]);


  return (
    <View style={[styles.container, otherStyles]}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            errorMessage ? { borderColor: "red" } : {}, // Red border if there’s an error
          ]}
          value={value || ''}  // Ensure value is a string, even when empty
          placeholder={placeholder}
          placeholderTextColor="#888" // Use a clearer color for the placeholder
          onChangeText={handleChangeText}
          secureTextEntry={(title === "Password" || title === "ConfirmPassword") && !showPassword}
          {...props}
        />

        {(title === "Password" || title === "ConfirmPassword") && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Image
              source={!showPassword ? icons.eyeHide : icons.eye}
              style={styles.icon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Display error message if form is submitted and field is required but empty */}
      {isSubmitting && errorMessage ? (
        <Text style={styles.errorMessage}>{errorMessage}</Text>
      ) : null}
    </View>
  );
};
export default FormField;

const styles = StyleSheet.create({
  container: {
    marginBottom: 8, // Adjust space between fields
    
  },
  title: {
    fontSize: 15, // Equivalent to 'text-base'
    color: 'black', // Equivalent to 'text-gray-100'
    fontWeight: 'bold', // Equivalent to 'font-bold'
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
   errorMessage: {
    color: "red",
    marginTop: 5,
    fontSize: 12,
  },
});
