import { View, Text, ScrollView, StyleSheet, Image, Alert } from 'react-native'
import React, { useContext, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAlert } from '../../components/AlertContext';

import FormField from "../../components/formfield";
import CustomButton from "../../components/CustomButton";
import { icons } from "../../constants";
import axios from 'axios';
import { AuthContext } from '../../components/authcontext'; // Import the useAuth hook
import BASE_URL from '../../components/ApiConfig';




const Login = () => {
  const { login } = useContext(AuthContext);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isLoading,setIsLoading] = useState(false);
  const { showAlert } = useAlert();

  const [form, setform] = useState({
    Firstname: '',
    Lastname: '',
    password: ''
  });

  const isFormValid = () => {
    return form.Firstname !== ''&& form.Lastname !== '' && form.password !== '';
  };

  const submit = async () => {
    setSubmitting(true); // This sets the form to "submitting" state, which shows the validation errors if any.

    if (!isFormValid()) {
        // If the form is not valid, show the alert and exit without setting `isLoading` to true.
        setSubmitting(false); // Set submitting back to false after validation error
        showAlert('Please fill all the required fields', 3000, 'orange', 'Error');
        return; // Return early to prevent further execution
    }
  
    setIsLoading(true);
    try {
        const response = await axios.post(`${BASE_URL}/api/Admin/login`, {
            Firstname: form.Firstname,
            Lastname: form.Lastname,
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
            Firstname: '',
            Lastname: '',
            password: '',      
          });
          // Simulate a loading delay for a smoother UX experience
          setTimeout(() => {
            showAlert('WELCOME Admin!', 3000, 'green');
            // Alert.alert("Success", "Logged in successfully!");

            // Navigate to the tabs screen after successful login
            setIsLoading(false);
            setSubmitting(false);
            console.log('Logging in...');
            router.navigate("/sell");
            login(); 
        }, 2000);

    } catch (error: unknown) {
      setIsLoading(false); // Reset the loading state
      setSubmitting(false);
  
      if (axios.isAxiosError(error)) {
          if (error.response) {
              if (error.response.status === 401 || error.response.status === 422) {
                  Alert.alert("Error", "User does not exist or invalid credentials");
                  showAlert('User does not exist or invalid credentials', 3000, 'red', 'Error');
              } else if (error.response.status === 403) {
                  Alert.alert("Error", "You are not authorized to access this resource.");
                  showAlert('You are not authorized to access.', 3000, 'orange', 'Error');
              } else if (error.response.status === 422) {
                  const errors = error.response.data.errors;
                  if (errors.password && errors.password.includes('password.min')) {
                      Alert.alert("Error", "Password must be at least 6 characters long.");
                      showAlert('Password must be at least 6 characters long.', 3000, 'orange', 'Error');
                  } else {
                      // Handle other validation errors
                      Alert.alert("Error", "An error occurred during login.");
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

return (
  <SafeAreaView style={styles.safeContainer}>
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={icons.Agribid} style={styles.logo} />
      </View>
      <View style={styles.conts}>
        <Text style={styles.title}>Admin Sign In</Text>
        <View style={styles.wrapper}>
          <View style={styles.inputGroup}>
            <FormField
              style={styles.numberinput}
              title="First Name"
              value={form.Firstname}
              handleChangeText={(e) => setform({ ...form, Firstname: e })}
              placeholder="Jane"
              placeholderTextColor="#888"
              isSubmitting={isSubmitting}
            />
            <FormField
              style={styles.numberinput}
              title="Last Name"
              value={form.Lastname}
              handleChangeText={(e) => setform({ ...form, Lastname: e })}
              placeholder="Doe"
              placeholderTextColor="#888"
              isSubmitting={isSubmitting}
            />
            <FormField
              style={styles.numberinput}
              title="Password"
              value={form.password}
              handleChangeText={(e) => setform({ ...form, password: e })}
              maxLength={15}
              placeholder="Password"
              placeholderTextColor="#888"
              isSubmitting={isSubmitting}
            />
          </View>
          <CustomButton
            title="Sign In"
            handlePress={submit}
            isLoading={isSubmitting}
            setIsLoading={(loading) => setSubmitting(loading)}
          />
        </View>
      </View>
    </View>
  </SafeAreaView>
);
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#7DC36B',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    width: '100%',
  },
  conts: {
    width: '100%',
    maxWidth: 500,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', // Optional shadow effect for web
  },
  logoContainer: {
    marginTop: -90,
    alignItems: 'center',
    marginBottom: 90,  // Adjusted margin to control spacing
    height: 250, // Increased the logo size
    width: 250,  // Increased the logo size
  },
  logo: {
    width: 450,  // Increased the logo size
    height: 450, // Increased the logo size
    resizeMode: 'contain',  // Ensures it scales correctly without distortion
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    marginBottom: 20,
  },
  wrapper: {
    alignContent: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  numberinput: {
    height: "auto",
    width: "100%",
    padding: 10,
    fontSize: 16,
    color: '#333',                                                  
  },
  ask: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  askText: {
    fontSize: 14,
    color: '#333',
    marginRight: 5,
  },
  link: {
    fontSize: 14,
    color: '#007bff',
    textDecorationLine: 'underline',
  },
});


export default Login;