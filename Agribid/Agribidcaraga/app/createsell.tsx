import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, Image, TouchableOpacity, ScrollView } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from '@react-native-picker/picker';

const Createsell = () => {
  const navigation = useNavigation();

  const [category, setCategory] = useState(""); // State to store selected category
  const categories = ["Fruits", "Poultry", "Fish", "Vegetable", "Crops" ];

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState<string>("");
  const [locate, setLocate] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<{ [key: string]: string }>({});

  const regex = /^\d{0,7}(\.\d{0,2})?$/;

  const handleChangeText = (text: string) => {
    // Check if the text matches the regex
    if (regex.test(text)) {
      setPrice(text);
    }
  };


  const changeHandler = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      alert("You've refused to allow this app to access your photos!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const createProduct = async () => {
    const currentDate = new Date().toLocaleString();
  
    const formData = new FormData();
    formData.append('title', title);
    if (description) {
      formData.append('description', description);
    }
    formData.append('quantity', quantity);
    formData.append('price', price);
    formData.append('locate', locate);
    formData.append('created_at', currentDate);
  
    if (image) {
      // If image is a base64 string
      const response = await fetch(image);
      const blob = await response.blob();
      
      // Append the blob with a proper file extension
      formData.append("image", blob, 'photo.jpg');
  }
  
    try {
      const response = await axios.post("http://localhost:8000/api/store", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      Alert.alert("Success", response.data.message);
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate("(tabs)");
      }
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate("(tabs)");
              }
            }}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
  
          {Object.keys(validationError).length > 0 && (
            <View style={styles.errorContainer}>
              {Object.entries(validationError).map(([key, value]) => (
                <Text key={key} style={styles.errorText}>{value}</Text>
              ))}
            </View>
          )}
  
          <TouchableOpacity style={styles.imageUploadButton} onPress={changeHandler}>
            <Text style={styles.imageUploadButtonText}>Upload Image</Text>
          </TouchableOpacity>
  
          {image && (
            <Image
              source={{ uri: image }}
              style={styles.previewImage}
            />
          )}
            <View style={styles.formWrapper}>    
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerWrapper}>      
                <Picker
                  selectedValue={category}
                  onValueChange={(itemValue) => {
                    setCategory(itemValue);
                    setTitle(itemValue); // Set the selected category as the title
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select a category" value=""/>
                  {categories.map((category, index) => (
                    <Picker.Item key={index} label={category} value={category} />
                  ))}
                </Picker>
              </View>
  
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, { height: 100 }]}
              multiline
              value={description}
              onChangeText={(text) => setDescription(text)}
            />
  
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={(text) => setQuantity(text)}
            />
  
            <Text style={styles.label}>Price</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={handleChangeText}
            />
  
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={locate}
              onChangeText={(text) => setLocate(text)}
            />
  
            <Button title="Post" onPress={createProduct} />
          </View> {/* Closing formWrapper View here */}
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
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    color: '#007bff',
    fontSize: 18,
  },
  formWrapper: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 10,
    marginBottom: 20,
  },
  imageUploadButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 20,
  },
  imageUploadButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    marginBottom: 20,
  },
  errorContainer: {
    marginBottom: 20,
    backgroundColor: '#f8d7da',
    padding: 10,
    borderRadius: 4,
  },
  errorText: {
    color: '#721c24',
  },
});
