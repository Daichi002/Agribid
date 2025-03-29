import React, { useState, useEffect, useCallback} from "react";
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal,
 Dimensions, ImageBackground,
 Alert} from "react-native";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { icons } from "../../constants";
import CustomButton from '../../components/CustomButton2';
import { FontAwesome } from '@expo/vector-icons';
import CategoryCommodityInput from '../../components/createsrp';
import CommodityPriceList from '../../components/CommodityPriceList';
import { ScrollView } from "react-native-gesture-handler";
import BASE_URL from '../../components/ApiConfig';
import { useAlert } from '../../components/AlertContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import { router } from "expo-router";


const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;


const ITEM_HEIGHT = 360; // Define the height of each item

const Srp = () => {
  const [srp, setSrp] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCategoryCommodityInput, setShowCategoryCommodityInput] = useState(false);
  const { showAlert } = useAlert();
  const [currentWeek, setCurrentWeek] = useState<Array<{ category: string; commodity: string; price_range: string; prevailing_price_this_week: string }>>([]); // To store the current week for modal


  const getcurrentweek = async () => {
    try {
      // Retrieve the authentication token from AsyncStorage
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        router.push("/login");
      }
  
      // Make the API request using axios
      const response = await axios.get(`${BASE_URL}/api/srp/currentweek`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      // Extract the data from the response
      const data = response.data;
      setCurrentWeek(data);
      // Retrieve the stored SRP data from AsyncStorage
      const storedData = await AsyncStorage.getItem('currentsrpData');
      const parsedStoredData = storedData ? JSON.parse(storedData) : null;
  
      if (!parsedStoredData || parsedStoredData.weekby !== data.weekby) {
        // If 'weekby' is different or no stored data, save the new data
        await AsyncStorage.setItem('currentsrpData', JSON.stringify(data));
        await getcurrentweekstored();
        console.log('New SRP data saved to storage.');
      } else {
        // If 'weekby' is the same, check if any category data has changed
        interface Category {
          category: string;
          commodity: string;
          price_range: string;
          prevailing_price_this_week: string;
        }

        interface SRPData {
          weekby: string;
          categories: Category[];
        }

        const categoriesChanged: boolean =
          Array.isArray((data as SRPData).categories) &&
          (data as SRPData).categories.some((newCategory: Category, index: number) => {
            const storedCategory: Category = (parsedStoredData as SRPData).categories[index];
            if (!storedCategory) return true; // Handle case where array lengths differ

            // Normalize numeric values by trimming and parsing
            const newPriceRange: string = newCategory.price_range.trim();
            const storedPriceRange: string = storedCategory.price_range.trim();
            const newPrevailing: number = parseFloat(newCategory.prevailing_price_this_week);
            const storedPrevailing: number = parseFloat(storedCategory.prevailing_price_this_week);

            // Compare all fields
            return (
              newCategory.category !== storedCategory.category ||
              newCategory.commodity !== storedCategory.commodity ||
              newPriceRange !== storedPriceRange ||
              newPrevailing !== storedPrevailing
            );
          });
  
        if (categoriesChanged) {
          // If any category data has changed, update the stored data
          await AsyncStorage.setItem('currentsrpData', JSON.stringify(data));
          await getcurrentweekstored();
          console.log('SRP data updated due to category change.');
        } else {
          console.log('No changes in SRP data.');
        }
      }
    } catch (error) {
      // Handle errors properly
      if (axios.isAxiosError(error)) {
        console.error('Axios error fetching srp:', error.message, error.response?.data);
      } else {
        console.error('Unexpected error fetching srp:', error);
      }
    }
  };
  
  


  const getcurrentweekstored = async () => {
    try {
      // Retrieve the stored SRP data from AsyncStorage
      const storedData = await AsyncStorage.getItem('currentsrpData');
      
      // If data exists, parse it and set it to the state
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setCurrentWeek(parsedData); // Set the current week to state
        console.log('Stored SRP Data:', parsedData);
      } else {
        console.log('No data found in AsyncStorage');
      }
    } catch (error) {
      console.error('Error retrieving SRP data from AsyncStorage:', error);
    }
  };
  
  
  useEffect(  () => {
    // dropstorage();
    // getcurrentweek();
    // getcurrentweekstored();
    fetchSrp();
    getSrpData();
  }, []);

  
const onRefresh = useCallback(async () => {
  setIsRefreshing(true);
  await fetchSrp();
  await getSrpData();
  await getcurrentweek();
  setIsRefreshing(false);
}, []);


  const processSrpData = (data: { [x: string]: any; }) => {
    // Check if data is an object, as it has dynamic keys (like '2024-11-24 - 2024-11-30')
    if (typeof data !== 'object' || Array.isArray(data)) {
        console.error('Invalid data format:', data);
        return []; // Return an empty array if the data is not in the expected format
    }

    // Convert the object to an array of week data
    const processedData = Object.keys(data).map((weekKey) => {
        const weekInfo = data[weekKey];

        // Ensure 'weekdata' is present and is an array
        if (!Array.isArray(weekInfo.weekdata)) {
            console.error(`Invalid 'weekdata' for week ${weekKey}:`, weekInfo.weekdata);
            weekInfo.weekdata = []; // Fallback to an empty array
        }

        // Extract the data for each week
        return {
            week: weekInfo.week,
            lastWeek: weekInfo.lastWeek,
            weekdata: weekInfo.weekdata, // 'weekdata' should already be an array
        };
    });

    return processedData; // Return the processed data as an array
};



// Example usage with API data
const fetchSrp = async () => {
  try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
          console.error('No auth token found');
          return;
      }

      // Fetch the data from the server
      const response = await axios.get(`${BASE_URL}/api/srp`, {
          headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;
      // console.log('Raw API Data:', data);
      
      // Process the data (grouping is already done by the backend)
      const processedData = processSrpData(data);
      // console.log('Processed Data:', JSON.stringify(processedData, null, 2));
      
      // Ensure processedData is an array before iterating
      if (Array.isArray(processedData)) {
          // Retrieve the existing SRP data from AsyncStorage
          const storedData = await AsyncStorage.getItem('srpData');
          let currentData = storedData ? JSON.parse(storedData) : [];
      
          // Iterate over the new data and update the existing data
          processedData.forEach((newWeekData) => {
              // Check if the current week already exists in the stored data
              const existingWeekIndex = currentData.findIndex((weekData: { week: any; }) => weekData.week === newWeekData.week);
      
              if (existingWeekIndex !== -1) {
                  // If the week already exists, update it
                  currentData[existingWeekIndex] = newWeekData;
              } else {
                  // If the week doesn't exist, add it as a new entry
                  currentData.push(newWeekData);
              }
          });
      
          // Save the updated data to AsyncStorage
          await AsyncStorage.setItem('srpData', JSON.stringify(currentData));
          console.log('SRP data updated in AsyncStorage successfully!');
      } else {
          console.error('Processed data is not an array:', processedData);
      }
  } catch (error) {
      if (axios.isAxiosError(error)) {
          console.error('Axios error fetching srp:', error.message, error.response?.data);
      } else {
          console.error('Unexpected error fetching srp:', error);
      }
  }
};




const getSrpData = async () => {
  try {
      // Retrieve stored data from AsyncStorage
      const storedData = await AsyncStorage.getItem('srpData');
      
      if (storedData) {
          const data = JSON.parse(storedData); // Parse the JSON string into an object
          // console.log("Retrieved data from AsyncStorage:", JSON.stringify(data, null, 2));

          // Check if 'data' is an array before attempting to iterate
          if (Array.isArray(data)) {
              // Iterate over the weeks
              data.forEach((weekData, weekIndex) => {
                  console.log(`Week ${weekIndex + 1}:`, weekData.week); // Log week range

                  // Ensure 'weekdata' exists and is an array
                  if (Array.isArray(weekData.weekdata)) {
                      // Iterate over the categories for the week
                      weekData.weekdata.forEach((category: any, categoryIndex: number) => {
                          // console.log(`  Category ${categoryIndex + 1}: ${category.category}`);
                          // console.log(`    Items:`, category.items);
                      });
                  } else {
                      console.error(`Invalid weekdata for week ${weekIndex + 1}:`, weekData.weekdata);
                  }
              });

              // Set the state with the retrieved data
              setSrp(data);
          } else {
              console.error("Retrieved data is not in the expected array format:", data);
          }
      } else {
          console.log("No data found in AsyncStorage");
      }
  } catch (error) {
      console.error("Error retrieving data from AsyncStorage:", error);
  }
};





const dropstorage = async () => {
  try {
    await AsyncStorage.removeItem('srpData');
    await AsyncStorage.removeItem('currentsrpData');
    console.log('SRP data dropped from AsyncStorage successfully!');
  } catch (error) {
    console.error('Error dropping SRP data from AsyncStorage:', error);
  }
};






const handlePress = () => {
  if (showCategoryCommodityInput) {
    const userConfirmed = window.confirm("Are you sure you want to close? Unsaved changes will be lost.");
    if (!userConfirmed) return;
  }

  setShowCategoryCommodityInput((prevState) => !prevState);
  getcurrentweek();
};




  const transformData = (data: any[]) => {
    return data.map(category => ({
      ...category,
      commodities: category.commodities.map((commodity: { priceRange: any; prevailingPrice: any; }) => ({
        ...commodity,
        priceRange: commodity.priceRange || null, // Change empty string to null
        prevailingPrice: commodity.prevailingPrice || null, // Change empty string to null
      }))
    }));
  };
  

  const handleSubmit = async (data: any[]) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
          console.error('No auth token found');
          return;
      }
      // Transform the data before sending it to the backend
      const transformedData = transformData(data);
      console.log("Transformed data:", JSON.stringify(transformedData)); // Log the transformed data
  
      const response = await axios.post(`${BASE_URL}/api/admin/srpstore`, { data: transformedData }, {
        headers: {
          Authorization: `Bearer ${token}` ,
          "Content-Type": "application/json",
        },
      });
  
      console.log("Server response:", response.data); // Axios automatically parses JSON response
      showAlert('This Weeks Srp UpLoaded!', 3000, 'green');
      setShowCategoryCommodityInput((prevState) => !prevState);
      await getcurrentweek();
      await getcurrentweekstored();
      await fetchSrp();
      await getSrpData();

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Server responded with an error
          console.error("Error response:", error.response.data);
        } else if (error.request) {
          // No response was received from the server
          console.error("Error request:", error.request);
        } else {
          // Something went wrong during setting up the request
          console.error("Error message:", error.message);
        }
      } else {
        console.error("Unexpected error:", error);
      }
    }
  };


  
  const reversedSrp = Object.values(srp);
  // const reversedSrp = Object.values(srp).reverse();



  return (
    <ProtectedRoute>
    <View style={styles.container}>
      <ImageBackground
          source={icons.Agribid} // Your image source
          style={styles.backgroundImage} // Style for the image
          resizeMode="cover" // You can use 'contain' or 'cover' depending on the effect you want
        >
          <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh} // Trigger onRefresh for both
        />
      }
      contentContainerStyle={styles.scrollContainer} // Added container style
    >
          <View style={styles.header}>
        <View style={styles.logoContainer}>
        <Image
          source={icons.Agribid}
          style={styles.headericon} // Use a separate style for better control
          resizeMode="contain" // 'cover' or 'contain' works best
        />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.titleText}>
            AVERAGE WEEKLY PRICES OF SELECTED AGRICULTURAL COMMODITIES
          </Text>
          <Text style={styles.mainText}>WEEKLY PRICE MONITORING</Text>
          <Text style={styles.subText}>AGUSAN DEL NORTE - BUTUAN CITY</Text>
        </View>
      </View>
      

      <View style={styles.dashboard}>
  {/* CustomButton to the left */}
  <CustomButton title="Refresh" onPress={onRefresh} />
  {/* <CustomButton title="debugdrop" onPress={dropstorage} /> */}

  {/* TouchableOpacity to the right */}
  <TouchableOpacity onPress={handlePress} style={styles.buttonContainer}>
    <View style={styles.buttonContent}>
      <Image
        source={icons.create2}
        style={styles.icon}
        resizeMode="contain"
      />
      <Text style={styles.buttonText}>
        {showCategoryCommodityInput ? "Close" : "Create"}
      </Text>
    </View>
  </TouchableOpacity>
</View>

    
      {showCategoryCommodityInput && (
        <CategoryCommodityInput currentWeek={currentWeek} onSubmit={handleSubmit} />
      )}

      {isRefreshing && 
      <View style={styles.emptyContainer}>
      <View style={styles.emptyContent}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
      </View>
      }
 {!showCategoryCommodityInput && (
        <CommodityPriceList data={reversedSrp} />
      )}


     
    </ScrollView>
      </ImageBackground>
    </View>  
    </ProtectedRoute>
  );
};

export default Srp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 5,
    backgroundColor: "#f0f0f0",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 5,
    backgroundColor: '#28a745',
    paddingVertical: 10,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start', // Adjust alignment as needed
    paddingBottom: 20, // Space at the bottom for scroll
  },
  logoContainer: {
    width: 80,
    height: 80,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headericon: {
    width: 170,
    height: 170,
    overflow: 'hidden',
  },
  textContainer: {
    flex: 1,
    paddingLeft: 10,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff', // Adjust color for better contrast
  },
  mainText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
  subText: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  }, 
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  dashboard: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Distribute the space between items
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
    paddingHorizontal: 10,
    height: 50,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  icon: {
    width: 30,
    height: 30,
  },
  listWrapper: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Light background color for the container
    margin: 10, // Optional margin for spacing around the list
    borderRadius: 10, // Rounded corners for the container
    padding: 10, // Padding inside the container
    elevation: 2, // Add subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  listcontainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContent: {
    backgroundColor: '#fff', // White background for the text container
    padding: 20,
    borderRadius: 10, // Rounded corners
    borderWidth: 1,
    borderColor: '#ddd', // Light border for contrast
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#757575', // Light gray text color
  },
});
