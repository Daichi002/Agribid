import { StatusBar } from "expo-status-bar";
import { Redirect, Tabs, Link } from "expo-router";
import { SafeAreaView, Image, Text, View, Pressable, StyleSheet, Dimensions } from "react-native";

import { icons } from "../../constants";
import { clamp } from "react-native-reanimated";

interface TabIconProps {
  icon: any; // Replace 'any' with the specific type if known (e.g., ImageSourcePropType)
  name: string;
  focused: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ icon, name, focused }) => {
  const screenWidth = Dimensions.get('window').width;
  const isSmallScreen = screenWidth < 360; // Define what you consider a "small screen"

  return (
    <View className="flex flex-row items-center justify-center gap-2"
     style={{ 
      flexDirection: 'row',
      paddingTop: 10, 
      alignItems: 'center',   
      backgroundColor: focused ? '#B2EE6D' : '#f0f0f0', // Background color for the box
      borderRadius: 5, // Curved corners
      height: 60,
      paddingHorizontal: 20, // Horizontal padding
      paddingVertical: 26, //vertical padding
      borderColor: '#000000', // Black border color
      borderWidth: 2, // Thickness of the border
      borderTopWidth: focused ? 0 : 1, // Hide the bottom border when active
      borderTopLeftRadius: focused ? 0 : 5, // Set bottom left radius to 0 when active
      borderTopRightRadius: focused ? 0 : 5, // Set bottom right radius to 0 when active
      }}>
      <Image
        source={icon}
        resizeMode="contain"
        tintColor= 'black'
        className="w-6 h-6"
      />
      <Text
        className={`${focused ? "font-psbold" : "font-pregular"} text-xs`}
        style={{ color: 'black', marginLeft: 10  }}
      >
        {name}
      </Text>
    </View>
  );
};

const TabLayout = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#161622' }} className=" h-full">
    <>
     {/* Header Section */}
      <View
        style={{
          backgroundColor: '#7DC36B',
          justifyContent: 'space-between',
          flexDirection: 'row',
          alignItems: 'center',
          height: 150, 
        }}
      >
      <Link href="/sell" style={styles.logoContainer}>
        <Image 
          source={icons.Agribid} 
          style={styles.logo}
          resizeMode="contain" // Ensure the image fits within the circular container
        />
      </Link>
      <Link href="/profile" style={styles.profileContainer}>
        <Image 
          source={icons.Profile} 
          resizeMode="contain" // Ensure the image fits within the circular container
        />
      </Link>
    </View>
        


    {/*tabs*/}
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: "#D9D9D9",
            borderTopWidth: 1,
            borderTopColor: "#232533",
            height: 60,
            paddingBottom: 2,      
            justifyContent: 'space-between',  // Ensure equal spacing between tab items
          },
          tabBarItemStyle: {   
            width: 80,  // Set a fixed width for each tab item
            justifyContent: 'center',

          },
        }}
      >
        <Tabs.Screen
          name="sell"
          options={{
            title: "SeLL",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.home}
                name="Sell"
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="srp"
          options={{
            title: "Srp",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.bookmark}
                name="Monitoring"
                focused={focused}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="buy"
          options={{
            title: "Buy",
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                icon={icons.plus}
                name="Buy"
                focused={focused}
              />
            ),
          }}
        />
      </Tabs>
      <StatusBar backgroundColor="#161622" style="light" />
    </>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 45, // Half of width/height to maintain circular shape
    overflow: 'hidden',
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45, // Maintain circular shape
  },
  profileContainer: {
    width: 60, // Adjust this size as needed
    height: 60, // Adjust this size as needed
  },
});

export default TabLayout;
