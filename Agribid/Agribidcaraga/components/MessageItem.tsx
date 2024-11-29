import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import ImageLoader  from '../components/imageprocessor';

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

const MessageItem: React.FC<{ message: Message; onPress: () => void }> = ({ message, onPress }) => {




  // Format the created_at date for a more readable format
  const timeAgo = (date: string) => {
    const now = new Date();
    const messageDate = new Date(date);
    const seconds = Math.floor((now.getTime() - messageDate.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    // Ensure that counting starts from 1 second, not 0
    if (seconds < 60) return `${Math.max(seconds, 1)}s`; // If 0 seconds, return 1s
    if (minutes < 60) return `${minutes}m`; // Less than an hour ago
    if (hours < 24) return `${hours}h`; // Less than a day ago
    if (days < 7) return `${days}d`; // Less than a week ago
    return `${weeks}w`; // More than a week ago
  };

  // Format the relative time for the message
  const relativeTime = timeAgo(message.created_at);

  const isImage = (messageText: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    return imageExtensions.some((ext) => messageText.toLowerCase().endsWith(ext));
  };

  // Check if the message is read
  const isRead = message.isRead === 0;

 // Determine if the message should be highlighted (only if the currentUser is not the sender)
 const messageContainerStyle = [
  styles.messageContainer,
  message.currentuserId !== message.sendId && isRead && styles.unreadMessage, // Apply unreadMessage style if the message is unread and not sent by current user
];


  return (
    <TouchableOpacity onPress={onPress}  style={messageContainerStyle}>
      <View style={styles.textContainer}>
        {/* Receiver's Name */}
        <Text style={styles.senderName}>
          {message.counterpart.Firstname} {message.counterpart.Lastname}
        </Text>

        {/* Message Row */}
        <View style={styles.messageRow}>
          <Text style={styles.usermessageText} numberOfLines={1}>
          {isImage(message.message) ? 'Image' : message.message || 'No message content'}
          </Text>
          <Text style={styles.messageTime}>{relativeTime}</Text>
        </View>
      </View>

      {/* Product Image */}
      <ImageLoader imageUri={message.product.image}
        style={styles.messageImage}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
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
    flex: 1, // This ensures the text group takes up the remaining space
    paddingRight: 10, // Add some padding to the right side
  },
  senderName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  messageRow: {
    flexDirection: 'row',  // Align items horizontally for the message and time
    alignItems: 'center',  // Align items vertically in the center
    marginTop: 5,
  },
  usermessageText: {
    fontSize: 15,
    color: '#000', // Black text for contrast
    backgroundColor: '#f1f1f1', // Light grey background
    padding: 5,
    borderRadius: 10,
    overflow: 'hidden', // Ensure text fits well
    maxWidth: '80%', // Limit message width
    alignSelf: 'flex-start', // Align left like a chat bubble
  },
  messageTime: {
    fontSize: 12,
    color: '#666', // Lighter gray for timestamp
    paddingLeft: 10,
  },
  messageImage: {
    width: 80,           // Fixed width for the image
    height: '100%',      // Image will stretch to match the height of the container
    marginLeft: 10,      // Space between text and image
    alignSelf: 'stretch', // Stretch the image vertically to match the text height
  },
});

export default MessageItem;
