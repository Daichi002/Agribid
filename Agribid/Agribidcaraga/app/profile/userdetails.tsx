import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ScrollView, Image, Modal, FlatList, RefreshControl, Dimensions, ImageBackground, BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation} from '@react-navigation/native';
import axios from 'axios';
import { useAlert } from '../../components/AlertContext';
import { FontAwesome } from '@expo/vector-icons';
import { icons } from "../../constants";
import { router } from 'expo-router';
import ApprovalRequest from '../../components/ApprovalRequest';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../components/authcontext';  // Import the useAuth hook
import ProtectedRoute from '../../components/ProtectedRoute';
import MessageItem from '../../components/MessageItem';
import UnreadMessagesNotification from '../../components/UnreadMessagesNotification'; 
import BASE_URL from '../../components/ApiConfig';
import ContactAdmin from '../../components/ContactAdmin';

const screenWidth = Dimensions.get('window').width;
const { height } = Dimensions.get('window'); 
const { width } = Dimensions.get('window'); 

interface User {
  id: number;
  firstname: string;
  lastname: string;
  phonenumber: string;
  address: string;
}


interface Message {
  id: number;
  text: string;
  sendId: string;
  receiveId: string;
  created_at: string;
  currentuserId: string;
  isRead: number;
  product: {
    id: number;
    image: string;
  };
  counterpart: {
    id: string;
    Firstname: string;
    Lastname: string;
  };
  message: string;
}

const UserDetailsScreen = () => {
    const { logout } = useContext(AuthContext);
    const navigation = useNavigation();
    const [currentUser, setCurrentUser] = useState<User | null>(null); 
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [messageList, setMessageList] = useState<Message[]>([]);
    const [totalmessage, setTotalmessage] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [messagenotif, setMessagenotif] = useState([]);

    const [isAdminModalVisible, setAdminModalVisible] = useState(false);

    const [forceRender, setForceRender] = useState(false); 
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [approvalRequests, setApproval] = useState([]);
    const [userRating, setUserRating] = useState(0);
    const [ratingCount, setRatingCount] = useState(0);
    const { showAlert } = useAlert();


    const handleAdminMessage = () => {
      setAdminModalVisible(true);
    };
  
    const closeModal = () => {
      setAdminModalVisible(false);
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

useEffect(() => {
  const fetchUserRating = async () => {
    try {
      // Check if currentUserId is invalid (empty or null)
      if (!currentUserId) {
        console.log('userId is null or empty. Skipping fetch operation.');
        return; // Do not proceed if the user ID is invalid
      }

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return; // Exit if there's no auth token
      }

      console.log('Fetching Ratings for user:', currentUserId);

      // Make the API call to fetch ratings
      const response = await axios.post(`${BASE_URL}/api/getRating/${currentUserId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const { averageRating, ratings } = response.data;

      // Set the average rating (rounded to the nearest decimal)
      setUserRating(averageRating);
      // Set the count of ratings
      setRatingCount(ratings.length);

      console.log('Rating data:', averageRating, ratings);

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Rating Axios error occurred:');
        console.error('RatingMessage:', error.message);
        console.error('ratingStatus:', error.response ? error.response.status : 'No status code');
      } else {
        console.error('Non-Axios error occurred:', error);
      }
    }
  };

  // Call fetchUserRating when currentUserId changes
  if (currentUserId && currentUserId !== 0) {
    fetchUserRating();
  } else {
    console.log('currentUserId is invalid or empty, skipping rating fetch.');
  }
}, [currentUserId]); // This effect will run when currentUserId changes


  const handleNotificationClick = async (item: Message) => {
    try {
      // Retrieve the auth token
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      console.log('Message item:', item.sendId, item.currentuserId);
      // If the current user is the sender, don't mark the message as read
      if (item.sendId === item.currentuserId) {
        // Skip marking as read and just navigate to the message
        router.push({
          pathname: '/message/messagesender',
          params: {
            productId: item.product.id, // Pass the product ID
            productuserId: item.counterpart.id, // Pass the user ID
          },
        });
        setModalVisible(!modalVisible);
        return;  // Exit function here to prevent any further action
      }
  
      // Mark the message as read if the current user is the receiver
      await axios.post(
        `${BASE_URL}/api/message/${item.id}/mark-read`,
        {}, // Empty object for POST body
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

       // Directly mutate the 'isRead' value in the item object
    item.isRead = 1; // Mark the message as read (1 represents read)

    // Assuming you have a state for managing message items
    setMessageList((prevState) =>
      prevState.map((message) =>
        message.id === item.id ? { ...message, isRead: 1 } : message
      )
    );
  
      // Navigate to the appropriate page after marking as read
      router.push({
        pathname: '/message/messagesender',
        params: {
          productId: item.product.id, // Pass the product ID
          productuserId: item.counterpart.id, // Pass the user ID
        },
      });
      setModalVisible(!modalVisible);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
};

  


  useEffect(() => {
    const loadAndFetchMessages = async () => {    
      await fetchMessages(); // Fetch from server to update messages
      await loadMessagesFromStorage();  
    };
    loadAndFetchMessages();
  }, []);


  
  const onRefresh = async () => {
    setRefreshing(true);
    // Wait until currentUserId is populated  
    await fetchMessages(); 
    await loadMessagesFromStorage();
    setRefreshing(false);
  };
  
  
  


  const loadMessagesFromStorage = async () => {
    try {
      const savedMessages = await AsyncStorage.getItem('sortedMessages');
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        // console.log('Loaded messages from storage:', parsedMessages);
        // Optionally, update the state
        setMessageList(parsedMessages);
        setTotalmessage(parsedMessages.length);

      } else {
        console.log('No messages found in storage.');
      }
    } catch (error) {
      console.error('Error loading messages from storage:', error);
    }
  };
  




  // the function to fetch messages created by user 
  const fetchMessages = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }
  
      const response = await axios.get(`${BASE_URL}/api/messageslistcreate`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
  
      // Ensure the response data is valid and contains messages
      let senderMessages = response.data.messages;

    
      // Convert the object to an array
      senderMessages = Object.values(senderMessages);
  
      // console.log('Fetched messages:', senderMessages);
      if (!Array.isArray(senderMessages)) {
        console.error('Invalid data format: messages should be an array');
        return;
      }
  
      // Sort messages by `created_at` in descending order (latest first)
      senderMessages = senderMessages.sort((a, b) => {
        const dateA = new Date(a.updated_at);
        const dateB = new Date(b.updated_at);
        return dateB.getTime() - dateA.getTime(); // Descending order
      });
  
      // console.log('Fetched and sorted messages:', JSON.stringify(senderMessages, null, 2));
  
      // Save sorted messages to AsyncStorage
      await AsyncStorage.setItem('sortedMessages', JSON.stringify(senderMessages));
      console.log('Messages saved to storage.');

        // Process message notifications
    const hasUnreadMessages = senderMessages.some(
      (item: Message) => item.receiveId === item.currentuserId && item.isRead === 0
    );

    setMessagenotif(hasUnreadMessages); // Store boolean (true/false) in state
      // Optionally, set the state with the sorted messages for UI rendering
      // setMessageList(senderMessages);
  
    } catch (error) {
      console.error('Error fetching messages:', error);
  
      if (axios.isAxiosError(error) && error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
  
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
        console.error('Request data:', error.request);
        Alert.alert('Error', 'Network error. Please check your connection.');
      } else {
        if (error instanceof Error) {
          console.error('Error message:', error.message);
        } else {
          console.error('Unexpected error:', error);
        }
        Alert.alert('Error', 'An unexpected error occurred.');
      }
    }
  };



 



  // ////////////////////////////////////////////////////////////////////////////

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
  
              const response = await axios.post(`${BASE_URL}/api/logout`, {}, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
  
              await AsyncStorage.removeItem('authToken');
              await AsyncStorage.removeItem('userInfo');
  
              logout();
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

  const onRefreshapproval = async () => {
    setRefreshing(true);
  
    // Wait until currentUserId is populated
    if (currentUserId !== null) {
      await fetchApprovalRequest();
    }
  
    setRefreshing(false);
  };

useEffect(() => {
  const loadAndFetchApproval = async () => {
    await fetchApprovalRequest();
  };
  loadAndFetchApproval();
}, [currentUserId]);

// Refresh approval requests
const onRefreshApproval = async () => {
  setIsRefreshing(true);
  await fetchApprovalRequest(); // Fetch updated requests
  setIsRefreshing(false); // End refreshing
};

 // Fetch approval request
 const fetchApprovalRequest = async () => {
  try {
    if (!currentUserId) {
      console.log('User ID is null or invalid. Reloading page...');
      onRefreshapproval(); // Reload the page if the user ID is invalid
      return;
    }

    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      console.error('No auth token found');
      return;
    }

    console.log('Fetching approval request for user:', currentUserId);

    const response = await axios.post(
      `${BASE_URL}/api/getApprovals/${currentUserId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const approval = response.data;

    if (approval.data && approval.data.length === 0) {
      console.warn('No transactions found for the user.');
      setApproval([]); // Clear the approval state if empty
      return;
    }

    setApproval(approval.data); // Update the state with fetched transactions
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // console.error('Axios error occurred:', error.message);

      // Handle specific status codes
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data.message;

        if (status === 404) {
          // console.warn('No transactions found:', message);
          setApproval([]); // Clear approval state when no data exists
        } else if (status >= 500) {
          console.error('Server error:', message || 'Internal server error');
        } else {
          console.error('Unexpected error:', message || 'Something went wrong');
        }
      } else {
        console.error('No response from server');
      }
    } else {
      if (error instanceof Error) {
        console.error('Non-Axios error occurred:', error.message);
      } else {
        console.error('Non-Axios error occurred:', error);
      }
    }
  }
};


const handleApprove = async (id: any) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      console.error('No auth token found');
      return;
    }

    console.log('Approving request:', id);
    const response = await axios.post(
      `${BASE_URL}/api/approve-request/${id}`,
      { is_approve: true }, // Send the approval status in the body
      {
        headers: {
          Authorization: `Bearer ${token}`, // Pass the token in headers
        },
      }
    );

    if (response.data.success === 201) {
      // Approval successful
      console.log('Approval Response:', response.data);
      showAlert('Request Approved Successfully!', 3000, 'green'); // Show success message  
    } 

    // Update the frontend state to remove the approved transaction
      setApproval((prev) => prev.filter((request: { id: any }) => request.id !== id));

      // Refresh the approval list
      onRefreshapproval();
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const { status, data } = error.response;

      if (status === 400) {
        // Handle the 400 error (e.g., not enough product quantity)
        console.log('Approval Response:', data);
        showAlert(data.message || 'Not enough product quantity', 3000, 'red'); // Show error message from server
      } else {
        // Handle other HTTP errors
        console.error('Unexpected Response Error:', data);
        showAlert('Something went wrong. Please try again.', 3000, 'red'); // Default message for unexpected errors
      }
    } else {
      // Handle non-Axios errors
      console.error('Unexpected Error:', error);
      showAlert('An unexpected error occurred. Please try again.', 3000, 'red');
    }
  }
};




const handleDecline = async (id: any) => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      console.error('No auth token found');
      return;
    }

    setApproval((prev) => prev.filter((request: { id: any }) => request.id !== id));
    console.log('Approving request:', id);
    const response = await axios.post(
      `${BASE_URL}/api/decline-request/${id}`,
      { is_decline: true }, // Send the approval status in the body
      {
        headers: {
          Authorization: `Bearer ${token}`, // Pass the token in headers
        },
      }
    );

    if (response.data.success === 201) {
      // Approval successful
      console.log('Approval Response:', response.data);
      showAlert('Request Approved Successfully!', 3000, 'green'); // Show success message  
    } 
    
    // Update the frontend state to remove the declined transaction
    setApproval((prev) => prev.filter((request: { id: any }) => request.id !== id));

      // Refresh the approval list
      onRefreshapproval();
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
    } else {
      // Handle non-Axios errors
      console.error('Unexpected Error:', error);
      showAlert('An unexpected error occurred. Please try again.', 3000, 'red');
    }
  }
};


  // const handleadminmessage = () => {
  //   router.push({
  //     pathname: '/contactadmin',
  //   });
  // };


  const Gotoeditprofile = () => {
    router.push({
      pathname: '/updateuser',
    });
  };
  const GotoSold = () => {
    router.push({
      pathname: '../history/sold',
    });
  };
  const GotoBuy = () => {
    router.push({
      pathname: '../history/buy',
    });
  };
  const Gotorate = () => {
    router.push({
      pathname: '../history/torate',
    });
  };

  useEffect(() => {
    const handleBackPress = () => {
      router.replace('/sell'); // Same as your "Go Back" button
      return true; // Prevents default behavior (going to blank profile page)
    };

    BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    };
  }, []);

  return (
    <ProtectedRoute>
     <SafeAreaView style={styles.scrollview}>
       <ImageBackground
          // source={icons.Agribid} // Your image source
          style={styles.backgroundImage} // Style for the image
          resizeMode="cover" // You can use 'contain' or 'cover' depending on the effect you want
        >
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.GoButton}
            onPress={() => {
              router.navigate("/sell");
            }}
          >
            <View style={styles.buttonContent}>
              <Image
                source={icons.leftArrow}
                style={styles.icon}
                resizeMode="contain"
              />
              <Text style={styles.messageText}>Go Back</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => {
              setModalVisible(true);
              onRefresh(); // Refresh messages
              // fetchMessages(); // Fetch messages from server
              // loadMessagesFromStorage(); // Load messages from storage
            }}
          >
            <View style={styles.buttonContent}>
              <Image
                      source={messagenotif ? icons.contactnoti : icons.contact}
                      style={styles.icon}
                      resizeMode="contain"
                    />
              <UnreadMessagesNotification />
              <Text style={styles.messageText}>Messages</Text>
            </View>
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
                  {totalmessage > 0 ? totalmessage : 'No'}
  
                   <Image
                      source={messagenotif ? icons.contactnoti : icons.contact}
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
              <FlatList
                data={messageList}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <MessageItem
                    message={item}
                    onPress={() => handleNotificationClick(item)}
                  />
                )}
              />
            </View>
          </View>
        </Modal>

        <View style={styles.maincontainer}>
              <View style={styles.profile}>
                <View style={styles.profileHeader}>
                  <Text style={styles.profileheaderText}>User Profile</Text>
                  <View style={styles.profileContent}>
                    <View>
                      {currentUser && (
                        <Text style={styles.nameText}>
                          {currentUser?.firstname} {currentUser?.lastname}
                        </Text>
                      )}
                     
                        <View style={styles.ratingContainer}>
                          <View style={styles.stars}>
                            {[...Array(5)].map((_, index) => {
                              const stars = index + 1; // 1 to 5
                              return (
                                <FontAwesome
                                  key={stars}
                                  name={stars <= Math.round(userRating) ? 'star' : 'star-o'}
                                  size={22}
                                  color={stars <= Math.round(userRating) ? '#FFC107' : '#E0E0E0'}
                                />
                              );
                            })}
                            <Text style={styles.averageRatingText}>
                              {userRating.toFixed(1)} {ratingCount > 0 ? `(${ratingCount})` : ''}
                            </Text>                  
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity onPress={Gotoeditprofile}>
                      <Image
                        source={icons.editprofile}
                        style={styles.editIcon}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

          <View style={styles.history}>
          <Text style={styles.historyheaderText}>Transactions:</Text>
         
          <View style={styles.historyContent}>
            <View style={styles.historyButton}>
                    <TouchableOpacity style={styles.historyrow} onPress={GotoSold}>
                          <Image
                            source={icons.history}
                            style={styles.historyIcon}
                            resizeMode="contain"
                          />                     
                        <Text style={styles.messageText}>Sold</Text>
                     </TouchableOpacity>
              </View>
              <View style={styles.historyButton}>
                    <TouchableOpacity style={styles.historyrow} onPress={GotoBuy}>
                          <Image
                            source={icons.history}
                            style={styles.historyIcon}
                            resizeMode="contain"
                          />                     
                        <Text style={styles.messageText}>Buy</Text>
                     </TouchableOpacity>
              </View>
                    <View style={styles.historyButton}>
                    <TouchableOpacity style={styles.historyrow} onPress={Gotorate}>
                      <Image
                        source={icons.torate}
                        style={styles.historyIcon}
                        resizeMode="contain"
                      />                     
                   
                    <Text style={styles.messageText}>To Rate</Text>
                    </TouchableOpacity> 
                    </View>
                </View>
            </View>

            <View style={styles.approve}>
              <View>
                <Text style={styles.approveheaderText}>
                  To Approve Request:
                  <Image
                    source={icons.approve}
                    style={styles.approveIcon}
                    resizeMode="contain"
                  />
                </Text>
              </View>
              <View
                style={styles.approveContent}
              >
              <ApprovalRequest
                  requests={approvalRequests}
                  onApprove={handleApprove}
                  onDecline={handleDecline}
                  onRefreshApproval={onRefreshApproval} 
                />          
              </View>
            </View>
            
        </View>
        <View style={styles.foot}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <View style={styles.logoutContent}>
            <Image
              source={icons.logout}
              style={styles.logoutIcon}
              resizeMode="contain"
            />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </View>
        </TouchableOpacity>
      <View>                     
      <ContactAdmin visible={isAdminModalVisible} onClose={closeModal} />

        <TouchableOpacity style={styles.quastionButtom} onPress={handleAdminMessage}>
          <View style={styles.logoutContent}>
            <Image
              source={icons.question}
              style={styles.questionIcon}
              resizeMode="contain"
            />
          </View>  
        </TouchableOpacity> 
       </View> 
      </View>
      </ImageBackground>
    </SafeAreaView>
    </ProtectedRoute>
  );
};
export default UserDetailsScreen;

const styles = StyleSheet.create({
  scrollview: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginTop: 10,
    flex: 1,
  },
  foot:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  maincontainer: {
    // flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    flex: 1,  // Make sure the image covers the full container
    width: '100%',
    height: '100%',
  },
  profile: {
    marginTop: 10,
    height: 120,
    width: '100%',
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
  profileHeader: {
    marginBottom: 5,
  },
  profileheaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 1,
    borderBottomWidth: 1, // Adds a bottom border
    borderBottomColor: '#cccccc', // Light gray color for subtle separation
    paddingBottom: 4, // Adds spacing between text and the border
  },  
  profileContent: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Push name/rating and icon to edges
    alignItems: 'center', // Align items vertically
  },
  nameText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4, // Space between name and rating container
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginTop: 4,
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',                // Center stars vertically
    justifyContent: 'center',
  },
  averageRatingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,                      // Space between stars and rating text
    alignSelf: 'center',                 // Center the text vertically with stars
  },
  ratingText: {
    fontSize: 16,
    color: '#757575',
  },
  editIcon: {
    width: 45, // Icon size
    height: 45,
    tintColor: '#ffffff', // Ensure consistent visibility on the green background
  },
  history: {
    marginTop: 5,
    height: height * 0.11,
    width: '100%',
    marginBottom: 2,
    borderColor: '#28a745',
    borderWidth: 1,
    borderRadius: 12,
  },
  historyheaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#28a745',
    borderTopRightRadius: 12,
    borderTopLeftRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
    paddingLeft: 10,
    borderBottomWidth: 1, // Adds a bottom border
    borderBottomColor: '#cccccc', // Light gray color for subtle separation
    paddingBottom: 1, // Adds spacing between text and the border
    justifyContent: 'space-between', // Push name/rating and icon to edges
  },  
  historyContent: {
    flexDirection: 'row', // Arrange items in a row
    justifyContent: 'center', // Center items horizontally
    alignItems: 'center', // Center items vertically
  }, 
  historyButton: {
    marginTop: 5,
    backgroundColor: '#28a745',
    paddingVertical: 10, // Ensure consistent height with padding
    paddingHorizontal: 10, // Add horizontal padding to make the button's width adjustable
    borderRadius: 5,
    alignItems: 'center',
    width: '30%', // Set fixed width or auto based on content
    height: 40, // Fixed height for consistency
    marginLeft: 5,
    marginRight: 5,
  }, 
  historyrow: {
    flexDirection: 'row', // Align icon and text horizontally
    alignItems: 'center', // Center icon and text vertically
    justifyContent: 'center', // Center icon and text horizontally
  },
  historyIcon: {
    width: 22, // Icon size
    height: 22,
    tintColor: '#ffffff', // Ensure consistent visibility on the green background
  },
  approve: {
    height: height * 0.4,
    width: '100%',
    marginBottom: 5,
    borderColor: '#28a745',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden', // Ensures content stays within the rounded border
  },
  approveheaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#28a745',
    borderTopRightRadius: 12,
    borderTopLeftRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  approveContent: {
    flex: 1, // Take up available space
    padding: 10, // Add padding around content
  },
  approveIcon: {
    width: 30, // Icon size
    height: 30,
    tintColor: '#ffffff', // Ensure consistent visibility on the green background
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 5,
    alignItems: 'center', // Center the content horizontally in the button
    justifyContent: 'center', // Ensure content is centered vertically
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  quastionButtom: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 5,
    alignItems: 'center', // Center the content horizontally in the button
    justifyContent: 'center', // Ensure content is centered vertically
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  
  logoutContent: {
    flexDirection: 'row', // Arrange icon and text horizontally
    alignItems: 'center', // Vertically center the icon and text
    justifyContent: 'center', // Horizontally center the content inside the button
  },
  
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  
  logoutIcon: {
    width: 24, // Icon size
    height: 24,
    tintColor: '#ffffff', // Ensure consistent visibility on the button
    marginRight: 8, // Add space between icon and text
  },

  questionIcon: {
    width: 24, // Icon size
    height: 24,
    tintColor: '#ffffff', // Ensure consistent visibility on the button
  },
  
  buttonContainer: {
    flexDirection: 'row', // Arrange items in a row
    justifyContent: 'space-between', // Evenly space out the buttons
    alignItems: 'center', // Center items vertically
    width: '100%', // Ensure buttons take full width of the parent container
  },
  buttonContent: {
    flexDirection: 'row', // Align Image and Text horizontally
    alignItems: 'center', // Center the items vertically
    justifyContent: 'space-between', // Evenly space out the items horizontally
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
      fontSize: 14,
      fontWeight: 'bold', // Ensure text stands out
      marginLeft: 5, // Add a little space between the icon and text
    },
    saveText: {
      color: 'white', // Ensure text is white
      fontSize: 16,
      fontWeight: 'bold', // Ensure text stands out
      marginLeft: 5, // Add a little space between the icon and text
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


  ////
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

