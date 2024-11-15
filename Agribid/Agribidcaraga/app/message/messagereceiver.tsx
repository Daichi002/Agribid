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
import { icons } from "../../constants";
import { images } from "../../constants";
import { useFocusEffect } from '@react-navigation/native';

interface Message {
  id: never;
  productId: number;
  senderId: number;
  receiverId: number;
  sessions: number;
}

// Caching function
const cacheImage = async (uri: string) => {
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

interface MessageImageProps {
  imageUri: string;
}

const MessageImage = React.memo(({ imageUri }: MessageImageProps) => {
  return <Image source={{ uri: imageUri }} style={styles.messageImage} />;
});

interface RenderMessageProps {
  item: any;
  currentUserId: string;
  OriginalImage: (uri: string) => void;
  handlelink: (url: string) => void;
}

const RenderMessage: React.FC<RenderMessageProps> = React.memo(({ item, currentUserId, OriginalImage, handlelink }) => {
  const isCurrentUser = parseInt(item.receiver_id) === parseInt(currentUserId);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const productPrefix = '@product/';
  
          // Find the index of `@product/` in the text
          const startIdx = item.text.indexOf(productPrefix);
          const base64Part = startIdx !== -1 ? item.text.slice(startIdx + productPrefix.length, startIdx + productPrefix.length + 16) : '';
          
          // Check if the text has a valid `@product/` link with a 16-character Base64 part
          const isValidBase64Link = base64Part.length === 16 && /^[A-Za-z0-9+/=]+$/.test(base64Part);
          
          // Only treat as a link if the text starts with `@product/` and has exactly 16 valid Base64 characters
          const hasValidLink = startIdx !== -1 && isValidBase64Link;

          // Split the text into parts
          const beforeText = startIdx !== -1 ? item.text.slice(0, startIdx) : item.text;
          const productLink = hasValidLink ? item.text.slice(startIdx, startIdx + productPrefix.length + 16) : '';
          const afterText = hasValidLink ? item.text.slice(startIdx + productPrefix.length + 16) : item.text.slice(startIdx);

  const sender = item.sender || {};
  const displayName = isCurrentUser ? `${sender.Firstname || 'Unknown'} ${sender.Lastname || ''}` : 'You';

  // Load image function
  const loadImage = useCallback(async () => {
    let uri = item.text;
  
    // Check if text has an image extension and treat as an image
    if (uri && (uri.endsWith('.jpg') || uri.endsWith('.jpeg') || uri.endsWith('.png') || uri.endsWith('.gif'))) {
      // Construct full URL if needed
      if (!uri.startsWith('http')) {
        uri = `https://trusting-widely-goldfish.ngrok-free.app/storage/message/images/${uri}`;
      }
  
      setLoading(true);
  
      try {
        // Clear any existing cache for updated images or cache anew
        const cachedUri = await cacheImage(uri, { forceRefresh: true });
        setImageUri(cachedUri);
      } catch (error) {
        console.error("Failed to load image, displaying text instead:", error);
        setImageUri(null); // Fallback to display text
      } finally {
        setLoading(false);
      }
    } else {
      // If the text is not an image URI, show text directly
      setImageUri(null);
    }
  }, [item.text]);
  
  useEffect(() => {
    loadImage();
  }, [loadImage]);  

  return (
    <View style={[styles.messageContainer, isCurrentUser ? styles.sentMessage : styles.receivedMessage]}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : imageUri ? (
        <TouchableOpacity onPress={() => OriginalImage(item.text)}>
          <MessageImage imageUri={imageUri} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => hasValidLink && handlelink(productLink)}>
                      <Text style={styles.messageText}>
                        {beforeText}
                        {hasValidLink ? (
                          <Text style={{ color: 'blue' }}>
                            {productLink}
                          </Text>
                        ) : (
                          productLink // Display the text as normal if it's not a valid link
                        )}
                        {afterText}
                      </Text>
                    </TouchableOpacity>
      )}
      <Text style={styles.senderName}>{displayName}</Text>
    </View>
  );
});


interface ImagePickerModalProps {
  visible: boolean;
  onChooseFromStorage: () => void;
  onTakePhoto: () => void;
  onClose: () => void;
}

const ImagePickerModal: React.FC<ImagePickerModalProps> = ({ visible, onChooseFromStorage, onTakePhoto, onClose }) => {
  const takestorage = () => {
    onChooseFromStorage();
    onClose();
  };
  const takephoto = () => {
    onTakePhoto();
    onClose();
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalimagecontainer}>
      <View style={styles.modal}>
        <Text style={styles.title}>Choose Image Source</Text>
        <TouchableOpacity style={styles.button} onPress={takestorage}>
          <Text style={styles.buttonText}>Upload from Storage</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.buttonGreen]} onPress={takephoto}>
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.buttonRed]} onPress={onClose}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
    </Modal>
  );
};

const MessageScreen2 = ( ) => {
  const navigation = useNavigation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState();
  interface Sender {
    id: string;
    Firstname: string;
    Lastname: string;
    Address?: string;
  }
  
  const [sender, setSender] = useState<Sender | null>(null);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);
  const { productId, senderId, receiverId, sessions } = useLocalSearchParams();
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const handleScrollBeginDrag = () => setIsUserScrolling(true);
  const handleMomentumScrollEnd = () => setIsUserScrolling(false);
  const [showOriginalImage, setShowOriginalImage] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);


interface SendMessageParams {
  id: string;
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
    const fullUri = `https://trusting-widely-goldfish.ngrok-free.app/storage/message/images/${uri}?${new Date().getTime()}`;
    console.log('Image URI:', fullUri); // Log the image URI for debugging

    await loadImage(fullUri); // Load the image
    setShowOriginalImage(true); // Open the modal
  };



  // Listen to messages from Pusher
useEffect(() => {
  const pusher = new Pusher('87916f2c03247f41316e', {
    cluster: 'ap1',
  });

  // Construct the channel name based on currentUserId
  const channelName = `chat.${currentUserId}`;
  console.log(`Subscribing to receiverchannel: ${channelName}`);

  // Subscribe to the receiver's channel (based on currentUserId)
  const channel = pusher.subscribe(channelName);
  
  // Log when the channel is successfully subscribed
  channel.bind('pusher:subscription_succeeded', () => {
    console.log(`Successfully subscribed to ${channelName}`);
  });
  console.log('currentUserId', currentUserId, channelName)

  // channel.bind('App\\Events\\MessageSent', function(data) {
  //   console.log('Broadcast received:', data);

  channel.bind('MessageSent', function(data: { message: { receiver_id: any; [key: string]: any; }; }) {
    // Log the broadcast received
    console.log('Broadcast received:', data);

    // Ensure the message content exists
    const messageContent = data.message;
    if (!messageContent) {
        console.error('Message content is undefined');
        return;
    }

    // Access the receiver_id
    const receiverId = messageContent.receiver_id;
    console.log('currentUserId to trig', currentUserId, channelName);

    // Check if the current user is the intended receiver
    if (receiverId && currentUserId && parseInt(receiverId) === parseInt(currentUserId)) {
        // console.log('New message for me:', messageContent);
        // Trigger the fetchMessages() function to get updated messages
         // Ensure prevMessages is an array and messageContent is properly added
         setMessages((prevMessages: any[]) => Array.isArray(prevMessages) ? [...prevMessages, messageContent] : [messageContent]);
         fetchMessages();  // Debug this not triggering the fetch message
         updateMessagesInStorage(productId, [messageContent]); // Ensure updateMessagesInStorage gets an array
    } else {
        console.log('Message received, but not for me. Ignoring...');
    }
});

  // Log if there is an error in subscription
  channel.bind('pusher:subscription_error', (status: any) => {
    console.error('Subscription error:', status);
  });

  return () => {
    channel.unbind_all();
    channel.unsubscribe();
  };
}, [currentUserId]);

  


 // Function to handle sending message
    const handleSendMessage = () => {
      const paramsToSend = {
        id: '', // Add a valid id value here
        productId: Array.isArray(productId) ? parseInt(productId[0]) : parseInt(productId),
        senderId: Array.isArray(senderId) ? parseInt(senderId[0]) : parseInt(senderId),
        receiverId: Array.isArray(receiverId) ? parseInt(receiverId[0]) : parseInt(receiverId),
        sessions: Array.isArray(sessions) ? parseInt(sessions[0]) : parseInt(sessions),
      };

      console.log('Params to send:', paramsToSend);
      sendMessage(paramsToSend);
    };

  useEffect(() => {  
    fetchMessages();
  }, [productId, sessions]); 
  
  // Fetch messages from server
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
  
        const response = await axios.get('https://trusting-widely-goldfish.ngrok-free.app/api/getmessages', {
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
  
  

    const updateMessagesInStorage = async (productId: string | string[], newMessages: any[]) => {
      try {
          // Fetch current messages from AsyncStorage
          const existingMessages = await AsyncStorage.getItem(`messages_${productId}`);
          let currentMessages = existingMessages ? JSON.parse(existingMessages) : [];
  
          // Create a map to keep track of unique messages by ID
          const messageMap = new Map();
          currentMessages.forEach((msg: { id: any; }) => messageMap.set(msg.id, msg));
  
          // Check if newMessages is an array
          if (Array.isArray(newMessages)) {
              // Add new messages to the map, overwriting any duplicates
              newMessages.forEach(msg => messageMap.set(msg.id, msg));
          } else {
              console.error('newMessages is not an array:', newMessages);
              return;
          }
  
          // Convert the map back to an array
          const combinedMessages = Array.from(messageMap.values());
  
          // Save updated messages to AsyncStorage
          await AsyncStorage.setItem(`messages_${productId}`, JSON.stringify(combinedMessages));
  
          console.log('AsyncStorage updated with new messages.');
      } catch (error) {
          console.error('Failed to update AsyncStorage:', error);
      }
  };


  const handleImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
    });
  
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri; // Use result.assets[0].uri
      console.log('Picked Image URI:', imageUri); // Log for debugging
  
      setNewMessage(imageUri); // Set the original image URI
      const compressedUri = await compressImage(imageUri);
      
      if (compressedUri) {
        setNewMessage(compressedUri); // Set compressed image URI
      } else {
        console.error('Failed to compress image, URI is undefined');
      }
    }
  };
  
  const handleTakePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
    });
  
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri; // Use result.assets[0].uri
      console.log('Taken Photo URI:', imageUri); // Log for debugging
  
      setNewMessage(imageUri); // Set the original image URI
      const compressedUri = await compressImage(imageUri);
  
      if (compressedUri) {
        setNewMessage(compressedUri); // Set compressed image URI
      } else {
        console.error('Failed to compress image, URI is undefined');
      }
    }
  };
  
  const compressImage = async (uri: string) => {
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
            }as any);
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
    
        const responseCheck = await axios.get('https://trusting-widely-goldfish.ngrok-free.app/api/messages/session', {
          params: {
            product_id: productId,
            sender_id: senderId,
            receiver_id: receiverId,
          },
          headers: { Authorization: `Bearer ${token}` },
        });
    
        let session = responseCheck.data.session;
        if (!session) {
          const responseMaxSession = await axios.get('https://trusting-widely-goldfish.ngrok-free.app/api/messages/max-session', {
            headers: { Authorization: `Bearer ${token}` },
          });
          session = responseMaxSession.data.maxSession + 1;
        }
    
        formData.append('sessions', session);
    
        // console.log('Final message data to send:', formData);
    
        const response = await axios.post('https://trusting-widely-goldfish.ngrok-free.app/api/messages', formData, {
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
      // console.log('New Message:', newMessage); // Log the new message
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
  
        const response = await axios.get(`https://trusting-widely-goldfish.ngrok-free.app/api/receiver/${senderId}`, {
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

const rate = () => {
  if (productId && currentUserId) {
    navigation.navigate('Rating', { productId: productId, userId: currentUserId } as never);
    setReportModalVisible(false)
  }
};
const report = () => {
  if (productId && currentUserId) {
    navigation.navigate('Reports/reportmessage', { messageId: messages[0]?.id, usermessageId: senderId } as never);
    setReportModalVisible(false)
  }
};


const handlelink = (url: string) => {
  try {
    const encodedData = url.split('/').pop();

    if (encodedData) {
      // Attempt to decode base64 and parse JSON
      const decodedData = JSON.parse(atob(encodedData));
      const productId = decodedData.id;

      if (productId) {
        // Navigate to product details if `productId` exists
        navigation.navigate('ProductDetails', { productId });
        console.log('Navigating to product details:', productId);
      } else {
        // Product ID not found in decoded data
        throw new Error('Product ID not found in decoded data');
      }
    } else {
      // Encoded data not found in URL
      throw new Error('Encoded data not found in URL');
    }
  } catch (error) {
    console.error('Error decoding URL:', error);
    Alert.alert(
      'Invalid Link',
      'The link provided is invalid. Please use a valid link.',
      [{ text: 'OK' }]
    );
  }
};

  
const GotoUserprofile = () => {
  if (sender?.id) {
    console.log('Navigating to user profile:', sender?.id);
    navigation.navigate('userproduct', { userId: sender?.id });
  }
};

  
  return (
    <SafeAreaView style={styles.safeArea}>
     <View style={styles.header}>
  {/* Back Button */}
  <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backicon}>
    <Image source={icons.leftArrow} style={{ tintColor: 'white', width: 24, height: 24 }} />
  </TouchableOpacity>

  {/* Title (Receiver's Name) */}
  <TouchableOpacity onPress={GotoUserprofile}>
  <Text style={styles.receiverNameheader}>
    {sender?.Firstname} {sender?.Lastname}
  </Text> 
  </TouchableOpacity>

  {/* Menu Icon */}
  <TouchableOpacity onPress={() => setReportModalVisible(true)} style={styles.menuButton}>
    <Image source={icons.menu} style={styles.menuIcon} resizeMode="contain" /> 
  </TouchableOpacity>
</View>


    {/* Report Modal for creating a report */}
  <Modal
        animationType="slide"
        transparent={true}
        visible={reportModalVisible}
        onRequestClose={() => setReportModalVisible(false)}
      >
        <View style={styles.reportModalContainer}>
          <View style={styles.reportModalContent}>
            <Text style={styles.reportModalTitle}>Customer Experience</Text>

            {/* <TouchableOpacity style={styles.rateButton} onPress={rate}>
              <View style={styles.buttonContent}>
                <Image source={icons.rate} style={styles.ExpIcon} resizeMode="contain" />
                <Text style={styles.rateButtonText}>Rate </Text>
              </View>
            </TouchableOpacity> */}

            <TouchableOpacity style={styles.rateButton} onPress={report}>
              <View style={styles.buttonContent}>
                <Image source={icons.report} style={styles.ExpIcon} resizeMode="contain" />
                <Text style={styles.rateButtonText}>Report</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setReportModalVisible(false)}>
              <Text style={styles.reportCloseButton}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    {loading ? <Text>Loading...</Text> : 
  <FlatList
    ref={flatListRef}
    data={messages}
    extraData={messages}
    renderItem={({ item }) => {

      // console.log('FlatList item:', item); // Log the item to the console


      return item ? <RenderMessage item={item} currentUserId={currentUserId} OriginalImage={OriginalImage} handlelink={handlelink}/> : null;
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
    onViewableItemsChanged={({ viewableItems }) => {
      if (viewableItems.length === messages.length) {
        if (!isUserScrolling && flatListRef.current && messages.length > 0) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }
    }}
    viewabilityConfig={{
      itemVisiblePercentThreshold: 100,
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
    <ImagePickerModal
          visible={isModalVisible}
          onChooseFromStorage={handleImagePicker}
          onTakePhoto={handleTakePhoto}
          onClose={() => setIsModalVisible(false)}
        />

    <TouchableOpacity style={styles.imageButton} onPress={() => setIsModalVisible(true)}>
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
                    defaultSource={images.empty}
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
  // alignSelf: 'flex-start',
  paddingHorizontal: 15,
  justifyContent: 'space-between', // Space between elements
  flexDirection: 'row',
  alignItems: 'center',
},

receiverNameheader: {
  flex: 1, // Allow the name to take up available space
  fontSize: 22,
  fontWeight: 'bold',
  textAlign: 'center', // Center the name text
  paddingRight: 'auto', // Add padding to prevent overlap with menu icon
  marginRight: 'auto', // Add margin to prevent overlap with menu 
  paddingTop: 20,
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
menuButton: {
  paddingLeft: 10,
  paddingBottom: 25,
},

menuIcon: {
  width: 24, // Set width for the menu icon
  height: 24, // Set height for the menu icon
  tintColor: '#fff', // Change color to match the header (adjust as needed)
  position: 'absolute',
  right: 10,
},
reportModalContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.5)', // semi-transparent background overlay
},
reportModalContent: {
  width: '80%',
  padding: 25,
  backgroundColor: '#fff',
  borderRadius: 12,
  alignItems: 'center',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 5, // shadow for Android
},
reportModalTitle: {
  fontSize: 20,
  fontWeight: '600',
  color: '#333',
  marginBottom: 20,
  textAlign: 'center',
},
rateButton: {
  backgroundColor: '#4CAF50', // Green button color
  paddingVertical: 12,
  borderRadius: 8,
  marginVertical: 10,
  width: '80%',
  alignSelf: 'center', // Center the button itself on the screen
  alignItems: 'center', // Center content horizontally within the button
},
buttonContent: {
  flexDirection: 'row', // Arrange icon and text horizontally
  alignItems: 'center', // Center vertically within the row
  justifyContent: 'center', // Center content within the button area
},
ExpIcon: {
  width: 24,
  height: 24,
  tintColor: '#fff',
  marginRight: 10, // Space between icon and text
},
rateButtonText: {
  color: '#fff',
  fontSize: 16,
  fontWeight: 'bold',
  textAlign: 'left', // Keep text aligned left in the row
},
reportCloseButton: {
  color: '#007BFF', // blue color for close button
  fontSize: 16,
  fontWeight: 'bold',
  textAlign: 'center',
  marginTop: 15,
},
modalimagecontainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.5)', // Add a slight overlay for focus
},
modal: {
  backgroundColor: 'white',
  padding: 20,
  borderRadius: 10,
  paddingBottom: 5,
  width: '80%', // Make the modal wider
  alignItems: 'center', // Center-align the buttons and text
},
title: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 20,
  textAlign: 'center',
},
button: {
  backgroundColor: '#1E90FF',
  padding: 10,
  borderRadius: 5,
  marginTop: 10,
  width: '100%',
  alignItems: 'center',
},
buttonGreen: {
  // backgroundColor: '#32CD32',
},
buttonRed: {
  // backgroundColor: '#FF6347',
},
buttonText: {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 16,
},
});
