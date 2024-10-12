import { StatusBar } from "expo-status-bar";
import { Redirect, Tabs, Link } from "expo-router";
import { SafeAreaView, Image, Text, View, Pressable, StyleSheet, useWindowDimensions,ImageSourcePropType } from "react-native";
import { icons } from "../../constants";


// Define a type for your icons (assuming they're ImageSourcePropType)
type IconProps = {
  icon: ImageSourcePropType;
  name: string;
  focused: boolean;
};

const TabIcon: React.FC<IconProps> = ({ icon, name, focused }) => {
  const { width: screenWidth } = useWindowDimensions();

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
        tintColor="black"
        style={styles.icon}
      />
      <Text
        style={[styles.text, focused ? styles.fontPsBold : styles.fontPRegular]}
      >
        {name}
      </Text>
    </View>
  );
};

const ProfileLayout = () => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#161622', height: '100%' }}>
    <>
    {/* Header Section */}
    <View style={{
      backgroundColor: '#7DC36B',
      justifyContent: 'space-between',
      flexDirection: 'row',
      alignItems: 'center',  // Change to center to align images vertically
      height: 150,  // Ensure this height is sufficient for both images
      paddingHorizontal: 15,
      overflow: 'visible',
    }}>
      <Link href="/sell">
        <Image 
          source={icons.Agribid} 
          style={styles.logo}
          resizeMode="contain" // Ensure the image fits within the circular container
        />
      </Link>
      <Link href="/profile">
        <Image 
          source={icons.Profile} 
          resizeMode="contain" // Ensure the image fits within the circular container
          style={styles.profile}
        />
      </Link>
    </View>

    {/* Tabs */}
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
        name="userdetails"
        options={{
          title: "Userdetails",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.Profile}
              name="User"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="recents"
        options={{
          title: "Recents",
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon={icons.recents}
              name="Recents"
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

export default ProfileLayout;

const styles = StyleSheet.create({
  logo: {
    width: 60,  // Set width explicitly
    height: 60,  // Set height explicitly
    borderRadius: 30,  // Circular shape
    resizeMode: 'contain',
  },
  profile: {
    width: 60,  // Set width explicitly
    height: 60,  // Set height explicitly
    borderRadius: 30,  // Circular shape
    resizeMode: 'contain',
  },

  tabBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,  // Curved corners
    height: 60,
    width: 135,
    paddingHorizontal: 25,
    paddingVertical: 20,
    borderColor: '#000000',
    borderWidth: 2,
  },
  icon: {
    width: 24,  // Adjust width as needed
    height: 24,  // Adjust height as needed
  },
  text: {
    color: 'black',
    marginLeft: 10,
    fontSize: 15,
  },
  fontPsBold: {
    fontFamily: 'Poppins-Bold',
  },
  fontPRegular: {
    fontFamily: 'Poppins-Regular',
  },
});
