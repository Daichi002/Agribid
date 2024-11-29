import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { icons } from '../constants';
import { router, useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from '../components/ApiConfig';

const Rating = () => {
  const navigation = useNavigation();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const { transaction_id, productId, userId } = useLocalSearchParams();
  const ratingDescriptions = [
    { stars: 1, label: 'Very Bad', emoji: '😞' },
    { stars: 2, label: 'Bad', emoji: '😕' },
    { stars: 3, label: 'Okay', emoji: '😐' },
    { stars: 4, label: 'Good', emoji: '😊' },
    { stars: 5, label: 'Excellent', emoji: '🤩' },
  ];

  useEffect(() => {
    console.log('Transaction ID:', transaction_id);
    console.log('Product ID:', productId);
    console.log('User ID:', userId);
  }, []);

  const handleRating = (star: React.SetStateAction<number>) => setRating(star);

  const submitRating = async () => {
    try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
            console.error('No auth token found');
            return;
        }

        console.log('Submitted Rating:', rating, 'Review:', review);

        const response = await axios.post(
            `${BASE_URL}/api/ratings`,
            {
                transaction_id: transaction_id,       // Transaction ID
                rate: rating,             // Rating value
                review: review,           // Optional review text
                product_id: productId,           // Specify the product ID here
                user_id: userId              // Specify the user ID here
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.status === 201|| response.status === 200) {
          console.log("Rating submitted successfully");
          router.push({
            pathname: '../history/torate',
          });
        } else {
          console.error("Failed to submit Rating");
        }

        console.log('Rating submitted:', response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
          // Handle Axios-specific errors
          console.error('Axios error occurred:', error.message);
          
          if (error.response) {
              // The request was made and the server responded with a status code
              // that falls out of the range of 2xx
              console.error('Response error:', error.response.data);
              console.error('Response status:', error.response.status);
          } else if (error.request) {
              // The request was made but no response was received
              console.error('No response received:', error.request);
          } else {
              // Something happened in setting up the request that triggered an Error
              console.error('Request setup error:', error.message);
          }
      } else {
          // Handle other errors (non-Axios)
          if (error instanceof Error) {
            console.error('Error submitting rating:', error.message || error);
          } else {
            console.error('Error submitting rating:', error);
          }
      }
  }  
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

      <View style={styles.headerContainer}>
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
      <Image source={icons.leftArrow} style={styles.backIconImage} />
    </TouchableOpacity>
    <Text style={styles.headerText}>Rate this Product</Text>
  </View>

        <View style={styles.card}>
          <View style={styles.ratingContainer}>
            <Text style={styles.label}>Your Rating</Text>
            <View style={styles.stars}>
                {ratingDescriptions.map(({ stars }) => (
                <TouchableOpacity key={stars} onPress={() => handleRating(stars)}>
                    <FontAwesome
                    name={stars <= rating ? 'star' : 'star-o'}
                    size={32}
                    color={stars <= rating ? '#FFC107' : '#E0E0E0'}
                    />
                </TouchableOpacity>
                ))}
            </View>
            {rating > 0 && (
        <View style={styles.ratingDescription}>
          <Text style={styles.ratingEmoji}>
            {ratingDescriptions[rating - 1].emoji}
          </Text>
          <Text style={styles.ratingLabel}>
            {ratingDescriptions[rating - 1].label}
          </Text>
        </View>
      )}
          </View>

          <View style={styles.reviewContainer}>
            <Text style={styles.label}>Write a Review</Text>
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience..."
              placeholderTextColor="#AAA"
              value={review}
              onChangeText={setReview}
              multiline
            />
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={submitRating}>
            <Text style={styles.submitButtonText}>Submit Rating</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Rating;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: '#28a745',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  backIcon: {
    marginRight: 10,
    padding: 10,
    borderRadius: 50,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backIconImage: {
    tintColor: '#28a745',
    width: 24,
    height: 24,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: '500',
    color: '#555',
    marginBottom: 10,
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  ratingDescription: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  ratingLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  reviewContainer: {
    marginBottom: 20,
  },
  reviewInput: {
    height: 100,
    padding: 15,
    borderColor: '#DDD',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    textAlignVertical: 'top',
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});


