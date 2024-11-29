import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import BASE_URL from '../components/ApiConfig';


export const fetchNewNotifications = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      console.warn('No token found');
      return false; // No token, cannot fetch notifications
    }

    // Make the request to the API
    const response = await axios.get(`${BASE_URL}/api/notifindicator`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Assuming response.data contains 'unread_count' and other relevant data
    const { unread_count, notifications } = response.data;

    console.log('Unread notifications count:', unread_count);

    if (unread_count > 0) {
      console.log('New notifications:', notifications);
      return true; // Indicate that there are new (unread) notifications
    }

    return false; // No new notifications
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error fetching notifications:', error.message);
    } else {
      console.error('Error fetching notifications:', error);
    }
    return false; // Return false if there's an error
  }
};

