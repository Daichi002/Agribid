import { View, Text, ScrollView, StyleSheet, Image, TextInput, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, router } from "expo-router";
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native';
import { useAlert } from '../../components/AlertContext';

import FormField from "../../components/formfield";
import CustomButton from "../../components/CustomButton";
import { icons } from "../../constants";
import axios from 'axios';
import { Alert } from 'react-native';



const Login = () => {
  const [validationError ,setValidationError] = useState({});
  const navigation = useNavigation();
  const [isSubmitting, setSubmitting] = useState(false);
  const [isLoading,setIsLoading] = useState(false);
  const { showAlert } = useAlert();

  const [form, setform] = useState({
    Phonenumber: '',
    password: ''
  });

  const isFormValid = () => {
    return form.Phonenumber !== '' && form.password !== '';
  };

  const submit = async () => {
    setSubmitting(true); // This sets the form to "submitting" state, which shows the validation errors if any.

    if (!isFormValid()) {
        // If the form is not valid, show the alert and exit without setting `isLoading` to true.
        setSubmitting(false); // Set submitting back to false after validation error
        Alert.alert("Error", "Please fill all the required fields");
        return; // Return early to prevent further execution
    }
    // Add +63 prefix if not already present
  const formattedPhonenumber = form.Phonenumber.startsWith("+63")
  ? form.Phonenumber
  : `+63${form.Phonenumber}`;

    setIsLoading(true);

    try {
        const response = await axios.post('https://trusting-widely-goldfish.ngrok-free.app/api/login', {
            Phonenumber: formattedPhonenumber,
            password: form.password
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
        });

         // Assuming your API returns a structure like { token, user }
          const { token, user } = response.data;

          // Store token and user in AsyncStorage
          await AsyncStorage.setItem('authToken', token);
          await AsyncStorage.setItem('userInfo', JSON.stringify(user));
          console.log("User Data:", response.data);

          // Log all user data to the console
          // console.log("User Data:", user);
          setform({
            Phonenumber: '',
            password: '',      
          });
          // Simulate a loading delay for a smoother UX experience
          setTimeout(() => {
            showAlert('LogIn Successfully!', 3000);
            // Alert.alert("Success", "Logged in successfully!");

            // Navigate to the tabs screen after successful login
            setIsLoading(false);
            setSubmitting(false);
            router.navigate("/sell");
        }, 2000);

    } catch (error: unknown) {
        setIsLoading(false); // Reset the loading state
        setSubmitting(false);

        if (axios.isAxiosError(error)) {
            if (error.response) {
                if (error.response.status === 401) {
                    Alert.alert("Error", "User does not exist or invalid credentials");
                } else if (error.response.status === 422) {
                    const errors = error.response.data.errors;
                    if (errors.password && errors.password.includes('password.min')) {
                        Alert.alert("Error", "Password must be at least 6 characters long.");
                    } else {
                        // Handle other validation errors
                        setValidationError(errors);
                    }
                } else {
                    Alert.alert("Error", error.response.data.message || "An error occurred during login.");
                }
            } else {
                Alert.alert("Error", error.message || "An error occurred. Please try again.");
            }
        } else if (error instanceof Error) {
            Alert.alert("Error", error.message);
        } else {
            Alert.alert("Error", "An unknown error occurred");
        }
    }
};

// Function to handle the reset and navigate
const handleForgotPasswordClick = () => {
  // Reset the form state
  setform({
    Phonenumber: '',
    password: '',
  });
  
  // Navigate to the ForgotPassword page
  router.navigate('/ForgotPassword');
};

  return (
    <SafeAreaView style={{ backgroundColor: '#7DC36B', height: '100%', padding: 10  }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoContainer}>
          <Image source={icons.Agribid} style={styles.logo} />
        </View>
        <Text style={styles.title}>Sign In</Text>

        <View style={styles.numbercontainer}>
        <FormField 
          style={styles.numberinputplaceholder}
          title="Phone Number"
          value={form.Phonenumber}
          handleChangeText={(e: any) => {
            // Remove all non-numeric characters
            let numericValue = e.replace(/[^0-9]/g, '');

                // If it starts with '0' and has more than one digit, remove the leading '0'
            if (numericValue.startsWith('0') && numericValue.length > 1) {
              numericValue = numericValue.slice(1);
            }
          
            // Check that the cleaned number now starts with '9'
            if (numericValue.length > 0 && numericValue[0] !== '9') {
              return; // Discard input if it doesn't start with '9'
            }

            // Update the form state with the valid phone number
            setform({ ...form, Phonenumber: numericValue });
          }}
            keyboardType="numeric"
            maxLength={10} // Allow up to 11 digits (including country code)
            inputMode="numeric" 
            placeholder="91234567"
            placeholderTextColor='#8888'
            otherStyles={styles.numberinput}  
            isSubmitting={isSubmitting}      
          />
          <View style={styles.countryCodeContainer}>
          <TextInput
            style={styles.countryCode}
            editable={false} // Make it non-editable
            value="+63" // Display the country code
          />
        </View>
        </View>

        <FormField 
          title="Password"
          value={form.password}
          handleChangeText={(e: any) => setform({ ...form, password: e })}
          maxLength={15}
          placeholder='Password'
          placeholderTextColor='#8888'
          otherStyles={undefined}     
          isSubmitting={isSubmitting}   
          />

          <View style={styles.forgot}> 
          <TouchableOpacity 
            onPress={handleForgotPasswordClick} // Trigger reset and navigation        
          >
            <Text  style={styles.link}>Forgot Password </Text>
          </TouchableOpacity>
          </View>

        <CustomButton 
          title={'Sign In'}
          handlePress={submit}
          isLoading={isSubmitting} 
          setIsLoading={function (loading: boolean): void {} }/>       
         <View style={styles.Ask}>
            <Text style={styles.asktext}>
              Don't have an account?
            </Text>
            <Link 
              href='/signup' 
              style={styles.link}>
              Signup
            </Link>
          </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Login

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  logoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 320,        // Adjust this size based on your image content
    height: 320,       // Adjust this size based on your image content
    borderRadius: 75,  // Maintain circular shape
    resizeMode: 'contain', // This ensures the image is contained within the circle
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Poppins-ExtraBold',
    textAlign: 'center',
    marginBottom: 20,
  },
  numbercontainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberinput: {
    flex: 1,
    // padding: 10,
    // paddingLeft: 30, // Add padding to prevent text from overlapping the country code
    fontSize: 16,
    width: '100%',
  },
  numberinputplaceholder: {
    paddingLeft: 23, // Adjust the padding value as needed
    fontSize: 16, // Adjust the font size as needed
  },
  countryCodeContainer: {
    marginTop: 26,
    position: 'absolute',
    left: 3,
    top: 2,
    // backgroundColor: '#f5f5f5', // Background color to match the input
    zIndex: 1, // Ensure it stays above the input
  },
  countryCode: {
    fontSize: 16,
    width: 40, // Fixed width to ensure consistent layout
    textAlign: 'center', // Center the text
    color: '#1F1F1F', // Adjust the color as needed
  },
  Ask: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 35, // Equivalent to pt-5
    gap: 8, // React Native does not support gap, use margin instead if needed
  },
  asktext: {
    fontSize: 13, // Equivalent to text-lg
    color: '#f0f0f0', // Equivalent to text-gray-100
    fontFamily: 'Poppins-ExtraBold', // Replace with actual font family
  },
  link: {
    fontSize: 13, // Equivalent to text-lg
    fontFamily: 'Poppins-Medium', // Replace with actual font family
    color: '#007bff', // Equivalent to text-secondary
  },

  forgot: {
    paddingBottom: 20,
    alignSelf: 'flex-start',
  },

  placeholder: {
    color: '#fffff',
  }
});
