import React, { useEffect, useState } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';
import * as FileSystem from 'expo-file-system';
import BASE_URL from '../components/ApiConfig';

interface Product {
  title: string;
  price: string;
  quantity: string;
  image: string;
}

interface ProductDetailsProps {
  product: Product | null;
  remainingQuantity: number;
}

const cacheOfferImage = async (uri: string) => {
  try {
    const filename = uri.split('/').pop();
    if (!filename) throw new Error('Invalid file URI');
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    const info = await FileSystem.getInfoAsync(fileUri);

    if (info.exists) {
      return fileUri; // Return cached image URI
    } else {
      const response = await FileSystem.downloadAsync(uri, fileUri);
      return response.uri; // Return newly downloaded image URI
    }
  } catch (error) {
    console.error('Error caching image:', error);
    return null; // Return null if an error occurs
  }
};

const ProductDetails: React.FC<ProductDetailsProps> = ({ product, remainingQuantity }) => {
  const [loading, setLoading] = useState(true);
  const [offerImageUri, setOfferImageUri] = useState<string | null>(null);

  const getQuantityExtension = (quantity: string) => {
    const match = quantity.match(/[a-zA-Z]+/); // Extract letters from the string
    return match ? match[0].trim() : ''; // Return the first matched extension or an empty string
  };

  const extension = getQuantityExtension(product?.quantity || ''); // Use offeredproduct.quantity

  useEffect(() => {}, [product]);

  useEffect(() => {
    if (product?.image) {
      const loadImage = async () => {
        const uri = `${BASE_URL}/storage/product/images/${product.image}?${new Date().getTime()}`;
        const cachedUri = await cacheOfferImage(uri);
        setOfferImageUri(cachedUri);
        setLoading(false);
      };

      loadImage();
    }
  }, [product?.image]);


  if (!product) {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>No product details available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{product.title}</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : offerImageUri ? (
        <Image source={{ uri: offerImageUri }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>Image not available</Text>
        </View>
      )}
      <Text style={styles.price}>Price: P{product.price}</Text>
      <Text style={styles.quantity}>
        Quantity: {remainingQuantity > 0 ? `${remainingQuantity} ${extension} ` : 'Out of stock'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    margin: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    borderRadius: 8,
    marginBottom: 8,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 8,
  },
  placeholderText: {
    color: '#999',
    fontSize: 14,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  quantity: {
    fontSize: 14,
    color: '#555',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProductDetails;
