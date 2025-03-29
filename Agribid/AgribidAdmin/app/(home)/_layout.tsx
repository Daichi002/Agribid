import React, { useEffect, useState,  useContext  } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs,useRouter  } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Alert, Text} from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL from "../../components/ApiConfig";
import { AuthContext } from '../../components/authcontext';  // Import the useAuth hook
import ProtectedRoute from '../../components/ProtectedRoute';
import axios from 'axios';

// Helper component for tab icons
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: 4 }} {...props} />;
}

// Non-clickable icon component for the left side
function LeftIcon() {
  return (
    <View style={styles.leftIconContainer}>
      <FontAwesome name="cog" size={28} color="gray" />
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { logout } = useContext(AuthContext);

  const [userName, setUserName] = useState('Admin'); // Default title as "Admin"

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userInfo = await AsyncStorage.getItem('userInfo');
        if (userInfo) {
          const parsedUser = JSON.parse(userInfo);
          const fullName = `${parsedUser.Firstname} ${parsedUser.Lastname}`;
          setUserName(fullName); // Update the title with the user's name
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchUserInfo(); // Call the function when the component mounts
  }, []); // Dependency array ensures it only runs once

  const handleLogout = async () => {
    try {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          console.error('No auth token found');
          return;
        }

        console.log('Token:', token);

        const response = await axios.post(`${BASE_URL}/api/logout`, {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        await AsyncStorage.removeItem('authToken');

        logout();
        router.navigate('/login');

        // console.log('Logout successful');
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Error response data:', error.response?.data);
        } else {
          console.error('Unexpected error:', error);
        }
        Alert.alert('Error', 'Failed to update user details.');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  
  const confirmLogout = () => {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (confirmed) {
      handleLogout();
    }
  };

  return (
    
    <View style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileInfo}>
          <FontAwesome name="user" size={28} color="white" />
          <Text style={styles.userName}>{userName}</Text>
        </View>
        <TouchableOpacity onPress={confirmLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Layout */}
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false, // Hide headers globally for all screens
          tabBarPosition: 'top', // Place tab bar at the top
          tabBarStyle: styles.tabBarStyle, // Custom tab bar styles
          tabBarLabelStyle: styles.tabBarLabelStyle, // Ensure label styles are applied correctly
          tabBarIconStyle: styles.tabBarIconStyle, // Custom icon placement
        }}
      >
        {/* Left Half - Non-clickable Icon */}
        <Tabs.Screen
          name="leftIcon"
          options={{
            tabBarIcon: () => <LeftIcon />,
            tabBarButton: () => null, // Make the tab non-clickable
          }}
        />

        {/* Right Half - Tab Icons */}
        {/* Sell Screen */}
        <Tabs.Screen
          name="sell"
          options={{
            title: 'Posted',
            tabBarLabelStyle: { fontSize: 16, color: 'white' }, // Increase font size for this tab
            tabBarIcon: ({ color }) => <TabBarIcon name="shopping-cart" color={color} />,
          }}
        />
        {/* SRP Screen */}
        <Tabs.Screen
          name="srp"
          options={{
            title: 'PRP',
            tabBarLabelStyle: { fontSize: 16, color: 'white' }, // Increase font size for this tab
            tabBarIcon: ({ color }) => <TabBarIcon name="dollar" color={color} />,
          }}
        />
        {/* Transactions */}
        <Tabs.Screen
          name="transactions"
          options={{
            title: 'Transactions',
            tabBarLabelStyle: { fontSize: 16, color: 'white' }, // Increase font size for this tab
            tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
          }}
        />
        {/* Reports Screen */}
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Reports',
            tabBarLabelStyle: { fontSize: 16, color: 'white' }, // Increase font size for this tab
            tabBarIcon: ({ color }) => <TabBarIcon name="file-text" color={color} />,
          }}
        />
        {/* users Screen */}
        <Tabs.Screen
          name="users"
          options={{
            title: 'Users',
            tabBarLabelStyle: { fontSize: 16, color: 'white' }, // Increase font size for this tab
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  profileHeader: {
    height: 60,
    backgroundColor: '#00695c', // Dark green header background
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    marginLeft: 10,
    fontSize: 18,
    color: 'white',
  },
  logoutButton: {
    backgroundColor: '#e53935',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  logoutText: {
    color: 'white',
    fontSize: 14,
  },
  tabBarStyle: {
    height: 60,
    backgroundColor: 'green',
    borderTopWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  tabBarLabelStyle: {
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  tabBarIconStyle: {
    alignItems: 'center',
    flexDirection: 'column',
  },
  leftIconContainer: {
    justifyContent: 'center',
    marginRight: 10,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    backgroundColor: 'white',
    width: 200,
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
});
