import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, TextInput, FlatList, StyleSheet, TouchableOpacity,
   Modal, KeyboardAvoidingView, Platform, Keyboard, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';

import { icons } from "../constants";
import { images } from "../constants";
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';

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

interface User {
  id: string;
  Firstname: string;
  Lastname: string;
  Phonenumber: string;
  Address: string;
  created_at: string;
  updated_at: string;
}

interface Comment {
  id: string; // Unique identifier
  text: string;
  user: User;
  userId: string | null;
  created_at: string; // Fetch matches created_at as string
}

const defaultUser: User = {
  id: '0',
  Firstname: 'Anonymous', // Changed from Fullname to Firstname
  Lastname: '',
  Phonenumber: '',
  Address: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

type Message = {
  receiver: any;
  id: number;
  text: string;
  product_id: number;
  sender_id: number;
  receiver_id: number;
  sessions: number;
  created_at: string;
  updated_at: string;
  sender: User; // Add sender property
  currentUserId: User;
};


interface ProductDetailsProps {
  product: string | string[] | Product; // Accepting the possible types for product
}

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

const ProductDetails = () => {
  const navigation = useNavigation();
  const { product } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [messageList, setMessageList] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [totalmessage, setTotalmessage] = useState(0);
  const router = useRouter();
  const [imageUri, setImageUri] = useState(null);
  
  const [showOriginalImage, setShowOriginalImage] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>();
  const [user, setUser] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);


  const [commentText, setCommentText] = useState(''); // State to hold the comment input

  const parseProduct = (product: string | string[] | Product): Product | null => {
    if (typeof product === 'string') {
      try {
        return JSON.parse(product);
      } catch (error) {
        console.error('Failed to parse product string', error);
        return null;
      }
    } else if (Array.isArray(product)) {
      console.error('Product is in an unexpected array format');
      return null;
    }
    return product as Product;
  };
  
  const parsedProduct = parseProduct(product); 
  
  // fetch userinfo from the asyncstorage
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userInfo = await AsyncStorage.getItem('userInfo');
        if (userInfo) {
          // Parse the userInfo string to an object
          const parsedUser = JSON.parse(userInfo) as User; // Assuming userInfo is a valid JSON string
        
          setUser(parsedUser);
          
          // Convert user.id to a number if setCurrentUserId expects a number
          const userId = Number(parsedUser.id);
          
          if (!isNaN(userId)) {
            setCurrentUserId(userId); // Set currentUserId here
          } else {
            console.error('Invalid user ID:', parsedUser.id); // Handle invalid ID case
          }
        
          // console.log('Fetched User:', parsedUser); // Log parsedUser instead
        }
              
        
      } catch (error) {
        console.error('Error fetching user info:', error);
        Alert.alert('Error', 'Could not fetch user info.');
      }
    };
    fetchUserInfo();
  }, []);

  const reloadScreen = () => {
    fetchMessages();
    console.log('Screen reloaded!');
  };

  useFocusEffect(
    useCallback(() => {
      reloadScreen();
    }, [])
  );



useEffect(() => {
  const loadImage = async () => {
    const uri = `http://10.0.2.2:8000/storage/product/images/${parsedProduct?.image}?${new Date().getTime()}`;
    setImageUri(await cacheImage(uri));
    setLoading(false);
  };

  loadImage();
},[parsedProduct?.image]);

  // this will fetch all the commnet for a product
useEffect(() => {
  const fetchComments = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }
      if (parsedProduct?.id) {
        const response = await axios.get(`http://10.0.2.2:8000/api/comments/${parsedProduct.id}`, {
          headers: {
            Authorization: `Bearer ${token}`, // Include token if needed
          },
        });

        // Log the fetched comments data
        // console.log('Fetched Comments:', response.data);

        // Assuming the API returns an array of comments
        setComments(response.data); // Update comments in state

        // Optionally save to AsyncStorage for offline support
        await AsyncStorage.setItem(`product_${parsedProduct.id}_comments`, JSON.stringify(response.data));
      }

    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  fetchComments();
}, [parsedProduct?.id]);


  // the message function start here 
  // function to send user if user is person who creator open modal if not send user to message
  const handlePress = () => {
    if (parsedProduct) {
      if (currentUserId === parsedProduct.user_id) {
        setModalVisible(true);
      } else {
        router.push({
          pathname: '/messagesender',
          params: {
            productId: parsedProduct.id, // Pass the product ID
            productuserId: parsedProduct.user_id, // Pass the user ID if needed
          },
        });
      }
    } else {
      console.error('parsedProduct is null');
    }
  };
  
  // function for message list
  const sortMessages = (messages, currentUserId) => {
    return messages.reduce((acc, message) => {
      const key = `${message.product_id}-${message.sender_id}-${message.receiver_id}`;
      const reversedKey = `${message.product_id}-${message.receiver_id}-${message.sender_id}`;
  
      if (!acc[key] && !acc[reversedKey]) {
        acc[key] = { first: message, latest: message };
      } else {
        if (acc[key]) {
          acc[key].latest = new Date(message.updated_at) > new Date(acc[key].latest.updated_at) ? message : acc[key].latest;
        }
        if (acc[reversedKey]) {
          acc[reversedKey].latest = new Date(message.updated_at) > new Date(acc[reversedKey].latest.updated_at) ? message : acc[reversedKey].latest;
        }
      }
      return acc;
    }, {});
  };
  
  const normalizeKeys = (obj) => {
    const normalizedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        normalizedObj[key.toLowerCase()] = obj[key];
      }
    }
    return normalizedObj;
  };
  const formatTime = (datetime) => {
    const date = new Date(datetime);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  const renderMessage = ({ item }) => {
    const { first, latest } = item;
    const sender = normalizeKeys(first.sender);
  
    const displayName = `${sender.firstname || 'Unknown'} ${sender.lastname || ''}`;
  
    console.log('Rendering message:', item);
    console.log('Display name:', displayName);
  
    return (
      <TouchableOpacity onPress={() => handlemessagereceive({ first, latest })}>
        <View style={styles.messageContainer}>
          <Text style={styles.senderName}>
            {displayName || 'Unknown'}
          </Text>
          <View style={styles.messageRow}>
            <Text style={styles.messageText}>{latest.text || 'No message content'}</Text>
            <Text style={styles.messageTime}>
              .{latest.created_at ? formatTime(latest.created_at) : 'No message content'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  

    const fetchMessages = async () => {
      const productId = parsedProduct?.id;
  
      if (!productId) return;
  
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          console.error('No auth token found');
          return;
        }
  
        const response = await axios.get('http://10.0.2.2:8000/api/messageslistproduct', {
          params: { productId },
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
  
        // console.log('Received data:', response.data);
  
        if (!Array.isArray(response.data)) {
          console.error('Data is not an array:', response.data);
          return;
        }
  
        const isValidData = response.data.every(item => !!item.sessions && !!item.sender);
        if (!isValidData) {
          console.error('Invalid data format:', response.data);
          return;
        }
  
        const groupedMessages = response.data.reduce((acc, message) => {
          const { sessions } = message;
          if (!acc[sessions]) {
            acc[sessions] = { first: message, latest: message };
          } else {
            if (new Date(message.created_at) < new Date(acc[sessions].first.created_at)) {
              acc[sessions].first = message;
            }
            if (new Date(message.updated_at) > new Date(acc[sessions].latest.updated_at)) {
              acc[sessions].latest = message;
            }
          }
          return acc;
        }, {});
  
        const groupedMessagesArray = Object.keys(groupedMessages).map(session => groupedMessages[session]);
  
        setMessageList(groupedMessagesArray);
        setTotalmessage(groupedMessagesArray.length)
        await AsyncStorage.setItem(`messages_${productId}`, JSON.stringify(groupedMessagesArray));
      } catch (error) {
        console.error('Error fetching messages:', error);
        Alert.alert('Error', 'Could not fetch messages.');
      } finally {
        setLoading(false);
      }
    };
  
  

    const handlemessagereceive = (message: { first: any; latest?: any; }) => {
      if (!message.first || !message.first.sender || !message.first.sender.id) {
        console.error('First message data is missing or invalid:', message);
        return;
      }
    
      const paramsToSend = {
        productId: message.first.product_id,
        senderId: message.first.sender.id,
        receiverId: message.first.receiver_id,
        sessions: message.first.sessions
      };
    
      console.log('Params to send:', paramsToSend);
    
      setModalVisible(false);
      router.push({
        pathname: '/messagereceiver',
        params: paramsToSend
      });
    };        
    
  // Function to handle comment submission
  const handleCommentSubmit = async () => {
    // Check if the comment text is not empty
    if (!comment.trim()) {
      Alert.alert("Comment cannot be empty.");
      return;
    }
  
    // Check if parsedProduct is null
    if (!parsedProduct || !parsedProduct.id) {
      console.error('Product not found or invalid');
      return;
    }
  const userId = currentUserId; // This is a number
     // Check if userId is null
  if (userId === null) {
    console.error('User ID is null. Cannot add comment.');
    return; // Exit if userId is not available
  }
    const newComment: Comment = {
      id: `${Date.now()}_${Math.random()}`, // Generate a unique ID for the comment
      text: comment, // Assuming this is the comment text
      user: user || defaultUser, // Set user to the logged-in user or a default User object
      userId: userId.toString(), 
      created_at: new Date().toISOString(), // Use ISO string for consistency
    };
  
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }
      const response = await axios.post('http://10.0.2.2:8000/api/comments', {
        product_id: parsedProduct.id,
        userId: newComment.userId,
        text: newComment.text,
      }, {
        headers: {
          'Content-Type': 'application/json',
           Authorization: `Bearer ${token}`,
        },
      });
      
       // Axios automatically throws an error for non-2xx status codes, no need to check manually
  if (response.status === 201) {  // Check for successful creation
    const updatedComments = [
      ...(comments ?? []),
      {
        ...response.data,
        user: {
          Firstname: user ? user.Firstname : defaultUser.Firstname, // Use default if user is not defined
          Lastname: user ? user.Lastname : defaultUser.Lastname,     // Ensure Lastname is included
        },
      },
    ]; // Ensure comments is never undefined

    setComments(updatedComments); // Update local state with new comments
    await AsyncStorage.setItem(
      `product_${parsedProduct.id}_comments`,
      JSON.stringify(updatedComments)
    ); // Save updated comments to AsyncStorage

    console.log('Comment created:', response.data);
    setComment(''); // Clear the input field after successful submission
  } else {
    // Handle unexpected response status
    const errorText = response.data?.message || 'Failed to create comment. Please try again.';
    console.error('Error response:', errorText);
    Alert.alert('Error', errorText);
  }
    } catch (error) {
      // Handle error response from axios
      if (axios.isAxiosError(error)) {
        console.error('Axios error:', error.response?.data || error.message);
        Alert.alert('Error', error.response?.data?.message || 'Something went wrong. Please try again.');
      } else {
        console.error('Error:', error);
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    }
  };
  

  // counts the time since the comment was created
  const timeSince = (dateString: string): string => {
    if (!dateString) {
      return 'No date available';
    }
  
    const date = new Date(dateString);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    let interval = Math.floor(seconds / 31536000);
  
    if (interval >= 1) return `${interval} year${interval === 1 ? '' : 's'} ago`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval} month${interval === 1 ? '' : 's'} ago`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval} day${interval === 1 ? '' : 's'} ago`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval} hour${interval === 1 ? '' : 's'} ago`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval} minute${interval === 1 ? '' : 's'} ago`;
    return `${seconds} second${seconds === 1 ? '' : 's'} ago`;
  };
  
  
// Function to delete a comment
const handleDelete = async (id: string | number) => {
  // Check if comments exist
  if (!comments) {
    console.warn('No comments available to delete.');
    return;
  }

  // Find the comment by its id, ensuring type consistency
  const comment = comments.find((item) => item.id === id);

  // Log the comment object to check its properties
  console.log("Comment object:", comment);

  // Check if currentUserId is defined
  if (currentUserId === undefined) {
    alert("You must be logged in to delete comments.");
    return;
  }

  // Ensure both currentUserId and comment.userId are strings for comparison
  const userId = String(currentUserId); // Ensure userId is a string for comparison

  // Check if the comment exists and if the user is authorized to delete it
  if (comment && String(comment.userId) === userId) {
    // Proceed with deletion
    console.log(`Deleting comment with id: ${id}`);

    // API call to delete comment from server
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await axios.delete(`http://10.0.2.2:8000/api/comments/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200 || response.status === 204) {
        console.log("Comment deleted successfully from server");

        // Update local state after deletion
        const updatedComments = comments.filter((item) => item.id !== id);
        setComments(updatedComments);

        // Update AsyncStorage
        await AsyncStorage.setItem(`product_${parsedProduct?.id}_comments`, JSON.stringify(updatedComments));
      } else {
        alert('Failed to delete comment. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('An error occurred while deleting the comment.');
    }
  } else {
    alert("You can only delete your own comments.");
  }
};

const [keyboardVisible, setKeyboardVisible] = useState(false);

useEffect(() => {
  const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
    setKeyboardVisible(true);
  });
  const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
    setKeyboardVisible(false);
  });

  return () => {
    keyboardDidShowListener.remove();
    keyboardDidHideListener.remove();
  };
}, []);

  return (
    <SafeAreaView style={styles.container}>
       <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} // Adjust for header height
      >
  
      <View style={{ flex: 1 }}>
        {/* Header Section */}
        <View >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.product}>
            <Text style={styles.title}>{parsedProduct?.title}</Text>
            <TouchableOpacity onPress={() => setShowOriginalImage(!showOriginalImage)}>
                {loading ? (
                  <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />
                ) : (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.productImage}
                    onError={() => console.log('Image failed to load')}
                    defaultSource={images.empty}
                  />
                )}
              </TouchableOpacity>
            <View style={styles.productdetails}>
              <Text>Description: {parsedProduct?.description}</Text>
              <Text>Quantity: {parsedProduct?.quantity}</Text>
              <Text>Price: {parsedProduct?.price}</Text>
              <Text>Location: {parsedProduct?.locate}</Text>
            </View>
            <Text >
              {/* put a style here */}
              <View style={styles.messagebar}>
                <TouchableOpacity style={styles.message} onPress={handlePress}>
                  <Text style={styles.messageText}>Message</Text>
                </TouchableOpacity>
                {parsedProduct?.user_id !== null && parsedProduct?.user_id.toString() === user?.id?.toString() && (
                  <Text style={styles.totalMessage}>
                    <Image 
              source={icons.contact} 
              style={styles.icon}
              resizeMode="contain" // Ensure the image fits within the circular container
            /> 
                  messages:                 
                {totalmessage}</Text>
                )}  
              </View>


            {/* modal for message list */}
            <Modal
  animationType="slide"
  transparent={true}
  visible={modalVisible}
  onRequestClose={() => setModalVisible(false)}
>
  <SafeAreaView style={styles.modalOverlay}>
    <View style={styles.modalView}>
    <View style={styles.modalButtonContainer}>
       <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
        <Text style={styles.modalButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
      {loading ? (
        <Text style={styles.loadingstate}>Loading...</Text>
      ) : (
        <FlatList
  data={messageList}
  keyExtractor={(item, index) => {
    // Ensure 'id' exists before calling 'toString'
    const key = item.latest && item.latest.id ? item.latest.id.toString() : index.toString();
    return key;
  }}
  renderItem={renderMessage}
/>

      )}
    </View>
  </SafeAreaView>
</Modal>
            </Text>
          </View>

          {/* Original Image Modal */}
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
        </View>

        {/* Comments Section */}
        <View style={{ flex: 1 }}>  
          {comments && comments.length > 0 ? (
  <FlatList

    data={(comments ?? []).slice().reverse()} // Safely handle undefined comments
    keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())} // Fallback to index if item.id is undefined
    renderItem={({ item }) => {
      // console.log('Item data:', item); // Log item data
      return (
        <View style={styles.comment}>
          <View style={styles.commentheader}>
            <View>
              <Text style={styles.commentUser}>{item.user?.Firstname || defaultUser.Firstname} {item.user?.Lastname}:</Text>
              <Text>{item.text}</Text>
              <Text style={styles.commentTime}>{timeSince(item.created_at)}</Text>
            </View>
            {/* Show delete button only if current user matches comment's userId */}
            {item.userId !== null && item.userId.toString() === user?.id?.toString() &&  ( // Compare item.userId (string) with user.id (converted to string)
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Image
                  source={icons.garbage}
                  style={styles.icon}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }}
  />
   ) : (
    <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text> // Message when there are no comments
  )}
</View>


        {/* Input for new comment or reply */}
        <View style={[styles.inputContainer]}>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder={"Add a comment..."}
            style={styles.commentInput}
            onFocus={() => setKeyboardVisible(true)}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleCommentSubmit}>
            <Image
              source={icons.send} // Local icon path
              style={styles.icon} // Add your icon styling here
            />
          </TouchableOpacity>
        </View>
      </View>
      </KeyboardAvoidingView>
  </SafeAreaView>
);
};

export default ProductDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#B4CBB7',
  },
  product: {
    padding: 5,                     // Increase padding for a more spacious look
    borderWidth: 1,                  // Add a border to outline the comment box
    borderColor: '#ddd',             // Use a subtle, light gray for the border
    borderRadius: 10,                // Rounded corners to make it look modern
    backgroundColor: '#f9f9f9',      // Light background color for a soft look
    shadowColor: "#000",             // Add a slight shadow for depth
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1, 
    marginBottom: 5,
  },

  productdetails: {
    padding: 10,                     // Increase padding for a more spacious look
    borderWidth: 1,                  // Add a border to outline the comment box
    borderColor: '#ddd',             // Use a subtle, light gray for the border
    borderTopLeftRadius: 0,          // Keep top left corner sharp
    borderTopRightRadius: 0,         // Keep top right corner sharp
    borderBottomLeftRadius: 10,      // Round bottom left corner
    borderBottomRightRadius: 10,     // Round bottom right corner
    backgroundColor: '#f9f9f9',      // Light background color for a soft look
    marginBottom: 5,                 // Add some space between comments
    shadowColor: "#000",             // Add a slight shadow for depth
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1, 
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  productImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
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
  messagebar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: 380,
    backgroundColor: '#F0F5F0', // Lighter green background
    paddingVertical: 15,
    borderRadius: 15,
  },
  message: {
    backgroundColor: '#28a745', // Darker green for a more modern look
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginRight: 15,
  },
  messageText: {
    color: '#FFFFFF', // White text for contrast
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalMessage: {
    fontSize: 20,
    color: '#333', // Darker text color for contrast
    alignSelf: 'flex-end',
    paddingLeft: 60,
    paddingBottom: 15,
  },
  commentsContainer: {
    maxHeight: 380, // Set a max height for the comments section
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    overflow: 'hidden', // Ensures no overflow
  },
  comment: {
    padding: 5,                     // Increase padding for a more spacious look
    borderWidth: 1,                  // Add a border to outline the comment box
    borderColor: '#ddd',             // Use a subtle, light gray for the border
    borderRadius: 10,                // Rounded corners to make it look modern
    backgroundColor: '#f9f9f9',      // Light background color for a soft look
    marginBottom: 10,                // Add some space between comments
    shadowColor: "#000",             // Add a slight shadow for depth
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,                    // Elevation for Android shadow
  },  
  
  commentUser: {
    fontSize: 14,                  // Slightly larger font size for better visibility
    fontWeight: 'bold',            // Make the username bold for emphasis
    color: '#1a1a1a',              // Darker color for better contrast
    marginBottom: 2,               // Space between username and comment text
  },
  commentTime: {
    fontSize: 12,
    color: '#666',
  },
  commentheader: {
    flexDirection: 'row',  // Arrange content in a row
    justifyContent: 'space-between',  // Push the text to the left and button to the right
    alignItems: 'center',  // Vertically center the content
  },
  commentInput: {
    height: 50,
    borderColor: '#ccc',
    width: '85%',
    padding: 5,
    fontSize: 15,
   
  },
  inputContainer: {
    maxHeight: 50,
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 20,
  },
  backButton: {
    marginBottom: 20,
    backgroundColor: '#F0F5F0', // Lighter background for a more elegant feel
    borderRadius: 10, // Rounded corners for a softer appearance
    padding: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
  },
  
  backButtonText: {
    color: '#008000',
    fontSize: 18,
    fontWeight: 'bold', // Bold font for emphasis
  },

  deleteButtonText: { 
      color: '#007bff',
      fontSize: 18,
  },
  icon: {
    width: 24, // Adjust based on your icon size
    height: 24, // Adjust based on your icon size
  },
  noCommentsText: {
    textAlign: 'center',
    color: 'gray', // Adjust color as needed
    margin: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark overlay background
  },
  modalView: {
    width: '90%', // Set width relative to screen size
    height: '80%', // Set height to 80% of screen size
    backgroundColor: '#B4CBB7',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalButtonContainer: {
    alignItems: 'flex-end', // Move button to the right
    marginTop: 10,
    marginBottom: 10,
    paddingLeft: 230,
  },
  modalButton: {
    backgroundColor: '#4CAF50', // Elegant green color
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25, // Rounded edges
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5, // For Android shadow
  },
  modalButtonText: {
    color: '#fff', // White text for contrast
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageRow: {
    flexDirection: 'row', // Arrange items in a row
  },
  messageTime: {
    // Your existing styles for message text
    marginLeft: 15, // Add some spacing between text and time
  },
  loadingstate: {
    justifyContent: 'center',
    alignSelf: 'center',
    paddingTop: 300,
  },
  loadingIndicator: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },

  messageContainer: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    width: '80%',            // Adjust width according to your needs
    minWidth: 500,           // Ensure it doesn't shrink too much
    backgroundColor: '#ECECEC',
    flexShrink: 0,           // Prevent shrinking
  },
senderName: {
    fontSize: 15,
  
},
});


