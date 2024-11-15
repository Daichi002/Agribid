import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Image} from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { router} from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import FormField from "../components/formfield";
import { icons } from '../constants';
import { useAlert } from '../components/AlertContext';

const ForgotPassword = () => {
  const navigation = useNavigation();
  const { showAlert } = useAlert();
  const [step, setStep] = useState(1);
  const [form, setform] = useState({
    otp: '',
    Phonenumber: '',
    newPassword: '',
    Confirmpassword: ''
  });
  
  const Phonenumber = form.Phonenumber.startsWith("+63")
  ? form.Phonenumber
  : `+63${form.Phonenumber}`;

  // Check if phone number exists
  const handlePhoneNumberSubmit = async () => {
    console.log(Phonenumber);
    try {
      const response = await axios.post('http://192.168.31.160:8000/api/check-phone-exist', 
        { Phonenumber: Phonenumber });
      
      // Assuming 'message' is returned from the Laravel response
      if (response.status === 200) {
        const response = await axios.post('http://192.168.31.160:8000/api/send-otp', {
            to: Phonenumber,
          });
          if (response.status === 200) {
            setStep(2);
            showAlert('Your One-Time Password (OTP) has been successfully sent!', 3000);
          } else {
            Alert.alert('Error', 'OTP error. Please try again.');
          }
        
      } else if (response.status === 404) {
        Alert.alert('Error', response.data.message);  // Error message returned from the server
      }
    } catch (error) {
        console.log('Error details:', error); 
      Alert.alert('Error', 'An error occurred. Please try again later.');
    }
  };  

  // Verify OTP
  const handleOtpSubmit = async () => {
    try {
      const response = await axios.post('http://192.168.31.160:8000/api/verify-otp', 
        { to:Phonenumber, otp: form.otp });
      if (response.status === 200) {
        setStep(3);
      } else {
        Alert.alert('Error', 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Invalid OTP. Please try again.');
    }
  };

  // Update password
  const handlePasswordUpdate = async () => {
    if (form.newPassword !== form.Confirmpassword) {
        Alert.alert("Error", "Password do not match!");
        return;
      }
      console.log(form.newPassword);
    try {
      const response = await axios.post('http://192.168.31.160:8000/api/updatepassword', 
        { Phonenumber, newPassword: form.newPassword });
      if (response.status === 200) {
        // Alert.alert('Success', 'Password has been updated.');
        handleLoginSuccess();
        setform({
            Phonenumber: '',
            otp: '',
            newPassword: '',
            Confirmpassword: ''
          });
        router.navigate("/login");
      }
    } catch (error) {
      console.log('Error details:', error);
      Alert.alert('Error', 'Could not update password. Please try again.');
    }
  };

  const handleLoginSuccess = () => {
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000); // Dismiss alert after 3 seconds
  };

  return (
    <SafeAreaView style={styles.safeArea}>
         <View style={styles.headerContainer}>
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
      <Image source={icons.leftArrow} style={styles.backIconImage} />
    </TouchableOpacity>
    <Text style={styles.headerText}>Reset Password</Text>
  </View>

    <View style={styles.container}>
      {step === 1 && (
        <View style={styles.stepContainer}>
          <Text style={styles.title}>Enter your Phone Number</Text>
          <View style={styles.numbercontainer}>
        <FormField 
          style={styles.numberinputplaceholder}
          title="Phone Number"
          value={form.Phonenumber}
          handleChangeText={(e: any) => {
            // Remove all non-numeric characters
            let numericValue = e.replace(/[^0-9]/g, '');

            // Check if the numeric value is empty or starts with '0'
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
          otherStyles={styles.otherinput}  
          placeholderTextColor='#8888'     
        />
          <View style={styles.countryCodeContainer}>
          <TextInput
            style={styles.countryCode}
            editable={false} // Make it non-editable
            value="+63" // Display the country code
          />
          </View>
          </View>
          <TouchableOpacity style={styles.button} onPress={handlePhoneNumberSubmit}>
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 2 && (
        <View style={styles.stepContainer}>
          <Text style={styles.title}>Enter OTP</Text>
          <View style={styles.numbercontainer}>
          <FormField 
          style={styles.numberinputplaceholder}
          title="Otp"
          value={form.otp}
          handleChangeText={(e: any) => setform({ ...form, otp: e })}
          keyboardType="numeric"
          maxLength={10} // Allow up to 11 digits (including country code)
          inputMode="numeric" 
          placeholder="Enter Otp"
          otherStyles={styles.otherinput} 
          placeholderTextColor='#8888'     
        />
        </View>
          <TouchableOpacity style={styles.button} onPress={handleOtpSubmit}>
            <Text style={styles.buttonText}>Verify OTP</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 3 && (
        <View style={styles.stepContainer}>
          <Text style={styles.title}>Enter New Password</Text>
          <FormField 
          title="Password"
          value={form.newPassword}
          handleChangeText={(e: any) => setform({ ...form, newPassword: e })}
          maxLength={15}
          placeholder="password"
          placeholderTextColor='#8888'
        />

        <FormField 
          title="ConfirmPassword"
          value={form.Confirmpassword}
          handleChangeText={(e: any) => setform({ ...form, Confirmpassword: e })}
          maxLength={15}
          placeholder="Confirmpassword"
          placeholderTextColor='#8888'
        />
          <TouchableOpacity style={styles.button} onPress={handlePasswordUpdate}>
            <Text style={styles.buttonText}>Update Password</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
        flex: 1,
        backgroundColor: '#F2F2F7',
        // maxHeight: 800,
      },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: '#28a745',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  backIcon: {
    marginRight: 10,
    padding: 10,
    borderRadius: 50,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backIconImage: {
    tintColor: '#28a745',
    width: 24,
    height: 24,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  stepContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  numbercontainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeContainer: {
    marginTop: 26,
    position: 'absolute',
    left: 3,
    top: 2,
    zIndex: 1, // Ensure it stays above the input
  },
  countryCode: {
    fontSize: 16,
    width: 40, // Fixed width to ensure consistent layout
    textAlign: 'center', // Center the text
    color: '#1F1F1F', // Adjust based on your theme
  },
  numberinputplaceholder: {
    paddingLeft: 23, // Adjust the padding value as needed
    fontSize: 16, // Adjust the font size as needed
  },
  otherinput: {
    flex: 1,
    fontSize: 16,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    width: '100%',
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ForgotPassword;
