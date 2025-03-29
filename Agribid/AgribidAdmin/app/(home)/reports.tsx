import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Modal } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from '../../components/ApiConfig';
import ProductReviewModal from '../../components/productreviewmodal';
import CommentReviewModal from '../../components/commentreviewmodal';
import MessageReviewModal from "../../components/MessageReviewModal";
import ProtectedRoute from '../../components/ProtectedRoute';
import { router } from "expo-router";

const Reports = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [commentReportModalVisible, setCommentReportModalVisible] = useState(false);
  const [productReportModalVisible, setProductReportModalVisible] = useState(false);
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: string; title: string } | undefined>(undefined);

  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
const [historyData, setHistoryData] = useState<{ adminFirstname: string; adminLastname: string; status: string; reporterFirstname: string; reporterLastname: string; reportReason?: string; reportDetails?: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      await getReports();
      // await showhistory();
    };
    fetchData();
  }, []);

  const getReports = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.error("No auth token found");
        router.push("/login");
      }

      // Fetch reports from the API
      const response = await axios.get(`${BASE_URL}/api/getreport`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const reportData = response.data;
      console.log("Fetched Reports:", reportData);
      setNotifications(reportData);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: number, action: string) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.error("No auth token found");
        return;
      }
  
      console.log(`Report ID: ${id} - Action: ${action}`);
  
      const response = await axios.post(
        `${BASE_URL}/api/setreport`,
        { 
          reportId: id, 
          status: action 
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      const reportData = response.data;
      console.log("Setting Reports:", reportData);

      getReports();
      showhistory();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Error response:", error.response?.data);
      } else {
        console.error("Error setting reports:", error);
      }
    } finally {
      setLoading(false);
    }
  };
  

  const onRefresh = () => {
    setIsRefreshing(true);
    getReports().finally(() => setIsRefreshing(false));
  };

  interface Notification {
    id: string;
    title: string;
    reportType: string;
    reporter: {
      FirstName: string;
      LastName: string;
    };
    reason?: string;
    details?: string;
    status: string;
    reportId: number;
  }

  interface HistoryData {
    adminFirstname: string;
    adminLastname: string;
    status: string;
    reporter?: {
      Firstname: string;
      Lastname: string;
    };
    reportReason?: string;
    reportDetails?: string;
    created_at: string;
  }

  const handleReviewPress = (item : any) => {
       
    // Check the report type and open the corresponding modal
    if (item.reportType === "Comment Report") {
      setCommentReportModalVisible(true); // Show the Comment Report modal
      setSelectedItem(item.commentDetails); // Pass the item data
      console.log("Comment Report", item);
    } else if (item.reportType === "Product Report") {
      setProductReportModalVisible(true); // Show the Product Report modal
      console.log("Product Report", item); 
      setSelectedItem(item.itemDetails); // Pass the item data
    }else if (item.reportType === "Message Report") {
      setSelectedItem(item); // Pass the item message data
      console.log("Message Report", item);
      setMessageModalVisible(true);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.headerrow}>
      <Text style={styles.title}>REPORT TYPE: {item.reportType} (ID:{item.reportId})</Text>
      <TouchableOpacity style={styles.historyButton} onPress={() => handleReviewPress(item)} // Example item data
    >
      <Text style={styles.historyText}>Review</Text>
      </TouchableOpacity>
      </View>
      <Text style={styles.text}>
        REPORTER: {item.reporter.FirstName} {item.reporter.LastName}
      </Text>
      <Text style={styles.text}>REASON: {item.reason || "No reason provided"}</Text>
      <Text style={styles.text}>DETAILS:</Text>
      <View style={styles.details}>
      <Text style={styles.text}>{item.details || "No details provided"}</Text>
      </View>
      <Text style={styles.text}>STATUS: {item.status}</Text>
  
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.reviewedButton]}
          onPress={() => handleAction(item.reportId, "Acknowledged")}
        >
          <Text style={styles.buttonText}>Acknowledge</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.actionedButton]}
          onPress={() => handleAction(item.reportId, "Resolved")}
        >
          <Text style={styles.buttonText}>Resolve</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.warnedButton]}
          onPress={() => handleAction(item.reportId, "Flagged")}
        >
          <Text style={styles.buttonText}>Flag</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007BFF" />
        <Text>Loading reports...</Text>
      </View>
    );
  }




  const showhistory = async () => {
    try {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
            console.error("No auth token found");
            return;
        }

        // Fetch data from API
        const response = await axios.get(`${BASE_URL}/api/reporthistory`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const data = response.data;
        console.log("Fetched History Data:", data);

        // Update the state with fetched history data
        setHistoryData(data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("Error fetching history data:", error.response ? error.response.data : error.message);
        } else {
            console.error("Error fetching history data:", error);
        }
    }
};


const getStatusColor = (status: any) => {
  switch (status) {
    case "Acknowledged":
      return styles.reviewedButton;
    case "Resolved":
      return styles.actionedButton;
    case "Flagged":
      return styles.warnedButton;
    default:
      return styles.defaultButton; // Default color if status is unknown
  }
};

  

  return (
    <ProtectedRoute>
    <View style={styles.container}>
  <View style={styles.headerstyle}>
  <Text style={styles.header}>Reports</Text>
  <TouchableOpacity style={styles.historyButton} onPress={() => { setIsHistoryModalVisible(true); showhistory(); }}>
    <Text style={styles.historyText}>History</Text>
  </TouchableOpacity>
  <Modal
  visible={isHistoryModalVisible}
  transparent={true}
  animationType="slide"
  onRequestClose={() => setIsHistoryModalVisible(false)} // Close modal on back press
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>History</Text>
      <FlatList
          data={historyData.slice().reverse()}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }: { item: { reportId: string; adminFirstname: string; adminLastname: string; status: string; reporterFirstname: string; reporterLastname: string; reportDetails?: string; created_at: string } }) => (
                   
            <View style={[styles.historyItem, getStatusColor(item.status)]}>
              <Text style={styles.historyTexthistory}>
                <Text style={{ fontWeight: "bold", textDecorationLine: 'underline' }}>
                  {item.adminFirstname} {item.adminLastname}
                </Text> 
                {" "}performed{" "}
                <Text style={{ fontWeight: "bold", textDecorationLine: 'underline' }}>
                  {item.status}
                </Text>{" "}
                on the report filed by{" "}
                <Text style={{ fontWeight: "bold", textDecorationLine: 'underline'}}>
                  {item.reporterFirstname || "Unknown"} {item.reporterLastname || ""}
                </Text>.
              </Text>
              <Text style={styles.historyDetails}>ID: {item.reportId}</Text>
              <Text style={styles.historyDetails}>Details: {item.status || "No details provided"}</Text>
              <Text style={styles.historyDetails}>
                Date: {new Date(item.created_at).toLocaleString()}
              </Text>
            </View>
          )}
        />
      <TouchableOpacity style={styles.closeButton} onPress={() => setIsHistoryModalVisible(false)}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
</View>

<ProductReviewModal
        visible={productReportModalVisible}
        onClose={() => setProductReportModalVisible(false)}
        data={selectedItem} // Pass the selected item to the modal
      />

<CommentReviewModal
  visible={commentReportModalVisible}
  onClose={() => setCommentReportModalVisible(false)}
  data={selectedItem} // Pass the selected comment data to the modal
/>

<MessageReviewModal
  visible={messageModalVisible}
  onClose={() => setMessageModalVisible(false)}
  data={selectedItem}
  />




      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>No reports available</Text>
        )}
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        numColumns={2} 
      />
    </View>
    </ProtectedRoute>
  );
};

export default Reports;

const styles = StyleSheet.create({
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    padding: 10,
  },
  headerstyle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyButton: {
    backgroundColor: "#28A745", // Green button
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  historyText: {
    color: "#FFFFFF", // White text for contrast
    fontSize: 16,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 15,
    width: "45%",
    marginVertical: 10,
    marginHorizontal: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3, // For Android shadow
    borderColor: "#D3D3D3",
    borderWidth: 1,
  },
  headerrow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  details:{
    borderWidth : 1,
    height: 50,
    padding: 5,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "300",
    marginBottom: 2,
  },
  container: {
    flex: 1,
    backgroundColor: "#D9E6D4", // Matches the light green background
    paddingTop: 10,
    alignContent: "center",
    justifyContent: "center",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#6C757D",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  reviewedButton: {
    backgroundColor: "#007BFF",
  },
  actionedButton: {
    backgroundColor: "#28A745",
  },
  warnedButton: {
    backgroundColor: "#DC3545",
  },
  defaultButton: {
    backgroundColor: "#e0e0e0", // Default background color for unknown status
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalContainer: {
    position: 'absolute',
    top: 20, // Distance from the top
    right: 10, // Distance from the right
    width: '40%', // Adjust the width of the modal
    height: '100%', // Let it be flexible depending on the content
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  historyItem: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    marginVertical: 8,
    borderRadius: 5,
    elevation: 2,
  },
  historyTexthistory: {
    color: "white", // Black text
    fontSize: 16,
    fontWeight: "bold",
  },
  historyDetails: {
    fontSize: 14,
    color: "white",
  },
  closeButton: {
    backgroundColor: "#dc3545",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});