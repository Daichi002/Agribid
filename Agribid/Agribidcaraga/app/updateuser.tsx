import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Image, Modal, FlatList, RefreshControl, Dimensions, ImageBackground } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation,  useFocusEffect  } from '@react-navigation/native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import { icons } from "../constants";
import { router } from 'expo-router';
import BASE_URL from '../components/ApiConfig';

const screenWidth = Dimensions.get('window').width;

interface Barangay {
  code: string;
  name: string;
}

interface User {
  id: number;
  firstname: string;
  lastname: string;
  phonenumber: string;
  address: string;
}

interface MessageGroup {
  id: string;
  first: {
    product_id: any;
    sender_id: any;
    receiver_id: any;
    sessions: any;
    sender: any;
    receiver: any;
    product: any;
    created_at: string;
  };
  latest: {
    updated_at: string;
    id: string;
    sender_id: string;
    isRead: boolean;
  };
  isRead: boolean;
  // Add other properties as needed
}



const UpdateuserScreen = () => {
    const [isSubmitting, setSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();
    const [Firstname, setFirstname] = useState('');
    const [Lastname, setLastname] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [currentUser, setCurrentUser] = useState<User | null>(null); 
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [forceRender, setForceRender] = useState(false); 
    const [Barangays, setBarangays] = useState<Barangay[]>([]);
    const [selectedMunicipality, setSelectedMunicipality] = useState<string>('160202000');
    const [selectedBarangay, setSelectedBarangay] = useState<string>('');
    const [barangayLookup, setBarangayLookup] = useState<{ [key: string]: string }>({});

      // Fetch barangays based on the municipality code
      useEffect(() => {
        const fetchBarangays = async (municipalityCode: string) => {
          try {
            const cachedBarangays = await AsyncStorage.getItem(`barangays_${municipalityCode}`);
            if (cachedBarangays) {
              const barangays = JSON.parse(cachedBarangays);
              setBarangays(barangays);
              setBarangayLookup(createBarangayLookup(barangays));
              // console.log('Barangays loaded from cache');
            } else {
              const response = await fetch(`https://psgc.gitlab.io/api/cities-municipalities/${municipalityCode}/barangays`);
              const data: Barangay[] = await response.json();
              setBarangays(data.sort((a, b) => a.name.localeCompare(b.name)));
              await AsyncStorage.setItem(`barangays_${municipalityCode}`, JSON.stringify(data));
              setBarangayLookup(createBarangayLookup(data));
              // console.log('Barangays fetched from API and cached');
            }
          } catch (error) {
            console.error('Error fetching barangays:', error);
          }
        };
    
        fetchBarangays(selectedMunicipality);
      }, [selectedMunicipality]);
    
      // Create barangay lookup
      const createBarangayLookup = (barangays: Barangay[]) => {
        return barangays.reduce((acc, curr) => {
          acc[curr.code] = curr.name;
          return acc;
        }, {} as { [key: string]: string });
      };

// normalize data for a more dynamic variable sync
const normalizeKeys = (obj: { [key: string]: any }): { [key: string]: any } => {
  const normalizedObj: { [key: string]: any } = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      normalizedObj[key.toLowerCase()] = obj[key];
    }
  }
  return normalizedObj;
};

// fetch userinfo from the asyncstorage
useEffect(() => {
  const fetchUserInfo = async () => {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) {
        const parsedUser = JSON.parse(userInfo); // Assuming userInfo is a valid JSON string
        const normalizedUser = normalizeKeys(parsedUser); // Normalize keys

        setCurrentUser(normalizedUser as User);

        const userId = Number(normalizedUser.id);
        if (!isNaN(userId)) {
          setCurrentUserId(userId);
        } else {
          console.error('Invalid user ID:', normalizedUser.id);
        }
        // console.log('Fetched profileUser:', normalizedUser);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      Alert.alert('Error', 'Could not fetch user info.');
    }
  };
  fetchUserInfo();
}, [forceRender]);

 // Preset form fields with fetched user data  //having when new user is logged in 
 useEffect(() => {
  // console.log('normalize', currentUser)
  if (currentUser) {
    setFirstname(currentUser.firstname || '');
    setLastname(currentUser.lastname || '');
    
    // Remove +63 prefix if present
    const phoneNumberWithoutPrefix = currentUser.phonenumber?.startsWith('+63')
      ? currentUser.phonenumber.slice(3)
      : currentUser.phonenumber || '';
      
    setPhoneNumber(phoneNumberWithoutPrefix);
    setAddress(currentUser.address || '');

    // console.log('Current user:', currentUser);
    // console.log('Barangay Lookup:', barangayLookup);

    const barangayName = currentUser.address || '';
    const barangayCode = Object.keys(barangayLookup).find(key => barangayLookup[key] === barangayName);

    // console.log('Mapping address to barangay code:', barangayName, barangayCode);
    setSelectedBarangay(barangayCode || '');
    // console.log('Selected barangay code set to:', barangayCode);
  }
}, [currentUser, barangayLookup]);



  // Update user details
  const handleSave = async () => {
    // console.log('User details:', { Firstname, Lastname, phoneNumber, address });  
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }

    const formattedPhonenumber = phoneNumber.startsWith("+63")
  ? phoneNumber
  : `+63${phoneNumber}`;

   // Check if the phone number already exists
   const checkResponse = await axios.get(`${BASE_URL}/api/check-phone`, {
    params: { Phonenumber: formattedPhonenumber, currentUserId },
    headers: { 'Content-Type': 'application/json' },
  });

  if (checkResponse.data.exists) {
    Alert.alert("Error", "Phone number already exists.");
    setIsLoading(false);
    setSubmitting(false);
    return;
  }
  
  const address = barangayLookup[selectedBarangay];

  console.log('sending to vefiry')
      router.push({
        pathname: '/verifyupdateuser',
        params: {
        currentUserId,
        Firstname,
        Lastname,
        Phonenumber: formattedPhonenumber,
        address,
        },
      });        
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response && error.response.status === 409) {
          Alert.alert('Error', 'Use Your Own Phonenumber .');
        } else {
          console.error('An error occurred:', error);
          Alert.alert('Error', 'An error occurred while updating the user.');
        }
      } else {
        console.error('Unexpected error:', error);
        Alert.alert('Error', 'An unexpected error occurred.');
      }
    }
  };  

  return (
    <ScrollView style={styles.scrollview}>
      <ImageBackground
          source={icons.Agribid} // Your image source
          style={styles.backgroundImage} // Style for the image
          resizeMode="cover" // You can use 'contain' or 'cover' depending on the effect you want
        >
    <View style={styles.buttonContainer}>
      <TouchableOpacity
        style={styles.GoButton}
        onPress={() => navigation.goBack()}
      >
        <View style={styles.buttonContent}>
          <Image
            source={icons.leftArrow}
            style={styles.icon}
            resizeMode="contain"
          />
          <Text style={styles.saveText}>Go Back</Text>
        </View>
      </TouchableOpacity>
    </View>
    <View style={styles.container}>
  <View style={styles.profileheaderText}>
    <Text style={styles.headerText}>Update User</Text>
    </View>
    <View style={styles.form}>
      <Text style={styles.label}>First Name:</Text>
      <TextInput
        style={styles.input}
        value={Firstname}
        onChangeText={setFirstname}
        placeholder="Enter your first name"
      />
      <Text style={styles.label}>Last Name:</Text>
      <TextInput
        style={styles.input}
        value={Lastname}
        onChangeText={setLastname}
        placeholder="Enter your last name"
      />
      <Text style={styles.label}>Phone Number:</Text>
      <View style={styles.numbercontainer}>
        <View style={styles.countryCodeContainer}>
          <TextInput
            style={styles.countryCode}
            editable={false}
            value="+63"
          />
        </View>
        <TextInput
          style={styles.numberinput}
          value={phoneNumber}
          onChangeText={(e) => {
            let numericValue = e.replace(/[^0-9]/g, '');
            if (numericValue.startsWith('0') && numericValue.length > 1) {
              numericValue = numericValue.slice(1);
            }
            if (numericValue.length > 0 && numericValue[0] !== '9') {
              return;
            }
            setPhoneNumber(numericValue);
          }}
          maxLength={10}
          keyboardType="numeric"
          placeholder="912345678"
          placeholderTextColor="#888"
        />
      </View>
  
      <Text style={styles.label}>Address:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedBarangay}
          onValueChange={(itemValue) => setSelectedBarangay(itemValue)}
          style={styles.picker}
        >
          {Object.entries(barangayLookup)
            .sort((a, b) => a[1].localeCompare(b[1]))
            .map(([code, name]) => (
              <Picker.Item key={code} label={name} value={code} style={{ fontSize: 19 }} />
            ))}
        </Picker>
      </View>
  
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>SAVE DETAILS</Text>
      </TouchableOpacity>
    </View>
    </View>
    </ImageBackground>
  </ScrollView>  
  );
};
export default UpdateuserScreen;

const styles = StyleSheet.create({
  scrollview: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginTop: 10,
  },
  backgroundImage: {
    flex: 1,  // Make sure the image covers the full container
    width: '100%',
    height: '100%',
  },
  container:{
     marginTop: '30%',
  },
  profileheaderText: {
    marginTop: 10,
    height: 70,
    width: '100%',
    backgroundColor: '#28a745', 
    padding: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },   
  headerText: { 
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    borderBottomWidth: 1, // Adds a bottom border
    borderBottomColor: '#cccccc', // Light gray color for subtle separation
    paddingBottom: 4, // Adds spacing between text and the border
    textAlign: 'center', // Center the text horizontally
  },
  form: {
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    opacity: 0.9,
    alignContent: 'center',
  },
  
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  numbercontainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    overflow: 'hidden', // Ensure the border wraps around both inputs
    backgroundColor: '#f5f5f5',
    height: 50, // Set a fixed height to avoid layout issues
  },
  
  countryCodeContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0, // Make it stretch to the full height
    backgroundColor: '#f5f5f5', // Match the background color of the input
    justifyContent: 'center', // Vertically center the country code text
    paddingHorizontal: 10, // Add padding to ensure the text is not too close to the edge
  },
  
  countryCode: {
    fontSize: 19,
    textAlign: 'center',
    color: '#1F1F1F', // Black text color
    width: 40, // Width for the country code container
  },
  
  numberinput: {
    flex: 1,
    padding: 10,
    paddingLeft: 50, // Add padding to prevent text from overlapping the country code
    fontSize: 19,
    height: '100%', // Ensure the input takes full height
  },  
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
    fontSize: 19,
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#bdc8d6', // Border color for the container
    borderRadius: 5, // Rounded corners for the container
    backgroundColor: '#f5f5f5', // White background for picker
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 55,
    fontSize: 25,
    overflow: 'visible', // Ensures text stays within bounds and is visible if it overflows
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    paddingTop: 20,
    marginTop: 10,
    alignItems: 'center',
  },
  
  buttonContainer: {
    flexDirection: 'row', // Arrange items in a row
    justifyContent: 'space-between', // Evenly space out the buttons
    alignItems: 'center', // Center items vertically
    width: '100%', // Ensure buttons take full width of the parent container
  },
  buttonContent: {
    flexDirection: 'row', // Align Image and Text horizontally
    alignItems: 'center', // Center the items vertically
    justifyContent: 'space-between', // Evenly space out the items horizontally
  },
  GoButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12, // Ensure consistent height with padding
    paddingHorizontal: 15, // Add horizontal padding to make the button's width adjustable
    borderRadius: 20,
    marginTop: 5,
    alignItems: 'center',
    width: '45%', // Set fixed width or auto based on content
    height: 50, // Fixed height for consistency
  },
    icon: {
      width: 24, // Adjust width as needed
      height: 24, // Adjust height as needed
    },
    saveText: {
      color: 'white', // Ensure text is white
      fontSize: 16,
      fontWeight: 'bold', // Ensure text stands out
      marginLeft: 5, // Add a little space between the icon and text
    },   
});

