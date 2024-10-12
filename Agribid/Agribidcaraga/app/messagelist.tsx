import { View, Text, Alert, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

type User = {
    id: number;
    Firstname: string;
    Lastname: string;
    Phonenumber: string;
    Address: string;
    created_at: string;
    updated_at: string;
  };
  
  type Message = {
    id: number;
    text: string;
    product_id: number;
    sender_id: number;
    receiver_id: number;
    created_at: string;
    updated_at: string;
    sender: User; // Add sender property
    currentUserId: User;
  };
    
const MessageList = () => {
    const [loading, setLoading] = useState(true);
    const [messageList, setMessageList] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    const { productId } = useLocalSearchParams();
    const router = useRouter();
    
    useEffect(() => {
        const fetchMessages = async () => {
            if (!productId) return;

            try {
                const token = await AsyncStorage.getItem('authToken');
                if (!token) {
                    console.error('No auth token found');
                    return;
                }

                const response = await axios.get(`http://10.0.2.2:8000/api/messageslist`, {
                    params: { productId },
                    headers: { Authorization: `Bearer ${token}` },
                    timeout: 10000,
                });

                console.log('messagedatareceive', response.data);

                setMessageList(response.data);
                await AsyncStorage.setItem(`messages_${productId}`, JSON.stringify(response.data));
            } catch (error) {
                console.error('Error fetching messages:', error);
                Alert.alert('Error', 'Could not fetch messages.');
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [productId]);

    useEffect(() => {
        const fetchCurrentUserId = async () => {
          try {
            const userInfo = await AsyncStorage.getItem('userInfo');
            console.log('messageuserbefore parse', userInfo);
      
            if (userInfo) {
              const user = JSON.parse(userInfo);
              console.log('parsed user:', user);
      
              if (user && user.id) {
                console.log('user.id:', user.id);
                setCurrentUserId(user.id); // Store as a number, not a string
              } else {
                console.error('user.id is undefined');
                setCurrentUserId(null); // Handle appropriately
              }
            } else {
              console.error('userInfo is null or undefined');
              setCurrentUserId(null); // Handle appropriately
            }
          } catch (error) {
            console.error('Error parsing userInfo:', error);
            setCurrentUserId(null); // Handle appropriately
          }
        };
      
        fetchCurrentUserId();
      }, []);      

    const sortMessages = (messages: Message[], currentUserId: number) => {
        return messages.reduce((acc: { [key: string]: Message }, message) => {
          if (message.sender_id === currentUserId) return acc; // Skip messages from the current user
      
          const key = `${message.sender_id}-${message.receiver_id}`;
          if (!acc[key] || new Date(message.updated_at) > new Date(acc[key].updated_at)) {
            acc[key] = message; // Keep only the latest message
          }
          return acc;
        }, {});
      };         

      const handlePress = (message: Message) => {
        router.push({
            pathname: '/messagereceiver',
            params: {
                productId: message.product_id,
                senderid: message.sender_id,
            }
        });
    };

    const sortedMessages = currentUserId ? sortMessages(messageList, currentUserId) : [];


    const renderMessage = ({ item }: { item: Message }) => (
        <TouchableOpacity onPress={() => handlePress(item)}>
            <View style={styles.messageContainer}>
                <Text style={styles.messageText}>{item.text}</Text>
                <Text style={styles.senderName}>{item.sender.Firstname} {item.sender.Lastname}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
        {loading ? (
            <Text>Loading...</Text>
        ) : (
            <FlatList
                data={Object.values(sortedMessages)}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id.toString()}
            />
        )}
    </View>
);
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    messageContainer: {
        padding: 10,
        marginVertical: 5,
        borderRadius: 5,
        maxWidth: '75%',
        backgroundColor: '#ECECEC',
    },
    messageText: {
        fontSize: 16,
        color: '#888',
    },
    senderName: {
        fontSize: 15,
      
    },
});

export default MessageList;



  // // Render message function
  // const renderMessage = ({ item }) => {
  //   const isCurrentUser = parseInt(item.sender_id) === parseInt(currentUserId);
    
  //   // Ensure receiver data is accessed correctly
  //   const receiver = item.receiver ? item.receiver : {};
  //   console.log('Item data:', item);
  
  //   const displayName = isCurrentUser ? 'You' : `${receiver.Firstname || 'Unknown'} ${receiver.Lastname || ''}`;
  //   console.log('Display name:', displayName);
    
  //   // Check if the text is an image URI
  //   const isImage = item.text.startsWith('http') && (item.text.endsWith('.jpg') || item.text.endsWith('.jpeg') || item.text.endsWith('.png'));
  
  //   return (
  //     <View style={[styles.messageContainer, isCurrentUser ? styles.sentMessage : styles.receivedMessage]}>
  //       {isImage ? (
  //         <Image source={{ uri: item.text }} style={styles.messageImage} />
  //       ) : (
  //         <Text style={styles.messageText}>{item.text}</Text>
  //       )}
  //       <Text style={styles.senderName}>{displayName}</Text>
  //     </View>
  //   );
  // };