import { View, Text, ScrollView, StyleSheet, Image } from 'react-native'
import React, { useState } from 'react'
import { Link } from "expo-router";
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native';

import FormField from "../../components/formfield";
import CustomButton from "../../components/CustomButton";
import { icons } from "../../constants";
import axios from 'axios';
import { Alert } from 'react-native';

const Login = () => {
  const [validationError, setValidationError] = useState({});
  const navigation = useNavigation();
  const [isSubmitting, setSubmitting] = useState(false);
  const [form, setform] = useState({
    Phonenumber: '',
    password: ''
  });

  const submit = async () => {
    setSubmitting(true);

    try {
      const response = await axios.post('http://localhost:8000/api/login', {
        Phonenumber: form.Phonenumber,
        password: form.password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Handle successful login, e.g., store token and navigate
      const { token } = response.data;
      // Store token (e.g., AsyncStorage, or any state management)
      Alert.alert("Success", "Logged in successfully!");
      navigation.navigate("(tabs)"); // Navigate to the (tabs)home folder

    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        // Handle errors from axios
        if (error.response && error.response.status === 422) {
          setValidationError(error.response.data.errors);
        } else {
          Alert.alert("Error", error.response ? error.response.data.message : error.message);
        }
      } else if (error instanceof Error) {
        // Handle generic JavaScript errors
        Alert.alert("Error", error.message);
      } else {
        // Handle any other types of errors
        Alert.alert("Error", "An unknown error occurred");
      }
    }
  };

  return (
    <SafeAreaView className='h-full' style={{ backgroundColor: '#7DC36B' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoContainer}>
          <Image source={icons.Agribid} style={styles.logo} />
        </View>
        <Text style={styles.title}>Sign In</Text>

        <FormField 
          title="Phone Number"
          value={form.Phonenumber}
          handleChangeText={(e: any) => setform({ ...form, Phonenumber: e })}
          keyboardType="numeric"
          maxLength={15}
          inputMode="numeric" 
          placeholder="091234567"
          placeholderTextColor='#8888'
           otherStyles={undefined}        
          />

        <FormField 
          title="Password"
          value={form.password}
          handleChangeText={(e: any) => setform({ ...form, password: e })}
          maxLength={15}
          placeholder={undefined} otherStyles={undefined}       
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
        />
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
