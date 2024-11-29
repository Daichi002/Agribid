import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

// Rate interface for each rater's information
interface Rate {
  id: number;
  rater: { Firstname: string; Lastname: string };  // Expecting user details here
  rate: number;
  review: string | null;  // Review can be null
}

interface ProductRaterModalProps {
  visible: boolean;
  onClose: () => void;
  ratersData: Rate[]; // Correctly typed as an array of Rate
}

const ProductRaterModal: React.FC<ProductRaterModalProps> = ({ visible, onClose, ratersData }) => {

  // Render each rater item in the FlatList
  const renderRaterItem = ({ item }: { item: Rate }) => {
    return (
      <View style={styles.raterItem}>
        <Text style={styles.label}>
          Name: {item.rater.Firstname} {item.rater.Lastname}
        </Text>
        <View style={styles.ratingContainer}>
                          <View style={styles.stars}>
                            {[...Array(5)].map((_, index) => {
                              const stars = index + 1; // 1 to 5
                              return (
                                <FontAwesome
                                  key={stars}
                                  name={stars <= Math.round(item.rate) ? 'star' : 'star-o'}
                                  size={22}
                                  color={stars <= Math.round(item.rate) ? '#FFC107' : '#E0E0E0'}
                                />
                              );
                            })}
                            <Text style={styles.averageRatingText}>
                              {item.rate.toFixed(1)} 
                            </Text>                  
                        </View>
                      </View>
        <Text style={styles.ratingText}>Review: {item.review || 'No review provided'}</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}> 
            <Text style={styles.headerText}>Rater Details</Text>
          {/* FlatList to display the list of raters */}
          <FlatList
            data={ratersData}
            renderItem={renderRaterItem}
            keyExtractor={(item) => item.id.toString()}  // Ensure unique key for each item
            ListEmptyComponent={<Text style={styles.emptyMessage}>No ratings available.</Text>} // Display message when no data
          />
          {/* Close button to close the modal */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default ProductRaterModal;

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',  // Semi-transparent background
  },
  modalContent: {
    height: '50%',
    width: '90%',
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  raterItem: {
    backgroundColor: '#fff',
    margin: 5,
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    elevation: 2,
    overflow: 'hidden', // Ensures anything overflowing is clipped
    justifyContent: 'space-between', // Ensure content spacing within the container
    
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#f44336',  // Red for close button
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyMessage: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
    marginTop: 20,  // Padding around the empty message
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
});
