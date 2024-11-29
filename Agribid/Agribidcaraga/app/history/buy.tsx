import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Dimensions } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { icons } from "../../constants";
import ImageLoader  from '../../components/imageprocessor';
import BASE_URL from '../../components/ApiConfig';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375; // Mobile phones (smaller screens)


const Buy = () => {
  const navigation = useNavigation();
  const [transactions, setTransactions] = useState([]); // Holds transactions for the selected status
  const [status, setStatus] = useState('Approved'); // Current selected tab
  const [page, setPage] = useState(1); // Current page for pagination
  const [loading, setLoading] = useState(false); // Indicates if data is being loaded
  const [hasMore, setHasMore] = useState(true); // Indicates if more data is available

  // Fetch transactions based on the selected status and page
  const fetchTransactions = async (status: string, page: number) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await axios.get(
        `${BASE_URL}/api/transactionbuyer?status=${status}&page=${page}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const { data, next_page_url } = response.data;
      console.log(data);

      if (page === 1) {
        setTransactions(data);
      } else {
        setTransactions((prev) => [...prev, ...data]);
      }

      setHasMore(!!next_page_url);
    } catch (error) {
      console.error('Error fetching transactions:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch transactions when the status or page changes
  useEffect(() => {
    fetchTransactions(status, page);
  }, [status, page]);

  // Handle tab change
  const handleTabChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(1); // Reset to the first page
    setTransactions([]); // Clear previous transactions
  };

  // Load more data for pagination
  const loadMore = () => {
    if (hasMore && !loading) {
      setPage((prev) => prev + 1);
    }
  };


  // Render transaction item
const renderItem = ({ item }: { item: any }) => (
  <View style={styles.transactionItem}>
    {/* Product Information */}
    <View style={styles.productContainer}>
    <ImageLoader imageUri={item.product.image}
        style={styles.productImage}
      />
      <View style={styles.productDetails}>
        <Text style={styles.productTitle}>{item.product.title}</Text>
        <Text style={styles.productQuantity}>Quantity: {item.quantity}</Text>
        <Text style={styles.transactionLocation}>Location: {item.location}</Text>
      </View>
    </View>

    {/* Seller Information */}
    <View style={styles.sellerContainer}>
      <Text style={styles.sellerText}>
        Seller: {item.seller.Firstname} {item.seller.Lastname}
      </Text>
    </View>

    {/* Transaction Information */}
    <Text style={styles.transactionDate}>
      Transaction Date: {new Date(item.created_at).toLocaleDateString()}
    </Text>
  </View>
);


  return (
    <SafeAreaView style={{ flex: 1 }}>
    <View style={styles.container}>
    <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.GoButton}
            onPress={() => navigation.goBack()}
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
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Transaction History</Text>

      {/* Tabs for statuses */}
      <View style={styles.tabContainer}>
        {['Pending', 'Approved', 'Canceled'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => handleTabChange(tab)}
            style={[styles.tab, status === tab && styles.activeTab]}
          >
            <Text style={[styles.tabText, status === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transaction list */}
      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading && <ActivityIndicator size="large" color="#0000ff" />}
        ListEmptyComponent={!loading && <Text style={styles.emptyText}>No transactions found.</Text>}
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
  transactionItem: {
    flexDirection: 'column', // Stack all elements vertically
    padding: isSmallScreen ? 8 : 12, // Adjust padding for smaller screens
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    flex: 1, // Ensure it takes up available space
    justifyContent: 'flex-start',
    minHeight: 100, // Ensure there's a minimum height for the item
  },
  productContainer: {
    flexDirection: 'row',
    marginBottom: isSmallScreen ? 8 : 12, // Adjust spacing between elements
    alignItems: 'center', // Align image and text vertically
    flexWrap: 'wrap', // Allow wrapping if space is tight
  },
  productImage: {
    width: isSmallScreen ? 50 : 70, // Adjust image size for small screens
    height: isSmallScreen ? 50 : 70, // Ensure image maintains aspect ratio
    borderRadius: 8,
    marginRight: isSmallScreen ? 8 : 12, // Spacing between image and text
  },
  productDetails: {
    flex: 1, // Allow text to take up the remaining space
    justifyContent: 'space-between', // Ensure details are spaced efficiently
  },
  productTitle: {
    fontSize: isSmallScreen ? 14 : 16, // Adjust font size for readability
    fontWeight: 'bold',
    marginBottom: 4,
    flexShrink: 1, // Allow title to shrink if needed
  },
  productQuantity: {
    fontSize: isSmallScreen ? 12 : 14, // Adjust for smaller screens
    color: '#555',
    marginBottom: 4,
  },
  transactionLocation: {
    fontSize: isSmallScreen ? 12 : 14,
    color: '#555',
  },
  sellerContainer: {
    marginTop: isSmallScreen ? 8 : 10,
  },
  sellerText: {
    fontSize: isSmallScreen ? 12 : 14, // Adjust text size for small screens
    fontWeight: '500',
    color: '#333',
  },
  transactionDate: {
    fontSize: isSmallScreen ? 12 : 13,
    color: '#888',
    marginTop: isSmallScreen ? 6 : 8,
  },
  transactionText: {
    fontSize: 16,
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
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

export default Buy;
