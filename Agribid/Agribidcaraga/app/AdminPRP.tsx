import { View, Text, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import BASE_URL from '../components/ApiConfig';
import { useAlert } from '../components/AlertContext';
import axios from "axios";
import CategoryCommodityInput from '../components/createsrp';

const AdminPRP = () => {
  const [categories, setCategories] = useState([]);
  const { showAlert } = useAlert();
  const [currentWeek, setCurrentWeek] = useState<Array<{ category: string; commodity: string; price_range: string; prevailing_price_this_week: string }>>([]); // To store the current week for modal
  

  useEffect(() => {
    getcurrentweek();
  }, []);

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
        // console.log('Stored SRP Data:', parsedData);
      } else {
        console.log('No data found in AsyncStorage');
      }
    } catch (error) {
      console.error('Error retrieving SRP data from AsyncStorage:', error);
    }
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
    //   console.log("Transformed data:", JSON.stringify(transformedData)); // Log the transformed data
  
      const response = await axios.post(`${BASE_URL}/api/admin/srpstore`, { data: transformedData }, {
        headers: {
          Authorization: `Bearer ${token}` ,
          "Content-Type": "application/json",
        },
      });
  
    //   console.log("Server response:", response.data); // Axios automatically parses JSON response
      showAlert('This Weeks Srp UpLoaded!', 3000, 'green');
     
      await getcurrentweek();
    //   await getcurrentweekstored();

      router.push("/srp");

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


  return (
    <ScrollView>
      <View>
        <CategoryCommodityInput currentWeek={currentWeek} onSubmit={handleSubmit} />
      </View>
    </ScrollView>
  );
};

export default AdminPRP;