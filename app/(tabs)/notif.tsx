import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from "@react-navigation/native";

import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Product {
  id: string;
  user_id: string;
  title: string;
  image: string;
  created_at: string;
}
interface User {
  id: string;
  Firstname: string;
  Lastname: string;
}
interface notification {
  id: string;
  product_id: string;
  product: Product;
  text: string;
  created_at: string;
  user: User;
  userId: string;
  isRead: boolean;
}

interface repliesnotification {
  id: string;
  product_id: string;
  product: Product;
  created_at: string;
  user: User;
  userId: string;
  replies: replies[]; 
}

interface replies {
  id: string;
  comment_id: string;
  created_at: string;
  user: User;
  userId: string;
  isRead: boolean;
}


type CombinedNotification = notification | repliesnotification;

const ProductImage = React.memo(({ imageUri }: { imageUri: string }) => {
  return <Image source={{ uri: imageUri }} style={styles.productImage} />;
});

const RenderNotifications = ({ item, ViewNotification }: { item: notification, ViewNotification: (product: Product) => void }) => { 
  const [imageUri, setImageUri] = useState<string | null>(null); 
  // console.log('Rendering IsRead:', item.isRead);
  const [isRead, setIsRead] = useState(item?.isRead); // Set initial read status
  const imageCache: { [key: string]: string } = {}; // In-memory cache for image URIs 
  // console.log('Rendering notification:', item);
  useEffect(() => { 
    const loadImage = async () => { 
      const uri = `http://10.0.2.2:8000/storage/product/images/${item.product.image}`; 
      if (imageCache[uri]) { setImageUri(imageCache[uri]); 
        return; 
      } 
      const filename = uri.split('/').pop(); 
      const fileUri = `${FileSystem.documentDirectory}${filename}`; 
      const info = await FileSystem.getInfoAsync(fileUri); 
      if (info.exists) 
        { imageCache[uri] = fileUri; setImageUri(fileUri); 

        } else 
        { const response = await FileSystem.downloadAsync(uri, fileUri); 
          imageCache[uri] = response.uri; 
          
          setImageUri(response.uri); } }; 
          
          loadImage(); 
        }, [item.product.image]); 

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

  const notificationBackgroundColor = isRead ? '#ffffff' : '#e6f7ff';

  const handleNotificationClick = async () => {
    setIsRead(true);
    ViewNotification(item.product);
    // console.log('Notification clicked:', item.id);
    const id = item.id;
  // Send request to mark notification as read
  try {
    const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const response = await axios.post(
        `http://10.0.2.2:8000/api/notifications/${id}/mark-read`,
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
        
        return (
          <TouchableOpacity 
          onPress={handleNotificationClick}
          style={[styles.notificationContainer, { backgroundColor: notificationBackgroundColor }]}
        >
            <View style={styles.imageWrapper}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.productImage} />
              ) : (
                <ActivityIndicator size="small" color="#0000ff" />
              )}
            </View>
            
            <View style={styles.notificationTextContainer}>
              <View >
                {/* style={styles.notificationTextRow} */}
                <Text style={styles.notificationUserName}>
                  {item.user.Firstname} {item.user.Lastname}
                </Text>
                <Text> commented on </Text>
                <Text style={styles.notificationProductTitle}>
                  "{item.product.title}"
                </Text>
              </View>
              <Text style={styles.notificationDate}>
              {timeSince(item.created_at)}
              </Text>
            </View>
          </TouchableOpacity>
        );         
      };

      
      const RenderreplyNotifications = ({ item, ViewNotification }) => {
        // console.log('Latest Reply:', JSON.stringify(item, null, 2));
        const [imageUri, setImageUri] = useState<string | null>(null);
        const [isRead, setIsRead] = useState(item.replies[0]?.isRead); // Access isRead from the first reply
        const imageCache: { [key: string]: string } = {}; // In-memory cache for image URIs
      
        // Load the product image
        useEffect(() => {
          const loadImage = async () => {
            const uri = `http://10.0.2.2:8000/storage/product/images/${item.product.image}`;
            if (imageCache[uri]) {
              setImageUri(imageCache[uri]);
              return;
            }
            const filename = uri.split('/').pop();
            const fileUri = `${FileSystem.documentDirectory}${filename}`;
            const info = await FileSystem.getInfoAsync(fileUri);
            if (info.exists) {
              imageCache[uri] = fileUri;
              setImageUri(fileUri);
            } else {
              const response = await FileSystem.downloadAsync(uri, fileUri);
              imageCache[uri] = response.uri;
              imageCache[uri] = response.uri; // Caching the image
            }
          };
          loadImage();
        }, [item.product.image]);
      
        // Calculate time since creation
        const timeSince = (dateString: string): string => {
          if (!dateString) return 'No date available';
      
          const date = new Date(dateString);
          const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
          let interval = Math.floor(seconds / 31536000);
      
          if (interval >= 1) return `${interval} y`;
          interval = Math.floor(seconds / 2592000);
          if (interval >= 1) return `${interval} m`;
          interval = Math.floor(seconds / 86400);
          if (interval >= 1) return `${interval} d`;
          interval = Math.floor(seconds / 3600);
          if (interval >= 1) return `${interval} h`;
          interval = Math.floor(seconds / 60);
          if (interval >= 1) return `${interval} m`;
          return `${seconds} s`;
        };
      
        
      
        const notificationBackgroundColor = isRead ? '#ffffff' : '#e6f7ff';
      
        const handleNotificationClick = async () => {
          console.log('Notification clicked:', item.product);
          setIsRead(true); // Update the local state to mark as read
          ViewNotification(item.product); // Assuming this function handles navigation or view updates
          console.log('Reply ID:', item.replies.id); // Correctly access the reply ID
      
          try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
              console.error('No auth token found');
              return;
            }
      
            const repliesId = item.replies[0]?.id; // Access the ID of the reply
      
            const response = await axios.post(
              `http://10.0.2.2:8000/api/reply/notifications/${repliesId}/mark-read`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
      
            const data = response.data;
            if (!data.success) {
              console.error('Failed to mark as read:', data.message);
            }
          } catch (error) {
            console.error('Error marking as read:', error);
          }
        };
      
        return (
          <TouchableOpacity
            onPress={handleNotificationClick}
            style={[styles.notificationContainer, { backgroundColor: notificationBackgroundColor }]}
          >
            <View style={styles.imageWrapper}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.productImage} />
              ) : (
                <ActivityIndicator size="small" color="#0000ff" />
              )}
            </View>
      
            <View style={styles.notificationTextContainer}>
            <View>
              <Text style={styles.notificationUserName}>
                {item.replies[0]?.user?.Firstname} {item.replies[0]?.user?.Lastname}
              </Text>
              <Text> replied to your comment on </Text>
              <Text style={styles.notificationProductTitle}>
                "{item.product.title}"
              </Text>
            </View>
            <Text style={styles.notificationDate}>
              {timeSince(item.replies[0]?.created_at)}
            </Text>
          </View>
          </TouchableOpacity>
        );
      };      


const Notif = () => {
  const [notifications, setNotifications] = useState<notification[]>([]);
  const [repliesnotifications, setRepliesNotifications] = useState<repliesnotification[]>([]);
  const navigation = useNavigation();

  const ViewNotification = (product: any) => {
    console.log('Viewing product details:', product.id);
    navigation.navigate('ProductDetails', { productId: product.id });
  };  

  useFocusEffect(
    React.useCallback(() => {
      const fetchNotifications = async () => {
        try {
          const token = await AsyncStorage.getItem('authToken');
          if (!token) {
            console.error('No auth token found');
            return;
          }
  
          // Step 1: Fetch user products
          const productsResponse = await axios.get(`http://10.0.2.2:8000/api/notif/products`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          const products = productsResponse.data;
          if (products.length === 0) {
            console.log('No products found for the current user');
            return;
          }
  
            const productIDs: number[] = products.map((product: Product) => product.id);
          // console.log('Fetching Prods comments:', productIDs);
          // Step 2: Fetch comments for each product
          const lastFetched = await AsyncStorage.getItem('lastFetched');
          const commentsResponse = await axios.get(`http://10.0.2.2:8000/api/comments`, {
            params: {
              productIds: productIDs.join(','),
              lastFetched: lastFetched || ''
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          Object.entries(commentsResponse.data).forEach( async ([id, replies]) => {
            // console.log(`Comment ID: ${id}`, replies);          
          });
          
      
          // Assuming commentsResponse.data is an array of comments
          const commentsData = commentsResponse.data;

          // Filter comments to exclude those where product.user_id equals comment.userId
          const filteredCommentsData = commentsData.filter((comment: notification) => {
            return comment.product.user_id !== comment.userId;
          });

          
          // Now set the filtered notifications
          // console.log('raw notif data', filteredCommentsData);a
          await updateNotifications(filteredCommentsData);
          // setNotifications(filteredCommentsData);

        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      };
  
      fetchNotifications(); 
    }, []) // Empty dependency array to fetch only once when the screen is focused
  );

  const updateNotifications = async (filteredCommentsData) => {
    try {
        // Ensure filteredCommentsData is a valid array
        if (!Array.isArray(filteredCommentsData)) {
            console.error('filteredCommentsData is not an array:', filteredCommentsData);
            return;
        }
  
        // Retrieve existing notifications from AsyncStorage and parse them
        const storedNotifications = await AsyncStorage.getItem('notifications');
        const existingNotifications = storedNotifications ? JSON.parse(storedNotifications) : [];
  
        // Ensure existingNotifications is an array
        if (!Array.isArray(existingNotifications)) {
            console.error('Existing notifications data is not an array:', existingNotifications);
            return;
        }
  
        // Filter out notifications that are no longer in `filteredCommentsData`
        const filteredNotifications = existingNotifications.filter(notification =>
            filteredCommentsData.some(newNotification => newNotification.id === notification.id)
        );
  
        // Remove duplicates by creating a new array with unique `id` values
        const combinedNotifications = [
            ...filteredNotifications,
            ...filteredCommentsData
        ];

        const updatedNotifications = combinedNotifications.reduce((acc, current) => {
            const isDuplicate = acc.find(item => item.id === current.id);
            if (!isDuplicate) {
                acc.push(current);
            } else {
                // Update `isRead` if it has changed
                if (isDuplicate.isRead !== current.isRead) {
                    acc = acc.map(item =>
                        item.id === current.id ? { ...item, isRead: current.isRead } : item
                    );
                }
            }
            return acc;
        }, []);
  
        // Save the updated notifications list to AsyncStorage
        await AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));

        // console.log('isread',updatedNotifications)
  
        // Update state with the updated notifications list
        setNotifications(updatedNotifications);
    } catch (error) {
        console.error('Error updating notifications:', error);
    }
};


  
// add another function that will fetch replies of comments for the user
useFocusEffect(
  useCallback(() => {
    let isMounted = true; // Track if the component is mounted

    const fetchData = async () => {
      const data = await fetchUserCommentsWithReplies();
      if (isMounted && data) {
        // Only update state if the component is still mounted
        setRepliesNotifications(data);
      }
    };

    fetchData();

    return () => {
      isMounted = false; // Clean up function to set isMounted to false
    };
  }, []) // Empty dependency array ensures this runs on focus
);

// fix not fetching comment with replies using user ID
const fetchUserCommentsWithReplies = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      console.error('No auth token found');
      return;
    }

    // Retrieve user info from AsyncStorage
    const userInfoString = await AsyncStorage.getItem('userInfo');
    if (!userInfoString) {
      throw new Error('User info not found in AsyncStorage.');
    }

    const userInfo = JSON.parse(userInfoString);
    const userId = userInfo.id; // Get the user ID from the userInfo

    // console.log('Fetched comment using user ID:', userId);

    // Step 1: Fetch user comments
    const commentsResponse = await axios.get(`http://10.0.2.2:8000/api/comments/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const commentsData = commentsResponse.data;
    const commentIDs = commentsData.map(comment => comment.id);

    // console.log('Fetched User Comments:', commentsData);

    // Step 2: Fetch replies in bulk using the comment IDs
    const fetchRepliesForComments = async (commentIDs) => {
      try {
        const response = await axios.get(`http://10.0.2.2:8000/api/comments/replies`, {
          params: {
            commentIds: commentIDs.join(','), // Join IDs into a single string
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // Log the replies to confirm the format
        // console.log('Fetched Replies:', response.data);
        
        // Return the fetched replies
        return response.data;
      } catch (error) {
        console.error('Failed to fetch replies:', error);
        return []; // Return an empty array on error
      }
    };

    // Step 3: Fetch replies for all comments and map them back to their respective comments
    const repliesData = await fetchRepliesForComments(commentIDs); // Fetch replies once based on comment IDs

    const commentsWithReplies = commentsData
      .map(comment => {
        // Ensure each comment has its corresponding product data
        const productDetails = comment.product || {}; // Assumes product details are nested in each comment
    
        // Filter replies based on the current comment ID and exclude replies from the comment's owner
        const filteredReplies = repliesData.filter(
          reply => reply.comment_id === comment.id && reply.user_id !== comment.userId
        );
    
        // Return the comment with product details and valid replies if any are found
        if (filteredReplies.length > 0) {
          return {
            ...comment,
            product: productDetails, // Map product details to the comment
            replies: filteredReplies, // Attach the replies to the comment
          };
        }
        return null; // Filter out comments without valid replies
      })
      .filter(comment => comment !== null); // Keep only comments with valid replies
    
    // Log or use `commentsWithReplies` for rendering in your UI
    // console.log("Comments with Replies and Products:", commentsWithReplies);
    

await updateRepliesNotifications(commentsWithReplies); // Save to AsyncStorage and set state
    
  } catch (error) {
    console.error('Failed to fetch comments and replies:', error);
    return null;
  }
};

const updateRepliesNotifications = async (commentsWithReplies) => {
  try {
    // Ensure commentsWithReplies is a valid array
    if (!Array.isArray(commentsWithReplies)) {
      console.error('commentsWithReplies is not an array:', commentsWithReplies);
      return;
    }

    // Retrieve existing replies notifications from AsyncStorage and parse them
    const storedRepliesNotifications = await AsyncStorage.getItem('repliesNotifications');
    const existingRepliesNotifications = storedRepliesNotifications ? JSON.parse(storedRepliesNotifications) : [];

    // Ensure existingRepliesNotifications is an array
    if (!Array.isArray(existingRepliesNotifications)) {
      console.error('Existing replies notifications data is not an array:', existingRepliesNotifications);
      return;
    }

    // Create a Set of existing notification IDs for quick lookup
    const existingIdsSet = new Set(existingRepliesNotifications.map(notification => notification.id));

    // Filter out replies notifications no longer in `commentsWithReplies`
    const updatedRepliesNotifications = commentsWithReplies.filter(newNotification => {
      // Keep new notifications or ones that already exist
      if (existingIdsSet.has(newNotification.id)) {
        return true; // Keep if it exists
      }
      return false; // Filter out if it doesn't exist in the current replies
    });

    // Add new replies notifications from `commentsWithReplies` that are not already in `existingRepliesNotifications`
    commentsWithReplies.forEach(newNotification => {
      if (!existingIdsSet.has(newNotification.id)) {
        updatedRepliesNotifications.push(newNotification);
      }
    });

    // Save the updated replies notifications list to AsyncStorage
    await AsyncStorage.setItem('repliesNotifications', JSON.stringify(updatedRepliesNotifications));

    // Set replies notifications in state
    setRepliesNotifications(updatedRepliesNotifications);
  } catch (error) {
    console.error('Error updating replies notifications:', error);
  }
};



// Combine notifications and repliesnotifications with the correct created_at date
const combinedNotifications: CombinedNotification[] = [
  ...notifications.map(notification => ({
    ...notification,
    type: 'notification',
    createdAt: notification.created_at, // Use notification's created_at
  })),
  ...repliesnotifications.map(replyNotification => ({
    ...replyNotification,
    type: 'repliesnotification',
    createdAt: replyNotification.replies[0]?.created_at || null, // Use the latest reply's created_at if it exists
  })),
];

// Sort combined notifications by createdAt in descending order (latest first)
const sortedCombinedNotifications = combinedNotifications.sort((a, b) => {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
});

// Log or use sortedCombinedNotifications for rendering
// console.log('Sorted Combined Notifications:', sortedCombinedNotifications);




// console.log('RepliesNotifications:', repliesnotifications); 
// console.log('Notifications:', notifications);
// console.log('Combined Notifications:', combinedNotifications);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Notifications</Text>
      <View >
      {(Array.isArray(notifications) && notifications.length > 0) || 
        (Array.isArray(repliesnotifications) && repliesnotifications.length > 0) ? (
          <FlatList
          data={combinedNotifications}
          renderItem={({ item }) => {
            

            if ('replies' in item) {
              // This item is a repliesnotification
              // console.log("Item being rendered:", item);
              return <RenderreplyNotifications item={item as repliesnotification} ViewNotification={ViewNotification} />;
            }

            // This item is a notification
            return <RenderNotifications item={item as notification} ViewNotification={ViewNotification} />;
          }}
          keyExtractor={(item) => item.id.toString()} // Ensure id is a string
        />
      ) : (
        <View style={styles.nonotifcontainer}>
          <Text style={styles.notiftext}>No new notifications</Text>
        </View>
      )}
    </View>
    </SafeAreaView>
  );
};

export default Notif;

const styles = StyleSheet.create({
  container: { 
    padding: 10, 
    backgroundColor: "#f0f0f0",
  },
  header: { 
    fontSize: 18,
     fontWeight: 'bold',
    },
  nonotifcontainer: {
      justifyContent: 'center', // Center vertically
      alignItems: 'center', // Center horizontally
      backgroundColor: '#f8f8f8', // Light background color
      padding: 20, // Add some padding
    },
  notiftext: {
      fontSize: 18, // Font size
      fontWeight: 'bold', // Bold text
      color: '#666', // Gray color for the text
      textAlign: 'center', // Center the text
    },
  text: { 
    fontSize: 14 
  },
  inventory: {
    paddingBottom: 80,
  },
  notificationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 12,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },

  imageWrapper: {
    width: 80,
    height: 80,
    overflow: 'hidden',
    marginRight: 12,
  },
  productImage: {
    width: 150,  // Ensure width is not too small
    height: 150, // Ensure height is not too small
    resizeMode: 'cover',
    marginRight: 10, // Space between image and text
    backgroundColor: '#e0e0e0', // Optional: a background color to debug
  },
  notificationTextContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  notificationText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  notificationUserName: {
    fontWeight: 'bold',
    color: '#1a73e8', // Blue color for user name
  },
  notificationProductTitle: {
    fontStyle: 'italic',
    color: '#333', // Dark color for product title
  },
  notificationDate: {
    fontSize: 12,
    color: '#888', // Grey for date text
    marginTop: 4,
  },
});

