import { Dimensions, StatusBar } from "react-native";
import { SafeAreaView, Image, Text, View, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { icons } from "../../constants";
import { useCallback, useEffect, useState } from "react";
import { fetchNewNotifications } from "../../components/notifindicator";
import UnreadMessagesNotification from '../../components/UnreadMessagesNotification'; 

// Define a type for your icons
type IconProps = {
  icon: any;
  focused: boolean;
};

const screenWidth = Dimensions.get('window').width;

const TabIcon: React.FC<IconProps> = ({ icon, focused }) => {
  // Define separate styles for active and inactive tabs
  const activeTabStyle = {
    backgroundColor: "#B2EE6D",
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  };
  
  const inactiveTabStyle = {
    backgroundColor: "#f0f0f0",
    borderTopWidth: 1,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  };

  return (
    <View
      style={[
        styles.tabBox,
        focused ? activeTabStyle : inactiveTabStyle,
      ]}
    >
      <Image
        source={icon}
        resizeMode="contain"
        style={styles.icon}
      />
    </View>
  );
};

const TabLayout = () => {
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  

  // Shared function for fetching unread notifications
  const checkForUnreadNotifications = useCallback(async () => {
    const hasUnread = await fetchNewNotifications();
    setHasNewNotifications(hasUnread);
    console.log("Has unread notifications:", hasUnread);
  }, []);

  // Polling logic in useEffect
  useEffect(() => {
    const interval = setInterval(checkForUnreadNotifications, 60000); // Poll every 1 minute
    return () => clearInterval(interval); // Cleanup on unmount
  }, [checkForUnreadNotifications]);

  // Function to manually trigger a notification check
  const triggerNotificationCheck = useCallback(() => {
    checkForUnreadNotifications();
  }, [checkForUnreadNotifications]);

  // Expose the trigger function for external use
  (global as any).hasUnreadNotifications = triggerNotificationCheck;



  return (
    <SafeAreaView style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,  // Ensures no label is shown
          tabBarStyle: {
            backgroundColor: "#D9D9D9",
            borderTopWidth: 1,
            borderTopColor: "#232533",
            height: 55,  // Set the height to 55
            justifyContent: "center", // Vertically align content in the container
            alignItems: "center",     // Center items within the container
          },
          tabBarItemStyle: {
            width: 80,
            justifyContent: "center",  // Center the content horizontally
            alignItems: "center",      // Center the content vertically
          },
        }}
      >
        <Tabs.Screen
          name="sell"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={icons.home} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="srp"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={icons.srp} focused={focused} />
            ),
          }}
        />

        <Tabs.Screen
          name="notif"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon
              icon={hasNewNotifications ? icons.notifindi : icons.notif} // Conditionally set the icon
              focused={focused}
            />
            ),
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Profile icon */}
              <TabIcon icon={icons.Profile} focused={focused} />
  
              {/* Unread messages notification icon */}
              <UnreadMessagesNotification />
            </View>
              
            ),
          }}
        />
      </Tabs>

      <StatusBar backgroundColor="#161622" barStyle="light-content" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161622',
    height: '100%',
  },
  tabBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',  // Center content vertically and horizontally
    height: 55, // Match tab bar height
    width: screenWidth * 0.23,
    minWidth: 70,
    maxWidth: 120,
    paddingVertical: 0,  // Remove unnecessary padding
    paddingHorizontal: 10,
    borderColor: '#000000',
    borderWidth: 2,
  },
  icon: {
    width: 32, // Adjust width as needed
    height: 32, // Adjust height as needed
  },
});

export default TabLayout;