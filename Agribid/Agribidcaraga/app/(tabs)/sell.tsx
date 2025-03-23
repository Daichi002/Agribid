import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { View, Text, TextInput, Image, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal,
 Dimensions, ImageBackground} from "react-native";
import { Picker } from '@react-native-picker/picker';
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
// import RangeSlider from 'rn-range-slider';
import { useRouter } from 'expo-router';
import { icons } from "../../constants";
import { FontAwesome } from '@expo/vector-icons';
import ProtectedRoute from '../../components/ProtectedRoute';
import Toast from 'react-native-simple-toast';
import BASE_URL from '../../components/ApiConfig';

import * as FileSystem from 'expo-file-system';
import { Float } from "react-native/Libraries/Types/CodegenTypes";

interface Barangay {
  code: string;
  name: string;
}

 // In-memory cache for image URIs


interface ProductItemProps {
  item: {
    id: string;
    image: string;
    title: string;
    description: string;
    price: string;
    locate: string;
    created_at: string;
    ratings_avg_rate: Float;
    ratings_count: number;
    comments_count: number;
  };
  handleViewDetails: (item: any) => void;
}

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

// Centralized image cache
const imageCache: { [key: string]: Promise<string> } = {};

const ProductItem = React.memo(({ item, handleViewDetails }: ProductItemProps) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const averageRating = parseFloat(item.ratings_avg_rate.toString()).toFixed(1);

  const uri = useMemo(
    () => `${BASE_URL}/storage/product/images/${item.image}`,
    [item.image]
  );

  useEffect(() => {
    const loadImage = async () => {
      setLoading(true);
      setError(false);

      try {
        // Check if the image URI is already being processed
        if (!imageCache[uri]) {
          // Cache the promise to avoid duplicate downloads
          imageCache[uri] = (async () => {
            const filename = uri.split('/').pop();
            const fileUri = `${FileSystem.documentDirectory}${filename}`;
            const info = await FileSystem.getInfoAsync(fileUri);

            if (info.exists) {
              // If the image exists locally, return its URI
              return fileUri;
            } else {
              // Download the image and store it locally
              const response = await FileSystem.downloadAsync(uri, fileUri);
              if (response.status === 200) {
                const fileInfo = await FileSystem.getInfoAsync(response.uri);
                if (fileInfo.exists && fileInfo.size > 0) {
                  return response.uri;
                }
                throw new Error('Downloaded image file is corrupted or empty');
              }
              throw new Error('Failed to download image');
            }
          })();
        }

        // Await the cached promise and set the image URI
        const downloadedUri = await imageCache[uri];
        setImageUri(downloadedUri);
      } catch (e) {
        console.error('Error loading image:', e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [uri]);

  // Skeleton Loader Placeholder
  const SkeletonLoader = () => (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonDescription} />
      <View style={styles.skeletonPrice} />
      <View style={styles.skeletonLocation} />
      <View style={styles.skeletonStars}>
        {[...Array(5)].map((_, index) => (
          <View key={index} style={styles.skeletonStar} />
        ))}
      </View>
    </View>
  );

  // Image Subcomponent
  const ProductImage = React.memo(({ imageUri }: { imageUri: string }) => (
    <Image
      source={imageUri ? { uri: imageUri } : icons.LoadingAgribid}
      style={styles.productImage}
      resizeMode="contain"
      onLoad={() => setLoading(false)}
      onError={() => {
        setError(true);
        setLoading(false);
      }}
    />
  ));

  return (
      <TouchableOpacity onPress={() => handleViewDetails(item)}>
         
        <View style={styles.productItem}>
       
          <Text style={styles.productTitle}>{item.title}</Text>

          <View style={styles.imagecontainer}>
            {loading ? (
              <SkeletonLoader />
            ) : error ? (
              <Image
                source={icons.LoadingAgribid} // Fallback placeholder
                style={styles.imagePlaceholder}
                resizeMode="contain"
              />
            ) : (
              <Image
                source={imageUri ? { uri: imageUri } : icons.LoadingAgribid}
                style={styles.productImage}
                resizeMode="cover"
              />
            )}
          </View>

          <View style={styles.productdetailscontainer}>
            <Text style={styles.productDescription} numberOfLines={2} ellipsizeMode="tail">
              {item.description}
            </Text>
            <View style={styles.middleman}>
            <Text style={styles.productPrice}>P{item.price}</Text>
            <View style={styles.commentContainer}>
          <Text> 
            <Image
                source={icons.comments} // Fallback placeholder
                style={styles.commenticon}
                resizeMode="contain"
              />
              {item.comments_count}
              </Text>
        </View>
        </View>
            <Text style={styles.productLocation}>{item.locate}</Text>

            <View style={styles.stars}>
              {[...Array(5)].map((_, index) => {
                const stars = index + 1;
                return (
                  <FontAwesome
                    key={stars}
                    name={stars <= Math.round(item.ratings_avg_rate) ? 'star' : 'star-o'}
                    size={22}
                    color={stars <= Math.round(item.ratings_avg_rate) ? '#FFC107' : '#E0E0E0'}
                  />
                );
              })}
              <Text style={styles.averageRatingText}>
                {averageRating}
                {item.ratings_count > 0 ? ` (${item.ratings_count}) ` : ''}
              </Text>
            </View>
          </View>
        </View>
       
      </TouchableOpacity>
  );
});


 interface Product {
    id: string;
    image: string;
    title: string;
    description: string;
    price: string;
    locate: string;
    created_at: string;
    ratings_avg_rate: number;
    ratings_count: number;
  }

const ITEM_HEIGHT = 360; // Define the height of each item

const Sell = () => {
 
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const flatListRef = useRef<FlatList<Product>>(null);
  const [filterOption, setFilterOption] = useState("locate");
  const [filterLetters, setFilterLetters] = useState("");
  const [currentDate] = useState(new Date().toLocaleDateString());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [price, setPrice] = useState(0);
  // const [range, setRange] = useState({ min: 1, max: 1000 });

  // const [ratings, setRatings] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
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
    // console.log('Stored products:', storedProducts);
    setProducts(storedProducts as Product[]);
    setTotalProducts(storedProducts.length);
    // setAverageRating(storedProducts.ratings_avg_rate);

    console.log('Product data rendered successfully.');
  } catch (error) {
    console.error('Failed to render product data:', error);
  }
}, []);


const isFetching = useRef(false); // Flag for main fetch status
// const isFetchingRatings = useRef(false); // Flag for ratings fetch status
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
    Toast.show('Products Updated', Toast.SHORT);
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
      navigation.navigate('(auth)/login');
    }

    const response = await axios.get(`${BASE_URL}/api/products`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const newProducts = response.data;

    // console.log('Fetched products:', newProducts);

    const existingProductsJson = await AsyncStorage.getItem('products');
    const existingProducts = existingProductsJson ? JSON.parse(existingProductsJson) : [];

    let updateNeeded = false;

    if (existingProducts.length !== newProducts.length) {
      updateNeeded = true;
    } else {
      for (let i = 0; i < newProducts.length; i++) {
        const existingProduct = existingProducts.find((p: { id: any; }) => p.id === newProducts[i].id);
        if (!existingProduct || JSON.stringify(existingProduct) !== JSON.stringify(newProducts[i])) {
          updateNeeded = true;
          break;
        }
      }
    }

    if (updateNeeded) {
      await AsyncStorage.setItem('products', JSON.stringify(newProducts));
      renderProduct();
      console.log('Updated AsyncStorage with new products data:', newProducts);
    } else {
      console.log('No updates needed, products data is unchanged.');
    }
  } catch (error) {
    console.error("Error fetching products:", error);
  }
};


  const handleViewDetails = (product: any) => {
    console.log('Viewing product details:', product.id);
    navigation.navigate('ProductDetails', { productId: product.id});
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

    const memoizedRenderItem = useCallback(
      (item: { item: Product; }) => {
        return renderItem(item);
      },
      [renderItem] // Only re-memoize when renderItem changes
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
    <ProtectedRoute>
    <View style={styles.container}>
      <ImageBackground
          source={icons.Agribid} // Your image source
          style={styles.backgroundImage} // Style for the image
          resizeMode="cover" // You can use 'contain' or 'cover' depending on the effect you want
        >
     
          <View style={styles.dashboard}>
            {/* button to post navigate you to createsell page */}
            <TouchableOpacity
                onPress={() => navigation.navigate("createsell" as never)}
                style={styles.buttonContainer}
              >
                <View style={styles.buttonContent}>
                  <Image 
                    source={icons.create2} 
                    style={styles.icon}
                    resizeMode="contain"
                  /> 
                  <Text style={styles.buttonText}>Post</Text>
                </View>
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
          <View style={styles.searchContainer}>
              <Image
                source={icons.search}
                style={styles.searchIcon}
                resizeMode="contain"
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search here"
                value={searchQuery}
                onChangeText={handleSearchChange}
              />
            </View>

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
              <Picker.Item key={code} label={name} value={code} style={{ fontSize: 16 }} />
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
      <View style={styles.closeButtonContainer}>
        <TouchableOpacity onPress={() => applyBarangayFilter(selectedBarangay, selectedCategory)}>
          <Text style={styles.closeButton}>Enter</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setModalVisible(false)}>
          <Text style={styles.closeButton}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
</>
    </View>       
          <FlatList
            ref={flatListRef}
            data={filteredProducts}
            renderItem={memoizedRenderItem} // Memoized render item function
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.inventory}
            extraData={filteredProducts} // Keep this to avoid unnecessary re-renders of the list
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            }
            numColumns={2} // Adjust this as needed for layout
            initialNumToRender={10} // Set a smaller initial number of rendered items
            maxToRenderPerBatch={10} // Limit the number of items to render in each batch
            windowSize={5} // Controls the number of items rendered off-screen (default 21, lower is better)
            removeClippedSubviews={true} // Optimize performance by removing off-screen items
            getItemLayout={(data, index) => ({
              length: ITEM_HEIGHT, // Specify the height of your list items for optimization
              offset: ITEM_HEIGHT * index, // Calculate the offset for each item
              index,
            })}
            onEndReachedThreshold={0.1} // Trigger onEndReached when user scrolls close to the end
            onEndReached={() => {
              // Fetch more data if required when end is reached
            }}
            scrollEventThrottle={16} // Optimize scroll event performance
            // Prevent unnecessary re-renders
          />
      </ImageBackground>
    </View>
    </ProtectedRoute>
  );
};

export default Sell;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 5,
    backgroundColor: "#f0f0f0",
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
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
  
  buttonContent: {
    flexDirection: 'row',  // Align icon and text horizontally
    alignItems: 'center',  // Center the icon and text vertically
    justifyContent: 'center',  // Center the content horizontally
  },
  
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,  // Space between the image and text
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
    marginBottom: 15,
    marginTop: 10,
    height  : 50,
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
    marginBottom: 10, // Adds margin between dropdowns
    alignItems: 'center', // Center the dropdown inside the container
    justifyContent: 'center', // Center the dropdown vertically if necessary
  },
  
  picker: {
    height: 60, // Increased height to allow room for descenders
    backgroundColor: '#B4CBB7',
    borderColor: 'black',
    borderWidth: 1,
    textAlign: 'center', // Centers the text inside the Picker
    paddingHorizontal: 10,
    width: '80%', // Adjust width to fit better within the container (optional)
    marginVertical: 10, // Adds vertical margin for spacing
    borderRadius: 5, // Adds border radius for rounded edges
    overflow: 'visible', // Ensures text stays within bounds and is visible if it overflows
  },
  
  pickerItem: {
    fontSize: 16, // Make sure the font size is readable
    lineHeight: 24, // Add line height to give more space to the text (important for descenders)
    overflow: 'visible', // Ensures the text is fully visible, even if it overflows
  },
  
  closeButtonContainer: {
    marginTop: 10, // Add some space from the content above
    width: '100%', // Ensure the container takes the full width
    alignItems: 'center', // Center buttons horizontally
    justifyContent: 'center', // Center buttons vertically if needed
    gap: 20, // Space between buttons
  },
  
  
  closeButton: {
    backgroundColor: '#28a745', // Button background color
    color: '#FFFFFF', // Text color
    fontSize: 18,
    fontWeight: 'bold', // Make text bold
    textAlign: 'center', // Center text inside button
    paddingVertical: 10, // Add padding for button height
    paddingHorizontal: 20, // Add padding for button width
    borderRadius: 5, // Round the corners of the button
    width: '45%', // Make the buttons take up 45% of the container's width
    elevation: 3, // Add a shadow effect (for Android)
    shadowColor: '#000', // Shadow color (for iOS)
    shadowOffset: { width: 0, height: 2 }, // Shadow offset (for iOS)
    shadowOpacity: 0.25, // Shadow opacity (for iOS)
    shadowRadius: 3.84, // Shadow blur (for iOS)
  },
    

  searchSortFilter: {
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: "space-between",
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
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
  searchContainer: {
    flexDirection: 'row', // Arrange icon and input horizontally
    alignItems: 'center', // Center items vertically
    borderWidth: 1, // Add border to simulate an input field
    borderColor: '#ccc', // Border color
    borderRadius: 8, // Rounded corners
    backgroundColor: '#f5f5f5', // Background color of the input
    paddingHorizontal: 10, // Add horizontal padding
    height: 50, // Fixed height for the search bar
    width: '80%', // Take up the full width of the container
  },
  searchIcon: {
    width: 20, // Icon width
    height: 20, // Icon height
    marginRight: 10, // Space between icon and input
  },
  searchInput: {
    flex: 1, // Take up the remaining space
    fontSize: 16, // Font size for input text
    color: '#333', // Text color
    padding: 5, // Inner padding for text
  },
  
  inventory: {
    paddingBottom: 20,
  },
  skeletonContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f2f2', // Light background for placeholder
    borderRadius: 5,
  },
  skeletonImage: {
    width: '100%',
    height: '60%',
    backgroundColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  skeletonTitle: {
    width: '60%',
    height: 20,
    backgroundColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  skeletonDescription: {
    width: '80%',
    height: 14,
    backgroundColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  skeletonPrice: {
    width: '40%',
    height: 20,
    backgroundColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  skeletonLocation: {
    width: '50%',
    height: 14,
    backgroundColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
  },
  skeletonStars: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  skeletonStar: {
    width: 20,
    height: 20,
    backgroundColor: '#ccc',
    borderRadius: 10,
    marginHorizontal: 2,
  },
  
    productItem: {
      width: screenWidth * 0.45,
      maxWidth: 400,
      minWidth: 150,
      height: 330,
      marginBottom: 10,
      marginRight: 10,
      backgroundColor: "#fff",
      padding: 15,
      paddingHorizontal: 10,  // Add horizontal padding to balance content inside
      borderRadius: 10,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
      elevation: 5,
      alignItems: 'center',         // Center items horizontally in container
    },

    productdetailscontainer: {
      width: '100%',
      flex: 1,
      marginRight: 5,
    },
    imagecontainer: {
      width: screenWidth * 0.4,
      height: screenHeight * 0.2,
      maxHeight: 200,
      marginRight: 5,
      alignItems: 'center',         // Ensure image content is centered
    },
    errorText: {
      color: 'red',
      fontSize: 16,
    },
    imagePlaceholder: {
      width: screenWidth * 0.4,
      height: screenHeight * 0.25,
      maxHeight: 200,
      marginRight: 5,
      alignItems: 'center',         // Ensure image content is centered
    },
    productImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
      borderRadius: 5,
      backgroundColor: '#e0e0e0',
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
middleman: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

commentContainer: {
  flexDirection: 'row',
  alignSelf: 'flex-end',
  // marginTop: -25,
  zIndex: 1,
},
commenticon: {
  // width: screenWidth * 0.1,
  // height: screenHeight * 0.25,
  width: 25,
  height: 25,
  // maxHeight: 1,
  // alignItems: 'center',         // Ensure image content is centered
},

});