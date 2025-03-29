import { View, Text, FlatList, ActivityIndicator, ScrollView, StyleSheet, Image, Dimensions, TouchableOpacity, Modal } from "react-native";
import React, { useEffect, useState } from "react";
import { fetchApprovedTransactions } from "../../components/gettransaction"; // Adjust the import path if needed
import AnalyticsChart from "../../components/AnalyticsChart";
import BASE_URL from '../../components/ApiConfig';



interface Transaction {
    id: number;
    product?: { name: string; commodity?: string; description?: string; price?: number; quantity?: number; image?: string };
    buyer?: { Firstname: string; Lastname: string };
    seller?: { Firstname: string; Lastname: string; Address: string; Phonenumber: string };
    quantity: number;
    location: string;
    is_approve: boolean;
    messages: { text: string }[];
  }
interface Buyer {
    Firstname: string;
    Lastname: string;
    id?: number;
  }

  interface Seller {
    Firstname: string;
    Lastname: string;
    Address: string;
    Phonenumber: string;
    id?: number;
  }

  interface Message {
    text: string;
    sender_id: number; // Ensure sender_id is included
  }

  
const Transactions = () => {
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<{ text: string }[]>([]);
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);

  useEffect(() => {
    const getTransactions = async () => {
      const data = await fetchApprovedTransactions();
      setTransactions(data);
      setLoading(false);
    };

    getTransactions();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  

  const openMessagesModal = (
    messages: Message[],
    buyer: Buyer | null,
    seller: Seller | null
  ): void => {
    setSelectedMessages(messages);
    setBuyer(buyer);
    setSeller(seller);
    setModalVisible(true);
    console.log("Selected Messages:", messages); // Log the selected messages
    console.log("Buyer:", buyer); // Log the selected buyer
    console.log("Seller:", seller); // Log the selected seller
  };


  return (
    <View style={{ flex: 1 }}>
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Transactions</Text>
      <AnalyticsChart transactions={transactions} />
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2} // Two columns per row
        columnWrapperStyle={styles.row} // Ensures spacing between columns
        renderItem={({ item }) => (
          <View style={styles.card}>
            {/* Image & Details in a row */}
            <View style={styles.rowContainer}>
              {/* Product Image */}
              <Image
                source={{ uri: `${BASE_URL}/storage/product/images/${item.product?.image}` }}
                style={styles.productImage}
              />

              {/* Transaction Details */}
              <View style={styles.detailsContainer}>
                {/* Product Information & Message Row */}
                <View style={styles.ProductmessagerowContainer}>
                  {/* Product Details */}
                  <View>
                  <Text style={styles.title}>{item.product?.commodity || "No Product"}</Text>
                  <Text style={styles.description}>{item.product?.description || "No Description"}</Text>
                  <Text>📍 Location: {item.location}</Text>
                  <Text>💰 Price: ₱{item.product?.price} </Text>
                  <Text>Current Quantity {item.product?.quantity}</Text>
                </View>
                  {/* Message  */}
                  <TouchableOpacity onPress={() => openMessagesModal(item.messages, item.buyer, item.seller)} style={styles.messageButton}>
                  <Text style={styles.messageButtonText}>💬 View Messages</Text>
                </TouchableOpacity>

                </View>
                {/* Buyer & Seller Information in One Row */}
                <View style={styles.buyerSellerRow}>
                  {/* Buyer */}
                  <View style={styles.buyerSeller}>
                    <Text style={styles.sectionHeader}>👤 Buyer</Text>
                    <Text style={styles.sectionHeader}>{item.buyer?.Firstname || "Unknown"} {item.buyer?.Lastname || "Unknown"}</Text>
                    <Text>📦 Bought: {item.quantity}</Text>
                  </View>

                  {/* Seller */}
                  <View style={styles.buyerSeller}>
                    <Text style={styles.sectionHeader}>🛒 Seller</Text>
                    <Text style={styles.sectionHeader}>{item.seller?.Firstname || "Unknown"} {item.seller?.Lastname || "Unknown"}</Text>
                    <Text>📍 Address: {item.seller?.Address || "Unknown"}</Text>
                    <Text>📞 Contact: {item.seller?.Phonenumber || "N/A"}</Text>
                  </View>
                </View>

                <Text>Status: {item.is_approve ? "✅ Approved" : "⏳ Pending"}</Text>
              </View>
            </View>

            
          </View>
        )}
      />
    </ScrollView>
    
    {/* Messages Modal */}
    
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.messageHeader}>
            <Text style={styles.modalTitle}>💬 Messages</Text>
          {/* Close Button */}
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            </View>
            {/* Messages Content */}
              {selectedMessages.length > 0 ? (
                <View style={styles.messageBox}>
                  {selectedMessages.map((msg, index) => {
                    const isBuyer = msg.sender_id === buyer?.id;
                    const isSeller = msg.sender_id === seller?.id;
                    
                    return (
                      <View 
                        key={index} 
                        style={[styles.messageRow, isBuyer ? styles.buyerMessage : styles.sellerMessage]}
                      >
                        <Text style={styles.messageSender}>
                          {isBuyer 
                            ? `${buyer.Firstname} ${buyer.Lastname}` 
                            : isSeller 
                            ? `${seller?.Firstname} ${seller?.Lastname}` 
                            : "Unknown"}
                        </Text>
                        <Text style={styles.messageText}>{msg.text}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.noMessageText}>No messages available.</Text>
              )}

        </View>
            
          
        </View>
      </Modal>
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  row: {
    justifyContent: "space-between",
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4, // Adds shadow for Android
    marginHorizontal: 5, // Spacing between columns
    width: Dimensions.get("window").width / 2 - 20, // Two cards per row
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ProductmessagerowContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  productImage: {
    width: 220, // Bigger image
    height: 220,
    borderRadius: 10,
    marginRight: 15,
  },
  detailsContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 5,
  },
  buyerSellerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  buyerSeller: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "bold",
  },
  messageButton: {
    marginTop: 8,
    backgroundColor: "#007bff",
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: "center",
  },
  messageButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0)",
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
    height: "90%",
    marginBottom: 10,
  },
  messageRow: {
    maxWidth: "75%",
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  buyerMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#e1f5fe", // Light blue for buyer
  },
  sellerMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#c8e6c9", // Light green for seller
  },
  messageSender: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 2,
  },

  messageHeader: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  messageText: {
    fontSize: 14,
    marginBottom: 3,
  },
  noMessageText: {
    fontSize: 14,
    fontStyle: "italic",
    color: "gray",
  },
  closeButton: {
    backgroundColor: "#ff4d4d",
    padding: 8,
    borderRadius: 6,
    alignSelf: "flex-end",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default Transactions;
