import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import BASE_URL from '../components/ApiConfig';

interface ProductItemProps {
    item: {
      id: number;
      title: string;
      description: string;
      quantity: number;
      price: number;
      locate: string;
      image: string;
      user_id: number;
      created_at: string;
      updated_at: string;
    };
    handleViewDetails: (item: any) => void;
    onRefresh: () => void;
  }
const RenderProductMessages: React.FC<ProductItemProps>  = ({ item }) => {
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      const loadImage = async () => {
        const uri = `${BASE_URL}/storage/product/images/${item.image}`;
        const cachedUri = await cacheImage(uri);
        setImageUri(cachedUri);
        setLoading(false);
      };
  
      loadImage();
    }, [item.image]);
    
    const handleViewMessage = (product) => {
      console.log("message:", product);
    };
  
    return (
      <TouchableOpacity onPress={() => handleViewMessage(item)}>
        <View style={styles.productItem}>
          {loading ? (
            <Text>Loading...</Text>
          ) : (
            <Image source={{ uri: imageUri }} style={styles.productImage} />
          )}
          <View style={styles.productdetails}>
            <Text style={styles.productTitle}>{item.title}</Text>
            <Text style={styles.productDescription}>Description: {item.description}</Text>
            <Text style={styles.productDate}>
              Date Created: {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
        </TouchableOpacity>
    );
  };

export default RenderProductMessages
const styles = StyleSheet.create({
productdetails: {
    flex: 1,
  },
  productItem: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    shadowColor: "#333",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 10,
  },
  productDetails: {
    flex: 1, // Takes the remaining space
  },
  productTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  productDescription: {
    fontSize: 14,
    color: '#777',
    marginBottom: 5,
  },
  productDate: {
    fontSize: 12,
    color: '#AAA',
  },
});

