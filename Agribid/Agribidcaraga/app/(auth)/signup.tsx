import { View, Text, ScrollView, StyleSheet, Image, Alert } from 'react-native'
import React, { useState } from 'react'
import { Link, router } from "expo-router";
import { SafeAreaView } from 'react-native-safe-area-context'
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

import FormField from "../../components/formfield";
import CustomButton from "../../components/CustomButton";
import { icons } from "../../constants";

const Signup = () => {
  const [isSubmitting, setSubmitting] = useState(false);
  const [form, setform] = useState({
    Fname: '',
    Phonenumber: '',
    Address: '',
    password: '',
    Confirmpassword: ''
  });

  const submit = async () => {
    if (form.password !== form.Confirmpassword) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.post('http://localhost:8000/api/register', {
        Fname: form.Fname,
        Phonenumber: form.Phonenumber,
        Address: form.Address,
        password: form.password,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      Alert.alert("Success", "User registered successfully!");
      router.replace('/login'); // Navigate to login page after success

    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        // Handle AxiosError
        Alert.alert("Error", error.response?.data?.message || "Something went wrong!");
      } else {
        // Handle non-Axios errors
        Alert.alert("Error", "An unexpected error occurred.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className='h-full' style={{ backgroundColor: '#7DC36B' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoContainer}>
          <Image source={icons.Agribid} style={styles.logo} />
        </View>
        <Text style={styles.title}>Sign Up</Text>

        <FormField 
          title="Full Name"
          value={form.Fname}
          handleChangeText={(e: any) => setform({ ...form, Fname: e })}
          placeholder='Jane Doe'
          placeholderTextColor='#8888'
           otherStyles={undefined}        
          />

        <FormField 
          title="Phone Number"
          value={form.Phonenumber}
          handleChangeText={(e: any) => setform({ ...form, Phonenumber: e })}
          keyboardType="numeric"
          maxLength={15}
          inputMode="numeric" 
          placeholder="091234567"
          placeholderTextColor='#8888' otherStyles={undefined}        
          />

          <FormField 
          title="Address"
          value={form.Address}
          handleChangeText={(e: any) => setform({ ...form, Address: e })}
          placeholder={undefined}
          placeholderTextColor='#8888' otherStyles={undefined}        
          />

        <FormField 
          title="Password"
          value={form.password}
          handleChangeText={(e: any) => setform({ ...form, password: e })}
          maxLength={15}
          placeholder={undefined} otherStyles={undefined}       
          />

        <FormField 
          title="ConfirmPassword"
          value={form.Confirmpassword}
          handleChangeText={(e: any) => setform({ ...form, Confirmpassword: e })}
          maxLength={15}
          placeholder={undefined} otherStyles={undefined}       
          />
      
        <CustomButton 
          title={'Sign In'}  
          handlePress={submit}
          isLoading={isSubmitting}
        />
         <View style={styles.Ask}>
            <Text style={styles.asktext}>
              Already Have an Account?
            </Text>
            <Link 
              href='/login' 
              style={styles.link}>
              Sign In
            </Link>
          </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Signup

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  logoContainer: {
    width: 145,
    height: 145,
    borderRadius: 75,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 300,        // Adjust this size based on your image content
    height: 300,       // Adjust this size based on your image content
    borderRadius: 75,  // Maintain circular shape
    resizeMode: 'contain', // This ensures the image is contained within the circle
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Poppins-ExtraBold',
    textAlign: 'center',
  
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
});
