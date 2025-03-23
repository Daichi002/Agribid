import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, FlatList, RefreshControl, TouchableOpacity, Alert, SafeAreaView, Modal, Dimensions } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { icons } from "../../constants";
import { useRouter } from 'expo-router';
import ImageLoader  from '../../components/imageprocessor';
import ProductList from '../../components/ProductList';
import BASE_URL from '../../components/ApiConfig';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

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

interface ProductItemProps {
  item: {
    id: number;
    image: string;
    title: string;
    description: string;
    price: string;
    locate: string;
    created_at: string;
  };
  handleViewDetails: (item: any) => void;
  handleDelete: (item: { id: number; image: string; title: string; description: string; price: string; locate: string; created_at: string; }) => void;
}

interface ProductMessage {
  isRead: number;
  id: number;
  sendId: string;
  receiveId: string;
  product: {
    image: string;
  };
  counterpart: {
    id: string
    Firstname: string;
    Lastname: string;
  };
  message: string;
  currentuserId: string;
  created_at: string;
}

const ProductItem = React.memo(({ item, handleViewDetails, handleDelete }: ProductItemProps) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // const imageUri = item.image; 
  // console.log('ProductItem rendering:', imageUri);
  // console.log('ProductItem rendering:', item.image);



  useEffect(() => {
    const loadImage = async () => {
      const uri = item?.image;;
      const cachedUri = await cacheImage(uri);
      setImageUri(cachedUri);
      setLoading(false);
    };

    loadImage();
  }, [item.image]);

  return (
    <TouchableOpacity  onPress={() => handleViewDetails(item)}>
      <View style={styles.productItem}>
        {loading ? (
           <Image 
           source={icons.LoadingAgribid} 
           style={styles.loadingicon}
           resizeMode="contain" // Ensure the image fits within the circular container
         /> 
        ) : (
          // console.log('ProductItem rendering:', imageUri),
          imageUri ? <ImageLoader imageUri={imageUri} style={styles.productImage} /> : null
        )}
        <View style={styles.productDetails}>
          <Text style={styles.productTitle}>{item.title}</Text>
          <Text style={styles.productDescription}>Description: {item.description}</Text>
          <Text style={styles.productDate}>Date Created: {new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        <TouchableOpacity style={styles.buttonContainer} onPress={() => handleDelete(item)}>
          <Image source={icons.garbage} style={styles.icon} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

interface RenderProductMessagesProps {
  item: {
    image: string;
    title: string;
    description: string;
    created_at: string;
    id: number;
  };
  handleViewMessage: (id: number) => void;
  sessionCount: number;
}

const RenderProductMessages = React.memo(({ item, handleViewMessage, sessionCount }: RenderProductMessagesProps) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // const imageUri = item.image; 
  // console.log('RenderProductMessages rendering:', item);

  useEffect(() => {
    const loadImage = async () => {
      const uri = item?.image;;
      const cachedUri = await cacheImage(uri);
      setImageUri(cachedUri);
      setLoading(false);
    };

    loadImage();
  }, [item.image]);

  return (
    <TouchableOpacity onPress={() => handleViewMessage(item.id)}>
      <View style={styles.productItem}>
        {loading ? (
          <Image 
            source={icons.LoadingAgribid} 
            style={styles.loadingicon}
            resizeMode="contain" // Ensure the image fits within the circular container
          /> 
        ) : (
          imageUri ? <ImageLoader imageUri={imageUri} style={styles.productImage} /> : null
        )}
        <View style={styles.productDetails}>
          <Text style={styles.productTitle}>{item.title}</Text>
          {sessionCount ? (
            <Text style={styles.productTitle}>
              <Image 
                source={icons.contact} 
                style={styles.icon}
                resizeMode="contain" // Ensure the image fits within the circular container
              /> 
              Messages: {sessionCount}</Text>
          ) : null}
          <Text style={styles.productDate}>Date Created: {new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const Recents = () => {
  interface Product {
    id: number;
    image: string;
    title: string;
    description: string;
    price: string;
    locate: string;
    created_at: string;
  }
  interface Message {
    isRead: number;
    id: number;
    sendId: string;
    receiveId: string;
    product: {
      image: string;
    };
    counterpart: {
      id: string
      Firstname: string;
      Lastname: string;
    };
    message: string;
    currentuserId: string;
    created_at: string;
  }

  const [products, setProducts] = useState<Product[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageList, setMessageList] = useState<{ [key: number]: any[] }>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshingMessages, setIsRefreshingMessages] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation(); 
  const [modalVisible, setModalVisible] = useState(false);
  
  const isFocused = useIsFocused();
  const router = useRouter();

  // fetch live products of users
  const fetchProducts = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await axios.get(`${BASE_URL}/api/user/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // console.log('User products:', response.data);

      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching user products:', error);
    }
  };

  // fetch messages for each product
  const fetchMessages = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return null; // Return null if no token
      }
  
      const response = await axios.get(`${BASE_URL}/api/user/productmessage`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const messageData = response.data.data; // Assuming the main data is in `data` field
      // console.log('User messages:', JSON.stringify(response.data, null, 2));
  
      // Sort the message data
      const sortedData = messageData.map((productData: any) => {
        // Sort messages based on isRead (unread messages first), then created_at (latest first)
        const sortedMessages = productData.messages.sort((a: { isRead: number; created_at: string | number | Date; }, b: { isRead: number; created_at: string | number | Date; }) => {
          // If unread messages exist, put those at the top
          if (a.isRead === 0 && b.isRead === 1) return -1; // a comes before b
          if (a.isRead === 1 && b.isRead === 0) return 1; // b comes before a
          
          // Otherwise, sort by created_at for both read and unread messages (latest first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
  
        // Return the product with sorted messages
        return {
          ...productData,
          messages: sortedMessages,
        };
      });
  
      // Sort the products based on whether they have messages, unread ones first, then latest messages
      const finalSortedProducts = sortedData.sort((a: { messages: any[]; }, b: { messages: any[]; }) => {
        const hasUnreadA = a.messages.some(msg => msg.isRead === 0);
        const hasUnreadB = b.messages.some(msg => msg.isRead === 0);
  
        // If one has unread messages, it should come first
        if (hasUnreadA && !hasUnreadB) return -1;
        if (!hasUnreadA && hasUnreadB) return 1;
  
        // If both or neither have unread messages, sort by latest created_at
        return new Date(b.messages[0]?.created_at).getTime() - new Date(a.messages[0]?.created_at).getTime();
      });
  
      // console.log('Sorted User messages:', JSON.stringify(finalSortedProducts, null, 2));
  
      // Optionally, save sorted data to AsyncStorage
      await AsyncStorage.setItem('userMessages', JSON.stringify(finalSortedProducts));
  
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching user messages:', error.response ? error.response.data : error.message);
      } else {
        if (error instanceof Error) {
          console.error('Error fetching user messages:', error.message);
        } else {
          console.error('Error fetching user messages:', error);
        }
      }
      return null; // Return null in case of error
    }
  };
  

  const loadMessage = async () => {
    try {
      const savedMessageIDs = await AsyncStorage.getItem('userMessages');
      if (savedMessageIDs) {
        const message = JSON.parse(savedMessageIDs);
        console.log('Sorted User messages:', JSON.stringify(message, null, 2));
        setMessages(message); // Set the saved data to the state

      } else {
        // If no saved data, fetch messages
        const fetchedMessages = await fetchMessages();
        if (fetchedMessages) {
          // Save fetched messages to AsyncStorage
          await AsyncStorage.setItem('userMessages', JSON.stringify(fetchedMessages));
          console.log('Fetched User messages:', JSON.stringify(fetchedMessages, null, 2));
          // Set the fetched data to the state
          setMessages(fetchedMessages);
  
          return fetchedMessages;
        }
      }
    } catch (error) {
      console.error('Error loading Message IDs from AsyncStorage:', error);
    }
  };


// Function to handle message press
const handleMessagePress = async (item: { sendId: any; currentuserId: any; product: { id: any; }; receiveId: any; sessions: any; id: any; isRead: number; }) => {
  // console.log('Message clicked:', item);

  const token = await AsyncStorage.getItem('authToken');
  if (!token) {
    console.error('No auth token found');
    return;
  }

  // Check if the current user is the sender
  if (item.sendId === item.currentuserId) {
    // If the user is the sender, navigate without marking as read
    const paramsToSend = {
      productId: item.product.id,
      senderId: item.receiveId,
      receiverId: item.sendId,
      sessions: item.sessions,
    };

    router.push({
      pathname: '/message/messagereceiver',  // Navigate to sender's message page
      params: paramsToSend,
    });
    return; // Exit early
  }

  // If the current user is the receiver, mark the message as read first
  try {
    await axios.post(
      `${BASE_URL}/api/message/${item.id}/mark-read`,
      {}, // Empty object for POST body
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Mutate the 'isRead' value directly in the item object (Mark the message as read)
    item.isRead = 1; // Mark the message as read (1 represents read)

    // Update state to reflect the change in message read status
    // setMessageList((prevState) =>
    //   prevState.map((message) =>
    //     message.id === item.id ? { ...message, isRead: 1 } : message
    //   )
    // );

    // Now navigate to the receiver's message page
    const paramsToSend = {
      productId: item.product.id,
      senderId: item.sendId,
      receiverId: item.receiveId,
      sessions: item.sessions,
    };

    router.push({
      pathname: '/message/messagereceiver',  // Navigate to receiver's message page
      params: paramsToSend,
    });

  } catch (error) {
    console.error('Error marking message as read:', error);
  }
};




  const handleViewDetails = (product: any) => {
    // console.log('Viewing product details:', product.id);
    navigation.navigate('ProductDetails', { productId: product.id});
  };;

  const handleDelete = async (product: { id: number; image: string; title: string; description: string; price: string; locate: string; created_at: string; }) => {
    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete this product?`,
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Deletion cancelled'),
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken');
              if (!token) return;

              await axios.put(
                `${BASE_URL}/api/products/${product.id}/live`,
                { live: false },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              // console.log('Product deleted', product.id);
              Alert.alert('Product is now deleted');
              fetchProducts(); // Refresh the product list
            } catch (error) {
              console.error('Error deleting product:', error);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const lastFetchProductTime = useRef(0);
  const lastFetchMessageTime = useRef(0);
  const productDebounceDelay = 10000; // 10 seconds for products
  const messageDebounceDelay = 5000;  // 5 seconds for messages
  
  const fetchProductsData = async () => {
    const currentTime = Date.now();
    if (currentTime - lastFetchProductTime.current > productDebounceDelay) {
      console.log('Fetching products...');
      await fetchProducts();
      lastFetchProductTime.current = currentTime;
    } else {
      console.log('Product fetch skipped to prevent 429');
    }
  };
  
  const fetchMessagesData = async () => {
    const currentTime = Date.now();
    if (currentTime - lastFetchMessageTime.current > messageDebounceDelay) {
      console.log('Fetching messages...');
      await fetchMessages();
      // await fetchMessagesForProduct();
      lastFetchMessageTime.current = currentTime;
    } else {
      console.log('Message fetch skipped to prevent 429');
    }
  };
  
  const fetchData = async () => {
    await fetchProductsData();
    await fetchMessagesData();
    await loadMessage();
  };
  

  useEffect(() => {
    const executeFetch = async () => {
      if (isFocused) {
        setLoading(true);
        await fetchData();
        setLoading(false);
      }
    };
    executeFetch();
  }, [isFocused]);
  

  const onRefreshProducts = async () => {
    const currentTime = Date.now();
    if (currentTime - lastFetchProductTime.current > productDebounceDelay) {
      setIsRefreshing(true);
      await fetchProducts();
      setIsRefreshing(false);
      lastFetchProductTime.current = currentTime;
    } else {
      console.log('Product fetch skipped to prevent 429');
    }
  };
  
  const onRefreshMessages = async () => {
    const currentTime = Date.now();
    if (currentTime - lastFetchMessageTime.current > messageDebounceDelay) {
      setIsRefreshingMessages(true);
      await fetchMessages();
      await loadMessage();
      setIsRefreshingMessages(false);
      lastFetchMessageTime.current = currentTime;
    } else {
      console.log('Message fetch skipped to prevent 429');
    }
  };
  

  const sortedpost = products.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA; // Sort in descending order
  });


    // Sort the messages based on the following criteria:
    const sortedData: ProductMessage[] = messages
  .map((message: any) => message)
  .sort((a, b) => {
    // Get the first message for sorting purposes
    const aMessages = a.messages && a.messages.length > 0 ? a.messages[0] : null;
    const bMessages = b.messages && b.messages.length > 0 ? b.messages[0] : null;

    // First, check if both products have messages or not
    if (aMessages && !bMessages) {
      return -1; // a has messages, b does not (a goes first)
    }
    if (!aMessages && bMessages) {
      return 1; // b has messages, a does not (b goes first)
    }

    // If both products have messages, sort by isRead
    if (aMessages && bMessages) {
      // If both have messages, prioritize unread (isRead: 0) first
      if (aMessages.isRead === 0 && bMessages.isRead === 1) {
        return -1; // a comes before b (unread first)
      }
      if (aMessages.isRead === 1 && bMessages.isRead === 0) {
        return 1; // b comes before a (read second)
      }
      
      // If both messages have the same `isRead` value, sort by created_at
      const aDate = new Date(aMessages.created_at).getTime();
      const bDate = new Date(bMessages.created_at).getTime();
      return bDate - aDate; // Sort by created_at in descending order
    }

    return 0; // Default case: this shouldn't be hit due to earlier checks
  });









  return (
    <View style={styles.container}>
      {/* Product List */}
      <View style={styles.transactionsContainer}>
        <View style={styles.poster}>
          <Text style={styles.label}>Posted Products:</Text>
          <Text style={styles.totalProducts}>Total Post: {products.length}</Text>
        </View>
        <FlatList
          data={sortedpost}
          renderItem={({ item }) => (
            <ProductItem 
            item={item} 
            handleViewDetails={handleViewDetails} 
            handleDelete={handleDelete} 
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          extraData={products}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefreshProducts} />
          }
          ListEmptyComponent={
            <View style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
              }}>
              <Text style={{
                  marginTop: 10,
                  fontSize: 18,
                  fontWeight: '600',
                  color: '#444',
                  textAlign: 'center',
                }}>
                No Posted Product Yet
              </Text>
              <Text style={{
                  marginTop: 5,
                  fontSize: 14,
                  color: '#888',
                  textAlign: 'center',
                  paddingHorizontal: 15,
                  lineHeight: 20,
                }}>
                 You will see you Posted Product Here
              </Text>
            </View>
          }
        />
      </View>

      {/* Message List */}
      <View style={styles.transactionsContainer}>
        <View style={styles.poster}>
          <Text style={styles.label}>Product Messages:</Text>
        </View>
        <ProductList products={sortedData} onMessagePress={handleMessagePress}/>
      </View>
    </View>
  );
};

export default Recents;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    // backgroundColor: '#B4CBB7',
  },
  transactionsContainer: {
    marginBottom: 20,
    height: screenHeight * 0.4, // 40% of the screen height for the container
  },
  productItem: {
    flexDirection: 'row',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 5,
    marginRight: 10,
  },
  productDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  productTitle: {
    fontWeight: 'bold',
  },
  productDescription: {
    color: '#666',
  },
  productDate: {
    fontSize: 12,
    color: '#999',
  },
  buttonContainer: {
    marginTop: 10,
  },
  icon: {
    width: 20,
    height: 20,
  },
  loadingicon: {
    width: 80,
    height: 80,
    borderRadius: 5,
    marginRight: 10,
  },
  poster: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalProducts: {
    fontSize: 14,
    color: '#666',
  },
  placeholderText: {
    textAlign: 'center',
    color: '#999',
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
  messageheader: {
    flexDirection: 'row', // Arrange items in a row
    justifyContent: 'space-between', // Space items out evenly
    alignItems: 'center', // Center items vertically
    padding: 10, // Add some padding for spacing
    paddingLeft: screenWidth * 0.03, // 10% of screen width for left padding (adjustable)
    paddingRight: screenWidth * 0.001, // Add padding to the right side
    width: '100%', // Ensure it takes up full width
    borderBottomWidth: 1, // Optional: Add border for separation
    borderBottomColor: '#ccc',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalButtonContainer: {
    marginTop: 10,
    marginBottom: 10,
    paddingLeft: screenWidth * 0.1, // 10% of screen width for left padding (adjustable)
    paddingRight: screenWidth * 0.05, // Adjust the right padding for responsiveness
    flexDirection: 'row', // Arrange the button and other elements horizontally
    justifyContent: 'flex-end', // Align buttons to the right
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
  messageContainer: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    width: screenWidth * 0.75, // Add padding to the right side
    // width: '80%',            // Adjust width according to your needs
    minWidth: 200,           // Ensure it doesn't shrink too much
    backgroundColor: '#ECECEC',
    flexShrink: 0,           // Prevent shrinking
  },
  noMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageRow: {
    flexDirection: 'row', // Arrange items in a row
  },
  senderName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#0078FF', // Messenger-style blue color
    marginBottom: 5,
  },
  messageText: {
    fontSize: 15,
    color: '#000', // Black text for contrast
    backgroundColor: '#f1f1f1', // Light grey background
    paddingLeft: 5,
    borderRadius: 10,
    overflow: 'hidden', // Ensure text fits well
    maxWidth: '80%', // Limit message width
    alignSelf: 'flex-start', // Align left like a chat bubble
  },
  messageTime: {
    padding: 5,
    marginLeft: 15, // Add some spacing between text and time
  },
  noMessageText: {
    fontSize: 18,
    color: '#888',  // A subtle gray color
    fontWeight: 'bold',
  },
  loadingstate: {
    justifyContent: 'center',
    alignSelf: 'center',
    paddingTop: 100,
  },
});

