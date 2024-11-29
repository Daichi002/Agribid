import React from "react";
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import ImageLoader  from './imageprocessor';
import BASE_URL from '../components/ApiConfig';

interface User {
  Firstname: string;
  Lastname: string;
}

interface Product {
  id: number;
  image: string;
  title: string;
}

interface UserReplyDetail {
  id: number;
  text: string;
  created_at: string;
  user: User;
  isRead: number;
  product: Product;
}

interface UserReplyDetailsListProps {
  userReplyDetails: UserReplyDetail[];
  setNotifications: React.Dispatch<React.SetStateAction<UserReplyDetail[]>>;
}

const ViewNotification = async (
  product: Product,
  reply: UserReplyDetail,
  navigation: any,
  setNotifications: React.Dispatch<React.SetStateAction<UserReplyDetail[]>>

  
) => {
  // console.log("Product:", product);
  // console.log("Reply:", reply); // Log the reply object
  if (!reply || !reply.id) {
    console.error("Invalid reply object or missing id:", reply);
    return;
  }
  try {
    const token = await AsyncStorage.getItem("authToken");
    if (!token) {
      console.error("Token not found");
      navigation.navigate("(auth)/login");
      return;
    }


    console.log("Viewing product details:", product.id);
    console.log("Marking notification as read:", reply.id);

    const response = await axios.post(
      `${BASE_URL}/api/reply/notifications/${reply.id}/mark-read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 200) {
      console.log("Notification marked as read");

      // Update the isRead status locally
      if (setNotifications) {
        setNotifications((prevNotifications) =>
          prevNotifications.map((notif) =>
            notif.id === reply.id ? { ...notif, isRead: 1 } : notif
          )
        );
      }
    } else {
      console.error("Failed to mark notification as read", response);
    }

    // Navigate to product details page
    navigation.navigate("ProductDetails", { productId: product.id });
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
};

const UserReplyDetailsList: React.FC<UserReplyDetailsListProps> = ({ userReplyDetails, setNotifications  }) => {
    const navigation = useNavigation();
  const renderReplyItem = ({ item }: { item: UserReplyDetail }) => {
    const { text, created_at, user, product, isRead } = item;

     // Define a style for highlighted container if the comment is unread
     const commentContainerStyle = isRead === 0
     ? [styles.replyContainer, styles.unreadCommentContainer] // Apply the highlight style
     : styles.replyContainer;


    return (
      <TouchableOpacity onPress={() => ViewNotification(product, item, navigation, setNotifications)}>
      <View style={commentContainerStyle}>
      <ImageLoader imageUri={product.image}
          style={styles.productImage}
        />
        <View style={styles.textContainer}>
          <Text style={styles.notificationText}>
            {user ? (
              <Text style={styles.userName}>
                {user.Firstname} {user.Lastname}
              </Text>
            ) : (
              "A user"
            )}{" "}
            replied to you on the product{" "}
            <Text style={styles.productTitle}>{product.title}</Text>: "{text}"
          </Text>
          <Text style={styles.replyDate}>{new Date(created_at).toLocaleString()}</Text>
        </View>
      </View>
        </TouchableOpacity>
    );
  };

  return (
    <View>
    <FlatList
      data={userReplyDetails}
      renderItem={renderReplyItem}
      keyExtractor={(item) => item.id.toString()}
    />
    </View>
  );
};

const styles = StyleSheet.create({
  replyContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "white",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 3,
    overflow: "hidden",
  },
  unreadCommentContainer: {
    backgroundColor: "#f0f8ff",
    borderColor: "#007aff",
    borderWidth: 1,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 5,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    marginBottom: 5,
  },
  productTitle: {
    fontWeight: "bold",
  },
  replyDate: {
    fontSize: 12,
    color: "#666",
  },
  userName: {
    fontWeight: "bold",
  },
});

export default UserReplyDetailsList;
