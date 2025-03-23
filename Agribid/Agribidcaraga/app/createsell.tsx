import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { icons } from "../constants";
import * as ImageManipulator from 'expo-image-manipulator';
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from '@react-native-picker/picker';
import { useAlert } from '../components/AlertContext';
import ProtectedRoute from '../components/ProtectedRoute';
import BASE_URL from '../components/ApiConfig';
import SideModal from '../components/sidemodal';
import { GlowProvider, GlowingImage, useGlow } from '../components/Glowingmanager';


interface Barangay {
  code: string;
  name: string;
}

interface User {
  [key: string]: any;
  // id: string;
  // name: string;
  // phonenumber: string;
  // address: string;
}

interface ImagePickerModalProps {
  visible: boolean;
  onChooseFromStorage: () => void;
  onTakePhoto: () => void;
  onClose: () => void;
}

const ImagePickerModal: React.FC<ImagePickerModalProps> = ({ visible, onChooseFromStorage, onTakePhoto, onClose }) => {
  const takestorage = () => {
    onChooseFromStorage();
    onClose();
  };
  const takephoto = () => {
    onTakePhoto();
    onClose();
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalimagecontainer}>
      <View style={styles.modal}>
        <Text style={styles.title}>Choose Image Source</Text>
        <TouchableOpacity style={styles.button} onPress={takestorage}>
          <Text style={styles.buttonText}>Upload from Storage</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.buttonGreen]} onPress={takephoto}>
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.buttonRed]} onPress={onClose}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
    </Modal>
  );
};

const Createsell = () => {
  const navigation = useNavigation();
  const [category, setCategory] = useState("");
  const [commodities, setCommodities] = useState("");
  const categories = [
    "Imported Commercial Rice",
    "Local Commercial Rice",
    "Corn ",
    "Livestock & Poultry Products",
    "Fisheries",
    "Lowland Vegetables",
    "Highland Vegetables",
    "Fruits",
    "Species",
    "Rootcrops",
  ];
  const [srpData, setSrpData] = useState<{ commodities: Array<any> } | null>(null);
 
  const [filteredCommodities, setFilteredCommodities] = useState<string[]>([]);
  const [selectedCommodity, setSelectedCommodity] = useState<any | null>(null);
  const priceRange = selectedCommodity ? selectedCommodity.price_range : null;
  // const { setGlow } = useGlow();

  const [error, setError] = useState('');
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [Units, setUnits] = useState('kg');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const units = ["kg", "Pcs", "Trays", "Sacks"];
  const [currentUser, setCurrentUser] = useState<User | null>(null); // Assuming the initial state is null
  const [price, setPrice] = useState<string>("");
  const [address, setAddress] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const { showAlert } = useAlert();
  const [errors, setErrors] = useState({
    image: '',
    title: '',
    commodities: '',
    quantity: '',
    units: '',
    price: '',
    locate: '',
  });

  const [issideModalVisible, setIssideModalVisible] = useState(false);

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

      

      useEffect(() => {
        const fetchUserInfo = async () => {
          try {
            const userInfo = await AsyncStorage.getItem('userInfo');
            if (userInfo) {
              const parsedUser = JSON.parse(userInfo); // Assuming userInfo is a valid JSON string
              const normalizedUser = normalizeKeys(parsedUser); // Normalize keys
      
              setCurrentUser(normalizedUser);
              // console.log('Fetched profileUser:', normalizedUser);
            }
          } catch (error) {
            console.error('Error fetching user info:', error);
            Alert.alert('Error', 'Could not fetch user info.');
          }
        };
        fetchUserInfo();
      }, [forceRender]);

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

      // Preset form fields with fetched user data  //having when new user is logged in 
 useEffect(() => {
  // console.log('normalize', currentUser)
  if (currentUser) {
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

  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);

  // Parse price range and set min/max limits
  useEffect(() => {
    if (priceRange) {
      console.log('Price Range:', priceRange);
      const priceParts = priceRange.split('-');
      
      if (priceParts.length === 2) {
        // If range like 35.00-50.00
        const min = parseFloat(priceParts[0]);
        const max = parseFloat(priceParts[1]);
      
        setMinPrice(parseFloat((min * 0.7).toFixed(2))); // 30% less than min, rounded to 2 decimals
        setMaxPrice(parseFloat(max.toFixed(2))); // Max value rounded to 2 decimals
      } else if (priceParts.length === 1) {
        // If single value like 100.00
        const min = parseFloat(priceParts[0]);
        const max = parseFloat(priceParts[0]);
      
        setMinPrice(parseFloat((min * 0.5).toFixed(2))); // 50% less than the value, rounded to 2 decimals
        setMaxPrice(parseFloat(max.toFixed(2))); // Max value rounded to 2 decimals
      }      
    }
  }, [priceRange]);
 
  const regex = /^\d{0,7}(\.\d{0,2})?$/; // Regex for valid price format

 const handleChangeText = (text: string) => {
    // Only proceed if the text is a valid number format
    if (regex.test(text)) {
      const numericValue = text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'); // Clean input
      
      const input = parseFloat(numericValue);
  
      // Prevent input if it exceeds the min or max price
      if (maxPrice === 0 || isNaN(input) || input <= maxPrice) {
        setPrice(numericValue); // Update the price if within the allowed range
        validatePrice({ inputPrice: numericValue }); // Validate after updating the price
      } else {
        // Optional: set an error message or handle invalid input
        setError(`Price must be between ${minPrice} and ${maxPrice || 'no upper limit'}.`);
      }
    } else if (text === '') {
      // Allow clearing the input
      setPrice('');
      setError('');
    }
  };



  // const handleChangeText = (text: string) => {
  //   // Only proceed if the text is a valid number format
  //   if (regex.test(text)) {
  //     const numericValue = text.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'); // Remove non-numeric except decimal
  //     setPrice(numericValue);
  //     validatePrice(numericValue);
  //   }
  // };

  interface ValidatePriceProps {
    inputPrice: string;
  }

  const validatePrice = ({ inputPrice }: ValidatePriceProps): void => {
    const input = parseFloat(inputPrice);
    if (inputPrice && !isNaN(input)) {
      if (input < minPrice || (maxPrice && input > maxPrice)) {
        setError(`Price must be between ${minPrice} and ${maxPrice || 'no upper limit'}.`);
      } else {
        setError('');
      }
    } else {
      setError('');
    }
  };


  const handleChangequantity = (text: string) => {
    if (regex.test(text)) {
      setQuantity(text);
    }
  }; 

  const handleImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
    });
  
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri; // Use result.assets[0].uri
      console.log('Picked Image URI:', imageUri); // Log for debugging
  
      setImage(imageUri); // Set the original image URI
      const compressedUri = await compressImage(imageUri);
      
      if (compressedUri) {
        setImage(compressedUri); // Set compressed image URI
      } else {
        console.error('Failed to compress image, URI is undefined');
      }
    }
  };
  
  const handleTakePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
    });
  
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri; // Use result.assets[0].uri
      console.log('Taken Photo URI:', imageUri); // Log for debugging
  
      setImage(imageUri); // Set the original image URI
      const compressedUri = await compressImage(imageUri);
  
      if (compressedUri) {
        setImage(compressedUri); // Set compressed image URI
      } else {
        console.error('Failed to compress image, URI is undefined');
      }
    }
  };
  
  const compressImage = async (uri: string) => {
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 900, height: 1000 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipulatedImage.uri;
    } catch (error) {
      console.error('Image compression error:', error);
      Alert.alert("Error", "Image compression failed. Please try again.");
    }
  };
  
  const validateForm = () => {
    const newErrors = { image: '', title: '',commodities: '' , quantity: '', units: '', price: '', locate: '' };
    if (!image) newErrors.image = 'Image is required';
    if (!category) newErrors.title = 'Category is required';
    if (!commodities) newErrors.commodities = 'Commodities is required';
    if (!quantity) newErrors.quantity = 'Quantity is required';
    if (!Units) newErrors.units = 'Units is required';
    if (!price) newErrors.price = 'Price is required';
    if (!address) newErrors.locate = 'Location is required';
    return newErrors;
  };

  const createProduct = async () => {
    const newErrors = validateForm();
    setErrors(newErrors);

    // Validate price range
  if (parseFloat(price) < minPrice) {
    Alert.alert("Error", `Price must not be less than ${minPrice.toFixed(2)}.`);
    // setGlow(true);
    return; // Stop execution if price is invalid
  } else if (maxPrice !== 0 && parseFloat(price) > maxPrice) {
    Alert.alert("Error", `Price must not exceed ${maxPrice.toFixed(2)}.`);
    // setGlow(true);
    return; // Stop execution if price is invalid
  }
  
    if (Object.values(newErrors).every((error) => !error)) {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) throw new Error("Authentication token not found.");
  
        const formData = new FormData();
  
        // Check if the image is selected
        if (image) {
          try {
            // Fetch the image from the URI
            const response = await fetch(image);
            console.log('Fetch response status:', response.status); // Log fetch response status
  
            // Check if the response is OK (status 200-299)
            if (!response.ok) {
              throw new Error('Failed to fetch the image');
            }
  
            const blob = await response.blob(); // Convert the response to a Blob
            console.log('Fetched image blob:', blob); // Log the fetched blob
  
            // Check blob size and type to ensure it is a valid image
            if (!blob.size || !blob.type.startsWith('image/')) {
              throw new Error('Invalid image data');
            }
  
            // Append the Blob directly to FormData with correct metadata
            formData.append('image', {
              uri: image,
              type: 'image/jpeg', // Ensure the correct MIME type
              name: 'photo.jpg'
            } as any);
          } catch (error) {
            console.error('Error fetching the image:', error);
            Alert.alert("Error", "Could not process the image. Please try again.");
            return; // Exit the function if there's an error fetching the image
          }
        } else {
          console.error('Image URI is null or undefined.');
          return; // Exit the function if no image is selected
        }
  
        // Append other form data
        formData.append('title', title);
        formData.append('commodity', commodities);
        formData.append('description', description || title);
        formData.append('quantity', quantity);
        formData.append('unit', Units);
        formData.append('price', price);
        formData.append('locate', address);
        formData.append('created_at', new Date().toISOString()); // Use ISO format for consistency
  
        console.log('FormData:', JSON.stringify(formData)); // Log FormData for debugging
  
        // Make the API call to store the product
        const response = await axios.post(`${BASE_URL}/api/store`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        });
        
        if (response.status === 201) {
          showAlert('Product Posted successfully!', 3000, 'green');
            // Handle successful response
            navigation.goBack();
        }
  
      
      } catch (error) {
        if (axios.isAxiosError(error)) {
          // Axios-specific error handling
          console.error('Axios Error:', error.response?.data || error.message);
          Alert.alert("Error", error.response?.data?.message || error.message || "An unknown error occurred");
        } else {
          // General error handling
          console.error('General Error:', error);
          Alert.alert("Error", "An unexpected error occurred");
        }
      }
    }
  };

  // useEffect(() => {
  //   fetchSRP();
  // }, []);

  const toggleModal = () => {
    setIssideModalVisible(!issideModalVisible);
  };


  const fetchSRP = async (category: string) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        navigation.navigate("(auth)/login");
        return;
      }
      setSrpData(null); // Reset the SRP data
      setFilteredCommodities([]); // Reset the filtered commodities list
  
      const response = await axios.get(
        `${BASE_URL}/api/SRP/${category}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // console.log("SRP Data:", response.data);
  
      if (Array.isArray(response.data.commodities)) {
        // Set the full SRP data
        setSrpData(response.data);
  
        // Extract only the commodity names
        const commodityNames = response.data.commodities.map(
          (item: { commodity: any; }) => item.commodity
        );
        
        // Update the filtered commodities list
        setFilteredCommodities(commodityNames);
      } else {
        console.error("Commodities data is not an array:", response.data.commodities);
        setSrpData(null);
        setFilteredCommodities([]); // Set to empty array if data is invalid
      }
    } catch (error) {
      showAlert('NO Available SRP!', 3000, 'red');
      // console.error("Error fetching SRP:", error);
      setFilteredCommodities([]); // Set to empty array in case of error
    }
  };
  
  
  
  

  return (
    <ProtectedRoute>
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.errorContainer}>
          {Object.entries(errors).map(([key, value]) => value ? (
            <Text key={key} style={styles.errorText}>{value}</Text>
          ) : null)}
        </View>

        <ImagePickerModal
          visible={isModalVisible}
          onChooseFromStorage={handleImagePicker}
          onTakePhoto={handleTakePhoto}
          onClose={() => setIsModalVisible(false)}
        />

        <TouchableOpacity style={[styles.imageUploadButton, errors.image ? styles.errorInput : {}]} onPress={() => setIsModalVisible(true)}>
          <Text style={styles.imageUploadButtonText}>Upload Image*</Text>
        </TouchableOpacity>

        {image && (
          <Image source={{ uri: image }} style={styles.previewImage} />
        )}

        <View style={styles.formWrapper}>
        {/* Category Picker */}
          <Text style={styles.label}>Category*</Text>
      <View
        style={[
          styles.pickerContainer,
          errors.title ? styles.errorInput : {},
        ]}
      >
        <Picker
          selectedValue={category}
          onValueChange={(itemValue) => {
            console.log("Selected Category:", itemValue);
            setCategory(itemValue); // Update category state
            setTitle(itemValue); // Update title state
            setCommodities(""); // Reset commodity selection
            fetchSRP(itemValue);
            setErrors((prevErrors) => ({ ...prevErrors, title: "" }));
          }}
          style={[
            styles.picker,
            { borderWidth: 1, borderColor: "#bdc8d6", borderRadius: 5 },
          ]}
        >
          <Picker.Item label="Select a Category" value="" />
          {categories.map((cat, index) => (
            <Picker.Item key={index} label={cat} value={cat} />
          ))}
        </Picker>
      </View>

      {/* Commodity Picker */}
      {category && (
  <>
    <Text style={styles.label}>Commodity*</Text>
    <View
      style={[styles.pickerContainer, errors.commodities ? styles.errorInput : {}]}
    >
      <Picker
        selectedValue={commodities}
        onValueChange={(itemValue) => {
          console.log("Selected Commodity:", itemValue);

          // Update selected commodity in state
          setCommodities(itemValue); // Set the selected commodity

          // Clear error message for the commodity field
          setErrors((prevErrors) => ({
            ...prevErrors,
            commodities: "",
          }));

          // Ensure srpData is available and not empty
          if (srpData && Array.isArray(srpData.commodities)) {
            const selectedCommodityData = srpData.commodities.find(
              (item) => item.commodity === itemValue
            );

            if (selectedCommodityData) {
              setSelectedCommodity(selectedCommodityData); // Set the selected commodity for further use
            } else if (itemValue === "Others") {
              console.log("User selected 'Others'. Handle accordingly.");
              setSelectedCommodity(null); // Clear selected commodity if 'Others' is selected
            } else {
              console.error("Selected commodity not found in srpData.");
            }
          } else {
            console.error("SRP data or commodities is not available.");
          }
        }}
        style={[styles.picker, { borderWidth: 1, borderColor: "#bdc8d6", borderRadius: 5 }]}
      >
        <Picker.Item label="Select a Commodity" value="" />
        {filteredCommodities.length > 0 ? (
          filteredCommodities.map((commodity, index) => (
            <Picker.Item key={index} label={commodity} value={commodity} />
          ))
        ) : (
          <Picker.Item label="No commodities available" value="" />
        )}
        {/* Add 'Others' as a static choice */}
        <Picker.Item label="Others" value="Others" />
      </Picker>
    </View>
  </>
)}



          <Text style={styles.label}>Description Optional</Text>
          <TextInput
            style={[styles.descriptioninput, { height: 100 }]}
            multiline
            value={description}
            onChangeText={setDescription}
            placeholder="Description"
            maxLength={100}
          />

          <Text style={styles.label}>Quantity*</Text>
          <View style={[styles.quantityContainer, errors.quantity ? styles.errorInput : {}]}>
          <TextInput
        style={[styles.quantityinput]}
        value={quantity}
        placeholder="Quantity"     
        onChangeText={(text) => {
            // Allow only numeric values
            const numericValue = text.replace(/[^0-9]/g, '');
            handleChangequantity(numericValue);
          }}    
        keyboardType="numeric" // Ensure only numeric input
        maxLength={6}
      />
        <Picker
          selectedValue={Units}
          onValueChange={(itemValue) => {
            setUnits(itemValue); // If setSelectedUnit is also needed
          }}
          style={[styles.pickerDropdown, { borderWidth: 1, borderColor: '#bdc8d6', borderRadius: 5 }
            
          ]}
        >
          <Picker.Item label="Select a unit" value="" />
          {units.map((unit, index) => (
            <Picker.Item
              key={index}
              label={unit}
              value={unit}
            />
          ))}
        </Picker>
          </View>
          <TouchableOpacity style={styles.pullString} onPress={toggleModal}>
            
            <Image 
              source={icons.srptag2} 
              style={{ width: 90, height: 60, tintColor: 'green', zIndex: 1 }}
              />
        <View style={styles.pullStringHandle} />
      </TouchableOpacity>

      <SideModal
  isVisible={issideModalVisible}
  onClose={() => setIssideModalVisible(false)}
  srpData={selectedCommodity ? [selectedCommodity] : []} // Pass selectedCommodity as an array
/>



          
          <Text style={styles.label}>Price*</Text>
          {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
          <TextInput
            style={[styles.input, errors.price ? styles.errorInput : {}]}
            value={price}
            onChangeText={handleChangeText}
            placeholder="Price"
            keyboardType="decimal-pad" // Use decimal pad to input decimals
            maxLength={8} // Limit to 6 characters (can be adjusted based on your needs)
          />
          


      <Text style={styles.label}>Location*</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedBarangay}
          onValueChange={(itemValue) => setSelectedBarangay(itemValue)}
          style={styles.picker}
        >
           {Object.entries(barangayLookup)
        .sort((a, b) => a[1].localeCompare(b[1])) // Sort alphabetically by name
        .map(([code, name]) => (
          <Picker.Item key={code} label={name} value={code} style={{ fontSize: 19 }} />
        ))}
        </Picker>
      </View>

          <TouchableOpacity style={styles.post} onPress={createProduct}>
            <Text style={styles.buttonText}>Post</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
     </ProtectedRoute>
  );
};

export default Createsell;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewContent: {
    flexGrow: 1,
    marginTop: 20,
    margin: 5,
    paddingBottom: 30,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 16,
  },
  picker: {
    width: '100%',
    height: 55,
    fontSize: 25,
    overflow: 'visible', // Ensures text stays within bounds and is visible if it overflows
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#bdc8d6', // Border color for the container
    borderRadius: 5, // Rounded corners for the container
    overflow: 'hidden',
},
backButton: {
  backgroundColor: '#28a745', // Blue background for the button
  paddingVertical: 10, // Add vertical padding for button size
  paddingHorizontal: 20, // Add horizontal padding for button size
  borderRadius: 5, // Rounded corners
  marginBottom: 20, // Maintain the space below
  alignItems: 'center', // Center text horizontally inside button
  justifyContent: 'center', // Center the text vertically inside the button
  flexDirection: 'row', // Ensure the text is in a row (useful if you add icons)
  alignSelf: 'flex-start', // Align the button to the start of its container
},

backButtonText: {
  color: '#ffffff', // White text color
  fontSize: 18, // Text size
  fontWeight: 'bold', // Make the text bold
},

  post: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  formWrapper: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#f9f9f9', // Subtle background color
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
  },
  descriptioninput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    height: 55,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    height: 60,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  quantityinput: {
    flex: 3,
    borderWidth: 1,
    borderColor: '#ccc',
    height: 60.8,
    borderLeftWidth: 0,
  },
  pickerDropdown: {
    height: 58,
    width: 140, // Increase the width to ensure label visibility
    borderWidth: 0,
    paddingLeft: 3,
    marginLeft: 10,
  },
  dropDownContainer: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderRadius: 8,
    marginLeft: 100,
  },
  pickerOpen: {
    zIndex: 9999, // Ensures dropdown is on top when open
  },
  errorInput: {
    borderColor: 'red',
  },
  errorContainer: {
    marginBottom: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 5,
  },
  imageUploadButton: {
    backgroundColor: '#0c969c',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  imageUploadButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    borderRadius: 8,
    marginBottom: 20,
  },
  modalimagecontainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Add a slight overlay for focus
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    paddingBottom: 5,
    width: '80%', // Make the modal wider
    alignItems: 'center', // Center-align the buttons and text
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#1E90FF',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonGreen: {
    // backgroundColor: '#32CD32',
  },
  buttonRed: {
    // backgroundColor: '#FF6347',
  },
  pullString: {
    position: 'absolute',
    top: '65%',
    right: -15,
    width: 70,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#ccc',
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
    zIndex: 9999,
  },
  pullStringHandle: {
    width: 10,
    height: 30,
    // backgroundColor: '#888',
    borderRadius: 5,
  },
});
