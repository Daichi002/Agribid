import React, { useEffect, useState } from 'react';
import { View, Text, Image } from 'react-native';
import axios from 'axios';
import icons from '../constants/icons'; // Your icons path
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import BASE_URL from '../components/ApiConfig';

const UnreadMessagesNotification = () => {
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread messages when the component mounts
  useEffect(() => {
    const fetchUnreadMessages = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
              router.push('/login');
            }
            const response = await axios.get(`${BASE_URL}/api/user/productmessage`, {
              headers: {
                Authorization: `Bearer ${token}`, // Pass your auth token here
              },
            });
            if (response.data.status) {
                console.log('Unread messages:', response.data.status);
                setHasUnreadMessages(true);
                setUnreadCount(response.data.unreadCount);
              } else {
                setHasUnreadMessages(false);
                setUnreadCount(0);
              }
      } catch (error) {
        console.error('Error fetching unread messages:', error);
      } 
    };

    fetchUnreadMessages();
  }, []);


  return (
    <View style={{ position: 'absolute', right: -5, top: -5 }}>
    {hasUnreadMessages ? (
      <View style={{
        backgroundColor: 'red',
        borderRadius: 10,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Text style={{ color: 'white', fontSize: 10 }}>{unreadCount}</Text>
      </View>
    ) : null}
  </View>
  );
};

export default UnreadMessagesNotification;
