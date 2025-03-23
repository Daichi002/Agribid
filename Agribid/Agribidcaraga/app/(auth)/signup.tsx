
import { View, Text, ScrollView, StyleSheet, Image, Alert, Modal, Button, TouchableOpacity, TextInput } from 'react-native';
import React, { useState, useEffect, useContext } from 'react';
import { Link, router } from "expo-router";
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker'; // Make sure you have the Picker library installed

import FormField from "../../components/formfield";
import CustomButton from "../../components/CustomButton";
import { icons } from "../../constants";
import BASE_URL from '../../components/ApiConfig';


const Signup = () => {

  const [isSubmitting, setSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [form, setform] = useState({
    Firstname: '',
    Lastname: '',
    Phonenumber: '',
    Address: '',
    password: '',
    Confirmpassword: ''
  });

  // Type definitions
interface Province {
  code: string;
  name: string;
}

interface Municipality {
  code: string;
  name: string;
}

interface Barangay {
  code: string;
  name: string;
}

interface LookupMap {
  [key: string]: string;
}

  // State for Modal visibility
  const [modalVisible, setModalVisible] = useState(false);

  // State for Province, Municipality, and Barangay
  const [Provinces, setProvinces] = useState<Province[]>([]);
  const [Municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [Barangays, setBarangays] = useState<Barangay[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<string>('160200000'); // Pre-selected province
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('160202000'); // Pre-selected municipality
  const [selectedBarangay, setSelectedBarangay] = useState<string>(''); // Optional pre-selected barangay


  const submit = async () => {

    setSubmitting(true);

    const missingFields = [];
  // Check each field and add the missing ones to the array
  if (!form.Firstname) {
    missingFields.push("First Name");
  }
  if (!form.Lastname) {
    missingFields.push("last Name");
  }
  if (!form.Phonenumber) {
    missingFields.push("Phone Number");
  }
  if (!form.Address) {
    missingFields.push("Address");
  }
  if (!form.password) {
    missingFields.push("Password");
  }

  // If there are any missing fields, show an alert with a detailed message
  if (missingFields.length > 0) {
    const missingFieldsMessage = missingFields.join(", ");
    Alert.alert("Please fill in the following fields:", missingFieldsMessage);
    setSubmitting(false); // Stop the submission process due to validation errors
    return;
  }

    if (form.password !== form.Confirmpassword) {
      Alert.alert("Error", "Password do not match!");
      setSubmitting(false);
      return;
    }

     // Add +63 prefix if not already present
  const formattedPhonenumber = form.Phonenumber.startsWith("+63")
  ? form.Phonenumber
  : `+63${form.Phonenumber}`;

    setIsLoading(true);
    
    try {
      // Check if the phone number already exists
      const checkResponse = await axios.get(`${BASE_URL}/api/check-phone`, {
        params: { Phonenumber: formattedPhonenumber },
        headers: { 'Content-Type': 'application/json' },
      });
  
      if (checkResponse.data.exists) {
        Alert.alert("Error", "Phone number cannot be used.");
        setIsLoading(false);
        setSubmitting(false);
        return;
      }

      console.log('sending to vefiry')
      router.push({
        pathname: '/verifynumber',
        params: {
        Firstname: form.Firstname,
        Lastname: form.Lastname,
        Phonenumber: formattedPhonenumber,
        Address: form.Address,
        password: form.password, // Assuming the receiver is the product user
        },
      });   

    } catch (error: unknown) {
      setIsLoading(false);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 409) {
          Alert.alert("Error", "Phone number already exists.");
        } else {
          Alert.alert("Error", error.response?.data?.message || "Something went wrong!");
        }
      } else {
        Alert.alert("Error", "An unexpected error occurred.");
      }    
    } finally {
      setSubmitting(false);
    }
  };

  const [provinceLookup, setProvinceLookup] = useState<{ [key: string]: string }>({});
  const [municipalityLookup, setMunicipalityLookup] = useState<{ [key: string]: string }>({});
  const [barangayLookup, setBarangayLookup] = useState<{ [key: string]: string }>({});


  const fetchProvinces = async () => {
    try {
      const response = await fetch(`https://psgc.gitlab.io/api/provinces/`);
      const data: Province[] = await response.json();
      setProvinces(data.sort((a, b) => a.name.localeCompare(b.name)));
  
      // Create province lookup
      const provinceMap: LookupMap = data.reduce((acc: LookupMap, curr) => {
        acc[curr.code] = curr.name;
        return acc;
      }, {});
      setProvinceLookup(provinceMap);
    } catch (error) {
      console.error('Error fetching provinces:', error);
    }
  };
  
  const fetchMunicipalities = async (provinceCode: string) => {
    try {
      const response = await fetch(`https://psgc.gitlab.io/api/provinces/${provinceCode}/cities-municipalities`);
      const data: Municipality[] = await response.json();
      setMunicipalities(data.sort((a, b) => a.name.localeCompare(b.name)));
  
      // Create municipality lookup
      const municipalityMap: LookupMap = data.reduce((acc: LookupMap, curr) => {
        acc[curr.code] = curr.name;
        return acc;
      }, {});
      setMunicipalityLookup(municipalityMap);
    } catch (error) {
      console.error('Error fetching municipalities:', error);
    }
  };
  
  const fetchBarangays = async (municipalityCode: string) => {
    try {
      const response = await fetch(`https://psgc.gitlab.io/api/cities-municipalities/${municipalityCode}/barangays`);
      const data: Barangay[] = await response.json();
      setBarangays(data.sort((a, b) => a.name.localeCompare(b.name)));
  
      // Create barangay lookup
      const barangayMap: LookupMap = data.reduce((acc: LookupMap, curr) => {
        acc[curr.code] = curr.name;
        return acc;
      }, {});
      setBarangayLookup(barangayMap);
    } catch (error) {
      console.error('Error fetching barangays:', error);
    }
  };
  

useEffect(() => {
  fetchProvinces();
}, []);

useEffect(() => {
  if (selectedProvince) {
    fetchMunicipalities(selectedProvince);
  }
}, [selectedProvince]);

useEffect(() => {
  if (selectedMunicipality) {
    fetchBarangays(selectedMunicipality);
  }
}, [selectedMunicipality]);


const handleAddressSelect = () => {
  // // Get the names from the lookup objects
  // const selectedProvinceName = provinceLookup[selectedProvince] || '';
  // const selectedMunicipalityName = municipalityLookup[selectedMunicipality] || '';
  // const selectedBarangayName = barangayLookup[selectedBarangay] || '';

  // // Format and set the selected address
  // const selectedAddress = `${selectedProvinceName}, ${selectedMunicipalityName}, ${selectedBarangayName}`;
  // setform({ ...form, Address: selectedAddress });
  // setModalVisible(false); // Close the modal

   // Set form.Address to the selected barangay
   if (selectedBarangay) {
    setform((prevForm) => ({
      ...prevForm,
      Address: barangayLookup[selectedBarangay], // Set the barangay name as the address
    }));
  }
  setModalVisible(false); // Close the modal after confirming the address
};

  return (
    <SafeAreaView style={{ backgroundColor: '#7DC36B', height: '100%', padding: 10 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoContainer}>
          <Image source={icons.Agribid} style={styles.logo} />
        </View>
        <Text style={styles.title}>Sign Up</Text>

        <FormField 
          title="First Name"
          value={form.Firstname}
          handleChangeText={(e: any) => setform({ ...form, Firstname: e })}
          placeholder='Jane'
          placeholderTextColor='#8888'
          isSubmitting={isSubmitting} 
        />

        <FormField 
          title="last Name"
          value={form.Lastname}
          handleChangeText={(e: any) => setform({ ...form, Lastname: e })}
          placeholder='Doe'
          placeholderTextColor='#8888'
          isSubmitting={isSubmitting} 
        />
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
          <>
              <TouchableOpacity onPress={() => setModalVisible(true) }>
                <Text style={styles.formTitle}>Address</Text>
                <View style={styles.addressInputContainer}>
                <Text style={[styles.addressInput, !form.Address && styles.placeholderaddress]}>
                    {form.Address || 'Select Address'}
                  </Text>
                </View>
              </TouchableOpacity>

   
              <Modal visible={modalVisible} animationType="slide" transparent={true}>
                <View style={styles.modalContainer}>
                  {/* function comment for future progress */}
                  {/* <Text style={styles.label}>Province</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedProvince}
                      onValueChange={(itemValue) => setSelectedProvince(itemValue)}
                      style={styles.picker}
                    >
                      {Object.entries(provinceLookup).map(([code, name]) => (
                        <Picker.Item key={code} label={name} value={code} />
                      ))}
                    </Picker>
                  </View> */}

                  {/* <Text style={styles.label}>Municipality</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={selectedMunicipality}
                      onValueChange={(itemValue) => setSelectedMunicipality(itemValue)}
                      style={styles.picker}
                    >
                      {Object.entries(municipalityLookup).map(([code, name]) => (
                        <Picker.Item key={code} label={name} value={code} />
                      ))}
                    </Picker>
                  </View> */}

                  <Text style={styles.label}>Barangay</Text>
                  <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedBarangay}
                    onValueChange={(itemValue) => setSelectedBarangay(itemValue)}
                    style={styles.picker}
                  >
                    {/* Placeholder option to reset selection */}
                    <Picker.Item label="Choose an address" value="placeholder" color="gray" />
                    
                    {/* Map through the barangayLookup for other options */}
                    {Object.entries(barangayLookup)
                      .sort((a, b) => a[1].localeCompare(b[1])) // Sort alphabetically by name
                      .map(([code, name]) => (
                        <Picker.Item key={code} label={name} value={code} />
                      ))}
                  </Picker>  
                  </View>
                  <View style={styles.buttonaddress}> 
                  <CustomButton title="Confirm Address" handlePress={handleAddressSelect} 
                  isLoading={false} setIsLoading={function (loading: boolean): void {} }/>
                  <CustomButton title="Cancel" handlePress={() => setModalVisible(false)} 
                  isLoading={false} setIsLoading={function (loading: boolean): void {} }/>
                  </View>
                </View>
              </Modal>
            </>
   
        <FormField 
          title="Password"
          value={form.password}
          handleChangeText={(e: any) => setform({ ...form, password: e })}
          maxLength={15}
          placeholder="password"
          placeholderTextColor='#8888'
          isSubmitting={isSubmitting} 
        />

        <FormField 
          title="ConfirmPassword"
          value={form.Confirmpassword}
          handleChangeText={(e: any) => setform({ ...form, Confirmpassword: e })}
          maxLength={15}
          placeholder="Confirmpassword"
          placeholderTextColor='#8888'
        />
      
        <CustomButton 
          title={'Sign Up'}  
          handlePress={submit}
          isLoading={isSubmitting}
          setIsLoading={function (loading: boolean): void {} }
        />
          
        <View style={styles.Ask}>
          <Text style={styles.asktext}>Already Have an Account?</Text>
          <Link href='/login' style={styles.link}>Sign In</Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Signup;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  numbercontainer: {
    // margin: 20,
    // height: 40,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    // overflow: 'hidden', // Ensure the border wraps around both inputs
    // backgroundColor: '#f5f5f5',
  },
  numberinput: {
    flex: 1,
    // padding: 10,
    // paddingLeft: 30, // Add padding to prevent text from overlapping the country code
    fontSize: 16,
  },
  numberinputplaceholder: {
    paddingLeft: 23, // Adjust the padding value as needed
    fontSize: 16, // Adjust the font size as needed
  },
  countryCodeContainer: {
    marginTop: 26,
    position: 'absolute',
    left: 3,
    top: 4.5,
    // backgroundColor: '#f5f5f5', // Background color to match the input
    zIndex: 1, // Ensure it stays above the input
  },
  countryCode: {
    fontSize: 16,
    width: 40, // Fixed width to ensure consistent layout
    textAlign: 'center', // Center the text
    color: '#1F1F1F', // Adjust based on your theme
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
    width: 300,
    height: 300,
    borderRadius: 75,
    resizeMode: 'contain',
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
    paddingTop: 35,
  },
  asktext: {
    fontSize: 13,
    color: '#f0f0f0',
    fontFamily: 'Poppins-ExtraBold',
  },
  link: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: '#007bff',
  },
  modalContainer: {
    marginTop: 200,
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#bdc8d6', // Border color for the container
    borderRadius: 24, // Rounded corners for the container
    backgroundColor: '#fff', // White background for picker
    overflow: 'hidden',
    marginVertical: 10, // Spacing between pickers
  },
  picker: {
    width: '100%',
    height: 60,
  },
  label: {
    fontSize: 16,
    marginVertical: 10,
  },
  addressContainer: {
    marginBottom: 8, // Adjust space between fields
    width: '100%', // Ensure it spans the full width
  },
  formTitle: {
    fontSize: 12, // Adjust as needed
    color: '#F5F5F5', // Adjust based on your theme
    fontFamily: 'Poppins-Regular', // Adjust based on your font family
  },
  addressInputContainer: {
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
  addressInput: {
    flex: 1,
    color: '#1F1F1F', // Adjust based on your theme
    fontFamily: 'Poppins-Regular', // Adjust based on your font family
    fontSize: 16, // Adjust as needed
  },
  placeholderaddress: {
    color: '#8888',
  },  
  placeholder: {
    textDecorationColor: '#8888',
  },
  buttonaddress: {
   gap: 2,
  },
});
