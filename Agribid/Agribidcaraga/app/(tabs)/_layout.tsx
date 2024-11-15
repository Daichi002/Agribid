import { Dimensions, StatusBar } from "react-native";
import { SafeAreaView, Image, Text, View, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { icons } from "../../constants";

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
              <TabIcon icon={icons.notif} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={icons.Profile} focused={focused} />
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