import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { useRoute, useNavigation } from '@react-navigation/native';
import { icons } from '../constants';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import BASE_URL from '../components/ApiConfig';

// Define User and Product interfaces
interface User {
  Firstname: string;
  Lastname: string;
}

interface Product {
  id: number;
  image: string;
  title: string;
  description: string;
  price: number;
  locate: string;
}

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

// Cache image function
const cacheImage = async (uri: string) => {
  const filename = uri.split('/').pop();
  const fileUri = `${FileSystem.documentDirectory}${filename}`;
  const info = await FileSystem.getInfoAsync(fileUri);

  if (info.exists) {
    return fileUri; // Return cached image URI if available
  } else {
    const response = await FileSystem.downloadAsync(uri, fileUri);
    return response.uri; // Return newly downloaded image URI
  }
};

const UserProduct = () => {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [ratingCount, setRatingCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imageUris, setImageUris] = useState<{ [key: number]: string }>({});
  const route = useRoute();
  const navigation = useNavigation();
  const { userId } = route.params as { userId: string };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          console.error('No auth token found');
          return;
        }

        // Fetch user products
        const response = await axios.get(`${BASE_URL}/api/userproduct/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const { user, products } = response.data;
        setUser(user || {});
        setProducts(products);

        // Preload product images
        const uriPromises = products.map(async (product: { image: any; id: any; }) => {
          const uri = `${BASE_URL}/storage/product/images/${product.image}`;
          const cachedUri = await cacheImage(uri);
          return { id: product.id, uri: cachedUri };
        });
        const uriResults = await Promise.all(uriPromises);
        setImageUris(uriResults.reduce((acc, { id, uri }) => ({ ...acc, [id]: uri }), {}));

        // Fetch ratings for all products
        const productsWithRatings = await Promise.all(products.map(async (product: { id: any; }) => {
          const ratingsResponse = await axios.get(`${BASE_URL}/api/productrating/${product.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const ratings = ratingsResponse.data.ratings || [];
          const averageRating = ratingsResponse.data.averageRating || 0;

          return {
            ...product,
            ratings, // Attach ratings to the product
            averageRating, // Add average rating to the product
          };
        }));

        // Update products state with ratings and average ratings
        setProducts(productsWithRatings);

        // Calculate overall average rating and total count
        let totalRatings = 0;
        let overallRatingCount = 0;

        productsWithRatings.forEach(prod => {
          if (prod.ratings.length > 0) {
            totalRatings += prod.averageRating * prod.ratings.length; // Sum of (averageRating * count of ratings)
            overallRatingCount += prod.ratings.length; // Total number of ratings across products
          }
        });

        const overallAverageRating = overallRatingCount > 0 ? totalRatings / overallRatingCount : 0;

        setAverageRating(overallAverageRating);
        setRatingCount(overallRatingCount); // Count of all ratings

      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]); // Dependency added to useEffect

  const renderProductItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => handleViewDetails(item)}>
      <View style={styles.productItem}>
        <Text style={styles.productTitle}>{item.title}</Text>
        <View style={styles.imagecontainer}>
          {imageUris ? (
            <Image
              source={imageUris[item.id] ? { uri: imageUris[item.id] } : undefined}
              style={styles.productImage}
            />
          ) : (
            <ActivityIndicator size="small" color="#0000ff" />
          )}
        </View>
        <View style={styles.productdetailscontainer}>
          <Text style={styles.productDescription} numberOfLines={2} ellipsizeMode="tail">
            {item.description}
          </Text>
          <Text style={styles.productPrice}>P{item.price}</Text>
          <Text style={styles.productLocation}>{item.locate}</Text>
          <View style={styles.stars}>
            {[...Array(5)].map((_, index) => {
              const stars = index + 1; // 1 to 5
              return (
                <FontAwesome
                  key={stars}
                  name={stars <= Math.round(item.averageRating) ? 'star' : 'star-o'}
                  size={22}
                  color={stars <= Math.round(item.averageRating) ? '#FFC107' : '#E0E0E0'}
                />
              );
            })}
             <Text style={styles.averageRatingText}>
            {typeof item.averageRating === 'number' && !isNaN(item.averageRating)
              ? item.averageRating.toFixed(1)
              : '0.0'}
            {Array.isArray(item.ratings) && item.ratings.length > 0 ? ` (${item.ratings.length})` : ''}
          </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleViewDetails = (product: any) => {
    console.log('Viewing product details:', product.id);
    navigation.navigate('ProductDetails', { productId: product.id });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>    
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
          <Image source={icons.leftArrow} style={styles.backIconImage} />
        </TouchableOpacity>
        {user && (
          <Text style={styles.userName}>
            {user.Firstname} {user.Lastname}
          </Text>
        )}
        <View style={styles.ratingContainer}>
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
      </View>
      <Text style={styles.userName}>Products</Text>
      <FlatList
        data={(products ?? []).slice().reverse()}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProductItem}
        numColumns={2} // Set the number of columns to 2
        contentContainerStyle={styles.flatListContent}
        ListEmptyComponent={
          <View style={styles.emptyListContainer}>
            <Text style={styles.emptyListText}>This user has not posted any products yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};


export default UserProduct;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f2f2f2',
  },
  headerContainer: {
    backgroundColor: '#a5d6a7', // Light green background to highlight
    padding: 16,
    marginTop: 12, // Add padding to the top to avoid the status bar
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center', // Centers content vertically
    marginBottom: 16,
    position: 'relative', // Allows positioning the back icon absolutely
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2, // Adds subtle shadow on Android
  },
  backIcon: {
    position: 'absolute', // Makes sure it's not part of the flex layout
    left: 16, // Positions the icon 16 units from the left edge
    top: '50%', // Vertically centers the icon within the header
    transform: [{ translateY: -12 }], // Adjusts to truly center the icon
  },
  backIconImage: {
    width: 24,
    height: 24,
    tintColor: '#2c3e50', // Color for the back icon
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center', // Ensures the text stays centered
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#ffffff',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  ratingText: {
    fontSize: 16,
    color: '#757575', // Neutral color for the label
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffb300', // Yellow-orange to highlight the rating value
  },
  flatListContent: {
    paddingBottom: 16, // Add some space at the bottom of the FlatList
    paddingTop: 8, // Add some space at the top of the FlatList
  },
  productItem: {
    width: screenWidth * 0.45,
    maxWidth: 300,
    minWidth: 150,
    height: 360,
    marginBottom: 10,
    marginRight: 10,
    backgroundColor: "#fff",
    padding: 15,
    paddingHorizontal: 10,  // Add horizontal padding to balance content inside
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
    alignItems: 'center',         // Center items horizontally in container
    // justifyContent: 'center',      // Center items vertically if needed
  },
  productdetailscontainer: {
    width: '100%',
    flex: 1,
    marginRight: 5,
    // alignItems: 'center',         // Center items horizontally in container if needed
  },
  imagecontainer: {
    width: screenWidth * 0.4,
    height: screenHeight * 0.25,
    maxHeight: 200,
    marginRight: 5,
    alignItems: 'center',         // Ensure image content is centered
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
  },  
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34495e',
  },
  productDescription: {
    fontSize: 14,
    height: 40,
    color: '#7f8c8d',
    marginTop: 4,
    width: 'auto',
    flexShrink: 1,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a085',
    marginTop: 4,
  },
  productLocation: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 4,
  },
  productDate: {
    fontSize: 12,
    color: '#777',
    marginTop: 6,
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
  loadingContainer: {
    flex: 1, // Allow the container to take the full height of the screen
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
    backgroundColor: '#fff', // Optional: Set a background color
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyListText: {
    fontSize: 16,
    color: '#666', // Subtle color for the text
  },
});
