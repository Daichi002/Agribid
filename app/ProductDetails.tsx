import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Image, TextInput, FlatList, StyleSheet, TouchableOpacity,
   Modal, KeyboardAvoidingView, Platform, Keyboard, Alert, ActivityIndicator, } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { FontAwesome } from '@expo/vector-icons';

import { icons } from "../constants";
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';


interface Product {
  id: string;
  user_id: string;
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
}

interface Comment {
  id: string; // Unique identifier
  text: string;
  user: User;
  userId: string | null;
  created_at: string; // Fetch matches created_at as string
}
interface Replies {
  id: string; 
  text: string;
  comment_id: Comment;
  comment: Comment;
  user_id: string;
  reply: string;
  user: User;
  replies_to: Replies | null;
  created_at: string; 
}

const defaultUser: User = {
  id: '0',
  Firstname: 'Anonymous', // Changed from Fullname to Firstname
  Lastname: '',
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

interface product {
  id: string;
  title: string;
  description: string;
  quantity: string;
  price: string;
  locate: string;
  image: string;
  user_id: string;
  user: User;
}

const ProductDetails = () => {
  const navigation = useNavigation();
  const [product, setProduct] = useState<product | null>(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [rating, setRating] = useState();
  const [averageRating, setAverageRating] = useState(0);
  const { productId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [messageList, setMessageList] = useState<{ first: Message; latest: Message }[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [totalmessage, setTotalmessage] = useState(0);
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [replyVisibility, setReplyVisibility] = useState<{ [key: string]: boolean }>({});
  const [reply_Visibility, setReply_Visibility] = useState<{ [key: string]: boolean }>({});
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const replyInputRef = useRef<TextInput>(null);
  const replyInputRef1 = useRef(null);
  
  const [showOriginalImage, setShowOriginalImage] = useState(false);
  const [reply, setReply] = useState('');
  const [reply1, setReply1] = useState('');
  const [replies, setReplies] = useState<Record<string, Replies[]>>({});
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<Comment[]>();
  const [user, setUser] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // console.log('Parsed Product:', productId);

  useFocusEffect(
    useCallback(() => {
        fetchProduct();
        fetchRating();
    }, [productId])
);

  const fetchProduct = async () => {
    if (!productId) {
      console.error('No product ID found');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }   
      console.log('Parsed Product:', productId);
      const response = await axios.get(`http://10.0.2.2:8000/api/productdetails/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
  
      const product = response.data;  
      setProduct(product);
      // console.log('Fetched one Product:', product);
    } catch (error) {
      console.error("Error fetching product:", error);
    }
  };

  // if(!product) {
  //   loading = true;
  // }

  const fetchRating = async () => {
    if (!productId) {
        console.error('No product ID found');
        return;
    }
    try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
            console.error('No auth token found');
            return;
        }   
        
        // console.log('Fetching product Rating:', productId);

        const response = await axios.get(`http://10.0.2.2:8000/api/ratings/${productId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const ratings = response.data;  

         // Calculate the average rating
         if (ratings.length > 0) {
          const total = ratings.reduce((acc: number, rating: { rate: number }) => acc + rating.rate, 0);
          const averageRating = total / ratings.length;
          const ratingCount = ratings.length;

          // Set the average rating in state or log it
          // console.log('Average Product Rating:', averageRating);
          setAverageRating(averageRating); // Make sure you have a state variable to hold this
          setRatingCount(ratingCount);
      } else {
          console.log('No ratings found for this product');
          setAverageRating(0); // Set to 0 if no ratings
      }

        setRating(ratings); // Assuming ratings is an array of ratings
        // console.log('Fetched Product Rating:', ratings);
    } catch (error) {
        console.error("Error fetching product Rating:", error);
    }
};


  // useEffect(() => {
  //   console.log('Product:', product);
  //  });

  
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
    const uri = `http://10.0.2.2:8000/storage/product/images/${product?.image}?${new Date().getTime()}`;
    setImageUri(await cacheImage(uri));
    setLoading(false);
  };

  loadImage();
},[product?.image]);

  // this will fetch all the commnet for a product
  useEffect(() => {
    const fetchComments = async () => {
      const id = productId;
      if (!id) {
        console.error('Error: No product ID found');
        return;
      }
  
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          console.error('Error: No auth token found');
          return;
        }
  
        const response = await axios.get(`http://10.0.2.2:8000/api/comments/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`, // Include token if needed
          },
        });
  
        // Assuming the API returns an array of comments
        const commentsData = response.data;
        
        if (!Array.isArray(commentsData)) {
          throw new TypeError('Expected an array of comments');
        }
  
        const commentIDs = commentsData.map((comment) => comment.id);
        // console.log('Fetched Comments:', commentsData);
        setComments(commentsData); // Update comments in state
  
        await fetchReplies(commentIDs);
  
        // Optionally save to AsyncStorage for offline support
        await AsyncStorage.setItem(`product_${productId}_comments`, JSON.stringify(commentsData));
      } catch (error) {
        if (axios.isAxiosError(error)) {
          if (error.response) {
            // Server responded with a non-2xx status
            console.error('Error fetching comments:', error.response.data);
          } else if (error.request) {
            // Request was made but no response received
            console.error('Error fetching comments: No response received', error.request);
          } else {
            // Other errors
            console.error('Error fetching comments:', error.message);
          }
        } else {
          console.error('Unexpected error:', error);
        }
      }
    };
  
    fetchComments();
  }, [product?.id]);


  // the message function start here 
  // function to send user if user is person who creator open modal if not send user to message
  const handlePress = () => {
    if (product) {
      if (product?.user_id?.toString() === currentUserId?.toString()) {
        setModalVisible(true);
      } else {
        router.push({
          pathname: '/message/messagesender',
          params: {
            productId: product.id, // Pass the product ID
            productuserId: product.user_id, // Pass the user ID if needed
          },
        });
      }
    } else {
      console.error('parsedProduct is null');
    }
  };
  
  // function for message list
  const sortMessages = (messages: Message[], currentUserId: number) => {
    return messages.reduce((acc: { [key: string]: { first: Message; latest: Message } }, message) => {
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
  
  const normalizeKeys = (obj: { [key: string]: any }) => {
    const normalizedObj: { [key: string]: any } = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        normalizedObj[key.toLowerCase()] = obj[key];
      }
    }
    return normalizedObj;
  };
  const formatTime = (datetime: string) => {
    const date = new Date(datetime);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  const renderMessage = ({ item }: { item: { first: Message; latest: Message } }) => {
    const { first, latest } = item;
    const sender = normalizeKeys(first.sender);
  
    const displayName = `${sender.firstname || 'Unknown'} ${sender.lastname || ''}`;

    const isImageUrl = (text: string) => {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff'];
      return imageExtensions.some(ext => text.toLowerCase().endsWith(ext));
    };

    // console.log('Rendering message:', item);
    // console.log('Display name:', displayName);
  
    return (
      <TouchableOpacity onPress={() => handlemessagereceive({ first, latest })}>
        <View style={styles.messageContainer}>
          <Text style={styles.senderName}>
            {displayName || 'Unknown'}
          </Text>
          <View style={styles.messageRow}>
            <Text style={styles.messageTextlist}>
              {isImageUrl((latest as any)?.text ?? '') ? 'Image' : ((latest as any)?.text || 'No message content')}
            </Text>
            <Text style={styles.messageTime}>
              .{latest.created_at ? formatTime(latest.created_at) : 'No message content'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
    const fetchMessages = async () => {
      const Id = productId;
      console.log('Fetching messages for product:', Id);
  
      if (!Id) return;
  
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          console.error('No auth token found');
          return;
        }
        
        const response = await axios.get('http://10.0.2.2:8000/api/messageslistproduct', {
          params: { Id },
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
        pathname: '/message/messagereceiver',
        params: paramsToSend
      });
    };        
    
  // Function to handle comment submission
  const handleCommentSubmit = async () => {
    // Check if the comment text is not empty
    if (!comment.trim()) {
      setKeyboardVisible(false);
      Keyboard.dismiss();
      return;
    }
  
    // Check if parsedProduct is null
    if (!product || !productId) {
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
        product_id: productId,
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
      `product_${productId}_comments`,
      JSON.stringify(updatedComments)
    ); // Save updated comments to AsyncStorage
    setKeyboardVisible(false);
    Keyboard.dismiss();
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

  const handleReplySubmit = async (commentId: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userInfo = await AsyncStorage.getItem('userInfo');
      const parsedUser = JSON.parse(userInfo!);
      const userId = parsedUser.id;

      if (!token || !userId || !reply.trim()) {
        console.error('Missing required data for submission');
        return;
      }

      const response = await axios.post('http://10.0.2.2:8000/api/replies', {
      comment_id: commentId,
      user_id: userId,
      reply: reply,
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('Response:', response.data);
      const newReply = response.data;

      setReplies((prevReplies) => ({
        ...prevReplies,
        [commentId]: [...(prevReplies[commentId] || []), newReply],
      }));
  
      // Clear the reply input and hide the keyboard
      setReply('');
      Keyboard.dismiss();
  
      // dont Hide the reply input after submission
      setReplyVisibility((prev) => ({
        ...prev,
        [commentId]: true,
      }));
      // await fetchReplies([commentId]);
      console.log('Reply submitted successfully!');
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  const handle_ReplySubmit = async (replyId: string, commentId: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userInfo = await AsyncStorage.getItem('userInfo');
      const parsedUser = JSON.parse(userInfo!);
      const userId = parsedUser.id;

      // console.log('Token:', token); // Log token 
      // console.log('Reply ID:', replyId); // Log replyId 
      // console.log('Comment ID:', commentId); // Log commentId 
      // console.log('User ID:', userId); // Log userId 
      // console.log('Reply:', reply1); // Log reply

      if (!token || !userId || !reply1.trim()) {
        if (!token) {
          console.error('Missing token');
        }
        if (!userId) {
          console.error('Missing userId');
        }
        if (!reply.trim()) {
          console.error('Missing reply');
        }
        return;
      }
      

      const response = await axios.post('http://10.0.2.2:8000/api/replies_replies', {
      comment_id: commentId,
      replies_to: replyId,
      user_id: userId,
      reply: reply1,
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    console.log('Responsereply:', response.data);
      const newReply = response.data;

      // update the replies state with the new reply
      setReplies((prevReplies) => ({
        ...prevReplies,
        [commentId]: [...(prevReplies[commentId] || []), newReply],
      }));
  
      // Clear the reply1 input and hide the keyboard
      setReply1('');
      Keyboard.dismiss();

      // dont Hide the reply input after submission
      setReply_Visibility((prev) => ({
        ...prev,
        [replyId]: false,
      }));
  
      // await fetchReplies([commentId]);
      console.log('Reply submitted successfully!');
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

// Fetch replies for comments
const fetchReplies = async (commentIDs: string[]) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      console.error('Missing required data for submission');
      return;
    }

    console.log('Fetching Replies for comments:', commentIDs);
    const response = await axios.get(`http://10.0.2.2:8000/api/replies/${commentIDs}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Check if the response is empty or if no replies were found
    if (response.status === 404 || !response.data.replies || response.data.replies.length === 0) {
      // Do nothing if no replies were found, as this is expected in some cases
      return;
    }

    // Process and group replies by comment ID if replies exist
    const allRepliesByComment: { [key: string]: Replies[] } = {};
    response.data.replies.forEach(reply => {
      const { comment_id } = reply;
      if (!allRepliesByComment[comment_id]) {
        allRepliesByComment[comment_id] = [];
      }
      allRepliesByComment[comment_id].push(reply);
    });

    setReplies(allRepliesByComment);
    // console.log('Fetched and grouped Replies:', JSON.stringify(allRepliesByComment, null, 2)); // Log expanded data
  } catch (err) {
    // Log error only if it's a server error (status 500 or above)
    if (axios.isAxiosError(err) && err.response && err.response.status >= 500) {
      console.error('Server error while fetching replies:', err);
    }
  }
};


// Render the replies for each comment
const RenderReplies = ({ item }: { item: Replies }) => {
  const productPrefix = '@product/';
  const replyText = item.reply || ''; // Correctly reference the reply text

  // Find the index of `@product/` in the reply text
  const startIdx = replyText.indexOf(productPrefix);
  const base64Part = startIdx !== -1 ? replyText.slice(startIdx + productPrefix.length, startIdx + productPrefix.length + 16) : '';

  // Check if the reply text has a valid `@product/` link with a 16-character Base64 part
  const isValidBase64Link = base64Part.length === 16 && /^[A-Za-z0-9+/=]+$/.test(base64Part);

  // Only treat as a link if the text starts with `@product/` and has exactly 16 valid Base64 characters
  const hasValidLink = startIdx !== -1 && isValidBase64Link;

  // Split the text into parts
  const beforeText = startIdx !== -1 ? replyText.slice(0, startIdx) : replyText;
  const productLink = hasValidLink ? replyText.slice(startIdx, startIdx + productPrefix.length + 16) : '';
  const afterText = hasValidLink ? replyText.slice(startIdx + productPrefix.length + 16) : '';

  const toggleReplyInputVisibility = (replyId: string, commentId: string) => {
    console.log('Toggled Item ID:', replyId); // Log item.id
    console.log('Toggled Comment ID:', commentId); // Log comment.id
    setReply_Visibility((prev) => ({
      ...prev,
      [replyId]: !prev[replyId], // Toggle visibility for this comment's reply input
    }));
  };

 // Safely determine the target user's name 
 const targetUser = item.replies_to && item.replies_to.user ? item.replies_to.user : (item.comment && item.comment.user ? item.comment.user : null); 
 const targetUserName = targetUser ? `${targetUser.Firstname} ${targetUser.Lastname}` : 'Unknown User'; 
//  console.log('Target User:', targetUser);

  return (
      <View>
          <View style={styles.replies}>
              <View style={styles.commentheader}>
                  <View>               
                      <Text style={styles.commentUser}> 
                        <Text style={styles.userreplyName}> 
                          {item.user?.Firstname || defaultUser.Firstname} {item.user?.Lastname || ''} 
                        </Text> <Text style={styles.actionText}> ↪ replied to  </Text> 
                      <Text style={styles.targetUser}> 
                         { targetUserName}
                      </Text> 
                    </Text>
                      <TouchableOpacity style={{ width: 350 }} onPress={() => hasValidLink && handlelink(productLink)}>
                          <Text style={{ color: 'black' }}>
                              {beforeText}
                              {hasValidLink ? (
                                  <Text style={{ color: 'blue' }}>{productLink}</Text>
                              ) : (
                                  <Text>{productLink}</Text> // Display the text as normal if it's not a valid link
                              )}
                              {afterText}
                          </Text>
                      </TouchableOpacity>
                  </View>
                  {item.user_id !== null && item.user_id.toString() === user?.id?.toString() ? (
                      <TouchableOpacity style={styles.replydelete} onPress={() => handleDeletereply(item.id)}>
                          <Image source={icons.garbage} style={styles.replyicon} />
                      </TouchableOpacity>
                  ) : (
                      <TouchableOpacity style={styles.replydelete} onPress={() => reportproductcomment(item.id)}>
                          <Image source={icons.report} style={styles.replyicon} />
                      </TouchableOpacity>
                  )}
              </View>
          </View>
          <View style={styles.undercomment}>
                <Text style={styles.commentTime}>{timeSince(item.created_at)}</Text>
                <View style={styles.replyContainer}>
                <TouchableOpacity 
                  style={styles.reply_Button} 
                  onPress={() => toggleReplyInputVisibility(item.id.toString(), item.comment_id.toString())}
                >
                    <Text style={{ color: 'blue', fontWeight: 'bold' }}>reply</Text>
              </TouchableOpacity>
                  {/* Conditionally Render Reply Input */}
                  {reply_Visibility[item.id] && (
                <View style={[styles.replyinputContainer]}>
                  <TextInput 
                    ref={replyInputRef1} 
                    value={reply1} 
                    onChangeText={setReply1} 
                    style={styles.replyInput} 
                    placeholder="Add a reply..." 
                    onFocus={handleReplyFocus1} 
                    onBlur={() => setFocusedInput(null)} 
                  />
                  <TouchableOpacity style={styles.sendButton} onPress={() => handle_ReplySubmit(item.id, item.comment_id.toString())}>
                    <Image source={icons.send} style={styles.icon} />
                  </TouchableOpacity>
                </View>
              )}
          </View>
          </View>
      </View>
  );
};

  // counts the time since the comment was created
  const timeSince = (dateString: string): string => {
    if (!dateString) {
      return 'No date available';
    }
  
    const date = new Date(dateString);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    let interval = Math.floor(seconds / 31536000);
  
    if (interval >= 1) return `${interval} y${interval === 1 ? '' : ''}`;
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) return `${interval} m${interval === 1 ? '' : ''}`;
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) return `${interval} d${interval === 1 ? '' : ''}`;
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) return `${interval} h${interval === 1 ? '' : ''}`;
    interval = Math.floor(seconds / 60);
    if (interval >= 1) return `${interval} m${interval === 1 ? '' : ''}`;
    return `${seconds} s${seconds === 1 ? '' : ''}`;
  };

  const handleReplyPress = (commentId: string) => {
    setReplyVisibility((prev) => ({
      ...prev,
      [commentId]: !prev[commentId], // Toggle visibility for both replies and input
    }));
  };
  
  
  
// Function to delete a comment
const handleDelete = async (id: string | number) => {
  // Check if comments exist
  if (!comments) {
    console.warn('No comments available to delete.');
    return;
  }

  // Find the comment by its ID, ensuring type consistency
  const comment = comments.find((item) => item.id === id);
  // console.log("Comment object:", comment);

  if (!comment) {
    console.error('Comment not found.');
    return;
  }

  // Ensure currentUserId is defined
  if (currentUserId === undefined) {
    alert("You must be logged in to delete comments.");
    return;
  }

  // Convert currentUserId to a string for comparison
  const userId = String(currentUserId);

  // Check if the comment exists and if the user is authorized to delete it
  if (comment && String(comment.userId) === userId) {
    // Prompt the user for confirmation before deleting
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Retrieve auth token from AsyncStorage
              const token = await AsyncStorage.getItem('authToken');
              if (!token) {
                console.error('No auth token found');
                return;
              }

              // Send delete request to the server
              const response = await axios.delete(`http://10.0.2.2:8000/api/comments/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });

              // Check response status to confirm deletion
              if (response.status === 200 || response.status === 204) {
                console.log("Comment deleted successfully from server");

                // Update local comments state after deletion
                const updatedComments = comments.filter((item) => item.id !== id);
                setComments(updatedComments);

                // Update AsyncStorage
                await AsyncStorage.setItem(`product_${productId}_comments`, JSON.stringify(updatedComments));
              } else {
                alert('Failed to delete comment. Please try again.');
              }
            } catch (error) {
              console.error('Error deleting comment:', error);
              alert('An error occurred while deleting the comment.');
            }
          },
        },
      ]
    );
  } else {
    alert("You can only delete your own comments.");
  }
};


// Function to delete a reply
const handleDeletereply = async (id: string | number) => {
  // Check if replies exist
  if (!replies) {
    console.warn('No replies available to delete.');
    return;
  }

  // Find the reply by its id, ensuring type consistency
  const reply = Object.values(replies).flat().find((item) => item.id === id); // Update this to handle nested replies
  // console.log("Reply object:", reply); // Log the reply object to check its properties

  if (!reply) {
    console.error('Reply not found.');
    return;
  }

  // Check if currentUserId is defined
  if (currentUserId === undefined) {
    alert("You must be logged in to delete replies.");
    return;
  }

  const userId = String(currentUserId); // Ensure userId is a string for comparison

  // Check if the reply exists and if the user is authorized to delete it 
  if (reply && String(reply.user_id) === userId) 
    { // Prompt the user for confirmation before deleting 
      Alert.alert( 
        'Delete Reply', 
        'Are you sure you want to delete this reply?', 
        [ 
          { 
            text:  'Cancel', 
            style: 'cancel', 
          }, 
          { 
            text: 'Delete', 
            style: 'destructive', 
            onPress: async () => 
          { 
            try 
            { 
              const token = await AsyncStorage.getItem('authToken'); 
              if (!token) { console.error('No auth token found'); 
                return; 
              } 
              
              const response = await axios.delete(`http://10.0.2.2:8000/api/reply/${id}`, 
                { 
                  headers: 
                  { 
                    Authorization: `Bearer ${token}`, 
                  }, 
                }); 
                
                if (response.status === 200 || response.status === 204)                  
                  { console.log("Reply deleted successfully from server"); 

                    // Update local state after deletion 
                    const updatedReplies = Object.entries(replies).reduce((acc, [commentId, repliesArray]) => {
                       acc[commentId] = repliesArray.filter((item) => item.id !== id); 
                       return acc; 
                      }, 
                      {}); 
                      
                      setReplies(updatedReplies); 
                      
                      // Update AsyncStorage 
                      await AsyncStorage.setItem(`product_${productId}_comments`, JSON.stringify(updatedReplies)); 
                    } else { 
                      alert('Failed to delete reply. Please try again.'); 
                    } 
                  } catch (error)
                   { console.error('Error deleting reply:', error); 
                    alert('An error occurred while deleting the reply.'); 
                  } 
                }, 
              }, ] 
            ); 
          } else { alert("You can only delete your own replies."); 
          } 
        };

        const handleReport = async (id: string | number) => {
          alert('Reported');
        }


useEffect(() => {
  const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
    if (focusedInput) setKeyboardVisible(true); // Show keyboard only if an input is focused
  });
  const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
    setKeyboardVisible(false);
    setFocusedInput(null); // Reset focused input on keyboard hide
  });

  return () => {
    keyboardDidShowListener.remove();
    keyboardDidHideListener.remove();
  };
}, [focusedInput]);

const handleCommentFocus = () => setFocusedInput('comment');
const handleReplyFocus = () => {
  setFocusedInput('reply');
  if (replyInputRef.current) {
    replyInputRef.current.focus(); // Focus on the reply input immediately
  }
};
const handleReplyFocus1 = () => {
  setFocusedInput('reply');
};


const copyToClipboard = async () => {
  const productLink = Array.isArray(productId) ? generateProductLink(productId[0]) : generateProductLink(productId);
  try {
    await Clipboard.setStringAsync(productLink);
    Alert.alert('Link copied to clipboard!');
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    Alert.alert('Error', 'Failed to copy link to clipboard.');
  }
};


const generateProductLink = (productId: string | number) => {
  const productData = {
    id: productId,
  };
  const encodedProductData = btoa(JSON.stringify(productData)); // Base64 encode
  return ` @product/${encodedProductData} `;
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

const updateproduct = () => {
  if (product?.id) {
    navigation.navigate('updateproduct', { productId: product.id });
    setReportModalVisible(false)
  }
};

const reportproduct = () => {
  if (product?.id) {
    navigation.navigate('Reports/reportproduct', { productId: product.id });
    setReportModalVisible(false)
  }
};
const reportproductcomment = (commentId: string) => {
  if (product?.id) {
    console.log('Navigating to report comment:', commentId,product.id);
    navigation.navigate('Reports/reportcomments', { productId: product.id, commentsId: commentId });
    setReportModalVisible(false)
  }
};

const GotoUserprofile = () => {
  if (product?.user_id) {
    console.log('Navigating to user profile:', product.user_id);
    navigation.navigate('userproduct', { userId: product.user_id });
  }
};

const renderHeader = () => (
  <View>
   <View style={styles.header}>    
  <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
    <Text style={styles.backButtonText}>Back</Text>
  </TouchableOpacity>
  <TouchableOpacity onPress={GotoUserprofile}>
  <View style={styles.productuser}>
            <Text style={styles.userName}>
                {product?.user.Firstname} {product?.user.Lastname}
            </Text>
            <View style={styles.stars}>
                {[...Array(5)].map((_, index) => {
                    const stars = index + 1; // 1 to 5
                    return (
                        <FontAwesome
                            key={stars}
                            name={stars <= Math.round(averageRating) ? 'star' : 'star-o'}
                            size={22}
                            color={stars <= Math.round(averageRating) ? '#FFC107' : '#E0E0E0'}
                        />
                    );
                })}
                <Text style={styles.averageRatingText}>
                    {averageRating.toFixed(1)} {ratingCount > 0 ? `(${ratingCount})` : ''}
                </Text>
            </View>
        </View>
  </TouchableOpacity>
  <TouchableOpacity onPress={() => setReportModalVisible(true)}>
    <Image 
      source={icons.menu} 
      style={styles.menuIcon}
      resizeMode="contain"
    /> 
  </TouchableOpacity>
</View>

  {/* Report Modal for creating a report */}
  <Modal
  animationType="slide"
  transparent={true}
  visible={reportModalVisible}
  onRequestClose={() => setReportModalVisible(false)}
>
  <View style={styles.reportmodalContainer}>
    <View style={styles.reportmodalContent}>
      <Text style={styles.reportmodalTitle}>Choose an Action</Text>
      {product?.user_id?.toString() === currentUserId?.toString() && (
         <TouchableOpacity style={styles.actionContainer} onPress={updateproduct}>
        <Image source={icons.update} style={styles.icon} resizeMode="contain" />
        <Text style={styles.actionText}>Edit Product</Text>
      </TouchableOpacity>
        )}   
        {product?.user_id?.toString() !== currentUserId?.toString() && ( 
      <TouchableOpacity style={styles.actionContainer} onPress={reportproduct}>
        <Image source={icons.report} style={styles.icon} resizeMode="contain" />
        <Text style={styles.actionText}>Report Product</Text>
      </TouchableOpacity>
      )} 
      <TouchableOpacity onPress={() => setReportModalVisible(false)}>
        <Text style={styles.reportcloseButton}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

    <View style={styles.product}>
      <View style={styles.titlebar}>
        <Text style={styles.title}>{product?.title}</Text>
        <TouchableOpacity onPress={copyToClipboard}>
          <Text>Copy</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => setShowOriginalImage(!showOriginalImage)}>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />
        ) : (
          <Image source={imageUri ? { uri: imageUri } : undefined} style={styles.productImage} 
          onError={() => {
            console.log('Image failed to load');
            setImageUri('image.empty'); // Set a fallback image URI
          }} />
        )}
      </TouchableOpacity>
        <View style={styles.productdetails}>
          <Text>{product?.description}</Text>
          <Text>Quantity: {product?.quantity}</Text>
          <Text>Price: {product?.price}</Text>
          <Text>Location: {product?.locate}</Text>
        </View>   
      <View style={styles.messagebar}>
        <TouchableOpacity style={styles.message} onPress={handlePress}>
          <Text style={styles.messageText}>Message</Text>
        </TouchableOpacity>
        {product?.user_id?.toString() === currentUserId?.toString() && (
          <Text style={styles.totalMessage}>
            <Image source={icons.contact} style={styles.icon} resizeMode="contain" />
            messages: {totalmessage}
          </Text>
        )}
      </View>
    </View>
  </View>
);

  
return (
  <SafeAreaView style={styles.container}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      
      <KeyboardAwareFlatList
         data={(comments ?? []).slice().reverse()} 
        keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={() => (
          <View style={styles.noCommentsText}>
            <Text>No comments yet</Text>
          </View>
        )}
        renderItem={({ item }) => {
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

          return (
            <View>
              <View style={styles.comment}>
                <View style={styles.commentheader}>
                  <View>
                    {/* fix this in where the product/ should be pick to be send to handlink and fix how many charater arre turned blue maybe add more specifies to completely exlude it from normal text */}
                    <Text style={styles.commentUser}>{item.user?.Firstname || defaultUser.Firstname} {item.user?.Lastname}</Text>
                    <TouchableOpacity style={{ width: 350 }} onPress={() => hasValidLink && handlelink(productLink)}>
                      <Text style={{ color: 'black' }}>
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
                  </View>
                  {item.userId !== null && item.userId.toString() === user?.id?.toString() ? (
                    // Show delete icon if item.userId matches user.id
                    <TouchableOpacity style={styles.delete} onPress={() => handleDelete(item.id)}>
                      <Image source={icons.garbage} style={styles.icon} />
                    </TouchableOpacity>
                  ) : (
                    // Show report icon if item.userId does not match user.id
                    <TouchableOpacity style={styles.delete} onPress={() => reportproductcomment(item.id)}>
                      <Image source={icons.report} style={styles.icon} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <View style={styles.undercomment}>
                <Text style={styles.commentTime}>{timeSince(item.created_at)}</Text>
                <View style={styles.replyContainer}>
                  <TouchableOpacity style={styles.replyButton} onPress={() => handleReplyPress(item.id)}>
                    <Text style={{ color: 'blue', fontWeight: 'bold' }}>reply {replies[item.id]?.length > 0 ? replies[item.id].length : ''}</Text>
                  </TouchableOpacity>
                  
                  {/* Conditionally Render Replies and Input */}
            {replyVisibility[item.id] && (
              <>
                {/* FlatList for replies */}
                {replies[item.id]?.length > 0 && (
                  <FlatList
                    data={replies[item.id] || []}
                    keyExtractor={reply => reply.id.toString()}
                    renderItem={RenderReplies}
                  />
                )}

                {/* Reply Input */}
                <View style={[styles.replyinputContainer]}>
                      <TextInput
                          ref={replyInputRef} 
                          value={reply}
                          onChangeText={setReply}
                          style={styles.replyInput}
                          placeholder="Add a reply..."
                          onFocus={handleReplyFocus}
                          onBlur={() => setFocusedInput(null)}
                        />
                      <TouchableOpacity style={styles.sendButton} onPress={() => handleReplySubmit(item.id)}>
                        <Image source={icons.send} style={styles.icon} />
                      </TouchableOpacity>
                    </View>
              </>
            )}
                </View>
              </View>
            </View>
          );
        }}
        enableOnAndroid={true}
        extraScrollHeight={80}  // Adjust scroll height for extra room above keyboard
      />

      {/* Original Image Modal */}
      <Modal visible={showOriginalImage} transparent={true} animationType="fade" onRequestClose={() => setShowOriginalImage(false)}>
        <TouchableOpacity style={styles.overlay} onPress={() => setShowOriginalImage(false)}>
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />
          ) : (
            <Image source={{ uri: imageUri || '' }} style={styles.originalImage} onError={() => console.log('Image failed to load')} defaultSource={require('../assets/images/empty.png')} />
          )}
          <TouchableOpacity style={styles.closeButton} onPress={() => setShowOriginalImage(false)}>
            <Text style={styles.closeText}>&times;</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      {/* modal for message list */}
      <Modal
  animationType="slide"
  transparent={true}
  visible={modalVisible}
  onRequestClose={() => setModalVisible(false)}
>
  <SafeAreaView style={styles.modalOverlay}>
    <View style={styles.modalView}>
    <View style={styles.messageheader}>
                <Text style={styles.headerText}> 
                  Your product
                  <Image 
                    source={icons.contact} 
                    style={styles.icon}
                    resizeMode="contain"
                  /> 
             </Text>
                  <View style={styles.modalButtonContainer}>
                <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalButtonText}>Close</Text>
                </TouchableOpacity>
                </View>
              </View>
            {loading ? (
              <Text style={styles.loadingstate}>Loading...</Text>
            ) : (
                  messageList.length === 0 ? (
                    <Text style={styles.nomessage}>No messages yet</Text>
                  ) : (
                  <FlatList
            data={messageList}
            keyExtractor={(item, index) => {
              // Ensure 'id' exists before calling 'toString'
              const key = item.latest && item.latest.id ? item.latest.id.toString() 
              : index.toString();
              return key;
            }}
            renderItem={renderMessage}
          />

      ))}
    </View>
  </SafeAreaView>
</Modal>

 {/* Input for new comment*/}
 <View style={[styles.inputContainer]}>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder={"Add a comment..."}
          style={styles.commentInput}
          onFocus={handleCommentFocus}
          onBlur={() => setFocusedInput(null)}
        />
          <TouchableOpacity style={styles.sendButton} onPress={handleCommentSubmit}>
            <Image
              source={icons.send} // Local icon path
              style={styles.icon} // Add your icon styling here
            />
          </TouchableOpacity>
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
  header: {
      flexDirection: 'row',                // Arrange children in a row
      justifyContent: 'space-between',      // Space out items evenly
      alignItems: 'center',                 // Center items vertically
      paddingHorizontal: 5,                // Adjusted for more spacing
      paddingVertical: 10,                  // Vertical padding for better height
      shadowColor: '#000',                  // Optional: add shadow for depth
      shadowOffset: { width: 0, height: 1 }, // Shadow offset
      shadowOpacity: 0.1,                   // Shadow opacity
      shadowRadius: 2,                      // Shadow radius
      elevation: 3,                         // Elevation for Android
      backgroundColor:'#a5d6a7',
      borderRadius: 5,
  },
  productuser: {
    alignItems: 'center',                 // Center items vertically
    justifyContent: 'center',             // Center items horizontally
    elevation: 3,                         // Android shadow support
},
userName: {
    fontSize: 22,                         // Slightly larger font size for the name
    fontWeight: 'bold',                   // Bold text for emphasis
    color: '#333',                        // Darker text color
},
userreplyName: {
  fontSize: 14,                  // Slightly larger font size for better visibility
    fontWeight: 'bold',            // Make the username bold for emphasis
    color: '#1a1a1a',              // Darker color for better contrast
    marginBottom: 2,               // Space between username and comment text
},
averageRatingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,                      // Space between stars and rating text
    alignSelf: 'center',                 // Center the text vertically with stars
},
stars: {
    flexDirection: 'row',
    alignItems: 'center',                // Center stars vertically
    justifyContent: 'center',
},
  menuIcon: {
    width: 24, // Set width for the menu icon
    height: 24, // Set height for the menu icon
    tintColor: '#000', // Change color if needed
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

  dash: {
    flexDirection: 'row', // Arrange children in a row
    justifyContent: 'space-between', // Space between product details and user info
    padding: 10, // Add some padding
    backgroundColor: '#fff', // Background color for the dash
    borderRadius: 5, // Round corners
    shadowColor: '#000', // Shadow for elevation
    shadowOffset: { width: 0, height: 1 }, // Shadow offset
    shadowOpacity: 0.1, // Shadow opacity
    shadowRadius: 2, // Shadow radius
    elevation: 2, // Elevation for Android
  },
  productdetails: {
    flex: 1, // Allow this section to take up available space
    padding: 10, // Increase padding for a more spacious look
    borderWidth: 1, // Add a border to outline the comment box
    borderColor: '#ddd', // Use a subtle light gray for the border
    borderTopLeftRadius: 5, // Round top left corner
    borderTopRightRadius: 5, // Round top right corner
    borderBottomLeftRadius: 10, // Round bottom left corner
    borderBottomRightRadius: 10, // Round bottom right corner
    backgroundColor: '#f9f9f9', // Light background color for a soft look
    marginBottom: 5, // Add some space between comments
    shadowColor: "#000", // Add a slight shadow for depth
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1, 
  },
  titlebar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
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
  reportmodalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Dark overlay for focus effect
    justifyContent: 'flex-end', // Align modal to the bottom
    alignItems: 'center',
  },
  reportmodalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 15,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  reportmodalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0', // Light border for separation
  },
  actionText: {
    fontSize: 14,
    marginLeft: 10,
  },
  replyicon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  reportcloseButton: {
    fontSize: 16,
    color: '#007bff',
    textAlign: 'center',
    paddingVertical: 15,
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
    paddingVertical: 5,
    borderRadius: 15,
  },
  message: {
    backgroundColor: '#28a745', // Darker green for a more modern look
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginRight: 15,
  },
  messageText: {
    color: '#FFFFFF', // White text for contrast
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageTextlist: {
    fontSize: 15,
    color: '#000', // Black text for contrast
    backgroundColor: '#f1f1f1', // Light grey background
    padding: 5,
    borderRadius: 10,
    overflow: 'hidden', // Ensure text fits well
    maxWidth: '80%', // Limit message width
    alignSelf: 'flex-start', // Align left like a chat bubble
  },
  totalMessage: {
    fontSize: 20,
    color: '#333', // Darker text color for contrast
    alignSelf: 'flex-end',
    paddingLeft: 60,
    paddingBottom: 10,
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
    padding: 5, 
    height: 60,                    // Increase padding for a more spacious look
    borderWidth: 1,                  // Add a border to outline the comment box
    borderColor: '#ddd',             // Use a subtle, light gray for the border
    borderRadius: 10,                // Rounded corners to make it look modern
    backgroundColor: '#f9f9f9',      // Light background color for a soft look
    shadowColor: "#000",             // Add a slight shadow for depth
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,                // Elevation for Android shadow
  },  
  
  commentUser: {
    fontSize: 14,                  // Slightly larger font size for better visibility
    fontWeight: 'bold',            // Make the username bold for emphasis
    color: '#1a1a1a',              // Darker color for better contrast
    marginBottom: 2,               // Space between username and comment text
  },

  replies: {
    padding: 5, 
    height: 60,                    // Increase padding for a more spacious look
    width: 370,
    borderWidth: 1,                  // Add a border to outline the comment box
    borderColor: '#ddd',             // Use a subtle, light gray for the border
    borderRadius: 10,                // Rounded corners to make it look modern
    backgroundColor: '#f9f9f9',      // Light background color for a soft look
    shadowColor: "#000",             // Add a slight shadow for depth
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,                // Elevation for Android shadow
  },
  targetUser: {
    fontWeight: 'bold',
    color: '#666', // Lighter color than the main user
    fontSize: 13,
  },
  commentTime: {
    fontSize: 12,
    textAlign: 'auto',
    color: '#666',
    position: 'absolute',
    left: 5, // Adjust as needed for positioning
    top: 0,  
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
  undercomment: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5,
    marginBottom: 2, // Add some padding to make the button more clickable
  },
  replyundercomment: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 5,
    marginBottom: 5, // Add some padding to make the button more clickable
  },
  replyContainer: {
    paddingLeft: 12,
  },
  replyButton: {
    marginLeft: 25, // Slight indentation for alignment
    left: 0,
  },
  reply_Button: {
    marginLeft: 30, // Slight indentation for alignment
    left: 0,
  },
  replyinputContainer: {
    maxHeight: 50,
    width: '90%',
    marginTop: 5,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
  },
  replyInput: {
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
    marginBottom: 5,
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

  delete: { 
     right:5,
  },
  replydelete: { 
    right:15,
 },
  icon: {
    width: 24, // Adjust based on your icon size
    height: 24, // Adjust based on your icon size
  },
  noCommentsText: {
    textAlign: 'center',
    color: 'gray', // Adjust color as needed
    marginVertical: 20,
    padding: 10,
    fontSize: 18,
    fontStyle: 'italic',
    borderWidth: 1,
    borderColor: 'lightgray',
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
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
    marginTop: 10,
    marginBottom: 10,
    paddingLeft: 50,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto', // Push button to the right
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
    padding: 5,
    marginLeft: 15, // Add some spacing between text and time
  },
  loadingstate: {
    justifyContent: 'center',
    alignSelf: 'center',
    paddingTop: 300,
  },
  messageheader: {
    flexDirection: 'row', // Arrange items in a row
    justifyContent: 'space-between', // Space items out evenly
    alignItems: 'center', // Center items vertically
    padding: 10, // Add some padding for spacing
    paddingLeft: 80,
    borderBottomWidth: 1, // Optional: Add border for separation
    borderBottomColor: '#ccc', 
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  nomessage: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
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
    borderRadius: 20,
    width: '90%',            // Adjust width according to your needs
    minWidth: 331,           // Ensure it doesn't shrink too much
    backgroundColor: '#ECECEC',
    flexShrink: 0,           // Prevent shrinking
  },
senderName: {
  fontWeight: 'bold',
  fontSize: 16,
  color: '#0078FF', // Messenger-style blue color
  marginBottom: 5,
  
},
});


