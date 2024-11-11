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
import * as ImageManipulator from 'expo-image-manipulator';
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from '@react-native-picker/picker';
import { useAlert } from '../components/AlertContext';


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
  const categories = ["Fruits", "LiveStock & Poultry", "Fisheries", "Vegetable", "Crops"];
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [Units, setUnits] = useState('kg');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const units = ["kg", "Pcs", "Trays", "Sacks"];
  const [currentUser, setCurrentUser] = useState<User | null>(null); // Assuming the initial state is null
  const [price, setPrice] = useState<string>("");
  const [address, setAddress] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const { showAlert } = useAlert();
  const [errors, setErrors] = useState({
    image: '',
    title: '',
    quantity: '',
    units: '',
    price: '',
    locate: '',
  });

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

 const regex = /^\d{0,7}(\.\d{0,2})?$/;

  const handleChangeText = (text: string) => {
    if (regex.test(text)) {
      setPrice(text);
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
        [{ resize: { width: 800, height: 800 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipulatedImage.uri;
    } catch (error) {
      console.error('Image compression error:', error);
      Alert.alert("Error", "Image compression failed. Please try again.");
    }
  };
  
  const validateForm = () => {
    const newErrors = { image: '', title: '', quantity: '', units: '', price: '', locate: '' };
    if (!image) newErrors.image = 'Image is required';
    if (!category) newErrors.title = 'Category is required';
    if (!quantity) newErrors.quantity = 'Quantity is required';
    if (!Units) newErrors.units = 'Units is required';
    if (!price) newErrors.price = 'Price is required';
    if (!address) newErrors.locate = 'Location is required';
    return newErrors;
  };

  const createProduct = async () => {
    const newErrors = validateForm();
    setErrors(newErrors);
  
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
        formData.append('description', description || title);
        formData.append('quantity', quantity);
        formData.append('unit', Units);
        formData.append('price', price);
        formData.append('locate', address);
        formData.append('created_at', new Date().toISOString()); // Use ISO format for consistency
  
        console.log('FormData:', JSON.stringify(formData)); // Log FormData for debugging
  
        // Make the API call to store the product
        const response = await axios.post("http://10.0.2.2:8000/api/store", formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        });

        showAlert('Produdct Posted successfully!', 3000);
  
        // Handle successful response
        navigation.goBack();
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

  return (
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
        <Text style={styles.label}>Category*</Text>
        <View style={[styles.pickerContainer, errors.title ? styles.errorInput : {}]}>
    <Picker
        selectedValue={category}
        onValueChange={itemValue => {
            setCategory(itemValue);
            setTitle(itemValue);
            setErrors(prevErrors => ({ ...prevErrors, title: '' }));
        }}
        style={[styles.picker, { borderWidth: 1, borderColor: '#bdc8d6', borderRadius: 5 }]} // Add border styles here
    >
        <Picker.Item label="Select a category" value="" />
        {categories.map((category, index) => (
            <Picker.Item key={index} label={category} value={category} />
        ))}
    </Picker>
</View>

          <Text style={styles.label}>Description Optional</Text>
          <TextInput
            style={[styles.descriptioninput, { height: 100 }]}
            multiline
            value={description}
            onChangeText={setDescription}
            placeholder="Description"
          />

          <Text style={styles.label}>Quantity*</Text>
          <View style={[styles.quantityContainer, errors.quantity ? styles.errorInput : {}]}>
          <TextInput
        style={[styles.quantityinput, errors.quantity ? styles.errorInput : {}]}
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
            , errors.units ? styles.errorInput : {}
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
      

          <Text style={styles.label}>Price*</Text>
          <TextInput
              style={[styles.input, errors.price ? styles.errorInput : {}]}
              value={price}
              onChangeText={(text) => {
                // Allow only numeric values
                const numericValue = text.replace(/[^0-9]/g, '');
                handleChangeText(numericValue);
              }}
              placeholder="Price"
              keyboardType="numeric" // Ensure only numeric input
              maxLength={6} // Limit to 6 digits
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
    margin: 20,
    paddingBottom: 30,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 16,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#bdc8d6', // Border color for the container
    borderRadius: 5, // Rounded corners for the container
    overflow: 'hidden',
},
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    color: '#007bff',
    fontSize: 18,
  },
  post: {
    backgroundColor: '#32DF81',
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
    height: 60,
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
    backgroundColor: '#007bff',
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
});
