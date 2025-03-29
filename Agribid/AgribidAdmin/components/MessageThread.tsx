import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";

interface Message {
  messageId: number;
  text: string;
  createdAt: string;
  sender: {
    id: number;
    FirstName: string;
    LastName: string;
  };
}

interface MessageThreadProps {
    messages: Message[];
    reporterId: number; // Allow null values
  }

  const MessageThread: React.FC<MessageThreadProps> = ({ messages, reporterId }) => {
    const renderMessage = ({ item }: { item: Message }) => {
      const isReporter = item.sender.id === reporterId; // Avoid errors
      console.log("Message Sender ID:", item.sender.id, "Reporter ID:", reporterId); // Debugging line
  
      return (
        <View style={[styles.messageContainer, isReporter ? styles.rightMessage : styles.leftMessage]}>
        <View style={[styles.messageBubble, isReporter ? styles.rightMessageBubble : styles.leftMessageBubble]}>
          <Text style={styles.senderName}>
            {`${item.sender.FirstName} ${item.sender.LastName}`}
          </Text>
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={styles.timestamp}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
        </View>
      </View>      
      );
    };
  
    return (
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.messageId.toString()}
      />
    );
  };

  const styles = StyleSheet.create({
    messageContainer: {
      flexDirection: "row",
      alignItems: "flex-start", // Align text bubbles correctly
      marginVertical: 5,
      width: "100%", // Ensure full width for alignment
    },
    leftMessage: {
      alignSelf: "flex-start",
      justifyContent: "flex-start",
    },
    rightMessage: {
      alignSelf: "flex-end",
      justifyContent: "flex-end",
    },
    messageBubble: {
      maxWidth: "75%",
      padding: 10,
      borderRadius: 10,
    },
    leftMessageBubble: {
      backgroundColor: "#e1f5fe", // Gray for other users
      alignSelf: "flex-start",
    },
    rightMessageBubble: {
      backgroundColor: "#c8e6c9", // Blue for the reporter
      alignSelf: "flex-end",
    },
    senderName: {
      fontSize: 12,
      fontWeight: "bold",
      marginBottom: 2,
    },
    messageText: {
      fontSize: 14,
    },
    timestamp: {
      fontSize: 10,
      marginTop: 3,
      textAlign: "right",
    },
  });
  

export default MessageThread;
