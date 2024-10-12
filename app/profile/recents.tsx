import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Image, FlatList, RefreshControl, TouchableOpacity, Alert, SafeAreaView, Modal } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { icons } from "../../constants";
import { useRouter } from 'expo-router';

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

const ProductItem = React.memo(({ item, handleViewDetails, handleDelete }) => {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadImage = async () => {
      const uri = `http://10.0.2.2:8000/storage/product/images/${item.image}`;
      const cachedUri = await cacheImage(uri);
      setImageUri(cachedUri);
      setLoading(false);
    };

    loadImage();
  }, [item.image]);

  return (
    <TouchableOpacity onPress={() => handleViewDetails(item)}>
      <View style={styles.productItem}>
        {loading ? (
          <Text>Loading...</Text>
        ) : (
          <Image source={{ uri: imageUri }} style={styles.productImage} />
        )}
        <View style={styles.productDetails}>
          <Text style={styles.productTitle}>{item.title}</Text>
          <Text style={styles.productDescription}>Description: {item.description}</Text>
          <Text style={styles.productDate}>Date Created: {new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
          <TouchableOpacity style={styles.buttonContainer} onPress={() => handleDelete(item.id)}>
            <Image source={icons.garbage} style={styles.icon} />
          </TouchableOpacity>
        
      </View>
    </TouchableOpacity>
  );
});

const RenderProductMessages = React.memo(({ item, handleViewMessage, sessionCount }) => {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(true);
 

  useEffect(() => {
    const loadImage = async () => {
      const uri = `http://10.0.2.2:8000/storage/product/images/${item.image}`;
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
          <Text>Loading...</Text>
        ) : (
          <Image source={{ uri: imageUri }} style={styles.productImage} />
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
  const [products, setProducts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageID, setMessageID] = useState([]);
  const [messageList, setMessageList] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshingMessages, setIsRefreshingMessages] = useState(false);
  const [sessionCounts, setSessionCounts] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation(); 
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const isFocused = useIsFocused();
  const router = useRouter();

  // fetch live products of users
  const fetchProducts = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await axios.get(`http://10.0.2.2:8000/api/user/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setProducts(response.data);
      // console.log('Fetched User Products Data:', response.data);
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
  
      console.log('Fetching user messages...');
      const response = await axios.get('http://10.0.2.2:8000/api/user/productmessage', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      const messageIDs = response.data.map((message) => message.id);
      setMessages(response.data);
  
      // Save messageIDs to AsyncStorage
      await AsyncStorage.setItem('messageIDs', JSON.stringify(messageIDs));
      // console.log('Saved Message IDs to AsyncStorage');
  
      // console.log('Fetched User Messages Data:', response.data);
      // console.log('Fetched Message IDs:', messageIDs);
      return messageIDs; // Return the message IDs
    } catch (error) {
      console.error('Error fetching user messages:', error.response ? error.response.data : error.message);
      return null; // Return null in case of error
    }
  };  
  
  

  // message function start here
  // function for message list

  const handleViewMessage = (productId) => {
    // console.log('Current messageList:', JSON.stringify(messageList, null, 2)); // Check the current state of messageList
  
    if (!messageList || typeof messageList !== 'object') {
      console.error('messageList is not available or not an object.');
      return;
    }
  
    const filteredMessages = messageList[productId];
  
    if (!filteredMessages) {
      // console.error(`No messages found for productId ${productId}.`);
      setSelectedMessages([]);  // Ensure this is set even if no messages are found
      setModalVisible(true);    // Open the modal even if no messages found
      return;
    }
    
    const sessionMessages = Object.values(filteredMessages);
    const flattenedMessages = sessionMessages.flat(); // Flatten the array to handle multiple sessions
    setSelectedMessages(flattenedMessages);
    setModalVisible(true);  // Open the modal
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

  const renderMessage = React.memo(({ item }) => {
    if (!item || !item.first || !item.first.sender || !item.latest) {
      console.error('Invalid message item:', item);
      return null;
    }
  
    const firstMessage = item.first;
    const latestMessage = item.latest;
    const sender = normalizeKeys(firstMessage.sender);
    const displayName = `${sender.firstname || 'Unknown'} ${sender.lastname || ''}`.trim();

     // Function to check if text is an image URL
     const isImageUrl = (text) => {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff'];
      return imageExtensions.some(ext => text.toLowerCase().endsWith(ext));
    };
  
    return (
      <TouchableOpacity onPress={() => handlemessagereceive(firstMessage)}>
        <View style={styles.messageContainer}>
          <Text style={styles.senderName}>{displayName || 'Unknown'}</Text>
          <View style={styles.messageRow}>
            <Text style={styles.messageText}>
            {isImageUrl(latestMessage.text) ? 'Image' : (latestMessage.text || 'No message content')}
              </Text>
            <Text style={styles.messageTime}>
              .{latestMessage.created_at ? formatTime(latestMessage.created_at) : 'No message content'}
            </Text>
          </View>

        </View>
      </TouchableOpacity>
    );
  });

  const loadMessageIDs = async () => {
    try {
      const savedMessageIDs = await AsyncStorage.getItem('messageIDs');
      if (savedMessageIDs) {
        const messageIDs = JSON.parse(savedMessageIDs);
        setMessageID(messageIDs);
        // console.log('Loaded Message IDs from AsyncStorage:', messageIDs);
        return messageIDs;
      }
    } catch (error) {
      console.error('Error loading Message IDs from AsyncStorage:', error);
    }
    return await fetchMessages(); // Fallback to fetching if no saved data
  };
  
   
  // message fetch
  const fetchMessagelist = async () => {
    setLoading(true); // Start loading
    const productIds = await loadMessageIDs(); // Await loaded or fetched message IDs
  
    if (!productIds || productIds.length === 0) {
      console.log('Fetched productIds is empty, skipping fetchMessagelist');
      setLoading(false); // End loading
      return;
    }
  
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        setLoading(false); // End loading
        return;
      }
  
      const fetchMessagesForProduct = async (productId) => {
        const response = await axios.get('http://10.0.2.2:8000/api/messageslist', {
          params: { productId },
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
  
        if (!response.data || response.data.length === 0) {
          // console.warn('Received empty data for productId', productId);
          return [];
        }
  
        // console.log('Received data for productId', productId, ':', JSON.stringify(response.data, null, 2));
  
        return response.data.map(session => ({
          productId: productId,
          sessions: session.sessions,
          first: session.first,
          latest: session.latest,
        }));
      };
  
      const allMessagesByProduct = {};
      for (const productId of productIds) {
        if (!productId) {
          console.warn('Empty productId found, skipping...');
          continue;
        }
        // console.log('Processing productId:', productId); // Log each productId
        const messages = await fetchMessagesForProduct(productId);
        if (messages.length) {
          if (!allMessagesByProduct[productId]) {
            allMessagesByProduct[productId] = [];
          }
          messages.forEach(message => {
            allMessagesByProduct[productId].push(message);
          });
        }
      }
  
      // console.log('All messages by product:', JSON.stringify(allMessagesByProduct, null, 2)); // Log allMessagesByProduct

      const sessionCounts = Object.keys(allMessagesByProduct).reduce((acc, productId) => {
        acc[productId] = Object.keys(allMessagesByProduct[productId]).length;
        return acc;
      }, {});
      setSessionCounts(sessionCounts);
      // console.log('Session counts:', sessionCounts);
      setMessageList(allMessagesByProduct);
      await updateMessagesInStorage(productIds, allMessagesByProduct); // Ensure this awaits for completion
      setLoading(false); // End loading
    } catch (error) {
      console.error('Error fetching messages:', error);
      setLoading(false); // End loading
      Alert.alert('Error', 'Could not fetch messages.');
    }
  };

  const updateMessagesInStorage = async (productIds, newMessages) => {
    try {
      const storageKey = `messages_${productIds.join('_')}`;
      const existingMessages = await AsyncStorage.getItem(storageKey);
      let currentMessages = existingMessages ? JSON.parse(existingMessages) : [];
  
      // Ensure currentMessages is an array
      if (!Array.isArray(currentMessages)) {
        currentMessages = [];
      }
  
      const allNewMessages = Object.values(newMessages).flat();
  
      // Create a map for current messages
      const messageMap = new Map(currentMessages.map(msg => [msg.id, msg]));
  
      // Add new messages to the map
      allNewMessages.forEach(msg => messageMap.set(msg.id, msg));
  
      // Create a new array from the map values
      const combinedMessages = Array.from(messageMap.values());
  
      // Save updated messages to AsyncStorage
      await AsyncStorage.setItem(storageKey, JSON.stringify(combinedMessages));
  
      console.log('AsyncStorage updated with new messages.');
    } catch (error) {
      console.error('Failed to update AsyncStorage:', error);
    }
  };
  

  const handlemessagereceive = (message) => {
    if (!message || !message.sender || !message.sender.id) {
      console.error('First message data is missing or invalid:', message);
      return;
    }
  
    const paramsToSend = {
      productId: message.product_id,
      senderId: message.sender.id,
      receiverId: message.receiver_id,
      sessions: message.sessions
    };
  
    // console.log('Params to send:', paramsToSend);
  
    setModalVisible(false);
    router.push({
      pathname: '/messagereceiver',
      params: paramsToSend
    });
  };  

  const handleViewDetails = (product) => {
    navigation.navigate('ProductDetails', { product: JSON.stringify(product) });
  };

  const handleDelete = async (productId: any) => {
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
                `http://10.0.2.2:8000/api/products/${productId}/live`,
                { live: false },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                }
              );

              console.log('Product deleted', productId);
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

  const onRefreshProducts = async () => {
    setIsRefreshing(true);
    await fetchProducts();
    setIsRefreshing(false);
  };

  const fetchData = async () => {
    console.log('Fetching data...');
    await fetchProducts();
    await fetchMessages();
    await fetchMessagelist();
  
    // const productIds = messageID;
    // if (!productIds || productIds.length === 0) {
    //   console.log('productIds is empty, retrying...');
    //   await onRefreshMessages();
    // }
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

  
  const onRefreshMessages = async () => {
    setIsRefreshingMessages(true);
    await fetchData();
    setIsRefreshingMessages(false);
  };

  const sortedpost = products.sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return dateB - dateA; // Sort in descending order
  });

  const sortedData = messages.sort((a, b) => {
    const aCount = sessionCounts[a.id] || 0;
    const bCount = sessionCounts[b.id] || 0;
    return bCount - aCount; // Sort in descending order
  });
  
  

  return (
    <View style={styles.container}>
      {/* Product List */}
      <View style={styles.transactionsContainer}>
        <View style={styles.poster}>
          <Text style={styles.label}>Transactions:</Text>
          <Text style={styles.totalProducts}>Total Post: {products.length}</Text>
        </View>
        <FlatList
          data={sortedpost}
          renderItem={({ item }) => (
            <ProductItem item={item} handleViewDetails={handleViewDetails} handleDelete={handleDelete} />
          )}
          keyExtractor={(item) => item.id.toString()}
          extraData={products}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefreshProducts} />
          }
          ListEmptyComponent={<Text style={styles.placeholderText}>No Posted Product yet...</Text>}
        />
      </View>

      {/* Message List */}
      <View style={styles.transactionsContainer}>
        <View style={styles.poster}>
          <Text style={styles.label}>Item Messages:</Text>
        </View>
        <>
            {loading ? (
              <Text style={styles.loadingstate}>Loading...</Text> // Show a loading indicator or placeholder
            ) : (
              <FlatList
                data={sortedData}
                renderItem={({ item }) => {
                  const sessionCount = sessionCounts[item.id] || 0;
                  return (
                    <RenderProductMessages 
                      item={item} 
                      handleViewMessage={handleViewMessage} 
                      sessionCount={sessionCount} // Pass the correct session count
                    />
                  );
                }}
                keyExtractor={(item) => item.id.toString()}
                extraData={messages}
                refreshControl={
                  <RefreshControl refreshing={isRefreshingMessages} onRefresh={onRefreshMessages} />
                }
                ListEmptyComponent={<Text style={styles.placeholderText}>No Messages yet...</Text>}
              />
            )}
          </>
      </View>
      <Modal
  animationType="slide"
  transparent={true}
  visible={modalVisible}
  onRequestClose={() => setModalVisible(false)}
>
  <SafeAreaView style={styles.modalOverlay}>
    <View style={styles.modalView}>
       <View style={styles.messageheader}>
        <Text style={styles.headerText}>Your Product Messages</Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
        </View>

      {loading ? (
        <Text style={styles.loadingstate}>Loading...</Text>
      ) : selectedMessages && selectedMessages.length === 0 ? (
        <View style={styles.noMessageContainer}>
          <Text style={styles.noMessageText}>No messages yet</Text>
        </View>
      ) : (
        <FlatList
          data={selectedMessages}
          keyExtractor={(item) => item.first.id.toString()}  
          renderItem={renderMessage}
        />
      )}
    </View>
  </SafeAreaView>
</Modal>
    </View>
  );
};

export default Recents;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  transactionsContainer: {
    marginBottom: 20,
    height: 318,
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
    paddingLeft: 40,
    borderBottomWidth: 1, // Optional: Add border for separation
    borderBottomColor: '#ccc', 
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalButtonContainer: {
    // Move button to the right
   marginTop: 10,
   marginBottom: 10,
   paddingLeft: 30,
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
    width: '80%',            // Adjust width according to your needs
    minWidth: 331,           // Ensure it doesn't shrink too much
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

