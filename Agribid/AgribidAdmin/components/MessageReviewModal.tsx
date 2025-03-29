import React, { useEffect } from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import MessageThread from "./MessageThread"; // Import the MessageThread component

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

interface Reporter {
  ReporterId: number; // Fixed casing (was ReporterId)
}

interface MessageReviewModalProps {
  visible: boolean;
  onClose: () => void;
  data: {
    messageDetails: Message[];
    reporter?: Reporter; // Made `reporter` optional to avoid crashes
  } | null;
}

const MessageReviewModal: React.FC<MessageReviewModalProps> = ({ visible, onClose, data }) => {
    console.log("Modal Visibility:", visible);
    console.log("Data Received:", data);
  
    const messagesArray = Array.isArray(data?.messageDetails) ? data.messageDetails : [];
  
    return (
      <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.messageHeader}>
              <Text style={styles.modalTitle}>💬 Messages</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
  
            {/* Messages Content */}
            {messagesArray.length > 0 ? (
              <View style={styles.messageBox}>
                <MessageThread messages={messagesArray} reporterId={data?.reporter?.ReporterId ?? 0} />
              </View>
            ) : (
              <Text style={styles.noMessageText}>No messages available.</Text>
            )}
          </View>
        </View>
      </Modal>
    );
  };
  

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0)", // Darker overlay for better focus
        justifyContent: "center",
        alignItems: "center",
      },
      modalContainer: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 12,
        width: "30%",
        height: "80%",
        alignItems: "center",
        borderWidth: 5,
        borderColor: "#ccc",
      },
      modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 10,
      },
      messageBox: {
        backgroundColor: "#f1f1f1",
        padding: 10,
        borderRadius: 8,
        width: "100%",
        height: "80%",
        marginBottom: 10,
      },
      messageHeader: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 10,
        flexDirection: "row",
        width: "100%",
        justifyContent: "space-between",
      },
      noMessageText: {
        fontSize: 14,
        fontStyle: "italic",
        color: "gray",
        textAlign: "center",
        marginTop: 20,
      },
      closeButton: {
        backgroundColor: "#ff4d4d",
        padding: 8,
        borderRadius: 6,
      },
      closeButtonText: {
        color: "#fff",
        fontWeight: "bold",
      },
});

export default MessageReviewModal;
