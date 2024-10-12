import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, Image, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, ActivityIndicator} from "react-native";
import { Picker } from '@react-native-picker/picker';
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from "@react-native-community/slider";
import { useRouter } from 'expo-router';
import { icons } from "../../constants";

import * as FileSystem from 'expo-file-system';

interface Barangay {
  code: string;
  name: string;
}

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
const ProductImage = React.memo(({ imageUri }: { imageUri: string }) => {
  return <Image source={{ uri: imageUri }} style={styles.productImage} />;
});

const ProductItem = React.memo(({ item, handleViewDetails }) => {
  // console.log('sorten item',item)
  const [imageUri, setImageUri] = useState(null);

  useEffect(() => {
    const loadImage = async () => {
      const uri = `http://10.0.2.2:8000/storage/product/images/${item.image}`;
      setImageUri(await cacheImage(uri));
    };

    loadImage();
  }, [item.image]);

  return (
    <TouchableOpacity onPress={() => handleViewDetails(item)}>
      <View style={styles.productItem}>
        <View style={styles.imagecontainer}>
        {imageUri ? (
         <ProductImage imageUri={imageUri} />
        ) : (
          <ActivityIndicator size="small" color="#0000ff" />
        )}</View>
        <View style={styles.productdetailscontainer}>
          <Text style={styles.productTitle}>{item.title}</Text>
          <Text style={styles.productDescription}>Description: {item.description}</Text>
          <Text style={styles.productDescription}>Located: {item.locate}</Text>
          <Text style={styles.productDate}>
            Date Created: {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});


const Sell = () => {
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortCriteria, setSortCriteria] = useState("title");
  const [sortOrder, setSortOrder] = useState("desc");
  const [filterOption, setFilterOption] = useState("locate");
  const [filterLetters, setFilterLetters] = useState("");
  const [currentDate] = useState(new Date().toLocaleDateString());
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [price, setPrice] = useState(0);
  const [minValue, setMinValue] = useState(0);
  const [maxValue, setMaxValue] = useState(100);

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const categories = ["Fruits", "LiveStock & Poultry", "Fisheries", "Vegetable", "Crops"];
  const navigation = useNavigation();
  const router = useRouter();

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
            console.log('Barangays loaded from cache');
          } else {
            const response = await fetch(`https://psgc.gitlab.io/api/cities-municipalities/${municipalityCode}/barangays`);
            const data: Barangay[] = await response.json();
            setBarangays(data.sort((a, b) => a.name.localeCompare(b.name)));
            await AsyncStorage.setItem(`barangays_${municipalityCode}`, JSON.stringify(data));
            setBarangayLookup(createBarangayLookup(data));
            console.log('Barangays fetched from API and cached');
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

    // save the new data to asyncstorage for a more faster render
    const updateAsyncStorage = async (newData) => {
      try {
        // Fetch current data from AsyncStorage
        const existingData = await AsyncStorage.getItem('products');
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
        await AsyncStorage.setItem('products', JSON.stringify(updatedData));
        console.log('AsyncStorage updated successfully.');
      } catch (error) {
        console.error('Failed to update AsyncStorage:', error);
      }
    };

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
      const enhancedProducts = response.data.map((product: any) => ({
        ...product,
      }));
      setProducts(enhancedProducts);
      updateAsyncStorage(enhancedProducts);
      setTotalProducts(enhancedProducts.length);
      // console.log("Fetched Products Data:", enhancedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };



  const handleViewDetails = (product: any) => {
    // console.log("Fetched Products:", product);
    // @ts-ignore
    navigation.navigate('ProductDetails', { product: JSON.stringify(product) });
  };

  //debugs codes
  const logNavigationState = () => {
    // console.log(navigation.getState());
    console.log('screen change');
    fetchProducts();
};

useEffect(() => {
    const unsubscribe = navigation.addListener('focus', logNavigationState);
    return unsubscribe;
}, [navigation]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchProducts();
    setIsRefreshing(false);
  }, []);

  const handleSearchChange = (text) => {
    setSearchQuery(text);
  };
  

 
 // Function to filter and sort products
const filterAndSortProducts = () => {
  // Filter based on search query and custom filter options
  const sortedProducts = products
    .filter((product) => 
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .filter((product) => {
      if (filterOption === "") return true;
      const name = product.title.toLowerCase();
      const letters = filterLetters.toLowerCase();
      if (filterOption === "starts_with") {
        return name.startsWith(letters);
      } else if (filterOption === "ends_with") {
        return name.endsWith(letters);
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  return sortedProducts; // Return the sorted products
};

// Use effect to run filtering and sorting initially on page load
useEffect(() => {
  const initialFilteredProducts = filterAndSortProducts(); // Get initially filtered and sorted products
  setFilteredProducts(initialFilteredProducts); // Set initial state
}, [products, searchQuery, filterOption, filterLetters, sortOrder]); // Dependencies for initial filtering


const applyBarangayFilter = (selectedBarangay: string, selectedCategory: string) => {
  console.log('Applying barangay filter for code:', selectedBarangay);

  // Find the barangay name based on the barangay code (if selectedBarangay exists)
  const barangayName = barangayLookup[selectedBarangay];

  console.log('Mapping address to barangay name:', selectedBarangay, barangayName);

  // Get the already filtered and sorted products
  const initialFilteredProducts = filterAndSortProducts();

  // Sort logic: Match barangay and category, but all products should be shown
  const finalSortedProducts = initialFilteredProducts.sort((a, b) => {
    // First, compare by barangay if it's selected
    if (selectedBarangay) {
      const aMatchesBarangay = a.locate === barangayName ? 1 : 0;
      const bMatchesBarangay = b.locate === barangayName ? 1 : 0;

      if (aMatchesBarangay !== bMatchesBarangay) {
        return bMatchesBarangay - aMatchesBarangay; // Sort barangay matches first
      }
    }

    // Then, compare by category if it's selected
    if (selectedCategory) {
      const aMatchesCategory = a.title.toLowerCase().includes(selectedCategory.toLowerCase()) ? 1 : 0;
      const bMatchesCategory = b.title.toLowerCase().includes(selectedCategory.toLowerCase()) ? 1 : 0;

      if (aMatchesCategory !== bMatchesCategory) {
        return bMatchesCategory - aMatchesCategory; // Sort category matches after barangay
      }
    }

    // Otherwise, keep the original order
    return 0;
  });

  // Update the state with the new sorted products
  setFilteredProducts(finalSortedProducts);
  setModalVisible(false);
  setSelectedBarangay('');
  setSelectedCategory('');
};
  const renderItem = ({ item }) => (
      <ProductItem item={item} handleViewDetails={handleViewDetails} />
    );

  return (
    <View style={styles.container}>
      {selectedProduct ? (
        <ProductDetails product={selectedProduct} onBack={() => setSelectedProduct(null)} />
      ) : (
        <>
          <View style={styles.dashboard}>
            {/* button to post navigate you to createsell page */}
          <TouchableOpacity
            onPress={() => navigation.navigate("createsell")}
            style={styles.buttonContainer}
        >
            <Text style={styles.buttonText}>
            <Image 
              source={icons.create2} 
              style={styles.icon}
              resizeMode="contain" // Ensure the image fits within the circular container
            /> 
              Post</Text>
        </TouchableOpacity>

            <Text style={styles.totalProducts}>Total Post: {totalProducts}</Text>
          </View>
          <View style={styles.searchSortFilter}>
            <TextInput
              style={styles.search}
              placeholder="Search here"
              value={searchQuery}
              onChangeText={handleSearchChange}
            />
            <>
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Image 
          source={icons.slider} 
          style={styles.slider}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <Modal
  visible={modalVisible}
  animationType="slide"
  transparent={true}
  onRequestClose={() => setModalVisible(false)}  // Handle hardware back button
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContainer}>
      <View style={styles.dropdownContainer}>
      <Picker
           selectedValue={selectedCategory}
           onValueChange={(itemValue) => setSelectedCategory(itemValue)} 
          style={styles.picker}
        >
          <Picker.Item label="Category" value="" />
          {categories.map((category, index) => (
            <Picker.Item key={index} label={category} value={category} />
          ))}
        </Picker>
      </View>

      <View style={styles.dropdownContainer}>
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

      <View style={styles.slidercontainer}>
      <Text>Enter Price:</Text>
      <Text>Minimum Price: {minValue}</Text>
      <Slider
        style={{width: 300, height: 40}}
        minimumValue={0}
        maximumValue={maxValue}
        value={minValue}
        onValueChange={(value) => {
          if (value <= maxValue) {
            setMinValue(value);
          }
        }}
      />
      <Text>Maximum Price: {maxValue}</Text>
      <Slider
        style={{width: 300, height: 40}}
        minimumValue={minValue}
        maximumValue={200}  // Adjust as needed
        value={maxValue}
        onValueChange={(value) => {
          if (value >= minValue) {
            setMaxValue(value);
          }
        }}
      />
    </View>
      <TouchableOpacity onPress={() => applyBarangayFilter(selectedBarangay, selectedCategory)}>
        <Text style={styles.closeButton}>Enter</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setModalVisible(false)}>
        <Text style={styles.closeButton}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
</>
          </View>       
          <FlatList
            data={filteredProducts}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.inventory}
            extraData={products}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
              />
            }
          />
        </>
      )}
    </View>
  );
};

export default Sell;

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
  addProductLink: {
    fontSize: 16,
    color: "#0066cc",
    textDecorationLine: "underline",
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  totalProducts: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  
  modalContainer: {
    width: '90%', // Ensure it scales with the screen size
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
  
  dropdownContainer: {
    marginBottom: 15, // Add margin between dropdowns
  },
  
  picker: {
    height: 40,
    backgroundColor: '#B4CBB7',
    borderColor: 'black',
    borderWidth: 1,
    textAlign: 'center',
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  
  closeButton: {
    textAlign: 'center',
    color: 'blue',
    fontSize: 18,
    marginTop: 10,
  },

  searchSortFilter: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: "space-between",
    alignItems: 'center',
  },
  slider: {
    width: 30, // Adjust size as needed
    height: 30,
    marginRight: 20, // Space between slider and next element
  },
  slidercontainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop:30,
    marginBottom: 30,
    borderColor: 'black',

  },

  input: {
    height: 30,
    borderColor: "#ccc",
    borderWidth: 1,
    paddingHorizontal: 10,
    marginVertical: 10,
    marginHorizontal: 5, // Space between input fields
    flex: 1, // Make input fields flexible
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