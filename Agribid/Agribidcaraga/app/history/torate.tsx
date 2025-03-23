import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { icons } from "../../constants";
import { router } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import ShowRating from '../../components/ShowRating'; // Import ShowRating component
import ImageLoader  from '../../components/imageprocessor';
import BASE_URL from '../../components/ApiConfig';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

interface Rating {
  id: number;
  rate: number;
  review: string;
  product: {
    id: number;
    title: string;
    image: string;
  };
  rater: {
    firstname: string;
    lastname: string;
  };
  buyer?: {
    id: number;
  };
  rater_id?: number;
  transaction_id?: number;
  quantity?: number;
  location?: string;
  averageRating?: number;
  ratingCount?: number;
}

const ToRate = () => {
  const navigation = useNavigation();
  const [ratings, setRatings] = useState<any[]>([]); // Holds data for the selected tab
  const [status, setStatus] = useState('Rated'); // Current selected tab
  const [loading, setLoading] = useState(false); // Loading state
  const [page, setPage] = useState(1); // Pagination page
  const [hasMore, setHasMore] = useState(true); // Indicates if more data is available
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRatings, setSelectedRatings] = useState<Rating[] | null>(null);

  
  // Fetch ratings based on the selected status
  const fetchRatings = async (status: string, page: number) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(
        `${BASE_URL}/api/ratinghistory?status=${status}&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // console.log('Full response:', JSON.stringify(response.data, null, 2));

      const { data, next_page_url } = response.data;
      // console.log('rating data',response.data)


      if (page === 1) {
        setRatings(data);
      } else {
        setRatings((prev) => [...prev, ...data]);
      }

      setHasMore(!!next_page_url);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching ratings:', error.message);
      } else {
        console.error('Error fetching ratings:', error);
      }
    } finally {
      setLoading(false);
    }
};



  // Fetch data whenever status or page changes
  useEffect(() => {
    fetchRatings(status, page);
  }, [status, page]);

  // Handle tab change
  const handleTabChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(1); // Reset to the first page
    setRatings([]); // Clear the current list
  };

  // Load more data for pagination
  const loadMore = () => {
    if (hasMore && !loading) {
      setPage((prev) => prev + 1);
    }
  };


   // Function to open the modal and set ratings for the selected item
   const openRatingModal = (item: any) => {
    if (!modalVisible) {  // Check if the modal is not already open
      setSelectedRatings(item.ratings || []);  // Set the selected ratings
      setModalVisible(true);  // Show the modal
    }
  };

    // Function to close the modal
    const closeRatingModal = () => {
    setModalVisible(false);  // Hide the modal
    setSelectedRatings([]);  // Clear the selected ratings
    };



  

    const renderItem = ({ item }: { item: any }) => {
      const imageUri = item.product?.image; 
    
      const StarRating = ({ rating, ratingCount }: { rating: number, ratingCount: number }) => (
        <View style={styles.stars}>
          {[...Array(5)].map((_, index) => {
            const starValue = index + 1;
            return (
              <FontAwesome
                key={starValue}
                name={starValue <= Math.round(rating) ? 'star' : 'star-o'}
                size={22}
                color={starValue <= Math.round(rating) ? '#FFC107' : '#E0E0E0'}
              />
            );
          })}
          <Text style={styles.averageRatingText}>
            {rating ? rating.toFixed(1) : '0.0'} ({ratingCount || 0})
          </Text>
        </View>
      );
    
      const renderToRate = () => {
        const handleRate = () => {
          navigation.navigate('Rating', {
            transaction_id: item.id,
            productId: item.product.id,
            userId: item.buyer?.id,
          } as never);
        };
    
        return (
          <TouchableOpacity onPress={handleRate}>
            <View style={styles.ratingItem}>
              <View style={styles.itemTitleContainer}>
                <Text style={styles.itemTitle} numberOfLines={2}>
                  To Rate: {item.product?.title || 'Unknown Product'}
                </Text>
              </View>
              <Text style={styles.itemDetails}>Quantity: {item.quantity}</Text>
              <Text style={styles.itemDetails}>Seller: {item.seller.Firstname}{item.seller.Lastname}</Text>
              <View style={styles.imagecontainer}>
              <ImageLoader imageUri={imageUri}
                style={styles.productImage}
              />
              </View>
            </View>
          </TouchableOpacity>
        );
      };
    
      const renderRated = () => {
        const handleRateEdit = () => {
          navigation.navigate('Rating', {
            transaction_id: item.transaction_id,
            productId: item.product.id,
            userId: item.rater_id,
          } as never);
        };
    
        return (
          <TouchableOpacity onPress={handleRateEdit}>
            <View style={styles.ratingItem}>
              <View style={styles.itemTitleContainer}>
                <Text style={styles.itemTitle} numberOfLines={2}>
                  Rated: {item.product?.title || 'Unknown Product'}
                </Text>
              </View>
              <View style={styles.ratingContainer}>
                <StarRating rating={item.rate || 0} ratingCount={0} />
              </View>
              <View>
              <Text style={styles.itemDetails} numberOfLines={3}>Review: {item.review || 'No review provided'}</Text>
              </View>
              <View style={styles.imagecontainer}>
              <ImageLoader imageUri={imageUri}
                style={styles.productImage}
              />
              </View>
            </View>
          </TouchableOpacity>
        );
      };
    
      const renderRating = () => (
        <>
        <TouchableOpacity onPress={() => openRatingModal(item)}>
          <View style={styles.ratingItem}>
            <View style={styles.itemTitleContainer}>
              <Text style={styles.itemTitle} numberOfLines={2}>
                Product: {item.product?.title || 'Unknown Product'}
              </Text>
            </View>
            <View style={styles.ratingContainer}>
              <StarRating rating={item.averageRating} ratingCount={item.ratingCount} />
            </View>
            <View style={styles.imagecontainer}>
            <ImageLoader imageUri={imageUri}
              style={styles.productImage}
            />
            </View>
          </View>
        </TouchableOpacity>
        <ShowRating
            visible={modalVisible}
            ratings={selectedRatings || []}
            onClose={closeRatingModal}
          />
        </>
      );
    
      // Determine which renderer to use
      if (item.quantity && item.product) {
        console.log('To Rate:', item);
        return renderToRate();
      }
    
      if (item.rate && item.product) {
        console.log('Rated:', item);
        return renderRated();
      }
    
      if (item.product && item.averageRating !== undefined) {
        console.log('Rating:', item);
        return renderRating();
      }
    
      
      // Fallback for unknown data structure
      console.log('Unknown Item:', item);
      return (
        <View style={styles.ratingItem}>
          <Text style={styles.itemTitle}>Unknown Item</Text>
        </View>
      );
    };
    
  


const Gobacktoprofile = () => {
  router.push('../profile/userdetails'); ;
}


  return (
    <SafeAreaView style={{ flex: 1 }}>
    <View style={styles.container}>
    <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.GoButton}
            onPress={Gobacktoprofile}
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
        </View>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Rating</Text>

      {/* Tabs for To Rate, Rated and Rating */}
      <View style={styles.tabContainer}>
        {['To Rate', 'Rated', 'Rating'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => handleTabChange(tab)}
            style={[styles.tab, status === tab && styles.activeTab]}
          >
            <Text style={[styles.tabText, status === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Rating list */}
      <FlatList
        data={ratings}
        renderItem={renderItem}
        keyExtractor={(item, index) => (item?.id ? item.id.toString() : `key-${index}`)}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading ? <ActivityIndicator size="large" color="#007BFF" /> : null}
        ListEmptyComponent={!loading ? <Text style={styles.emptyText}>No ratings found.</Text> : null}
        numColumns={2}
      />
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 5,
    elevation: 2,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  activeTab: {
    backgroundColor: '#28a745',
  },
  tabText: {
    fontSize: 16,
    color: '#333',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  ratingItem: {
    backgroundColor: '#fff',
    margin: 5,
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    elevation: 2,
    width: (width * 0.45) - 10, // Adjust width slightly to ensure space for margins
    height: 250, // Keeps the height the same
    overflow: 'hidden',
    justifyContent: 'space-between',
    alignItems: 'center',
  },  
  
  itemTitleContainer: {
    maxHeight: 100, // Limits the height but avoids cutting off short titles
    overflow: 'hidden', // Ensures long titles don't overflow
    height: 40, // Fixed height for consistent spacing
  },

  itemTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center', // Centers text horizontally
  },

  itemDetails: {
  fontSize: 12,
  color: '#666',
  marginTop: 5,
  textAlign: 'center',
  lineHeight: 18, // Consistent spacing
  maxHeight: 36, // Ensures 2 lines of text
  overflow: 'hidden',
},

ratingContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#ffffff',
  paddingHorizontal: 5, // Scale padding for consistency
  borderRadius: 16,
  marginTop: 5,
  justifyContent: 'center', // Ensures stars and rating text align better
},

stars: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
},
averageRatingText: {
  fontSize: 12,
  fontWeight: 'bold',
  color: '#333',
  marginLeft: 2, // Reduced margin for closer alignment
  alignSelf: 'center',
},

  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  imagecontainer: {
    width: '100%', // Container matches the item width
    height: height * 0.2, // Scaled height for better responsiveness
    maxHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%', // Ensures image takes the full container width
    height: '100%', // Keeps aspect ratio inside the container
    borderRadius: 5,
    resizeMode: 'cover',
    marginBottom: 5,
  },
  
  buttonContainer: {
    flexDirection: 'row', // Arrange items in a row
    justifyContent: 'space-between', // Evenly space out the buttons
    alignItems: 'center', // Center items vertically
    width: '100%', // Ensure buttons take full width of the parent container
    marginBottom: 10, // Add some space between the buttons and the tabs
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
    icon: {
      width: 24, // Adjust width as needed
      height: 24, // Adjust height as needed
    },
    messageText: {
      color: 'white', // Ensure text is white
      fontSize: 16,
      fontWeight: 'bold', // Ensure text stands out
      marginLeft: 5, // Add a little space between the icon and text
    }, 
});

export default ToRate;






