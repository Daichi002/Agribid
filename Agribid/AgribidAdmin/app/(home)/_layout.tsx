import React, { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Alert, Modal, Text } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const [userName, setUserName] = useState('Admin'); // Default title as "Admin"
  const [isDropdownVisible, setDropdownVisible] = useState(false); // Dropdown visibility state

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
      await AsyncStorage.clear(); // Clear stored data
      Alert.alert('Logout Successful', 'You have been logged out.');
      // Navigate to login or another screen if needed
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };


  

  return (
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
      title: 'Sell',
      tabBarLabelStyle: { fontSize: 16, color: 'white' }, // Increase font size for this tab
      tabBarIcon: ({ color }) => <TabBarIcon name="shopping-cart" color={color} />,
      }}
      />
      {/* SRP Screen */}
      <Tabs.Screen
      name="srp"
      options={{
      title: 'SRP',
      tabBarLabelStyle: { fontSize: 16, color: 'white'  }, // Increase font size for this tab
      tabBarIcon: ({ color }) => <TabBarIcon name="dollar" color={color} />,
      }}
      />
      {/* Notifications Screen */}
      <Tabs.Screen
      name="notif"
      options={{
      title: 'Reports',
      tabBarLabelStyle: { fontSize: 16, color: 'white'  }, // Increase font size for this tab
      tabBarIcon: ({ color }) => <TabBarIcon name="file-text" color={color} />,
      }}
      />
      {/* Profile Screen */}
      <Tabs.Screen
      name="profile"
      options={{
      title: userName, // Dynamically set the title from AsyncStorage
      tabBarLabelStyle: { fontSize: 24, color: 'white'  }, // Increase font size for this tab
      tabBarIcon: ({ color }) => (
        <TouchableOpacity onPress={() => setDropdownVisible(!isDropdownVisible)}>
          <TabBarIcon name="user" color={color} />
        </TouchableOpacity>
      ),
      }}
      />
       {/* Dropdown for Logout */}
       {isDropdownVisible && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={isDropdownVisible}
          onRequestClose={() => setDropdownVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalBackground}
            onPress={() => setDropdownVisible(false)}
          >
            <View style={styles.dropdownMenu}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={handleLogout}
              >
                <Text style={styles.dropdownText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarStyle: {
    height: 80, // Adjust tab bar height
    backgroundColor: 'green', // Tab bar background color
    borderTopWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row', // Layout as a row
    paddingHorizontal: 15, // Padding for the tab bar
    alignItems: 'center', // Center vertically
  },
  tabBarLabelStyle: {
    fontSize: 12, // Set the font size of the labels
    marginTop: 5, // Space between icon and title
    textAlign: 'center', // Center the text below the icon
  },
  tabBarIconStyle: {
    alignItems: 'center', // Center the icons
    flexDirection: 'column', // Make icons and labels stack vertically
  },
  leftIconContainer: {
    justifyContent: 'center', // Center the left icon vertically
    marginRight: 10, // Add space between left icon and right side
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
