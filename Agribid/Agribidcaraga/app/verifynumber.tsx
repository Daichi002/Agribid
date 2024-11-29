import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableOpacity } from 'react-native'
import React, { useContext, useEffect, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router';

import { useAlert } from '../components/AlertContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../components/authcontext'; // Import the useAuth hook
import BASE_URL from '../components/ApiConfig';

const verifynumer = () => {
      const { login } = useContext(AuthContext);
      const [isResendDisabled, setIsResendDisabled] = useState(true);
      const [countdown, setCountdown] = useState(60); // start with 1 minute
      const [isLoading, setIsLoading] = useState(false);
      const [otp, setOtp] = useState('');
      const { showAlert } = useAlert();
      const { Firstname, Lastname, Phonenumber, Address, password, } = useLocalSearchParams();

      
      useEffect (() => {
        // console.log('receive to verify', Firstname, Lastname, Phonenumber , Address , password)
      });

      // Effect to handle countdown
    useEffect(() => {
      let timer: string | number | NodeJS.Timeout | undefined;
      if (isResendDisabled && countdown > 0) {
          timer = setInterval(() => {
              setCountdown(prevCountdown => prevCountdown - 1);
          }, 1000);
      } else if (countdown === 0) {
          setIsResendDisabled(false);
      }

      return () => clearInterval(timer); // Clean up interval on unmount
  }, [isResendDisabled, countdown]);

      // const Phonenumber = "+639851878816";

      useEffect(() => {
          sendOtp(Phonenumber);
      }, [Phonenumber]);

        const sendOtp = async (Phoenenumber : any) => {
          
          try {
            const response = await axios.post(`${BASE_URL}/api/send-otp`, {
              to: Phonenumber,
            });
            console.log(response.data);

            if (response.status === 200) {
              showAlert('Success, OTP sent successfully!', 3000, 'green');
              setIsResendDisabled(true);
              setCountdown(60); // Reset countdown to 60 seconds
            }
             
          } catch (error) {
            const err = error as any;
            console.error('Error sending OTP:', err.response?.data || err.message);
          }
        };
      

        const handleVerifyOtp = async () => {
          // Check if OTP and phone number are provided
          if (!otp.trim()) {
              Alert.alert("Error", "Please enter the OTP.");
              return;
          }
      
          if (!Phonenumber || typeof Phonenumber !== 'string' || Phonenumber.trim() === '') {
              Alert.alert("Error", "Please enter a valid phone number.");
              return;
          }
      
          setIsLoading(true);
      
          try {
              // Log OTP verification attempt
              console.log('Verifying OTP:', otp, Phonenumber);
      
              // Verify the OTP
              const verifyResponse = await axios.post(`${BASE_URL}/api/verify-otp`, {
                  otp: Number(otp),
                  to: Phonenumber,
              });
      
              if (verifyResponse.status !== 200) {
                  Alert.alert("Error", "Invalid OTP. Please try again.");
                  return;
              }
      
              console.log('OTP verified successfully:', verifyResponse.data);
      
              // Prepare registration data
              const registrationData = {
                  Firstname,
                  Lastname,
                  Phonenumber,
                  Address,
                  password,
              };
      
              console.log('Sending registration request with data:', registrationData);
      
              // Register the user
              const registerResponse = await axios.post(`${BASE_URL}/api/register`, registrationData, {
                  headers: {
                      'Content-Type': 'application/json',
                  },
              });
      
              if (registerResponse.status === 201 || registerResponse.status === 200) {
                  console.log("User registered successfully");
      
                  // Attempt to log the user in
                  await handleUserLogin();
              } else {
                  Alert.alert("Error", "Registration failed. Please try again.");
              }
      
          } catch (error) {
              handleError(error);
          } finally {
              setIsLoading(false);
          }
      };
      
      const handleUserLogin = async () => {
          try {
              const response = await axios.post(`${BASE_URL}/api/login`, {
                  Phonenumber: Phonenumber,
                  password: password,
              }, {
                  headers: {
                      'Content-Type': 'application/json',
                  },
              });
      
              const { token, user } = response.data;
      
              // Store token and user in AsyncStorage
              await AsyncStorage.setItem('authToken', token);
              await AsyncStorage.setItem('userInfo', JSON.stringify(user));
      
              console.log("User Data:", user);
      
              // Success notification
              Alert.alert("Success", "User registered and logged in successfully!");
      
              // Navigate to the desired screen
              showAlert('User Created And Logged In!', 3000, 'green');
              login(); // Log the user in
              router.navigate("/sell");
      
          } catch (error) {
              handleError(error, "Failed to log in. Please try again.");
          }
      };
      
      const handleError = (error: any, customMessage = "An error occurred. Please try again.") => {
          if (axios.isAxiosError(error)) {
              console.error('Error message:', error.message || 'No message provided');
              if (error.response) {
                  console.error('Response data:', error.response.data);
                  console.error('Response status:', error.response.status);
              }
          } else {
              console.error('Unexpected error:', error);
          }
          Alert.alert("Error", customMessage);
      };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Verify OTP</Text>
        
        <TextInput
          placeholder="Enter OTP"
          value={otp}
          onChangeText={setOtp}
          keyboardType="numeric"
          style={styles.input}
        />
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={() => handleVerifyOtp()}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>{isLoading ? "Verifying..." : "Verify OTP"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
                onPress={sendOtp}
                style={styles.resendContainer}
                disabled={isResendDisabled}
            >
                <Text style={styles.resendText}>Didn't receive OTP?</Text>
                <Text style={isResendDisabled ? styles.resendDisabledLink : styles.resendLink}>
                    {isResendDisabled ? `Resend OTP in ${countdown}s` : "Resend OTP"}
                </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default verifynumer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
  },
  card: {
    width: '90%',
    padding: 25,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 25,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  button: {
    width: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resendContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendLink: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 5,
  },
  resendDisabledLink: {
    fontSize: 16,
    color: '#888', // Greyed out color when disabled
},
});
