import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import ImageLoader  from './imageprocessor';
import BASE_URL from '../components/ApiConfig';

interface Notification {
  user: {
    Firstname: string;
    Lastname: string;
  };
  from: {
    id: number;
    title: string;
    image: string;
  };
  resource?: string;
  type: 'comment' | 'reply' | 'reply_to' | string;
  isRead: number;
}

const NotificationItem = ({ notification, onPress }: { notification: Notification, onPress: () => void }) => {
  const { user, from, type, resource, isRead } = notification;
  const userName = `${user.Firstname} ${user.Lastname}`;
  const productTitle = from.title;
  const productImage = from.image;

  // Construct notification message based on the type
  let message = '';
  switch (type) {
    case 'comment':
      message = `commented on your product "${productTitle}" ${resource ? `-- ${resource}` : ''}`;
      break;
    case 'reply':
      message = `replied to your comment on "${productTitle}" ${resource ? `-- ${resource}` : ''}`;
      break;
    case 'reply_to':
      message = `replied to you on "${productTitle}" ${resource ? `-- ${resource}` : ''}`;
      break;
    default:
      message = 'You have a new notification';
      break;
  }

  // Apply style for unread notifications (isRead === 0)
  const containerStyle = isRead === 0 ? styles.unreadNotification : styles.readNotification;


  return (
    <TouchableOpacity style={[styles.notificationContainer, containerStyle]} onPress={onPress}>
      <ImageLoader
        imageUri={`${BASE_URL}/storage/product/images/${productImage}`}
        style={styles.productImage}
      />
      <View style={styles.textContainer}>
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </TouchableOpacity>
  );
};


const styles = StyleSheet.create({
  notificationContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginVertical: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textContainer: {
    marginLeft: 15,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  message: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  unreadNotification: {
    backgroundColor: '#f0f8ff', // Light blue background for unread notifications
    borderColor: '#007bff', // Blue border for unread notifications
  },
  readNotification: {
    backgroundColor: '#fff', // Default background for read notifications
    borderColor: '#ddd', // Default border color for read notifications
  },
});

export default NotificationItem;
