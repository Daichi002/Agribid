import React, { useEffect, useMemo, useState} from 'react';
import { View, Text, StyleSheet, Dimensions, RefreshControl, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

 

import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';


const { height } = Dimensions.get('window'); // Get the screen height  


interface Notification {
  id: number;
  productTitle: string;
  created_at: string;
  user: {
    Firstname: string;
    Lastname: string;
  };
  from: {
    id: number;
    title: string;
    image: string;
  };
  type: string;
  isRead: number;
}

const Notif = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
 


  useEffect(() => { 
    storedNotifications();
  }, []); // Empty dependency array ensures this effect runs only once


    // Refresh function for pull-to-refresh
    const onRefresh = async () => {
      try {
        setIsRefreshing(true);
        setLoading(true);
        await fetchNotifications();
        Toast.show('Notifications updated', Toast.SHORT); // Optional Toast message
      } catch (error) {
        console.error('Error refreshing notifications:', error);
        Toast.show('Error updating notifications', Toast.LONG);
      } finally {
        setIsRefreshing(false);
        setLoading(false);
      }
    };
    

  // Focus effect to fetch notifications periodically
  useFocusEffect(
    React.useCallback(() => {
      const interval = setInterval(fetchNotifications, 60000); // Fetch every 5 minutes (300000 ms)

      // Fetch notifications when the screen is focused for the first time
      fetchNotifications();

      // Cleanup the interval when the screen is unfocused
      return () => clearInterval(interval);
    }, []) // Empty dependency array to fetch notifications only once when the screen is focused
  );

  const fetchNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }
  
      setLoading(true);
  
      // Fetch notifications from the API
      const notificationResponse = await axios.get(`http://10.0.2.2:8000/api/notif`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const notifications = notificationResponse.data.notifications || [];
  
      // Sort notifications by created_at in descending order (latest first)
      const sortedNotifications = notifications.length > 0
        ? notifications.sort((a: { created_at: string | number | Date; }, b: { created_at: string | number | Date; }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        : [];
  
      // Retrieve stored notifications
      const storedNotificationsJSON = await AsyncStorage.getItem('notifications');
      const storedNotifications = storedNotificationsJSON ? JSON.parse(storedNotificationsJSON) : [];
  
      // Check for new or missing notifications
      const newNotificationIds = new Set(sortedNotifications.map((notif: { id: any; }) => notif.id));
      const storedNotificationIds = new Set(storedNotifications.map((notif: { id: any; }) => notif.id));
  
      let isNewDataDifferent = false;
  
      // Check if any notification is missing in the newly fetched data
      for (const id of storedNotificationIds) {
        if (!newNotificationIds.has(id)) {
          isNewDataDifferent = true;
          break;
        }
      }
  
      // Check if the lengths differ or there are field differences
      if (!isNewDataDifferent) {
        isNewDataDifferent = storedNotifications.length !== sortedNotifications.length;
      }
  
      if (!isNewDataDifferent) {
        for (let i = 0; i < sortedNotifications.length; i++) {
          const newNotif = sortedNotifications[i];
          const storedNotif = storedNotifications.find((notif: { id: any; }) => notif.id === newNotif.id);
  
          if (
            !storedNotif ||
            newNotif.productTitle !== storedNotif.productTitle ||
            newNotif.created_at !== storedNotif.created_at ||
            newNotif.user.Firstname !== storedNotif.user.Firstname ||
            newNotif.user.Lastname !== storedNotif.user.Lastname ||
            newNotif.from?.id !== storedNotif.from?.id ||
            newNotif.from?.title !== storedNotif.from?.title ||
            newNotif.from?.image !== storedNotif.from?.image ||
            newNotif.type !== storedNotif.type ||
            newNotif.isRead !== storedNotif.isRead
          ) {
            isNewDataDifferent = true;
            break;
          }
        }
      }
  
      // Update AsyncStorage if the new data is different
      if (isNewDataDifferent) {
        await AsyncStorage.setItem('notifications', JSON.stringify(sortedNotifications));
        console.log('Notifications updated in AsyncStorage');
      } else {
        console.log('No new data, AsyncStorage is up to date');
      }
  
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };
  
  
  
  


  const storedNotifications = async () => {
    try {
      // Get stored notifications from AsyncStorage
      const storedNotifications = await AsyncStorage.getItem('notifications');
      const existingNotifications = storedNotifications ? JSON.parse(storedNotifications) : [];
  
      if (existingNotifications.length === 0) {
        console.log('No stored notifications found');
        return;
      }

      console.log('Stored notifications:', existingNotifications);
  
      // Set notifications to state
      setNotifications(existingNotifications);
  
    } catch (error) {
      console.error('Error fetching stored notifications:', error);
    }
  };
  


  if (loading) {
    return (
      <View style={styles.placeholderContainer}>
        <View style={styles.placeholderItem}>
          <View style={styles.placeholderImage} />
          <View style={styles.placeholderText} />
        </View>
        <View style={styles.placeholderItem}>
          <View style={styles.placeholderImage} />
          <View style={styles.placeholderText} />
        </View>
      </View>
    );
  }


  const handleNotificationPress = async (notification: Notification) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.error("Token not found");
        navigation.navigate("(auth)/login"); // Navigate to login if token is not found
        return;
      }
  
      // Mark the notification as read on the server
      const response = await axios.post(
        `http://10.0.2.2:8000/api/notifications/${notification.id}/mark-read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (response.status === 200) {
        // Update the notification status to 'read' in the local state
        notification.isRead = 1; // Directly mutating the notification object
  
        const productId = notification.from.id;
        // Navigate to the ProductDetails screen with the product ID
        navigation.navigate("ProductDetails", { productId: productId.toString() });
      } else {
        // Handle any errors or issues with the response
        console.error("Failed to mark notification as read:", response);
      }
    } catch (error) {
      console.error("Error occurred:", error);
    }
  };


 

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inventory}>
        <Text style={styles.header}>Notifications</Text>
        <FlatList
          data={notifications}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={() => handleNotificationPress(item)}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={() => (
            <Text style={{ textAlign: 'center', marginTop: 20 }}>No notifications available</Text>
          )}
          refreshing={isRefreshing} // This binds to your `isRefreshing` state
          onRefresh={onRefresh}
        />
      </View>
    </SafeAreaView>
  );
};

export default Notif;

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    padding: 10, 
    backgroundColor: "#f0f0f0",
  },
  listContainer: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: { 
    fontSize: 18,
     fontWeight: 'bold',
     borderBottomWidth: 5, // Add a border at the bottom
     borderBottomColor: '#e0e0e0', // Light grey border
     paddingBottom: 10, // Add some padding at the bottom
    },
  nonotifcontainer: {
      justifyContent: 'center', // Center vertically
      alignItems: 'center', // Center horizontally
      backgroundColor: '#f8f8f8', // Light background color
      padding: 20, // Add some padding
    },
  notiftext: {
      fontSize: 18, // Font size
      fontWeight: 'bold', // Bold text
      color: '#666', // Gray color for the text
      textAlign: 'center', // Center the text
    },
  text: { 
    fontSize: 14 
  },
  inventory: {
    paddingTop: 10, // Add some padding at the top
    paddingBottom: height * 0.1, // Adjust 5% of the screen height for padding
  },
  notificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 12,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },

  imageWrapper: {
    width: 80,
    height: 80,
    overflow: 'hidden',
    marginRight: 12,
  },
  productImage: {
    width: 150,  // Ensure width is not too small
    height: 150, // Ensure height is not too small
    resizeMode: 'cover',
    marginRight: 10, // Space between image and text
    backgroundColor: '#e0e0e0', // Optional: a background color to debug
  },
  notificationTextContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  notificationText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  notificationUserName: {
    fontWeight: 'bold',
    color: '#1a73e8', // Blue color for user name
  },
  notificationProductTitle: {
    fontStyle: 'italic',
    color: '#333', // Dark color for product title
  },
  notificationDate: {
    fontSize: 12,
    color: '#888', // Grey for date text
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
  placeholderContainer: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
  },
  placeholderItem: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  placeholderImage: {
    width: 50,
    height: 50,
    backgroundColor: '#d1d1d1',
    borderRadius: 25,
    marginRight: 15,
  },
  placeholderText: {
    width: '70%',
    height: 15,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
});

