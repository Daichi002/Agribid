import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";

import BASE_URL from './ApiConfig';

export const fetchApprovedTransactions = async () => {
  try {
    
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      console.error('No auth token found');
      router.push("/login");
    }

    const response = await axios.get(`${BASE_URL}/api/transactions/approved`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Fetched transactions:", response.data.transactions); // Log the fetched transactions
    
    return response.data.transactions; // Returning only transactions array
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
};
