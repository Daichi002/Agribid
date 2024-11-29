import React, { ReactNode } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, Alert, Modal, Dimensions, RefreshControl } from 'react-native';
import ImageLoader  from './imageprocessor';
import BASE_URL from '../components/ApiConfig';

const screenWidth = Dimensions.get('window').width;
const { width } = Dimensions.get('window'); 

interface Request {
  id: number;
  product: {
    quantity: ReactNode;
    image: string;
    title: string;
    description: string;
    price: number;
  };
  quantity: number;
  location: string;
  buyer: {
    Firstname: string;
    Lastname: string;
  };
  
}

interface ApprovalRequestProps {
  requests: Request[];
  onApprove: (id: number) => void;
  onDecline: (id: number) => void;
  onRefreshApproval: () => Promise<void>;
}

const ApprovalRequest: React.FC<ApprovalRequestProps> = ({ requests, onApprove, onDecline, onRefreshApproval }) => {
  const [modalVisible, setModalVisible] = React.useState(false);
  const [selectedRequest, setSelectedRequest] = React.useState<Request | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshApproval(); // Call parent function to refresh the data
    setIsRefreshing(false); // Stop refreshing when done
  };

  const handleApprove = (id: number) => {
    Alert.alert('Approve Request', 'Are you sure you want to approve this request?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: () => onApprove(id) },
    ]);
  };

  const handleDecline = (id: number) => {
    Alert.alert('Decline Request', 'Are you sure you want to decline this request?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Decline', onPress: () => onDecline(id) },
    ]);
  };

  const renderItem = ({ item }: { item: Request }) => (

    <TouchableOpacity
      onPress={() => {
        setSelectedRequest(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.previewcard}>
        <ImageLoader imageUri={item.product.image}
          style={styles.previewproductImage}
        />
        <View style={styles.previewdetails}>
          <Text style={styles.previewtitle}>{item.product.title}</Text>
          <Text style={styles.previewprice}>Current Quantity: {item.product.quantity}</Text>
          <Text style={styles.previewquantity}>Requested Quantity: {item.quantity}</Text>
          <Text style={styles.previewlocation}>Location: {item.location}</Text>
          <Text style={styles.previewbuyer}>
            Buyer: {item.buyer.Firstname} {item.buyer.Lastname}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1 }}>
     <FlatList
        data={requests} // Your data source
        keyExtractor={(item) => item.id.toString()} // Convert `id` to string
        renderItem={renderItem} // Function to render each item
        contentContainerStyle={[
          styles.container,
          requests && requests.length === 0 && styles.emptyContainer, // Adjust styling for empty state
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No requests found</Text>
          </View>
        } // Component displayed when data is empty
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh} // Attach the refresh handler
          />
        }
  
      />


      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedRequest(null);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
          <View style={styles.messageheader}>
                <Text style={styles.headerText}> 
                Pending Approval!
             </Text>
                  <View style={styles.modalButtonContainer}>
                <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalButtonText}>Close</Text>
                </TouchableOpacity>
                </View>
              </View>
            {selectedRequest && (
              <>
                <Image
                  source={{
                    uri: `${BASE_URL}/storage/product/images/${selectedRequest.product.image}`,
                  }}
                  style={styles.productImage}
                />
                <Text style={styles.title}>{selectedRequest.product.title}</Text>
                <Text style={styles.description}>{selectedRequest.product.description}</Text>
                <Text style={styles.price}>Price: ₱{selectedRequest.product.price}</Text>
                <Text style={styles.previewprice}>Current Quantity: {selectedRequest.product.quantity}</Text>
                <Text style={styles.quantity}>Requested Quantity: {selectedRequest.quantity}</Text>
                <Text style={styles.location}>Location: {selectedRequest.location}</Text>
                <Text style={styles.buyer}>
                  Buyer: {selectedRequest.buyer.Firstname} {selectedRequest.buyer.Lastname}
                </Text>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => {
                      handleApprove(selectedRequest.id);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={styles.buttonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.declineButton}
                    onPress={() => {
                      handleDecline(selectedRequest.id);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={styles.buttonText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
  },
  previewcard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    padding: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    height: 110,
    width: width * 0.88,
    flexDirection: 'row',
  },
  previewproductImage: {
    width: width * 0.4,
    height: '100%',
    borderRadius: 8,
    marginRight: 10,
  },
  previewdetails: {
    marginBottom: 5,
  },
  previewtitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 1,
  },
  previewdescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 1,
  },
  previewprice: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 1,
  },
  previewquantity: {
    fontSize: 14,
    marginBottom: 1,
  },
  previewlocation: {
    fontSize: 14,
    marginBottom: 1,
    fontStyle: 'italic',
  },
  previewbuyer: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewactions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
    marginRight: 16,
  },
  details: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  quantity: {
    fontSize: 14,
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  buyer: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  declineButton: {
    backgroundColor: '#F44336',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  messageheader: {
    flexDirection: 'row', // Arrange items in a row
    justifyContent: 'space-between', // Space items out evenly
    alignItems: 'center', // Center items vertically
    padding: 10, // Add some padding for spacing
    paddingLeft: screenWidth * 0.03, // 10% of screen width for left padding (adjustable)
    paddingRight: screenWidth * 0.001, // Add padding to the right side
    width: '100%', // Ensure it takes up full width
    borderBottomWidth: 1, // Optional: Add border for separation
    borderBottomColor: '#ccc',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalButtonContainer: {
    marginTop: 10,
    marginBottom: 10,
    paddingLeft: screenWidth * 0.1, // 10% of screen width for left padding (adjustable)
    paddingRight: screenWidth * 0.05, // Adjust the right padding for responsiveness
    flexDirection: 'row', // Arrange the button and other elements horizontally
    justifyContent: 'flex-end', // Align buttons to the right
  },
  modalButton: {
    backgroundColor: '#4CAF50', // Elegant green color
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25, // Rounded edges
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5, // For Android shadow
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto', // Push button to the right
  },
  modalButtonText: {
    color: '#fff', // White text for contrast
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ApprovalRequest;
