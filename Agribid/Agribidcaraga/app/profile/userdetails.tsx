import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Image, Modal, FlatList, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation,  useFocusEffect  } from '@react-navigation/native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import CustomAlert from '../../components/customeAlert';

import { icons } from "../../constants";
import { router } from 'expo-router';

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

interface Message {
  id: string;
  text: string;
  sender_id: string;
  receiver_id: string;
  sender: string;
  first?: string;
  latest?: string;
  // Add other properties as needed
}

interface MessageGroup {
  latest: { updated_at: string };
  // Add other properties as needed
}



const UserDetailsScreen = () => {
    const navigation = useNavigation();
    const [Firstname, setFirstname] = useState('');
    const [Lastname, setLastname] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');
    const [currentUser, setCurrentUser] = useState<User | null>(null); 
    const [currentUserId, setCurrentUserId] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [messageList, setMessageList] = useState<MessageGroup[]>([]);
    const [totalmessage, setTotalmessage] = useState(0);
    const [showAlert, setShowAlert] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [clickedItems, setClickedItems] = useState(new Set());
    const [newMessages, setNewMessages] = useState([]);
  
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

            const response = await axios.post('http://10.0.2.2:8000/api/logout', {}, {
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

        setCurrentUser(normalizedUser);

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
    setPhoneNumber(currentUser.phonenumber || '');
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

    const address = barangayLookup[selectedBarangay];
  
      const response = await axios.put(`http://10.0.2.2:8000/api/users/${currentUserId}`, {
        Firstname,
        Lastname,
        phoneNumber,
        address,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      let updatedUser = response.data.user;
  
      // Normalize the keys to match what is stored in AsyncStorage
      updatedUser = {
        ...updatedUser,
        address: updatedUser.address,
        phonenumber: updatedUser.phonenumber,
      };
  
      // console.log('User details updated:', updatedUser);
      // Alert.alert('Success', 'User details updated successfully!');
      setShowAlert(true);
      setTimeout(() => {
        setShowAlert(false);
      }, 3000);
  
      // Set the state directly with updated user
      setCurrentUser(updatedUser);
  
      // Also update AsyncStorage for consistency
      await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUser));
  
      // Reload the page to reflect updates
      setForceRender(prev => !prev);
  
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error response data:', error.response?.data);
      } else {
        console.error('Unexpected error:', error);
      }
      Alert.alert('Error', 'Failed to update user details.');
    }
  };  


  // the message function start here 
  // function to send user if user is person who creator open modal if not send user to message
  const handlemessage = (first: { product_id: any; sender_id: any; receiver_id: any; sessions: any; }, latest: string | undefined) => {
    setClickedItems((prev) => new Set(prev).add(latest.Id));
    const params = {
      productId: first.product_id, // Use product_id from the first data
      senderId: first.sender_id,
      receiverId: first.receiver_id,
      sessions: first.sessions
    };
  
    if (currentUserId === first.sender_id) {
      router.push({
        pathname: '/messagesender',
        params: {
          productId: first.product_id,
          productuserId: first.receiver_id, // Assuming the receiver is the product user
        },
      });
    } else {
      // console.log('Navigating to messagereceiver with params:', params);
      router.push({
        pathname: '/messagereceiver',
        params: params,
      });
    }
    setModalVisible(false); // Close the modal after routing
  };

  const checkNewMessages = (latestMessageId) => {
    // Ensure latestMessageId is defined and newMessages contains the ID
    return latestMessageId && newMessages.includes(latestMessageId) && !clickedItems.has(latestMessageId);
  };
  
  
  // function for message list
  const formatTime = (datetime: string | number | Date) => {
    const date = new Date(datetime);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  const renderMessage = ({ item }: { item: Message }) => {
    const { first, latest } = item;
    const sender = first ? normalizeKeys(first.sender) : undefined;
    const receiver = first ?normalizeKeys(first.receiver) : undefined;
  
    // Check if the sender ID matches the current user ID and append "You send" or "You receive" accordingly
    const displayName = first.sender_id === currentUserId
      ? `${receiver.firstname || 'Unknown'} ${receiver.lastname || ''} -📤` 
      : `${sender.firstname || 'Unknown'} ${sender.lastname || ''} - 📥`;
  
    // Function to check if text is an image URL
    const isImageUrl = (text) => {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff'];
      return imageExtensions.some(ext => text.toLowerCase().endsWith(ext));
    };
  
    return (
      <TouchableOpacity onPress={() => handlemessage(first, latest)}>
        <View style={styles.messageContainer}>
          <Text style={styles.senderName}>
            {displayName || 'Unknown'}
          </Text>
          <View style={styles.messageRow}>
            <Text style={styles.usermessageText}>
              {isImageUrl(latest.text) ? 'Image' : (latest.text || 'No message content')}
            </Text>
            <Text style={styles.messageTime}>
              {latest.created_at ? formatTime(latest.created_at) : 'No message content'}
            </Text>
          </View>
          {checkNewMessages(latest.id) && <Text style={styles.warningText}>You have a 📩!</Text>}
        </View>
      </TouchableOpacity>
    );
  };
  


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
    // console.log('currenuserid', currentUser?.id, currentUserId)

    if (userId === 0) {
      // console.error('User not authenticated. Reloading page...');
      window.location.reload(); // Reload the page if currentUser is empty
      return;
    }
    
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }
  
      const response = await axios.get('http://10.0.2.2:8000/api/messageslistUser', {
        params: { userId },
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

       // Check for a 404 response
       if (response.data.length === 0) {
        // No messages found, do nothing or handle accordingly
        await AsyncStorage.removeItem(`messages_${userId}`);
        return; // Do nothing further
    }
       // Check if the response data is empty or not an array
    if (!Array.isArray(response.data)) {
      console.error('Data is not an array:', response.data);
      return;
    }
  
      const isValidData = response.data.every(item => item.first && item.latest); // validate the date first and latest if they are actual 
      if (!isValidData) {                                                         // the data expected throw and error if not
        console.error('Invalid data format:', response.data);
        return;
      }
  
      const groupedMessages = response.data.reduce((acc, message) => {   //group message first and latest messages by sessions
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
      updateUserMessagesInStorage(userId, groupedMessagesArray);
    } catch (error) {
      console.error('Error fetching messages:', error);
  
      if (error.response) {
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
      } else if (error.request) {
          // Request was made but no response was received
          console.error('Request data:', error.request);
          Alert.alert('Error', 'Network error. Please check your connection.');
      } else {
          // Something else happened in making the request
          console.error('Error message:', error.message);
          Alert.alert('Error', 'An unexpected error occurred.');
      }
  } finally {
      setLoading(false);
    }
  };

  const updateUserMessagesInStorage = async (userId, newMessages) => {
    try {
      const storageKey = `messages_${userId}`;
      const existingMessages = await AsyncStorage.getItem(storageKey);
      let currentMessages = existingMessages ? JSON.parse(existingMessages) : [];
  
      // Ensure currentMessages is an array
      if (!Array.isArray(currentMessages)) {
        currentMessages = [];
      }
  
      // Create a map for current messages
      const messageMap = new Map(currentMessages.map(msg => [msg.id, msg]));
  
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

useEffect(() => {
  loadMessagesFromStorage();
  fetchMessages(); // Fetch from server to update messages
}, [currentUserId]);

const reloadScreen = () => {
  fetchMessages();
  console.log('Screen reloaded!');
};

const onRefresh = async () => {
  setRefreshing(true);
  await fetchMessages();
  setRefreshing(false);
};
  
    useFocusEffect(
      useCallback(() => {
        reloadScreen();
      }, [])
    );

  return (
        <ScrollView>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.GoButton} onPress={() => { 
                router.navigate("/sell");
                // navigation.goBack();
            }}>
            <Text style={styles.saveText}>
            <Image 
              source={icons.leftArrow} 
              style={styles.icon}
              resizeMode="contain" // Ensure the image fits within the circular container
            />  Go Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => {
              setModalVisible(true);
              fetchMessages(); // Re-run the fetch every time button is clicked
              }}>    
            <Text style={styles.messageText}>
              <Image 
              source={icons.contact} 
              style={styles.icon}
              resizeMode="contain" // Ensure the image fits within the circular container
            /> Messages</Text>
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
                  {totalmessage > 0 ? totalmessage : ''}` 
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
                      data={messageList}
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
      <TextInput
        style={styles.input}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        placeholder="Enter your phone number"
      />
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
      </View>
    </ScrollView>
  );
};
export default UserDetailsScreen;

const styles = StyleSheet.create({
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
    height: 50,
    fontSize: 25,
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
  GoButton: {
    backgroundColor: '#28a745',
    padding: 5,
    borderRadius: 20,
    marginTop: 5,
    marginLeft: 5,
    alignItems: 'center',
    width: '40%',
  },
  buttonContainer: {
    flexDirection: 'row', // Arrange items in a row
    justifyContent: 'space-between', // Evenly space out the buttons
    alignItems: 'center', // Center items vertically
  },
  messageButton: {
    backgroundColor: '#28a745',
    padding: 5,
    borderRadius: 20,
    marginTop: 5,
    marginRight: 5,
    alignItems: 'center',
    width: '40%',
  },
  messageText: {
    color: 'white',
    fontWeight: 'bold',
    paddingBottom: 5,
    marginBottom: 5,
  },
  saveText: {
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 5,
    paddingRight: 10,
    paddingBottom: 5,
  },
  icon: {
    width: 30,  // Adjust width as needed
    height: 30,  // Adjust height as needed
    marginRight: 10,  
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
     // Move button to the right
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

  // this is the message styles
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  messageContainer: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    width: '90%',            // Adjust width according to your needs
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
    padding: 5,
    marginLeft: 15, // Add some spacing between text and time
  },
  noMessageText: {
    fontSize: 18,
    color: '#888',  // A subtle gray color
    fontWeight: 'bold',
  },
  
});

