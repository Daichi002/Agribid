
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, ActivityIndicator } from "react-native";
import * as FileSystem from 'expo-file-system';
import axios from "axios";

import AsyncStorage from '@react-native-async-storage/async-storage';
import { icons } from "../../constants";

const cacheImage = async (uri) => {
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
const ProductImage = React.memo(({ imageUri }) => {
  return <Image source={{ uri: imageUri }} style={styles.productImage} />;
});

const ProductItem = React.memo(({ item }) => {
  // console.log('Rendering ProductItem for:', item);

  const [imageUri, setImageUri] = useState(null);
  // console.log('Rendering ProductItem for:', imageUri);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const uri = `http://10.0.2.2:8000/storage/product/images/${item.image}`;
        const cachedUri = await cacheImage(uri);
        setImageUri(cachedUri);
      } catch (error) {
        console.error('Error loading image:', error);
      }
    };
    loadImage();
  }, [item.image]);

  if (!item) {
    console.warn('Undefined item:', item);
    return null;
  }
  
  const { id, title, description, locate, created_at } = item;
  if (!id) {
    console.warn('Item ID is undefined:', item);
    return null;
  }

  return (
    <View style={styles.productItem}>
      <View style={styles.imageContainer}>
        {imageUri ? (
          <ProductImage imageUri={imageUri} />
        ) : (
          <ActivityIndicator size="small" color="#0000ff" />
        )}
      </View>
      <View style={styles.productDetailsContainer}>
        <Text style={styles.productTitle}>{title}</Text>
        <Text style={styles.productDescription}>Description: {description}</Text>
        <Text style={styles.productDescription}>Located: {locate}</Text>
        <Text style={styles.productDate}>
          Date Created: {new Date(created_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
});


const Srp = () => {
  const [srp, setSrp] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");
  const [isRefreshing, setIsRefreshing] = useState(false);
  // const sortedSrp = SortedSrp(srp, sortOrder);

  useEffect(() => {
    fetchProducts();
  }, []);

  // fetch product from the server
  const fetchProducts = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }
  
      const response = await axios.get(`http://10.0.2.2:8000/api/products`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      // console.log("Raw API Response:", response.data); // Log the raw API response
  
      const enhancedProducts = response.data.map((product) => {
        if (!product.id) {
          console.warn('Product without ID:', product);
        }
        return {
          ...product,
        };
      }).filter(product => product && product.id); // Ensure valid products with IDs
  
      console.log("Enhanced Products:", enhancedProducts);
  
      setSrp(enhancedProducts);
      await updateAsyncStorage(enhancedProducts);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error fetching products:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          headers: error.response?.headers,
        });
      } else if (error instanceof ReferenceError) {
        console.error('ReferenceError fetching products:', error.message);
      } else {
        console.error('Unexpected error fetching products:', error);
      }
    }
  };
  
  

   // save the new data to asyncstorage for a more faster render
   const updateAsyncStorage = async (newData) => {
    try {
      // Fetch current data from AsyncStorage
      const existingData = await AsyncStorage.getItem('srp');
      let currentData = existingData ? JSON.parse(existingData) : [];
  
      // Create a map of current data for quick lookup
      const currentDataMap = new Map(currentData.map(item => [item.id, item]));
  
      // Update existing entries and add new ones
      newData.forEach(newItem => {
        currentDataMap.set(newItem.id, newItem);
      });
  
      // Convert map back to array
      const updatedData = Array.from(currentDataMap.values());
  
      // Save updated data to AsyncStorage
      await AsyncStorage.setItem('srp', JSON.stringify(updatedData));
      // console.log('Srp AsyncStorage.', updatedData);
      // console.log('Srp AsyncStorage updated successfully.');
    } catch (error) {
      console.error('Failed to update AsyncStorage:', error);
    }
  };


  const sortSrp = (srp, sortOrder) => {
    return srp.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  };

const sortedSrp = sortSrp(srp, sortOrder);

const onRefresh = useCallback(async () => {
  setIsRefreshing(true);
  await fetchProducts();
  setIsRefreshing(false);
}, []);

  return (
    <View>
<FlatList
  data={sortedSrp}
  renderItem={({ item }) => <ProductItem item={item} />} 
  keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())} 
  contentContainerStyle={styles.inventory}
  extraData={sortedSrp}
  refreshControl={
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={onRefresh}
    />
  }
/>
    </View>
  )
}

export default Srp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f0f0f0",
  },
  viewButton: {
    backgroundColor: "black", // Background color
    padding: 10,                // Padding inside the button
    borderRadius: 5,            // Rounded corners
    alignItems: "center",       // Center text horizontally
  },
  buttonContainer: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
},
  buttonText: {
    flexDirection: 'row',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    paddingBottom: 5,
    paddingLeft: 10,
    width: 90,
    height: 40,
  },
  icon: {
    width: 30,  // Adjust width as needed
    height: 30,  // Adjust height as needed
  },
  subText: {
    marginTop: 10,
    fontSize: 14,
    textAlign: "center",
  },
  linkText: {
    color: "#0066cc",
    textDecorationLine: "underline",
  },
  dashboard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  
  totalProducts: {
    fontSize: 16,
  },
  sortFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Space out children evenly
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#fff',
    maxWidth: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  sortBar: {
    flex: 1, // Allow the sort bar to take up available space
    marginRight: 10, // Space between sort bar and filter bar
  },
  filterBar: {
    flex: 1, // Allow the filter bar to take up more space
    flexDirection: 'row', // Arrange filter elements horizontally
    alignItems: 'center', // Align items vertically in the center
  },
  search: {
    height: 40,
    width: '80%',
    borderWidth: 1,
    borderColor: '#ccc',
    alignSelf: 'flex-start',
    fontSize: 15,
  },
  inventory: {
    paddingBottom: 20,
  },
  productItem: {
    flexDirection: "row",
    marginBottom: 10,
    backgroundColor: "#fff",
    padding: 15, // Increase padding for better spacing
    borderRadius: 10, // More rounded corners
    shadowColor: "#000",
    shadowOpacity: 0.2, // Slightly increase shadow opacity for more depth
    shadowRadius: 10, // Increase shadow radius for a softer look
    shadowOffset: { width: 0, height: 5 }, // Higher shadow offset for elevation
    alignItems: 'center',
    elevation: 5, // Add elevation for Android shadow
  },
  productdetailscontainer:{
    width: '60%',  // Ensure width is not too small
    height: 150, 
    marginRight: 5,
  },
  imagecontainer:{
    width: 150,  // Ensure width is not too small
    height: 150, 
    marginRight: 5,
  },
  productImage: {
    width: 150,  // Ensure width is not too small
    height: 150, // Ensure height is not too small
    resizeMode: 'cover',
    borderRadius: 5, // Optional: rounded corners
    marginRight: 10, // Space between image and text
    backgroundColor: '#e0e0e0', // Optional: a background color to debug
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  productDescription: {
    fontSize: 14,
    marginTop: 5,
  },
  productDate: {
    fontSize: 12,
    marginTop: 5,
    color: "#777",
  },
});