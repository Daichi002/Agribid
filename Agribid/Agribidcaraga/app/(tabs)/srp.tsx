
import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Image, StyleSheet, RefreshControl, ScrollView, FlatList } from "react-native";
import axios from "axios";

import CommodityPriceList from '../../components/CommodityPriceList';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { icons } from "../../constants";
import Toast from 'react-native-simple-toast';
import { SafeAreaView } from "react-native-safe-area-context";
import BASE_URL from '../../components/ApiConfig';


const Srp = () => {
  const [srp, setSrp] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // const sortedSrp = SortedSrp(srp, sortOrder);

  useEffect(() => {
    // dropstorage();
    getSrpData();
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
          console.log("Retrieved data from AsyncStorage:", JSON.stringify(data, null, 2));

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
    console.log('SRP data dropped from AsyncStorage successfully!');
  } catch (error) {
    console.error('Error dropping SRP data from AsyncStorage:', error);
  }
};




const onRefresh = useCallback(async () => {
  setIsRefreshing(true);
  await fetchSrp();
  await getSrpData();
  Toast.show('Srp List updated', Toast.SHORT);
  setIsRefreshing(false);
}, []);


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
        <Image
          source={icons.Agribid}
          style={styles.icon} // Use a separate style for better control
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

      <FlatList
      data={srp || []} // Use an empty array if srp is null or undefined
      renderItem={({ item }) => <CommodityPriceList data={item} />} // Render each item in CommodityPriceList
      keyExtractor={(item, index) => index.toString()} // Key extractor for flat list
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh} // Trigger onRefresh when pulled
        />
      }
      style={styles.listcontainer}
      ListEmptyComponent={<Text>Loading...</Text>} // Show loading text if srp is empty
    />
    </SafeAreaView>
  )
}

export default Srp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 5,
    backgroundColor: "#f0f0f0",
  },
  listcontainer:{
    width: '100%',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',  // Center everything horizontally
    alignItems: 'flex-start',      // Center the items vertically
    marginBottom: 5,
    backgroundColor: '#28a745',
  },
  icon: {
    width: 150,    // Set a fixed width for the icon
    height: 150,    // Adjust the height to match the combined text height
    resizeMode: 'contain',  // Adjust the icon size to fit the container
    overflow: 'hidden',    // Hide any overflow from the container
      },
  logoContainer: {
        width: 80,
        height: 80,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
      },
  textContainer: {
    padding: 5,  // Add padding around the text
    alignContent  : 'center',
    justifyContent: 'center',  // Vertically center the text
    alignItems: 'flex-start',  // Horizontally align the text to the start
  },
  titleText: {
    fontSize: 8,  // Adjust font size as needed for readability
    fontWeight: 'bold',
    textAlign: 'center',  // Center text
  },
  mainText: {
    fontSize: 20,     // Larger font size for the main title
    fontWeight: 'bold',
    textAlign: 'center',  // Center text
  },
  subText: {
    fontSize: 12,     // Smaller font size for the location text
    fontWeight: 'bold',
    textAlign: 'center',
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