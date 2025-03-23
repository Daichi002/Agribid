import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
} from 'react-native';
import ImageLoader from './imageprocessor';
import icons from '../constants/icons'; // Your icons import
import BASE_URL from '../components/ApiConfig';

interface Message {
    isRead: number;
    id: number;
    sendId: string;
    receiveId: string;
    product: {
      image: string;
    };
    counterpart: {
      id: string
      Firstname: string;
      Lastname: string;
    };
    message: string;
    currentuserId: string;
    created_at: string;
  }


interface Product {
  product: {
    id: number;
    title: string;
    image: string;
  };
  messages: Message[];
}

const ProductList = ({ products, onMessagePress }: { products: Product[], onMessagePress: (message: Message) => void }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

  // Function to determine if the message is an image
  const isImage = (messageText: string): boolean => {
    if (!messageText) return false;
    return imageExtensions.some((ext) => messageText.toLowerCase().endsWith(ext));
  };

  // Format the created_at date for a more readable format
  interface TimeAgoFunction {
    (date: string): string;
  }

  const timeAgo: TimeAgoFunction = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const seconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if (seconds < 60) return `${Math.max(seconds, 1)}s`;
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return `${weeks}w`;
  };

  interface ProductClickHandler {
    (product: Product): void;
  }

  const handleProductClick: ProductClickHandler = (product) => {
    setSelectedProduct(product);
    console.log('Selected Product:', JSON.stringify(product, null, 2));
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedProduct(null);
  };

  const renderProduct = ({ item }: { item: Product }) => {
    const sessionCount = item.messages.length;
    const imageUri = `${BASE_URL}/storage/product/images/${item.product.image}`;
    const loading = false;

    // console.log('Sorted User messages:', JSON.stringify(item.messages, null, 2));

    return (
      <TouchableOpacity
        style={styles.productItem}
        onPress={() => handleProductClick(item)}
      >
        {/* Product Image */}
        {loading ? (
          <Image
            source={icons.LoadingAgribid}
            style={styles.loadingicon}
            resizeMode="contain"
          />
        ) : imageUri ? (
          <ImageLoader imageUri={imageUri} style={styles.productImage} />
        ) : null}

        {/* Product Details */}
        <View style={styles.productDetails}>
          <Text style={styles.productTitle}>{item.product.title}</Text>
          <View style={styles.messagepreview}>
            {/* Preview of the latest message */}
            {sessionCount > 0 && (
            <Text style={styles.latestMessage} numberOfLines={1} ellipsizeMode="tail">
                {
                // Check for unread message with isRead === 0 first
                item.messages.find(msg => msg.isRead === 0) ? 
                    // Display the first unread message
                    `${item.messages.find(msg => msg.isRead === 0)?.counterpart?.Firstname || ''} ${item.messages.find(msg => msg.isRead === 0)?.counterpart?.Lastname || ''}: ${isImage(item.messages.find(msg => msg.isRead === 0)?.message || '') ? 'Image' : item.messages.find(msg => msg.isRead === 0)?.message || ''}`
                :
                    // Otherwise display the latest message (if no unread message)
                    `${item.messages[0]?.counterpart?.Firstname || ''} ${item.messages[0]?.counterpart?.Lastname || ''}: ${isImage(item.messages[0]?.message || '') ? 'Image' : item.messages[0]?.message || ''}`
                }
            </Text>
            )}
          </View>

          {sessionCount > 0 ? (
        <Text style={styles.messagecount}>
            {/* Conditionally change icon based on unread messages and sendId check */}
            <Image
            source={
                item.messages.some(msg => msg.isRead === 0 && msg.sendId !== msg.currentuserId) 
                ? icons.contactnoti // Show notification icon if there's an unread message and the sendId is not the currentUserId
                : icons.contact // Show default icon if no unread message or if the sendId is the currentUserId
            }
            style={styles.icon}
            resizeMode="contain"
            />
            Messages: {sessionCount}
        </Text>
        ) : (
        <Text style={styles.noMessagesText}>No messages yet</Text>
        )}

        </View>
      </TouchableOpacity>
    );
  };


  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.product.id.toString()}
        renderItem={renderProduct}
      />

      {/* Modal for Messages */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Product Title */}
            <Text style={styles.modalTitle}>
              {selectedProduct?.product.title || 'Product Details'} Messages
            </Text>

            {/* List of Messages */}
            <FlatList
              data={selectedProduct?.messages}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                console.log('Selected Product Messages render:', JSON.stringify(item, null, 2)),
                <TouchableOpacity
                style={[
                  styles.messageItem,
                  item.isRead === 0 && item.sendId !== item.currentuserId && styles.unreadMessage, // Apply highlight style if the message is unread and not sent by current user
                ]}
                onPress={() => {
                  onMessagePress(item);  // Your message press handler
                  closeModal();  // Close the modal when a message is pressed
                }}
              > 
                <View style={styles.textContainer}>           
                 {/* Sender's Full Name */}
                  <Text style={styles.messageSender} >
                    {`${item.counterpart?.Firstname || 'Unknown'} ${item.counterpart?.Lastname || ''}`}
                  </Text>  
                  <View style={styles.messageRow}>
                  {/* Message Content */}
                  <Text style={styles.messageText} numberOfLines={1}>
                    {isImage(item.message) ? 'Image' : item.message || 'No message content'}
                  </Text>

                  {/* Relative Time */}
                  <Text style={styles.messageDate}>{timeAgo(item.created_at)}</Text>
                  </View>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.noMessages}>No messages available</Text>
              }
            />

            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 5,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  loadingicon: {
    width: 50,
    height: 50,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 5,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  messagecount: {
    fontSize: 16,
    color: '#333',
    marginTop: 4,
    direction: 'rtl',
    flexDirection: 'row',
  },
  messagepreview:{
    borderWidth: 1,
  },
  latestMessage: {
    padding: 5,
    fontWeight: 'bold',
    fontSize: 14,
    color: '#555', // A subtle color for better distinction
    marginTop: 4, // Spacing below the title or message count
  },
  noMessagesText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4,
  },
  productDate: {
    fontSize: 14,
    color: '#666',
  },
  icon: {
    width: 24,
    height: 24,
    marginRight: 4,
    position: 'relative',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#B4CBB7',
    borderRadius: 10,
    padding: 20,
    height: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottomWidth: 1,
  },
  messageItem: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    height: 70,                // Full width of the parent container
    width: '100%',                // Full width of the parent container
    backgroundColor: '#f9f9f9',
    flexDirection: 'row',         // Row-oriented for text and image
    alignItems: 'center',         // Vertically align items
    justifyContent: 'space-between', // Space items evenly across the row
  },
  unreadMessage: {
    backgroundColor: '#e3f2fd', // Highlight color for unread messages
    borderLeftWidth: 5,
    borderLeftColor: '#42a5f5', // Blue border to indicate unread
  },
  textContainer: {
    // flex: 1, // This ensures the text group takes up the remaining space
    paddingRight: 10, // Add some padding to the right side
  },
  messageRow: {
    flexDirection: 'row',  // Align items horizontally for the message and time
    alignItems: 'center',  // Align items vertically in the center
    marginTop: 5,
  },
  messageText: {
    fontSize: 15,
    color: '#000', // Black text for contrast
    backgroundColor: '#f1f1f1', // Light grey background
    padding: 5,
    borderRadius: 10,
    overflow: 'hidden', // Ensure text fits well
    maxWidth: '80%', // Limit message width
    alignSelf: 'flex-start', // Align left like a chat bubble
  },
  messageSender: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    borderBottomWidth: 1,
  },
  messageDate: {
    fontSize: 12,
    color: '#666', // Lighter gray for timestamp
    paddingLeft: 10,
  },
  noMessages: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default ProductList;
