import { View, Text, FlatList, ActivityIndicator, StyleSheet, Dimensions, TouchableOpacity  } from 'react-native';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { router } from "expo-router";
import BASE_URL from '@/components/ApiConfig';
import { ScrollView } from 'react-native-gesture-handler';

const { width } = Dimensions.get("window"); // Get screen width

const Users = () => {
  interface User {
    id: number;
    Firstname: string;
    Lastname: string;
    IsAdmin: boolean;
    Address: string;
    isActive: boolean;
    Phonenumber: string;
  }

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
           fetchUsers();
    }, []);

        const fetchUsers = async () => {
            try {
                const token = await AsyncStorage.getItem('authToken');
                if (!token) {
                console.error('No auth token found');
                router.push("/login");
                }

                const response = await axios.get(`${BASE_URL}/api/alluser`, {
                    headers: { Authorization: `Bearer ${token}` },
                  }); // Change URL based on your setup

                  console.log("Fetched users:", response.data); // Log the fetched users
                setUsers(response.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setLoading(false);
            }
        };

     

        const toggleAdminStatus = async (userId, isAdmin) => {
            try {
              const token = await AsyncStorage.getItem("authToken");
              if (!token) {
                console.error("No auth token found");
                router.push("/login");
                return;
              }
          
              const apiUrl = isAdmin
                ? `${BASE_URL}/api/removeadmin/${userId}` // Remove Admin
                : `${BASE_URL}/api/makeadmin/${userId}`; // Make Admin
          
              const response = await axios.post(
                apiUrl,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              );
          
              console.log("Admin status updated:", response.data);
              
              await fetchUsers(); // Refresh the user list after update
            } catch (error) {
              console.error("Error updating admin status:", error);
            }
          };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>User List</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row} 
        renderItem={({ item }) => (
            <View style={styles.card}>
            {/* User Information */} 
            <Text style={[styles.roleBadge, item.IsAdmin ? styles.adminBadge : styles.userBadge]}>
                {item.IsAdmin ? "Admin" : "User"}
              </Text>
            <View style={styles.cardHeader}>
              <Text style={styles.userName}>{item.Firstname} {item.Lastname}</Text>

                {/* Role Badge */}
             
            {/* Toggle Admin Button */}
             <TouchableOpacity
              style={[styles.adminButton, item.IsAdmin ? styles.removeAdminButton : styles.makeAdminButton]}
              onPress={() => toggleAdminStatus(item.id, item.IsAdmin)}
            >
              <Text style={styles.adminButtonText}>
                {item.IsAdmin ? "Remove Admin" : "Make Admin"}
              </Text>
            </TouchableOpacity>

            </View>

             

            {/* User Details */}
            <Text style={styles.userDetail}>📍 {item.Address}</Text>
            <Text style={styles.userDetail}>📞 {item.Phonenumber}</Text>

            {/* Status */}
            <Text>Status:
            <Text style={[styles.statusBadge, item.isActive ? styles.activeBadge : styles.inactiveBadge]}>
              {item.isActive ? "🟢 Active" : "🔴 Inactive"}
            </Text></Text>
          </View>
        )}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: "#f8f9fa",
        flex: 1,
      },
      loader: {
        marginTop: 20,
      },
      header: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 15,
        textAlign: "center",
        color: "#333",
      },
      row: {
        justifyContent: "space-between", // Ensures equal spacing between columns
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
      cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 5,
      },
      userName: {
        fontSize: 16,
        fontWeight: "bold",
      },
      roleBadge: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 15,
        fontSize: 12,
        fontWeight: "bold",
        color: "#fff",
      },
      adminBadge: {
        backgroundColor: "#007bff",
      },
      userBadge: {
        backgroundColor: "#6c757d",
      },
      userDetail: {
        fontSize: 14,
        color: "#555",
        marginBottom: 3,
      },
      statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 15,
        fontSize: 12,
        fontWeight: "bold",
        textAlign: "center",
        alignSelf: "flex-start",
        marginTop: 5,
        marginLeft: 5,
      },
      activeBadge: {
        backgroundColor: "#28a745",
        color: "#fff",
      },
      inactiveBadge: {
        backgroundColor: "#dc3545",
        color: "#fff",
      },
      adminButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 5,
        marginTop: 8,
        alignItems: "flex-end",
      },
      makeAdminButton: {
        backgroundColor: "#ffcc00", // Yellow for "Make Admin"
        alignSelf: "flex-end",
      },
      removeAdminButton: {
        backgroundColor: "#ff4d4d", // Red for "Remove Admin"
        alignSelf: "flex-end",
      },
      adminButtonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 14,
      },
  });

export default Users;
