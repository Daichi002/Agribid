import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, TextInput, ScrollView, Alert, Modal } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomAlert from '../components/customeAlert';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { images } from "../constants";
import { Picker } from '@react-native-picker/picker';

interface Product {
  id: string;
  title: string;
  description: string;
  quantity: string;
  price: string;
  locate: string;
  image: string;
  user_id: string;
}

interface Barangay {
    code: string;
    name: string;
  }

const cacheImage = async (uri: string) => {
    const filename = uri.split('/').pop();
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    const info = await FileSystem.getInfoAsync(fileUri);
  
    if (info.exists) {
      return fileUri; // Return cached image URI
    } else {
      const response = await FileSystem.downloadAsync(uri, fileUri);
      return response.uri; // Return newly downloaded image URI
    }
  };

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
          <TouchableOpacity style={styles.Imagebutton} onPress={takestorage}>
            <Text style={styles.buttonText}>Upload from Storage</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.Imagebutton, styles.buttonGreen]} onPress={takephoto}>
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.Imagebutton, styles.buttonRed]} onPress={onClose}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
      </Modal>
    );
  };

const UpdateProduct = () => {
  const route = useRoute();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const navigation = useNavigation();
  const { productId } = route.params;
  const [loading, setLoading] = useState(true);
  const categories = ["Fruits", "LiveStock & Poultry", "Fisheries", "Vegetable", "Crops"];
  const units = ["kg", "Pcs", "Trays", "Sacks"];
  const [Units, setUnits] = useState('kg');
  const [errors, setErrors] = useState({
    image: '',
    title: '',
    quantity: '',
    units: '',
    price: '',
    locate: '',
  });

  const [product, setProduct] = useState<Product | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [initialDescription, setInitialDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [address, setAddress] = useState('');
  const [productData, setProductData] = useState<Product | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

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

  const validateForm = () => {
    const newErrors = { quantity: '', units: '', price: '', locate: '' };
    if (!quantity) newErrors.quantity = 'Quantity is required';
    if (!Units) newErrors.units = 'Units is required';
    if (!price) newErrors.price = 'Price is required';
    if (!address) newErrors.locate = 'Location is required';
    return newErrors;
  };



  useEffect(() => {
    fetchProduct();
  }, []);

  const fetchProduct = async () => {
    if (!productId) {
      console.error('No product ID found');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }
      const response = await axios.get(`http://10.0.2.2:8000/api/productdetails/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const productData = response.data;
      setProduct(productData);
      setCategory(productData.title);
      setDescription(productData.description);
      setInitialDescription(productData.description);
      setQuantity(productData.quantity.replace(/\D/g, ''));
      setPrice(productData.price);
      setProductData(productData);
      // console.log('Fetched one Product:', productData);
    } catch (error) {
      console.error('Error fetching product:', error);
    }
  };

       // Set initial values for address and selectedBarangay based on fetched productData
       useEffect(() => {
        if (productData) {
            const barangayName = productData.locate || ''; // Get barangay name from productData
            const barangayCode = Object.keys(barangayLookup).find(
                key => barangayLookup[key] === barangayName
            ); // Find code corresponding to barangay name
    
            // console.log('Barangay Lookup:', barangayLookup);
            // console.log('Barangay Name:', barangayName);
            // console.log('Located Barangay Code:', barangayCode);
    
            setAddress(barangayName); // Set address to the barangay name
            setSelectedBarangay(barangayCode || ''); // Preselect barangay in the Picker
        }
    }, [productData, barangayLookup]);
    

  // Set barangay based on productData.locate
useEffect(() => {
    if (address && barangayLookup) {
      const barangayCode = Object.keys(barangayLookup).find(
        (code) => barangayLookup[code].toLowerCase() === address.toLowerCase()
      );
      if (barangayCode) {
        setSelectedBarangay(barangayCode);
      }
    }
  }, [address, barangayLookup]);

  useEffect(() => {
    const loadImage = async () => {
      const uri = `http://10.0.2.2:8000/storage/product/images/${product?.image}?${new Date().getTime()}`;
      setImageUri(await cacheImage(uri));
      setLoading(false);
    };
  
    loadImage();
  },[product?.image]);

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

  const handleUpdateDescription = (text) => {
    setDescription(text);
};

  const UpdateProduct = async () => {  
    const newErrors = validateForm();
    setErrors(newErrors);

    // Proceed only if there are no validation errors
    if (Object.values(newErrors).every((error) => !error)) {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) throw new Error("Authentication token not found.");
  
        const formData = new FormData();
  
       // Check if the image is selected and fetch it
if (image) {
  try {
    const response = await fetch(image);
    console.log('Fetch response status:', response.status); 

    if (!response.ok) {
      throw new Error('Failed to fetch the image');
    }

    const blob = await response.blob();
    console.log('Fetched image blob:', blob); 

    if (!blob.size || !blob.type.startsWith('image/')) {
      throw new Error('Invalid image data');
    }

    // Append the Blob to FormData only if the image is valid
    formData.append('image', {
      uri: image,
      type: 'image/jpeg',
      name: 'photo.jpg'
    });
  } catch (error) {
    console.error('Error fetching the image:', error);
    Alert.alert("Error", "Could not process the image. Please try again.");
    return; // Exit the function if there's an error fetching the image
  }
}
const finalTitle = title || category;
const updatedDescription = description.trim() === initialDescription ? '' : description; // If no new input, set to empty
        console.log('Submitting description:', updatedDescription);

// Continue with appending the rest of the form data
formData.append('id', productId);
formData.append('title', finalTitle);
formData.append('description', updatedDescription || finalTitle);
formData.append('quantity', quantity);
formData.append('unit', Units);
formData.append('price', price);
formData.append('locate', address); 
formData.append('updated_at', new Date().toISOString()); // Use ISO format for consistency

console.log('FormData:', JSON.stringify(formData)); // Log FormData for debugging 
  
        // Make the API call to update the product
        const response = await axios.post("http://10.0.2.2:8000/api/update", formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        });

        console.log('Server response:', response.data);
        const productID = response.data.id;

        setShowAlert(true);
        setTimeout(() => {
          setShowAlert(false);
        }, 3000);
  
        // Navigate back on successful update
        console.log('Product updated:', productID);
        navigation.navigate('ProductDetails', { productId: productID});
        // navigation.goBack();
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Axios Error:', error.response?.data || error.message);
          Alert.alert("Error", error.response?.data?.message || error.message || "An unknown error occurred");
        } else {
          console.error('General Error:', error);
          Alert.alert("Error", "An unexpected error occurred");
        }
      }
    }
  };


  return (
    <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Update Product</Text>
      </View>

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

      <View style={styles.productContainer}>
      <TouchableOpacity style={{ width: '100%', height: 200 }} // Adjust dimensions
        activeOpacity={1}  onPress={() => setIsModalVisible(true)}>    
        {loading ? (
            <ActivityIndicator size="large" color="#008080" style={styles.loadingIndicator} />
        ) : (
          <Image 
          source={image ? { uri: image } : imageUri ? { uri: imageUri } : undefined} 
          style={styles.productImage} 
          onError={() => console.log('Image failed to load')} 
      />
        )}       
        </TouchableOpacity>

        <View style={styles.productDetails}>
          {/* <Text style={styles.title}>Update Product</Text> */}

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
            onChangeText={handleUpdateDescription}
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
        onValueChange={(itemValue) => {
            // Update selected barangay and set address to the barangay name
            setSelectedBarangay(itemValue);
            setAddress(barangayLookup[itemValue]); // Set address to selected barangay's name
        }}
        style={styles.picker}
    >
        {Object.entries(barangayLookup)
            .sort((a, b) => a[1].localeCompare(b[1])) // Sort options alphabetically by name
            .map(([code, name]) => (
                <Picker.Item key={code} label={name} value={code} style={{ fontSize: 19 }} />
            ))}
    </Picker>
</View>
      </View>
      </View>
      <View>
      <TouchableOpacity style={styles.button} onPress={UpdateProduct}>
          <Text style={styles.buttonText}>Post</Text>
          {showAlert && (
              <CustomAlert
                  message="Product Created!"
                  duration={3000}
                  onDismiss={() => setShowAlert(false)}
              />
          )}
      </TouchableOpacity>
    </View>
    </ScrollView>
    </SafeAreaView>
  );
};

export default UpdateProduct;

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#B4CBB7',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 20,
      backgroundColor: '#F8F8F8',
      borderBottomWidth: 1,
      borderBottomColor: '#EAEAEA',
    },
    label: {
        fontWeight: 'bold',
        marginBottom: 5,
      },
      pickerContainer: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#bdc8d6', // Border color for the container
        borderRadius: 5, // Rounded corners for the container
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        width: '100%',
      },
      scrollViewContent: {
        flexGrow: 1,
        // margin: 20,
        // paddingBottom: 30,
      },
    screenTitle: {
      flex: 1,
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333',
      textAlign: 'center',
      paddingRight: 60,
    },
    backButton: {
      padding: 10,
      backgroundColor: '#E0E0E0',
      borderRadius: 8,
    },
    backButtonText: {
      color: '#333',
      fontSize: 16,
    },
    productContainer: {
      flex: 1,
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    productImage: {
      width: '100%',
      height: 190,
      borderRadius: 10,
      marginBottom: 20,
      backgroundColor: '#F0F0F0',
    },
    loadingIndicator: {
      marginVertical: 20,
    },
    productDetails: {
        width: '100%',
        paddingVertical: 20,
        paddingHorizontal: 15,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        // marginBottom: 5, // Adds space between productDetails and button
      },
      title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
      },
      descriptioninput: {
        minHeight: 80,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        textAlignVertical: 'top',
      },
      input: {
        height: 60,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
      },
      quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#ccc',
        height: 60,
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
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
      button: {
        backgroundColor: '#28a745',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        alignSelf: 'center',
        width: '90%', // Slightly smaller width to separate it from the borders
        marginBottom: 50,
      },
      buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
      },
      errorInput: {
        borderColor: 'red',
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
      Imagebutton: {
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
      errorContainer: {
        marginBottom: 10,
        textAlign: 'center',
        paddingLeft: 20,
      },
      errorText: {
        color: 'red',
        fontSize: 14,
        marginBottom: 5,
      },
  });
