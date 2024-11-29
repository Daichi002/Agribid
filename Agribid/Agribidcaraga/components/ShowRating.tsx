// ShowRating.tsx
import React from 'react';
import { View, Text, Modal, FlatList, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface Rating {
  rate: number;
  rater: { firstname: string; lastname: string }; // Adjust as per your data
  review: string | null;
}

interface ShowRatingProps {
  visible: boolean;
  ratings: Rating[];
  onClose: () => void;
}

const ShowRating = ({ visible, ratings, onClose }: ShowRatingProps) => {
    if (!visible) return null;

    const StarRating = ({ rating}: { rating: number}) => (
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
          {rating ? rating.toFixed(1) : '0.0'}
          </Text>
        </View>
      );
  
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Ratings</Text>
            <FlatList
              data={ratings}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.ratingItem}>
                    <Text style={styles.raterName}>{item.rater.firstname} {item.rater.lastname}</Text>
                    
                    <View style={styles.ratingContainer}>
                        <StarRating 
                        rating={item.rate || 0}  // fallback for missing rate
                        />
                    </View>
                    
                    <Text style={styles.reviewText}>Review: {item.review || 'No review'}</Text>
                    </View>
              )}
            />
            <Text style={styles.closeButton} onPress={onClose}>Close</Text>
          </View>
        </View>
      </Modal>
    );
  };
  

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  ratingItem: {
    borderWidth: 1,
    backgroundColor: '#fff',   // White background to make it pop
    borderRadius: 8,           // Rounded corners for a soft feel
    padding: 15,               // Padding around the content
    marginBottom: 15,          // Space between items
    shadowColor: '#000',       // Shadow for a subtle elevation
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,        // Light shadow for subtle effect
    shadowRadius: 5,           // Soft edges for the shadow
    elevation: 3,              // Elevation for Android
  },
  raterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',             // Dark grey text for names
    marginBottom: 5,           // Space between name and rating
  },
  reviewText: {
    fontSize: 14,
    color: '#777',             // Lighter grey for the review text
    fontStyle: 'italic',       // Italic for the review text
  },
  closeButton: {
    color: '#007BFF',
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
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
});

export default ShowRating;
