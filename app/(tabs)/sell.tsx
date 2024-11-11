import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, TextInput, Image, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, ActivityIndicator} from "react-native";
import { Picker } from '@react-native-picker/picker';
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
// import RangeSlider from 'rn-range-slider';
import { useRouter } from 'expo-router';
import { icons } from "../../constants";
import { FontAwesome } from '@expo/vector-icons';

import * as FileSystem from 'expo-file-system';
import ProductDetails from '../ProductDetails'; 

interface Barangay {
  code: string;
  name: string;
}


const ProductImage = React.memo(({ imageUri }: { imageUri: string }) => {
  return <Image source={{ uri: imageUri }} style={styles.productImage} />;
});

interface ProductItemProps {
  item: {
    id: string;
    image: string;
    title: string;
    description: string;
    price: string;
    locate: string;
    created_at: string;
    averageRating: number;
    ratings: any[];
  };
  handleViewDetails: (item: any) => void;
}

const ProductItem = React.memo(({ item, handleViewDetails }: ProductItemProps) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const imageCache: { [key: string]: string } = {}; // In-memory cache for image URIs

  useEffect(() => {
    const loadImage = async () => {
      const uri = `http://10.0.2.2:8000/storage/product/images/${item.image}`;
      setLoading(true);
      setError(false);

      try {
        // Check if URI is already cached
        if (imageCache[uri]) {
          setImageUri(imageCache[uri]);
        } else {
          const filename = uri.split('/').pop();
          const fileUri = `${FileSystem.documentDirectory}${filename}`;
          const info = await FileSystem.getInfoAsync(fileUri);

          if (info.exists) {
            imageCache[uri] = fileUri;
            setImageUri(fileUri);
          } else {
            // Download the image if it isn't locally available
            const response = await FileSystem.downloadAsync(uri, fileUri);
            imageCache[uri] = response.uri;
            setImageUri(response.uri);
          }
        }
      } catch (e) {
        console.error("Error loading image:", e);
        setError(true); // Set error state if download fails
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [item.image]); // Reload image if `item.image` changes


  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return <Text style={{ color: 'red' }}>Failed to load image</Text>;
  }

   // Skeleton Loader Placeholder
   const skeletonLoader = (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonDescription} />
      <View style={styles.skeletonPrice} />
      <View style={styles.skeletonLocation} />
      <View style={styles.skeletonStars} />
    </View>
  );

   // Placeholder for the image when loading
   const imagePlaceholder = (
    <View style={styles.imagePlaceholder}>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );

  const productContent = (
    <TouchableOpacity onPress={() => handleViewDetails(item)}>
      <View style={styles.productItem}>
        <Text style={styles.productTitle}>{item.title}</Text>

        <View style={styles.imagecontainer}>
          {loading || !imageUri ? imagePlaceholder : <ProductImage imageUri={imageUri} />}
        </View>


        <View style={styles.productdetailscontainer}>
          <Text style={styles.productDescription} numberOfLines={2} ellipsizeMode="tail">
            {item.description}
          </Text>
          <Text style={styles.productPrice}>P{item.price}</Text>
          <Text style={styles.productLocation}>{item.locate}</Text>        
          <View style={styles.stars}>
          {[...Array(5)].map((_, index) => {
            const stars = index + 1; // 1 to 5
            return (
              <FontAwesome
                key={stars}
                name={stars <= Math.round(item.averageRating) ? 'star' : 'star-o'}
                size={22}
                color={stars <= Math.round(item.averageRating) ? '#FFC107' : '#E0E0E0'}
              />
            );
          })}
          <Text style={styles.averageRatingText}>
            {typeof item.averageRating === 'number' && !isNaN(item.averageRating)
              ? item.averageRating.toFixed(1)
              : '0.0'}
            {Array.isArray(item.ratings) && item.ratings.length > 0 ? ` (${item.ratings.length})` : ''}
          </Text>
        </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return loading ? skeletonLoader : productContent;
});

 interface Product {
    id: string;
    image: string;
    title: string;
    description: string;
    price: string;
    locate: string;
    created_at: string;
    averageRating: number;
    ratings: any[];
  }

const Sell = () => {
 

  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const flatListRef = useRef<FlatList<Product>>(null);
  const [filterOption, setFilterOption] = useState("locate");
  const [filterLetters, setFilterLetters] = useState("");
  const [currentDate] = useState(new Date().toLocaleDateString());
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [price, setPrice] = useState(0);
  // const [range, setRange] = useState({ min: 1, max: 1000 });

  const [ratings, setRatings] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
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

    
useEffect(() => { 
  renderProduct(); 
}, []);

  
// Retrieve product data from AsyncStorage and update UI state
const renderProduct = useCallback(async () => {
  try {
    const existingData = await AsyncStorage.getItem('products');
    const storedProducts = existingData ? JSON.parse(existingData) : [];

    // Set products and total count in UI state
    setProducts(storedProducts as Product[]);
    setTotalProducts(storedProducts.length);

    // Extract ratings and calculate average rating
    const extractedRatings = storedProducts.map((product: { ratings: any; averageRating: any; }) => ({
      ratings: product.ratings || [],
      averageRating: product.averageRating || 0,
    }));

    setRatings(extractedRatings.map((rating: any) => rating.ratings).flat());
    setAverageRating(
      extractedRatings.reduce((acc: any, curr: { averageRating: any; }) => acc + curr.averageRating, 0) / extractedRatings.length
    );

    console.log('Product data rendered successfully.');
  } catch (error) {
    console.error('Failed to render product data:', error);
  }
}, []);

const isFetching = useRef(false); // Flag for main fetch status
const isFetchingRatings = useRef(false); // Flag for ratings fetch status
const lastFetchTime = useRef(0);
const debounceDelay = 10000; // Set a 10-second delay between fetches

const logNavigationState = async () => {
  const currentTime = Date.now();
  if (currentTime - lastFetchTime.current > debounceDelay && !isFetching.current) {
    console.log('screen change');
    isFetching.current = true; // Set flag to indicate a fetch is in progress
    await fetchProducts(); // Call main fetch logic
    lastFetchTime.current = currentTime;
    isFetching.current = false; // Reset flag after fetch completes
  } else {
    console.log('Fetch skipped to prevent 429');
  }
};

useEffect(() => {
  const interval = setInterval(() => {
    if (!isFetching.current) { // Ensure no ongoing fetch before triggering another
      fetchProducts(); // Fetch products from the server at intervals
    }
  }, 10 * 60 * 1000); // 10 minutes in milliseconds

  return () => clearInterval(interval); // Clear the interval on component unmount
}, []);

useEffect(() => {
  const unsubscribe = navigation.addListener('focus', logNavigationState);
  return unsubscribe;
}, [navigation]);

const onRefresh = useCallback(async () => {
  if (!isFetching.current) { // Check if a fetch is already in progress
    setIsRefreshing(true);
    isFetching.current = true;
    await fetchProducts(); // Trigger the fetch for products
    setIsRefreshing(false);
    isFetching.current = false; // Reset flag after refresh completes
  }
}, []);

const fetchProducts = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      console.error('No auth token found');
      return;
    }

    const response = await axios.get('http://10.0.2.2:8000/api/products', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    let products = response.data;

    // Enhance products with ratings if the ratings are not already fetched
    for (let i = 0; i < products.length; i++) {
      const productWithRating = await fetchProductsRatings(products[i].id); // Fetch ratings for each product
      products[i] = { ...products[i], ...productWithRating }; // Merge the ratings with the product data
    }

    // Now you can use the products with ratings
    await updateAsyncStorage(products); // Update AsyncStorage with the new products
    console.log('Fetched products with ratings:');
  } catch (error) {
    console.error("Error fetching products:", error);
  }
};

// Update AsyncStorage without updating the UI state directly
const updateAsyncStorage = async (newData: any[]) => {
  try {
    // Fetch current data from AsyncStorage
    const existingData = await AsyncStorage.getItem('products');
    let currentData = existingData ? JSON.parse(existingData) : [];

    // Create a map of current data for quick lookup
    const currentDataMap = new Map(currentData.map((item: any) => [item.id, item]));

    // Create a Set of new product IDs for easy comparison
    const newProductIds = new Set(newData.map(item => item.id));

    // Update existing entries and add new ones
    newData.forEach(newItem => {
      currentDataMap.set(newItem.id, newItem);
    });

    // Remove items from currentDataMap that are not in newData
    for (let id of currentDataMap.keys()) {
      if (!newProductIds.has(id)) {
        currentDataMap.delete(id);
      }
    }

    // Convert map back to array
    const updatedData = Array.from(currentDataMap.values());

    // Save updated data to AsyncStorage
    await AsyncStorage.setItem('products', JSON.stringify(updatedData));

    console.log('AsyncStorage updated successfully.');
    await renderProduct(); // Update UI state after AsyncStorage update
  } catch (error) {
    console.error('Failed to update AsyncStorage:', error);
  }
}; 
  
const fetchProductsRatings = async (productId: any) => {
  try {
    if (isFetchingRatings.current) {
      console.log('Ratings fetch already in progress for productId:', productId);
      return {}; // Skip if the ratings fetch is already in progress
    }

    isFetchingRatings.current = true; // Set flag to indicate a ratings fetch is in progress

    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      console.error('No auth token found for ratings');
      isFetchingRatings.current = false; // Reset flag
      return {};
    }

    const ratingsResponse = await axios.get(`http://10.0.2.2:8000/api/productrating/${productId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const ratings = ratingsResponse.data.ratings || []; // Default to an empty array if undefined
    const averageRating = ratingsResponse.data.averageRating || 0;

    isFetchingRatings.current = false; // Reset flag after ratings fetch completes

    // Ensure the ratings are an array and handle safely
    if (!Array.isArray(ratings)) {
      console.error('Invalid ratings format for productId:', productId);
      return {
        ratings: [],
        averageRating: 0
      };
    }

    return {
      ratings,
      averageRating
    };
  } catch (error) {
    console.error("Error fetching product ratings:", error);
    isFetchingRatings.current = false; // Reset flag if error occurs
    return { ratings: [], averageRating: 0 }; // Return empty ratings and 0 average if error occurs
  }
};

  



  const handleViewDetails = (product: any) => {
    console.log('Viewing product details:', product.id);
    navigation.navigate('ProductDetails', { productId: product.id });
  };

  const handleSearchChange = (text: string) => {
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
      return sortOrder === "desc" ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime();
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

    // Scroll the FlatList to the top after state updates
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ animated: true, offset: 0 });
    }
};
  const renderItem = ({ item }: { item: Product }) => (
      <ProductItem item={item} handleViewDetails={handleViewDetails} />
    );

    // for debugging purpose only
    // const removeProductsData = async () => {
    //   try {
    //     await AsyncStorage.removeItem('products');
    //     console.log('Products data removed from AsyncStorage.');
        
    //     // Verify that the data has been removed
    //     const data = await AsyncStorage.getItem('products');
    //     if (data === null) {
    //       console.log('Verification successful: Products data is not present in AsyncStorage.');
    //     } else {
    //       console.log('Verification failed: Products data is still present in AsyncStorage.', data);
    //     }
    //   } catch (error) {
    //     console.error('Failed to remove products data from AsyncStorage:', error);
    //   }
    // };

  return (
    <View style={styles.container}>
      {selectedProduct ? (
        // error on product no idea how to resolve 
        <ProductDetails product={selectedProduct} onBack={() => setSelectedProduct(null)} />
      ) : (
        <>
          <View style={styles.dashboard}>
            {/* button to post navigate you to createsell page */}
          <TouchableOpacity
            onPress={() => navigation.navigate("createsell" as never)}
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
        {/* for debugging pupose only */}
        {/* <TouchableOpacity
            onPress={removeProductsData}
        >       
            <Text>  clearasyncstorage </Text>
        </TouchableOpacity> */}
        {/* <TouchableOpacity
            onPress={() => navigation.navigate("Rating")}
        >       
            <Text>  testpage </Text>
        </TouchableOpacity> */}

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

      {/* <View style={styles.slidercontainer}>
      <Text>Enter Price:</Text>
      <Text>Minimum Price: {range.min}</Text>
      <Text>Maximum Price: {range.max}</Text>
      <RangeSlider
        min={1}
        max={1000}
        fromValue={range.min}
        toValue={range.max}
        onValueChanged={(min, max) => setRange({ min, max })}
        styleSize='small'
        showRangeLabels={false}
        showValueLabels={true}
        showDoubleValue={true}
      />
    </View> */}
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
            ref={flatListRef}
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
            numColumns={2}
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
  skeletonContainer: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  skeletonImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#ccc',
    marginBottom: 15,
  },
  skeletonTitle: {
    width: '60%',
    height: 20,
    backgroundColor: '#ccc',
    marginBottom: 10,
  },
  skeletonDescription: {
    width: '80%',
    height: 14,
    backgroundColor: '#ccc',
    marginBottom: 10,
  },
  skeletonPrice: {
    width: '40%',
    height: 20,
    backgroundColor: '#ccc',
    marginBottom: 10,
  },
  skeletonLocation: {
    width: '50%',
    height: 14,
    backgroundColor: '#ccc',
    marginBottom: 10,
  },
  skeletonStars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productItem: {
    // flexDirection: "row",
    width: 190,
    // width: '100%', // Ensure width is not too small
    marginBottom: 10,
    marginRight: 10,
    backgroundColor: "#fff",
    padding: 15, // Increase padding for better spacing
    borderRadius: 10, // More rounded corners
    shadowColor: "#000",
    shadowOpacity: 0.2, // Slightly increase shadow opacity for more depth
    shadowRadius: 10, // Increase shadow radius for a softer look
    shadowOffset: { width: 0, height: 5 }, // Higher shadow offset for elevation
    // alignItems: 'center',
    elevation: 5, // Add elevation for Android shadow
  },
  productdetailscontainer:{
    width: '100%',  // Ensure width is not too small
    height: '100%', // Ensure height is not too small
    marginRight: 5,
    flex: 1,
  },
  imagecontainer:{
    width: 160,  // Ensure width is not too small
    height: 180, 
    marginRight: 5,
  },
  imagePlaceholder: {
    width: 160,  // Ensure width is not too small
    height: 180, 
    marginRight: 5,
  },
  productImage: {
    width: '100%',  // Ensure width is not too small
    height: '100%', // Ensure height is not too small
    resizeMode: 'cover',
    borderRadius: 5, // Optional: rounded corners
    marginRight: 10, // Space between image and text
    backgroundColor: '#e0e0e0', // Optional: a background color to debug
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34495e',
  },
  productDescription: {
    fontSize: 14,
    height: 40,
    color: '#7f8c8d',
    marginTop: 4,
    width: 'auto',
    flexShrink: 1,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a085',
    marginTop: 4,
  },
  productLocation: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  productDate: {
    fontSize: 12,
    color: '#777',
    marginTop: 6,
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',                // Center stars vertically
  },
  averageRatingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,                      // Space between stars and rating text
    alignSelf: 'center',                 // Center the text vertically with stars
},
});