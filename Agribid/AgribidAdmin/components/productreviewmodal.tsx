import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import BASE_URL from './ApiConfig';

interface ProductReviewModalProps {
  visible: boolean;
  onClose: () => void;
  data?: {
    user: any;
    id: string;
    title: string;
    description: string;
    price: string;
    quantity: string;
    image: string;
    commodity?: string;
    live?: boolean;
    created_at?: string;
  };
}

const ProductReviewModal: React.FC<ProductReviewModalProps> = ({ visible, onClose, data }) => {
  if (!visible) return null;

  return (
    <Modal transparent={true} animationType="fade" visible={visible}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Product Details</Text>

          {data ? (
            <>
              {/* Display product image */}
              {data.image && (
                <Image
                  source={{ uri: `${BASE_URL}/storage/product/images/${data.image}` }}
                  style={styles.productImage}
                />
              )}

              {/* Display product details */}
              <View style={styles.details}>
              <Text style={styles.text}>Item ID: {data.id}</Text>
              <Text style={styles.text}>Islive: {data.live}</Text>
              <Text style={styles.text}>Posted By: {data.user.Firstname} {data.user.Lastname}</Text>
              <Text style={styles.text}>Title: {data.title}</Text>
              <Text style={styles.text}>Commodity: {data.commodity}</Text>
              <Text style={styles.text}>Description: {data.description}</Text>
              <Text style={styles.text}>Price: {data.price}</Text>
              <Text style={styles.text}>Quantity: {data.quantity}</Text>
              <Text style={styles.text}>Created: {data.created_at}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.noDataText}>No data available</Text>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0)', // Darker background to make modal content pop
  },
  modalContent: {
    width: '30%', // Adjust width for better responsiveness
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  details:{
    padding: 5,
    width: '100%',
    borderWidth : 1,
    height: "auto",
    
  },
  text: {
    fontSize: 16,
    color: '#555',
    marginVertical: 5,
  },
  productImage: {
    width: '100%', // Make image width responsive
    height: 200,
    resizeMode: 'contain',
    marginBottom: 15,
    borderRadius: 10,
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginVertical: 20,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 6,
    alignSelf: 'center',
    width: '80%',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default ProductReviewModal;
