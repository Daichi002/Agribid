import { View, Text, ScrollView, StyleSheet, Image } from 'react-native'
import React, { useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, router } from "expo-router";
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native';
import CustomAlert from '../../components/customeAlert';

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
  const [showAlert, setShowAlert] = useState(false);

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

    setIsLoading(true);

    try {
        const response = await axios.post('http://10.0.2.2:8000/api/login', {
            Phonenumber: form.Phonenumber,
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

          // Log all user data to the console
          console.log("User Data:", user);

          // Simulate a loading delay for a smoother UX experience
          setTimeout(() => {
            handleLoginSuccess();
            // Alert.alert("Success", "Logged in successfully!");

            // Navigate to the tabs screen after successful login
            setIsLoading(false);
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

const handleLoginSuccess = () => {
  setShowAlert(true);
  setTimeout(() => setShowAlert(false), 3000); // Dismiss alert after 3 seconds
};

  return (
    <SafeAreaView style={{ backgroundColor: '#7DC36B', height: '100%' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoContainer}>
          <Image source={icons.Agribid} style={styles.logo} />
        </View>
        <Text style={styles.title}>Sign In</Text>

        <FormField 
            title="Phone Number"
            value={form.Phonenumber}
            handleChangeText={(e: any) => {
              // Ensure only numeric values are allowed
              const numericValue = e.replace(/[^0-9]/g, '');
              setform({ ...form, Phonenumber: numericValue });
            }}
            keyboardType="numeric"
            maxLength={11}
            inputMode="numeric" 
            placeholder="091234567"
            placeholderTextColor='#8888'
            otherStyles={undefined}   
            isSubmitting={isSubmitting}      
          />

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
            <Link 
              href='/' 
              style={styles.link}>
              Forgot Password
            </Link>
          </View>

        <CustomButton 
          title={'Sign In'}
          handlePress={submit}
          isLoading={isSubmitting} 
          setIsLoading={function (loading: boolean): void {} }/>   

           {showAlert && (
        <CustomAlert
          message="Logged in successfully!"
          duration={3000}
          onDismiss={() => setShowAlert(false)}
        />
      )}      
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
    marginRight: 160,
  },
  placeholder: {
    color: '#fffff',
  }
});
