import React, { useState, useEffect, useRef,  useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, Image, ActivityIndicator, Modal} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import axios, { AxiosResponse } from 'axios'; // Using axios for API requests
import Pusher from 'pusher-js/react-native';
import { icons } from "../constants";
// import { Channel } from 'laravel-echo';
import { useFocusEffect } from '@react-navigation/native';

interface Product {
  id: number;
  user_id: number;
  title: string;
  image: string;
  description: string;
  quantity: string;
  price: string;
  locate: string;
}

interface sender {
  id: string;
  Firstname: string; 
  Lastname: string;
  Phonenumber: string;
  Address: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  productId: number;
  senderId: number;
  receiverId: number;
  sessions: number;
}

// Caching function
const cacheImage = async (uri) => {
  const filename = uri.split('/').pop();
  const fileUri = `${FileSystem.documentDirectory}${filename}`;
  const info = await FileSystem.getInfoAsync(fileUri);

  if (info.exists) {
    return fileUri; // Return cached image URI
  } else {
    const response = await FileSystem.downloadAsync(uri, fileUri);
    return response.uri; // Return newly downloaded image URI
  }
};
const MessageImage = React.memo(({ imageUri }) => {
  return <Image source={{ uri: imageUri }} style={styles.messageImage} />;
});

const RenderMessage = React.memo(({ item, currentUserId, OriginalImage }) => {
  console.log('RenderMessage item:', item); // Log the item to ensure it's correct

  const isCurrentUser = parseInt(item.receiver_id) === parseInt(currentUserId);
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  const sender = item.sender || {};
  const displayName = isCurrentUser ? `${sender.Firstname || 'Unknown'} ${sender.Lastname || ''}` : 'You';

  // Load image function
  const loadImage = useCallback(async () => {
    let uri = item.text;
    if (uri && (uri.endsWith('.jpg') || uri.endsWith('.jpeg') || uri.endsWith('.png') || uri.endsWith('.gif'))) {
      if (!uri.startsWith('http')) {
        uri = `http://10.0.2.2:8000/storage/message/images/${uri}`;
      }
      setLoading(true);
      const cachedUri = await cacheImage(uri); // Assuming you have this function
      setImageUri(cachedUri);
      setLoading(false);
    }
  }, [item.text]);

  useEffect(() => {
    loadImage();
  }, [loadImage]);

  if (!item.text) {
    // console.error('Empty message text:', message); // Log when message text is empty
    // return null; // Prevent rendering when there is no text
  }

  return (
    <View style={[styles.messageContainer, isCurrentUser ? styles.sentMessage : styles.receivedMessage]}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : imageUri ? (
        <TouchableOpacity onPress={() => OriginalImage(item.text)}>
        <MessageImage imageUri={imageUri} />
        </TouchableOpacity>
      ) : (
        <Text style={styles.messageText}>{item.text}</Text> // Access message.text here
      )}
      <Text style={styles.senderName}>{displayName}</Text>
    </View>
  );
});


const MessageScreen2 = ( ) => {
  const navigation = useNavigation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState();
  const [sender, setSender] = useState();
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);
  const { productId, senderId, receiverId, sessions } = useLocalSearchParams();
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const handleScrollBeginDrag = () => setIsUserScrolling(true);
  const handleMomentumScrollEnd = () => setIsUserScrolling(false);
  const [showOriginalImage, setShowOriginalImage] = useState(false);
  const [imageUri, setImageUri] = useState(null);


interface SendMessageParams {
  productId: number;
  senderId: number;
  receiverId: number;
  sessions: number;
}
   // Load and cache the image when the image URI is provided
   const loadImage = async (uri: string) => {
    setLoading(true); // Start loading
    const cachedUri = await cacheImage(uri); // Assuming cacheImage is a function to cache the image
    setImageUri(cachedUri); // Set the cached URI
    setLoading(false); // Stop loading
  };

  // Function to set image URI and open modal
  const OriginalImage = async (uri: string) => {
    // Construct the full image URI
    const fullUri = `http://10.0.2.2:8000/storage/message/images/${uri}?${new Date().getTime()}`;
    console.log('Image URI:', fullUri); // Log the image URI for debugging

    await loadImage(fullUri); // Load the image
    setShowOriginalImage(true); // Open the modal
  };

  // Listen to messages from Pusher
// Initialize Pusher
const pusher = new Pusher("87916f2c03247f41316e", {
  cluster: "ap1",
  encrypted: true,
});

// Subscribe to channel
const channel = pusher.subscribe('my-channel');

// Bind to an event
channel.bind('my-event', function(data) {
  console.log('Received data:', data);
});



  useEffect(() => {
    const pusher = new Pusher("87916f2c03247f41316e", {
      cluster: "ap1",
      encrypted: true,
    });
  
    const receiverChannel = pusher.subscribe(`chat.${senderId}`);
    receiverChannel.bind('MessageSent', function(data) {
      console.log('Receiver Event received:', data);
      setMessages((prevMessages) => [...prevMessages, data.message]);
    });
  
    return () => {
      receiverChannel.unbind_all();
      receiverChannel.unsubscribe();
    };
  }, [currentUserId, senderId]);
  

  useEffect(() => {
    let chatChannel: PusherChannel;
  
    if (!currentUserId || !senderId) return;
  
    const initPusher = async () => {
      const pusher = Pusher.getInstance();
      await pusher.init({
        apiKey: '87916f2c03247f41316e',
        cluster: 'ap1',
      });
      await pusher.connect();
  
      chatChannel = await pusher.subscribe({
        channelName: `chat.${senderId}`,
        onEvent: (event) => {
          console.log('Receiver Event received:', event.data);
          setMessages((prevMessages) => [...prevMessages, event.data.message]);
          saveMessages([...messages, event.data.message], event.data.message);
        },
      });
  
      return () => {
        if (chatChannel) chatChannel.unsubscribe();
        pusher.disconnect();
      };
    };
  
    initPusher();
  }, [currentUserId, senderId]);
  


 // Function to handle sending message
    const handleSendMessage = () => {
      const paramsToSend = {
        productId: Array.isArray(productId) ? parseInt(productId[0]) : parseInt(productId),
        senderId: Array.isArray(senderId) ? parseInt(senderId[0]) : parseInt(senderId),
        receiverId: Array.isArray(receiverId) ? parseInt(receiverId[0]) : parseInt(receiverId),
        sessions: Array.isArray(sessions) ? parseInt(sessions[0]) : parseInt(sessions),
      };

      console.log('Params to send:', paramsToSend);
      sendMessage(paramsToSend);
    };

    // Fetch messages from server
  useEffect(() => {
    const fetchMessages = async () => {
      if (!productId) return;
  
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          console.error('No auth token found');
          return;
        }
  
        // Define parameters including only the sessions data
        const params = {
          productId: productId,
          sessions: sessions // Assuming sessionId is available in the scope
        };
  
        const response = await axios.get('http://10.0.2.2:8000/api/getmessages', {
          params,
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
  
        // console.log('messagedatareceive', response.data);
  
        setMessages(response.data);
        updateMessagesInStorage(productId, response.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
        Alert.alert('Error', 'Could not fetch messages.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchMessages();
  }, [productId, sessions]);

  const updateMessagesInStorage = async (productId: string | string[], newMessages: any[]) => {
    try {
      // Fetch current messages from AsyncStorage
      const existingMessages = await AsyncStorage.getItem(`messages_${productId}`);
      let currentMessages = existingMessages ? JSON.parse(existingMessages) : [];
  
      // Create a map to keep track of unique messages by ID
      const messageMap = new Map();
      currentMessages.forEach((msg: { id: any; }) => messageMap.set(msg.id, msg));
  
      // Add new messages to the map, overwriting any duplicates
      newMessages.forEach(msg => messageMap.set(msg.id, msg));
  
      // Convert the map back to an array
      const combinedMessages = Array.from(messageMap.values());
  
      // Save updated messages to AsyncStorage
      await AsyncStorage.setItem(`messages_${productId}`, JSON.stringify(combinedMessages));
  
      console.log('AsyncStorage updated with new messages.');
    } catch (error) {
      console.error('Failed to update AsyncStorage:', error);
    }
  };


  const pickImage = async () => {
    setNewMessage('');
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
  
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      const compressedUri = await compressImage(imageUri);
          if (compressedUri) {
            setNewMessage(compressedUri);
          } else {
            console.error('Failed to compress image, URI is undefined');
          }
    }
  };
  
  const compressImage = async (uri) => {
    try {
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800, height: 800 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipulatedImage.uri;
    } catch (error) {
      console.error('Image compression error:', error);
      Alert.alert("Error", "Image compression failed. Please try again.");
    }
  }; 
    
  
  
    // Send message function
    const sendMessage = async ({ productId, senderId, receiverId, sessions }: SendMessageParams) => {
      if (!newMessage.trim()) {
        return;
      }
    
      try {
        const token = await AsyncStorage.getItem('authToken');
        const formData = new FormData();
    
        // Check if newMessage is an image URI
        if (newMessage.startsWith('file')) {
          try {
            const response = await fetch(newMessage);
            if (!response.ok) {
              throw new Error('Failed to fetch the image');
            }
            const blob = await response.blob();
            // console.log('Fetched image blob:', blob);
            const fileName = `IMG_${Date.now()}.jpg`; // Generate a unique filename
            formData.append('image', {
              uri: newMessage,
              type: 'image/jpeg',
              name: fileName,
            });
          } catch (error) {
            console.error('Error fetching the image:', error);
            Alert.alert("Error", "Could not process the image. Please try again.");
            return;
          }
        } else {
          formData.append('text', newMessage);
        }
    
        formData.append('receiver_id', senderId);
        formData.append('sender_id', receiverId);
        formData.append('product_id', productId);
    
        // console.log('message data', productId, senderId, receiverId, sessions);
    
        const responseCheck = await axios.get('http://10.0.2.2:8000/api/messages/session', {
          params: {
            product_id: productId,
            sender_id: senderId,
            receiver_id: receiverId,
          },
          headers: { Authorization: `Bearer ${token}` },
        });
    
        let session = responseCheck.data.session;
        if (!session) {
          const responseMaxSession = await axios.get('http://10.0.2.2:8000/api/messages/max-session', {
            headers: { Authorization: `Bearer ${token}` },
          });
          session = responseMaxSession.data.maxSession + 1;
        }
    
        formData.append('sessions', session);
    
        console.log('Final message data to send:', formData);
    
        const response = await axios.post('http://10.0.2.2:8000/api/messages', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
    
         // Handle the response
    handleResponse(response);
    
    // Clear the message input
    setNewMessage('');       
      } catch (error) {
        console.error('Error sending message:', error);
        Alert.alert('Error', 'Could not send message.');
      }
    };     
    // Handle the response
    const handleResponse = (response: AxiosResponse<any, any>) => {
      const newMessage = response.data; // Assuming the response data contains the new message
      console.log('New Message:', newMessage); // Log the new message
      setMessages((prevMessages) => [...prevMessages, newMessage.message]); // Update state with the new message
      saveMessages(messages, newMessage); // Save the new message to AsyncStorage
    };
    
     // Save messages to AsyncStorage
     // Save messages to AsyncStorage
 const saveMessages = async (messages, newMessage) => {
  try {
    // Fetch current messages from AsyncStorage
    const existingMessages = await AsyncStorage.getItem('messages');
    let currentMessages = existingMessages ? JSON.parse(existingMessages) : [];

    // Combine existing messages with the new one
    const updatedMessages = [...currentMessages, newMessage];

    // Save updated messages to AsyncStorage
    await AsyncStorage.setItem('messages', JSON.stringify(updatedMessages));

    console.log('AsyncStorage updated with new messages.');
  } catch (error) {
    console.error('Error saving messages:', error);
  }
};
    
      // Fetch messages from AsyncStorage
      useEffect(() => {
        const loadMessages = async () => {
          const storedMessages = await AsyncStorage.getItem('messages');
          if (storedMessages) {
            setMessages(JSON.parse(storedMessages));
          }
        };
    
        loadMessages();
      }, []);

  // // Fetch current user ID from AsyncStorage
  useEffect(() => {
    const fetchCurrentUserId = async () => {
      try {
        const userInfo = await AsyncStorage.getItem('userInfo');
        // console.log('messageuserbefore parse', userInfo);
  
        if (userInfo) {
          const user = JSON.parse(userInfo);
          // console.log('parsed user:', user);
  
          if (user && user.id) {
            // console.log('user.id:', user.id);
            setCurrentUserId(user.id.toString());
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
  
  

  // Fetch messages from AsyncStorage
  useEffect(() => {
    const loadMessages = async () => {
      const storedMessages = await AsyncStorage.getItem('messages');
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }
    };

    loadMessages();
  }, []);


  // Function to fetch receiver data and store it in AsyncStorage
  useEffect(() => {
    const fetchreceiver = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          console.error('No auth token found');
          return;
        }
  
        const response = await axios.get(`http://10.0.2.2:8000/api/receiver/${senderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (response.status === 200) {
          setSender(response.data); // Store receiver data in state
          await AsyncStorage.setItem(`sender_${senderId}`, JSON.stringify(response.data));
          // console.log('Receiver data stored in AsyncStorage:', response.data);
        } else {
          console.error('Failed to fetch receiver data:', response.status);
        }
      } catch (error) {
        console.error('Error fetching receiver data:', error);
      }
    };
  
    // Make sure senderid is defined before calling fetchreceiver
    if (senderId) {
        fetchreceiver();
    }
  }, [senderId]); // Dependency array includes productuserId

  useEffect(() => {
    if (!isUserScrolling && flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);
  
  // Scroll to the bottom every time the screen is viewed (when it gains focus)
useFocusEffect(
  React.useCallback(() => {
    if (!isUserScrolling && flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages])
);
  
//   console.log('messagecontent', messages); 
  
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header code remains the same */}
      <View style={styles.header}>
      {/* Back button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backicon}>
        <Image
          source={icons.leftArrow}  // Your local icon
          style={{ tintColor: 'white' }} 
          />
      </TouchableOpacity>
      {/* Title (Receiver's Name) */}
      <Text style={styles.receiverNameheader}>
        {sender?.Firstname} {sender?.Lastname}
      </Text>
    </View>
    {loading ? <Text>Loading...</Text> : 
  <FlatList
    ref={flatListRef}
    data={messages}
    extraData={messages}
    renderItem={({ item }) => {
      // console.log('FlatList item:', item); // Log the item to the console
      return item ? <RenderMessage item={item} currentUserId={currentUserId} OriginalImage={OriginalImage}/> : null;
    }}
    keyExtractor={(item, index) => item.id ? item.id.toString() : `key-${index}`}
    initialNumToRender={10} // Reduce initial number of items rendered
    windowSize={5} // Control the size of the windowed list
    maxToRenderPerBatch={5} // Limit batch rendering
    updateCellsBatchingPeriod={100} // Reduce update frequency
    removeClippedSubviews={true} // Recycle off-screen views
    ListEmptyComponent={
      <View style={styles.emptyContainer}>
        <View style={styles.connectionStatus}>
          <Text style={styles.connectionText}>
            You and {sender?.Firstname} are now connected!
          </Text>
        </View>
        <View style={styles.receiverInfo}>
          <Text style={styles.receiverName}>
            {sender?.Firstname || 'Unknown'} {sender?.Lastname || 'Unknown'}
          </Text>
          <Text style={styles.receiverAddress}>
            {sender?.Address || 'No address available'}
          </Text>
        </View>
      </View>
    }
    onContentSizeChange={() => {
      if (!isUserScrolling && flatListRef.current && messages.length > 0) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }}
    onScroll={handleScrollBeginDrag}
    onMomentumScrollEnd={handleMomentumScrollEnd}
    onScrollToIndexFailed={(info) => {
      flatListRef.current?.scrollToIndex({ index: info.highestMeasuredFrameIndex, animated: true });
    }}
  />}
  <View style={styles.inputContainer}>
    {newMessage && newMessage.startsWith('file') && (
      <Image source={{ uri: newMessage }} style={styles.imagePreview} />
    )}
    <TextInput
      style={[styles.input, newMessage && newMessage.startsWith('file') && styles.inputWithImage]}
      placeholder={newMessage && newMessage.startsWith('file') ? "Image selected" : "Type your message..."}
      value={newMessage.startsWith('file') ? '' : newMessage} // Show image but clear text input
      onChangeText={setNewMessage}
      editable={!(newMessage && newMessage.startsWith('file'))} // Disable typing if an image is selected
    />
    <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
      <Text style={styles.imageButtonText}>📷</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
      <Text style={styles.sendButtonText}>Send</Text>
    </TouchableOpacity>
  </View>


        <Modal
            visible={showOriginalImage}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowOriginalImage(false)}
          >
            <TouchableOpacity style={styles.overlay} onPress={() => setShowOriginalImage(false)}>
            {loading ? (
                  <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />
                ) : (
                  <Image
                    source={{ uri: imageUri }} 
                    style={styles.originalImage}
                    onError={() => console.log('Image failed to load')}
                    defaultSource={require('../assets/images/empty.png')}
                  />
                )}
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowOriginalImage(false)}>
                <Text style={styles.closeText}>&times;</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
    </SafeAreaView>
  );
};


export default MessageScreen2;

const styles = StyleSheet.create({
safeArea: {
  flex: 1,
  backgroundColor: '#B4CBB7',
},
backicon: {
  paddingLeft: 5,
  width: 30, // Set the width of the icon
  height: 24, // Set the height of the icon

},

header: {
  height: 70,
  width: '100%',
  backgroundColor: '#7DC36B',
  alignSelf: 'flex-start',
  paddingHorizontal: 15,
  flexDirection: 'row',
  alignItems: 'center',
},

receiverNameheader: {
  fontSize: 18,
  fontWeight: 'bold',
  paddingStart: 20,
},
receiverName: {
  fontSize: 18,
  fontWeight: 'bold',
},
inputContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 10,
  padding: 10,
},
input: {
  flex: 1,
  borderWidth: 1,
  borderColor: '#ccc',
  borderRadius: 5,
  padding: 10,
  marginRight: 10,
  backgroundColor: '#f9f9f9',
},
sendButton: {
  backgroundColor: '#007bff',
  borderRadius: 5,
  padding: 10,
},
sendButtonText: {
  color: '#fff',
},
messageContainer: {
  marginVertical: 5,
  padding: 15,
  borderRadius: 20, // Rounded corners for message bubbles
  maxWidth: '75%', // Limit message width
},
sentMessage: {
  alignSelf: 'flex-start', // Align to the right for sent messages
  backgroundColor: '#7DC36B', // Green background for sent messages
  borderBottomLeftRadius: 0, // Make right side square
  paddingEnd: 20,
  marginStart: 10,
},
receivedMessage: {
  alignSelf: 'flex-end', // Align to the left for received messages
  backgroundColor: '#7DC36B', // Gray background for received messages
  borderBottomRightRadius: 0, // Make left side square
  marginEnd: 10,
},
messageText: {
  fontSize: 16,
  color: '#333', // Darker text color for better visibility
},
messageImage: {
  width: 200, // Specific width for image to ensure visibility
  height: 200, // Height for the image to maintain aspect ratio
  borderRadius: 10,
  resizeMode: 'cover', // Ensure the image covers the container
},
imageMessage: {
  borderRadius: 10,
  backgroundColor: 'transparent', // Ensure a visible background color
  padding: 0, // Remove padding for images
},
inputWithImage: {
  marginLeft: 10, // Adjust margin if needed when image is present
},
imagePreview: {
  width: 30,
  height: 30,
  borderRadius: 5,
  marginRight: 10,
},
imageButton: {
  backgroundColor: '#007bff',
  padding: 10,
  borderRadius: 5,
  marginRight: 10,
},
imageButtonText: {
  color: '#fff',
  fontSize: 16,
},
loadingIndicator: {
  width: 200,
  height: 200,
  justifyContent: 'center',
  alignItems: 'center',
},
senderName: {
  fontSize: 12,
  color: 'gray',
  marginTop: 5, // Space between message text and sender name
  textAlign: 'left', // Align sender name to the right
},
connectionStatus: {
  padding: 10,
  backgroundColor: '#e7f3fe',
  borderRadius: 5,
  marginBottom: 10,
  alignItems: 'center',
},
connectionText: {
  fontSize: 16,
  color: '#31708f',
},
emptyContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: 30,
},
receiverInfo: {
  alignItems: 'center',
},
receiverAddress: {
  fontSize: 16,
  color: 'gray',
},
overlay: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
},
originalImage: {
  width: '90%',
  height: '80%',
  resizeMode: 'contain',
},
closeButton: {
  position: 'absolute',
  top: 30,
  right: 20,
  backgroundColor: '#fff',
  borderRadius: 50,
  padding: 10,
},
closeText: {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#000',
},
});
