import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router';

import { useAlert } from '../components/AlertContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const verifynumer = () => {
      const [isResendDisabled, setIsResendDisabled] = useState(true);
      const [countdown, setCountdown] = useState(60); // start with 1 minute
      const [isLoading, setIsLoading] = useState(false);
      const [otp, setOtp] = useState('');
      const { showAlert } = useAlert();
      const {currentUserId, Firstname, Lastname, Phonenumber, address} = useLocalSearchParams();

      
      useEffect (() => {
        // console.log('receive to verify', Firstname, Lastname, Phonenumber , address);
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
            const response = await axios.post('http://10.0.2.2:8000/api/send-otp', {
              to: Phonenumber,
            });
            console.log(response.data);

            if (response.status === 200) {
              showAlert('Success", "OTP sent successfully!', 3000);
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
              const verifyResponse = await axios.post('http://10.0.2.2:8000/api/verify-otp', {
                  otp: Number(otp),
                  to: Phonenumber,
              });
      
              if (verifyResponse.status !== 200) {
                  Alert.alert("Error", "Invalid OTP. Please try again.");
                  return;
              }
      
              console.log('OTP verified successfully:', verifyResponse.data);
              const token = await AsyncStorage.getItem('authToken');
                if (!token) {
                  console.error('No auth token found');
                  return;
                }
      
              // Prepare registration data
              const updateData = {
                  Firstname,
                  Lastname,
                  Phonenumber,
                  address: address,
              };
      
              console.log('Sending registration request with data:', updateData);
      
              // Register the user
              const Response = await axios.put(`http://10.0.2.2:8000/api/users/${currentUserId}`, updateData, {
                  headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json',
                  },
              });
      
              if (Response.status === 201 || Response.status === 200) {
                  console.log("User Updated successfully");

                  let updatedUser = Response.data.user;
  
                // Normalize the keys to match what is stored in AsyncStorage
                updatedUser = {
                  ...updatedUser,
                  address: updatedUser.address,
                  phonenumber: updatedUser.phonenumber,
                };
      
                  await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUser));
                  // return to log the userprofile
                  showAlert('User Updated successfully!', 3000);
                  router.push('/profile/userdetails'); 
              } else {
                  Alert.alert("Error", "Update failed. Please try again.");
              }
      
          } catch (error) {
              handleError(error);
          } finally {
              setIsLoading(false);
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
