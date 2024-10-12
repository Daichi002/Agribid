import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for your Laravel API (Replace with your backend URL)
const API_URL = 'http://10.0.2.2:8000/api';

// Define a type for HTTP methods (GET, POST, etc.)
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

// Centralized function for making API requests with authentication
export const apiCallWithAuth = async (
  endpoint: string,   // Explicitly define the type for 'endpoint'
  method: HttpMethod = 'GET',  // Define the method parameter type
  data: any = null  // Optionally define the data type (you can make this more specific if needed)
) => {
  try {
    // Retrieve the auth token stored in AsyncStorage
    const token = await AsyncStorage.getItem('authToken');

    const response = await axios({
      url: `${API_URL}${endpoint}`,  // Full URL
      method,
      data,
      headers: {
        Authorization: `Bearer ${token}`,  // Pass the token in Authorization header
        'Content-Type': 'application/json',  // Ensure the request is in JSON format
      },
    });

    return response.data;  // Return the API response data
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};
