import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Image, Modal, FlatList, RefreshControl, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation,  useFocusEffect  } from '@react-navigation/native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import CustomAlert from '../../components/customeAlert';

import { icons } from "../../constants";
import { router } from 'expo-router';

const screenWidth = Dimensions.get('window').width;

interface Barangay {
  code: string;
  name: string;
}

interface User {
  id: number;
  firstname: string;
  lastname: string;
  phonenumber: string;
  address: string;
}

interface MessageGroup {
  id: string;
  first: {
    product_id: any;
    sender_id: any;
    receiver_id: any;
    sessions: any;
    sender: any;
    receiver: any;
    product: any;
    created_at: string;
  };
  latest: {
    updated_at: string;
    id: string;
    sender_id: string;
    isRead: boolean;
  };
  isRead: boolean;
  // Add other properties as needed
}



const UserDetailsScreen = () => {
    const [isSubmitting, setSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();
    const [Firstname, setFirstname] = useState('');
    const [Lastname, setLastname] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [currentUser, setCurrentUser] = useState<User | null>(null); 
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [messageList, setMessageList] = useState<MessageGroup[]>([]);
    const [totalmessage, setTotalmessage] = useState(0);
    const [showAlert, setShowAlert] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [clickedItems, setClickedItems] = useState(new Set());
    const [newMessages, setNewMessages] = useState<string[]>([]);
    const [readStates, setReadStates] = useState(
      messageList.map(() => false) // Initialize read states for each notification
    );
  
    const [forceRender, setForceRender] = useState(false); 
    const [Barangays, setBarangays] = useState<Barangay[]>([]);
    const [selectedMunicipality, setSelectedMunicipality] = useState<string>('160202000');
    const [selectedBarangay, setSelectedBarangay] = useState<string>('');
    const [barangayLookup, setBarangayLookup] = useState<{ [key: string]: string }>({});

      // Fetch barangays based on the municipality code
      useEffect(() => {
        const fetchBarangays = async (municipalityCode: string) => {
          try {
            const cachedBarangays = await AsyncStorage.getItem(`barangays_${municipalityCode}`);
            if (cachedBarangays) {
              const barangays = JSON.parse(cachedBarangays);
              setBarangays(barangays);
              setBarangayLookup(createBarangayLookup(barangays));
              // console.log('Barangays loaded from cache');
            } else {
              const response = await fetch(`https://psgc.gitlab.io/api/cities-municipalities/${municipalityCode}/barangays`);
              const data: Barangay[] = await response.json();
              setBarangays(data.sort((a, b) => a.name.localeCompare(b.name)));
              await AsyncStorage.setItem(`barangays_${municipalityCode}`, JSON.stringify(data));
              setBarangayLookup(createBarangayLookup(data));
              // console.log('Barangays fetched from API and cached');
            }
          } catch (error) {
            console.error('Error fetching barangays:', error);
          }
        };
    
        fetchBarangays(selectedMunicipality);
      }, [selectedMunicipality]);
    
      // Create barangay lookup
      const createBarangayLookup = (barangays: Barangay[]) => {
        return barangays.reduce((acc, curr) => {
          acc[curr.code] = curr.name;
          return acc;
        }, {} as { [key: string]: string });
      };

  
const handleLogout = () => {
  Alert.alert(
    'Confirm LOGOUT',
    'Are you sure you want to logout?',
    [
      {
        text: 'Cancel',
        onPress: () => console.log('Logout cancelled'),
        style: 'cancel',
      },
      {
        text: 'Yes',
        onPress: async () => {
          console.log('User logged out');

          try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
              console.error('No auth token found');
              return;
            }

            console.log('Token:', token);

            const response = await axios.post('http://192.168.31.160:8000/api/logout', {}, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            await AsyncStorage.removeItem('authToken');

            // @ts-ignore
            navigation.navigate('(auth)/login');

            // console.log('Logout successful');
          } catch (error) {
            if (axios.isAxiosError(error)) {
              console.error('Error response data:', error.response?.data);
            } else {
              console.error('Unexpected error:', error);
            }
            Alert.alert('Error', 'Failed to update user details.');
          }
        },
      },
    ],
    { cancelable: false }
  );
};

// normalize data for a more dynamic variable sync
const normalizeKeys = (obj: { [key: string]: any }): { [key: string]: any } => {
  const normalizedObj: { [key: string]: any } = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      normalizedObj[key.toLowerCase()] = obj[key];
    }
  }
  return normalizedObj;
};

// fetch userinfo from the asyncstorage
useEffect(() => {
  const fetchUserInfo = async () => {
    try {
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (userInfo) {
        const parsedUser = JSON.parse(userInfo); // Assuming userInfo is a valid JSON string
        const normalizedUser = normalizeKeys(parsedUser); // Normalize keys

        setCurrentUser(normalizedUser as User);

        const userId = Number(normalizedUser.id);
        if (!isNaN(userId)) {
          setCurrentUserId(userId);
        } else {
          console.error('Invalid user ID:', normalizedUser.id);
        }
        // console.log('Fetched profileUser:', normalizedUser);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      Alert.alert('Error', 'Could not fetch user info.');
    }
  };
  fetchUserInfo();
}, [forceRender]);

 // Preset form fields with fetched user data  //having when new user is logged in 
 useEffect(() => {
  // console.log('normalize', currentUser)
  if (currentUser) {
    setFirstname(currentUser.firstname || '');
    setLastname(currentUser.lastname || '');
    
    // Remove +63 prefix if present
    const phoneNumberWithoutPrefix = currentUser.phonenumber?.startsWith('+63')
      ? currentUser.phonenumber.slice(3)
      : currentUser.phonenumber || '';
      
    setPhoneNumber(phoneNumberWithoutPrefix);
    setAddress(currentUser.address || '');

    // console.log('Current user:', currentUser);
    // console.log('Barangay Lookup:', barangayLookup);

    const barangayName = currentUser.address || '';
    const barangayCode = Object.keys(barangayLookup).find(key => barangayLookup[key] === barangayName);

    // console.log('Mapping address to barangay code:', barangayName, barangayCode);
    setSelectedBarangay(barangayCode || '');
    // console.log('Selected barangay code set to:', barangayCode);
  }
}, [currentUser, barangayLookup]);



  // Update user details
  const handleSave = async () => {
    // console.log('User details:', { Firstname, Lastname, phoneNumber, address });  
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }

    const formattedPhonenumber = phoneNumber.startsWith("+63")
  ? phoneNumber
  : `+63${phoneNumber}`;

   // Check if the phone number already exists
   const checkResponse = await axios.get('http://192.168.31.160:8000/api/check-phone', {
    params: { Phonenumber: formattedPhonenumber, currentUserId },
    headers: { 'Content-Type': 'application/json' },
  });

  if (checkResponse.data.exists) {
    Alert.alert("Error", "Phone number already exists.");
    setIsLoading(false);
    setSubmitting(false);
    return;
  }
  
  const address = barangayLookup[selectedBarangay];

  console.log('sending to vefiry')
      router.push({
        pathname: '/verifyupdateuser',
        params: {
        currentUserId,
        Firstname,
        Lastname,
        Phonenumber: formattedPhonenumber,
        address,
        },
      });        
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response && error.response.status === 409) {
          Alert.alert('Error', 'Use Your Own Phonenumber .');
        } else {
          console.error('An error occurred:', error);
          Alert.alert('Error', 'An error occurred while updating the user.');
        }
      } else {
        console.error('Unexpected error:', error);
        Alert.alert('Error', 'An unexpected error occurred.');
      }
    }
  };  


  // the message function start here 
  // function to send user if user is person who creator open modal if not send user to message
  const handlemessage = (first: { product_id: any; sender_id: any; receiver_id: any; sessions: any; }, latest: { id: string } | undefined) => {
    if (latest) {
      if (latest && typeof latest === 'object' && 'id' in latest) {
        setClickedItems((prev) => new Set(prev).add(latest?.id));
      }
    }
    const params = {
      productId: first.product_id, // Use product_id from the first data
      senderId: first.sender_id,
      receiverId: first.receiver_id,
      sessions: first.sessions
    };
  
    if (currentUserId === first.sender_id) {
      router.push({
        pathname: '/message/messagesender',
        params: {
          productId: first.product_id,
          productuserId: first.receiver_id, // Assuming the receiver is the product user
        },
      });
    } else {
      // console.log('Navigating to messagereceiver with params:', params);
      router.push({
        pathname: '/message/messagereceiver',
        params: params,
      });
    }
    setModalVisible(false); // Close the modal after routing
  };
  
  // function for message list
  const formatTime = (datetime: string | number | Date) => {
    const date = new Date(datetime);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  // Determine if there are any unread notifications
  const hasUnreadNotifications = readStates.includes(false);

  // Determine the icon source based on read states
  const iconSource = hasUnreadNotifications ? icons.contactnoti : icons.contact;
  // fix the issue in where icons are not showing properly if readstate is false

  const renderMessage = ({ item, index }: { item: MessageGroup, index: number }) => {
    const { first, latest } = item;
    const isRead = readStates[index] || (Number(latest?.sender_id) === currentUserId); // Mark as read if sender is the current user
    const uri = `http://192.168.31.160:8000/storage/product/images/${first.product.image}`;

      let firstObj;
  
    try {
      if (first) {
        if (typeof first === 'string') {
          // console.log('JSON String:', first); // Log the JSON string
          firstObj = JSON.parse(first);
        } else {
          // console.log('Object:', first); // Log the object
          firstObj = first;
        }
      } else {
        firstObj = undefined;
      }
    } catch (error) {
      console.error('JSON Parse error:', error);
      firstObj = undefined;
    }

  const notificationBackgroundColor = (Number(latest?.sender_id) === currentUserId) ||latest.isRead ? '#ffffff' : '#e6f7ff'; // Light blue for unread notifications

  const handleNotificationClick = async (index: number) => {
      const newReadStates = [...readStates];
    newReadStates[index] = true; // Mark the notification as read
    setReadStates(newReadStates);
    console.log('Updated readStates:', newReadStates);
    first && handlemessage(typeof first === 'string' ? JSON.parse(first) 
      : first, latest && typeof latest === 'object' && 'id' in latest ? latest : undefined);

       // Check if the notification's sender ID matches the current user ID
  if (Number(latest?.sender_id) === currentUserId) {
    console.log('No need to mark as read for the current user\'s own message');
    return;
  }
    // Send request to mark notification as read
  try {
    const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }
      console.log('Marking as read:', latest.id);
      const messageId = latest.id;

      const response = await axios.post(
        `http://192.168.31.160:8000/api/message/${messageId}/mark-read`,
        {}, // Empty object for data since this is a POST without a body
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

    const data = await response.data;
    if (!data.success) {
      console.error('Failed to mark as read:', data.message);
    }
  } catch (error) {
    console.error('Error marking as read:', error);
  }
  };

    // Check if the sender_id matches the currentUserId
  if (!firstObj || firstObj.sender_id !== currentUserId) {
    return null; // Don't render this message if the sender_id doesn't match
  } 
    const sender = firstObj ? normalizeKeys(firstObj.sender) : undefined;
    const receiver = firstObj ? normalizeKeys(firstObj.receiver) : undefined;
  
    // Check if the sender ID matches the current user ID and append "You send" or "You receive" accordingly
    const displayName = `${receiver?.firstname || 'Unknown'} ${receiver?.lastname || ''}${
      (Number(latest?.sender_id) === currentUserId) || latest?.isRead ? '' : ' - 📥'
    }`;    
    
    // to display the message sender and receiver for debugging only
    // const displayName = firstObj && firstObj.sender_id === currentUserId
    //   ? `${receiver?.firstname || 'Unknown'} ${receiver?.lastname || ''} -📤`
    //   : `${sender?.firstname || 'Unknown'} ${sender?.lastname || ''} - 📥`;
  
    // Function to check if text is an image URL
    const isImageUrl = (text: string) => {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff'];
      return imageExtensions.some(ext => text.toLowerCase().endsWith(ext));
    };
    
    return (
      <TouchableOpacity 
        onPress={() => handleNotificationClick(index)}
        style={[styles.messageContainer, { backgroundColor: notificationBackgroundColor }]}
      >
          <View style={styles.textContainer}>
            <Text style={styles.senderName}>
              {displayName || 'Unknown'}
            </Text>
            <View style={styles.messageRow}>
            <Text style={styles.usermessageText} numberOfLines={1}>
              {isImageUrl((latest as any)?.text ?? '') ? 'Image' : ((latest as any)?.text || 'No message content')}
            </Text>
              <Text style={styles.messageTime}>
                {latest && 'created_at' in latest ? formatTime((latest as { created_at: string }).created_at) : 'No message content'}
              </Text>
            </View>
          </View>
          <Image
            source={{ uri }}  // Use the uri for the image
            style={styles.messageImage} // Styling the image
            onError={() => console.error('Error loading image')}
          />
      </TouchableOpacity>
    );
  };

  const userMessagesCount = messageList.filter((item) => {
    const firstObj = typeof item.first === 'string' ? JSON.parse(item.first) : item.first;
    return firstObj?.sender_id === currentUserId;
  }).length;

  useEffect(() => {
    const loadAndFetchMessages = async () => {
      await loadMessagesFromStorage();
      
      // Wait until currentUserId is populated
      if (currentUserId !== null) {
        await fetchMessages(); // Fetch from server to update messages
      }
    };
  
    loadAndFetchMessages();
  }, [currentUserId]);
  
  const reloadScreen = () => {
    onRefresh();
    console.log('Screen reloaded!');
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
  
    // Wait until currentUserId is populated
    if (currentUserId !== null) {
      await fetchMessages();
    }
  
    setRefreshing(false);
  };
  
  
  useFocusEffect(
    useCallback(() => {
      reloadScreen();
    }, [])
  );
  


  const loadMessagesFromStorage = async () => {
    try {
      const storedMessages = await AsyncStorage.getItem(`messages_${currentUserId}`);
      if (storedMessages) {
        setMessageList(JSON.parse(storedMessages));
      }
    } catch (error) {
      console.error('Error loading messages from storage:', error);
    }
    setLoading(false); // Set loading to false after attempting to load from storage
  };

  // the function to fetch messages created by user 
  const fetchMessages = async () => {
    const userId = currentUserId; //use current logged in user as parameter
    console.log('currentUserId:', currentUserId);
    console.log('userId:', userId);

    if (userId === 0 || userId === null) {
      console.error('User not authenticated or userId is null. Reloading page...');
      window.location.reload(); // Reload the page if currentUser is empty or userId is null
      return;
    }
    
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }
  
      const response = await axios.get('http://192.168.31.160:8000/api/messageslistUser', {
        params: { userId },
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      
      // Ensure the response data is an array
      const responseData = Array.isArray(response.data) ? response.data : [response.data];
      
      // Check for a 404 response or empty data
      if (responseData.length === 0) {
        // No messages found, do nothing or handle accordingly
        await AsyncStorage.removeItem(`messages_${userId}`);
        return; // Do nothing further
      }
      
      // Validate the data format
      const isValidData = responseData.every(item => item.first && item.latest);
      if (!isValidData) {
        console.error('Invalid data format:', response.data);
        return;
      }
      
      // Proceed with processing responseData
  
      const groupedMessages = responseData.reduce((acc, message) => {   //group message first and latest messages by sessions
        const { sessions } = message.first;
        if (!acc[sessions]) {
          acc[sessions] = { first: message.first, latest: message.latest };
        } else {
          if (new Date(message.first.created_at) < new Date(acc[sessions].first.created_at)) {
            acc[sessions].first = message.first;
          }
          if (new Date(message.latest.updated_at) > new Date(acc[sessions].latest.updated_at)) {
            acc[sessions].latest = message.latest;
          }
        }
        return acc;
      }, {});
  
      let groupedMessagesArray: MessageGroup[] = Object.keys(groupedMessages).map(session => groupedMessages[session]);

      // Sort by latest message date
      groupedMessagesArray.sort((a, b) => {
        return new Date(b.latest.updated_at).getTime() - new Date(a.latest.updated_at).getTime();
      });
  
      // console.log('Grouped messages:', groupedMessages);
      // console.log('Grouped messages array:', groupedMessagesArray);
  
      setMessageList(groupedMessagesArray);
      setTotalmessage(groupedMessagesArray.length);
      console.log('Before updating storage, userId:', userId);
      if (userId !== null) {
        updateUserMessagesInStorage(userId, groupedMessagesArray);
      } else {
        console.error('User ID is null, cannot update messages in storage.');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
  
      if (axios.isAxiosError(error) && error.response) {
          // Server responded with a status code outside the range of 2xx
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
          console.error('Response headers:', error.response.headers);
  
          // Customize alerts based on specific status codes
          switch (error.response.status) {
              case 404:
                  Alert.alert('Error', 'Messages not found.');
                  break;
              case 401:
                  Alert.alert('Error', 'Unauthorized access. Please log in again.');
                  break;
              case 500:
                  Alert.alert('Error', 'Internal server error. Please try again later.');
                  break;
              default:
                  Alert.alert('Error', 'Failed to fetch messages. Please try again.');
                  break;
          }
      } else if (axios.isAxiosError(error) && error.request) {
          // Request was made but no response was received
          console.error('Request data:', error.request);
          Alert.alert('Error', 'Network error. Please check your connection.');
      } else {
          // Something else happened in making the request
          if (error instanceof Error) {
            console.error('Error message:', error.message);
          } else {
            console.error('Unexpected error:', error);
          }
          Alert.alert('Error', 'An unexpected error occurred.');
      }
  } finally {
      setLoading(false);
    }
  };

  const updateUserMessagesInStorage = async (userId: number, newMessages: MessageGroup[]) => {
    try {
      const storageKey = `messages_${userId}`;
      const existingMessages = await AsyncStorage.getItem(storageKey);
      let currentMessages = existingMessages ? JSON.parse(existingMessages) : [];
  
      // Ensure currentMessages is an array
      if (!Array.isArray(currentMessages)) {
        currentMessages = [];
      }
  
      // Create a map for current messages
      const messageMap = new Map(currentMessages.map((msg: MessageGroup) => [msg.id, msg]));
  
      // Add new messages to the map, logging new additions
      newMessages.forEach(msg => {
        if (!messageMap.has(msg.id)) {
          console.log(`New message added: ${msg.id}`);
        }
        messageMap.set(msg.id, msg);
      });
  
      // Create a new array from the map values
      const combinedMessages = Array.from(messageMap.values());
  
      // Save updated messages to AsyncStorage
      await AsyncStorage.setItem(storageKey, JSON.stringify(combinedMessages));
  
      console.log('AsyncStorage updated with new messages.');
    } catch (error) {
      console.error('Failed to update AsyncStorage:', error);
    }
  };

  return (
        <ScrollView style={styles.scrollview}>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.GoButton}
            onPress={() => {
              router.navigate("/sell");
              // navigation.goBack();
            }}
          >
            <Text style={styles.saveText}>
              <Image
                source={icons.leftArrow}
                style={styles.icon}
                resizeMode="contain"
              />
              Go Back
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => {
              setModalVisible(true);
              fetchMessages(); // Re-run the fetch every time button is clicked
            }}
          >
            <Text style={styles.messageText}>
              <Image
                source={iconSource}
                style={styles.icon}
                resizeMode="contain"
              />
              Messages
            </Text>
          </TouchableOpacity>
        </View>

        {/* this is the message modal  */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <View style={styles.messageheader}>
                <Text style={styles.headerText}> 
                  You have`
                  {/* {totalmessage > 0 ? totalmessage : ''}`  */}
                  {userMessagesCount > 0 ? userMessagesCount : 'No'}
                  <Image 
                    source={icons.contact} 
                    style={styles.icon}
                    resizeMode="contain" // Ensure the image fits within the circular container
                    //show the message count you have created so far if there are none it is hidden
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
                      data={messageList as MessageGroup[]}
                      keyExtractor={(item, index) => {
                        const key = item.latest && item.latest.id ? `key-${item.latest.id}` : `key-${index}`;
                        return key;
                      }}                 
                      renderItem={renderMessage}
                      refreshControl={
                        <RefreshControl
                          refreshing={refreshing}
                          onRefresh={onRefresh}
                        />
                      }
                      contentContainerStyle={styles.scrollViewContent}
                    />
                  )
                )}
                  {/* content here messages */}
            </View>
          </View>
        </Modal>

        <View style={styles.form}>
      <Text style={styles.label}>First Name:</Text>
      <TextInput
        style={styles.input}
        value={Firstname}
        onChangeText={setFirstname}
        placeholder="Enter your first name"
      />
      <Text style={styles.label}>Last Name:</Text>
      <TextInput
        style={styles.input}
        value={Lastname}
        onChangeText={setLastname}
        placeholder="Enter your last name"
      />
      <Text style={styles.label}>Phone Number:</Text>
      <View style={styles.numbercontainer}>
        <View style={styles.countryCodeContainer}>
          <TextInput
            style={styles.countryCode}
            editable={false} // Non-editable field for the country code
            value="+63" // Display the country code
          />
        </View>

        <TextInput
          style={styles.numberinput}
          value={phoneNumber}
          onChangeText={(e) => {
            // Remove all non-numeric characters
            let numericValue = e.replace(/[^0-9]/g, '');

            if (numericValue.startsWith('0') && numericValue.length > 1) {
              numericValue = numericValue.slice(1);
            }

            // Check that the cleaned number now starts with '9'
            if (numericValue.length > 0 && numericValue[0] !== '9') {
              return; // Discard input if it doesn't start with '9'
            }

            setPhoneNumber(numericValue);
          }}
          maxLength={10}
          keyboardType="numeric"
          placeholder="912345678" // Adjust the placeholder
          placeholderTextColor="#888"
        />
      </View>


      <Text style={styles.label}>Address:</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedBarangay}
          onValueChange={(itemValue) => setSelectedBarangay(itemValue)}
          style={styles.picker}
        >
           {Object.entries(barangayLookup)
        .sort((a, b) => a[1].localeCompare(b[1])) // Sort alphabetically by name
        .map(([code, name]) => (
          <Picker.Item key={code} label={name} value={code} style={{ fontSize: 19 }} />
        ))}
        </Picker>
      </View>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>SAVE DETAILS</Text>
          {showAlert && (
        <CustomAlert
          message="User Details Updated"
          duration={3000}
          onDismiss={() => setShowAlert(false)}
        />
      )}
        </TouchableOpacity>
        
      </View>
      <View>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
        {showAlert && (
        <CustomAlert
          message="You Have been Logged Out"
          duration={3000}
          onDismiss={() => setShowAlert(false)}/>)}
      </TouchableOpacity>
      <View style={styles.footercontainer}> 
        <Text style={styles.footerText}>Created By: Brix Jay A. Nucos BSIS</Text> 
        </View>
      </View>
    </ScrollView>
  );
};
export default UserDetailsScreen;

const styles = StyleSheet.create({
  scrollview: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginTop: 10,
  },
  footercontainer: { 
    flex: 1, 
    justifyContent: 'flex-end', 
    alignItems: 'center', 
    paddingBottom: 20, // Adjust padding as needed 
    }, 
  footerText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
  },
  form: {
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  numbercontainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    overflow: 'hidden', // Ensure the border wraps around both inputs
    backgroundColor: '#f5f5f5',
    height: 50, // Set a fixed height to avoid layout issues
  },
  
  countryCodeContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0, // Make it stretch to the full height
    backgroundColor: '#f5f5f5', // Match the background color of the input
    justifyContent: 'center', // Vertically center the country code text
    paddingHorizontal: 10, // Add padding to ensure the text is not too close to the edge
  },
  
  countryCode: {
    fontSize: 19,
    textAlign: 'center',
    color: '#1F1F1F', // Black text color
    width: 40, // Width for the country code container
  },
  
  numberinput: {
    flex: 1,
    padding: 10,
    paddingLeft: 50, // Add padding to prevent text from overlapping the country code
    fontSize: 19,
    height: '100%', // Ensure the input takes full height
  },  
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
    fontSize: 19,
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#bdc8d6', // Border color for the container
    borderRadius: 5, // Rounded corners for the container
    backgroundColor: '#f5f5f5', // White background for picker
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 55,
    fontSize: 25,
    overflow: 'visible', // Ensures text stays within bounds and is visible if it overflows
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    paddingTop: 20,
    marginTop: 10,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#dc3545', 
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  
  buttonContainer: {
    flexDirection: 'row', // Arrange items in a row
    justifyContent: 'space-between', // Evenly space out the buttons
    alignItems: 'center', // Center items vertically
    width: '100%', // Ensure buttons take full width of the parent container
  },

    GoButton: {
      backgroundColor: '#28a745',
      paddingVertical: 12, // Ensure consistent height with padding
      paddingHorizontal: 15, // Add horizontal padding to make the button's width adjustable
      borderRadius: 20,
      marginTop: 5,
      alignItems: 'center',

      width: '45%', // Set fixed width or auto based on content
      height: 50, // Fixed height for consistency
    },
    messageButton: {
      backgroundColor: '#28a745',
      paddingVertical: 12, // Match the height of GoButton
      paddingHorizontal: 15,
      borderRadius: 20,
      marginTop: 5,
      marginLeft: 5, // Add a little space between the two buttons
      alignItems: 'center',
      width: '45%', // Set fixed width or auto based on content
      height: 50, // Fixed height for consistency
    },
    icon: {
      width: 24, // Adjust width as needed
      height: 24, // Adjust height as needed
    },
    messageText: {
      color: 'white', // Ensure text is white
      fontSize: 16,
      fontWeight: 'bold', // Ensure text stands out
    },
    saveText: {
      color: 'white', // Ensure text is white
      fontSize: 16,
      fontWeight: 'bold', // Ensure text stands out
    },  
  
  loadingstate: {
    justifyContent: 'center',
    alignSelf: 'center',
    paddingTop: 100,
  },
  // this is the modal style
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    width: '100%',
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
  nomessage: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
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

  // this is the message styles
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  messageContainer: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    width: '100%',                // Full width of the parent container
    backgroundColor: '#ECECEC',
    flexDirection: 'row',         // Row-oriented for text and image
    alignItems: 'center',         // Vertically align items
    justifyContent: 'space-between', // Space items evenly across the row
  },  

  textContainer: {
    flex: 1, // This ensures the text group takes up the remaining space
    paddingRight: 10, // Add some padding to the right side
    // height: 100, // Ensure the text group takes up the full height
  },
  noMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageRow: {
    flexDirection: 'row',  // Align items horizontally for the message and time
    alignItems: 'center',  // Align items vertically in the center
  },
  senderName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#0078FF', // Messenger-style blue color
    marginBottom: 5,
  },
  usermessageText: {
    fontSize: 15,
    color: '#000', // Black text for contrast
    backgroundColor: '#f1f1f1', // Light grey background
    padding: 5,
    borderRadius: 10,
    overflow: 'hidden', // Ensure text fits well
    maxWidth: '80%', // Limit message width
    alignSelf: 'flex-start', // Align left like a chat bubble
  },
  messageTime: {
    fontSize: 12,
    color: '#666', // Lighter gray for timestamp
    paddingLeft: 10,
  },
  messageImage: {
    width: 80,           // Fixed width for the image
    height: '100%',      // Image will stretch to match the height of the container
    marginLeft: 10,      // Space between text and image
    alignSelf: 'stretch', // Stretch the image vertically to match the text height
  },
  noMessageText: {
    fontSize: 18,
    color: '#888',  // A subtle gray color
    fontWeight: 'bold',
  },
  warningText: {
    color: '#FF0000', // Red color for warning
    fontWeight: 'bold',
  },
  
});

