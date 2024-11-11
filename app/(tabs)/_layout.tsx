import { StatusBar, TouchableOpacity } from "react-native";
import { Redirect, Tabs, Link, router } from "expo-router";
import { SafeAreaView, Image, Text, View, StyleSheet, useWindowDimensions,ImageSourcePropType } from "react-native";
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

const TabLayout = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* <View style={styles.header}>
        <Link href="/sell" style={styles.logoContainer}>
          <Image source={icons.Agribid} style={styles.logo} resizeMode="contain" />
        </Link>
        <Link href="/profile">
          <Image source={icons.Profile} style={styles.profileImage} resizeMode="contain" />
        </Link>
      </View> */}

      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: "#D9D9D9",
            borderTopWidth: 1,
            borderTopColor: "#232533",
            height: 60,
            paddingBottom: 2,
            justifyContent: "space-between",
          },
          tabBarItemStyle: {
            width: 80,
            justifyContent: "center",
          },
        }}
      >
        <Tabs.Screen
          name="sell"
          options={{
            title: "SeLL",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={icons.home} name="" focused={focused} />
            ),
          }}
        />

      <Tabs.Screen
          name="srp"
          options={{
            title: "Srp",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={icons.srp} name="" focused={focused} />
            ),
          }}
        />
         <Tabs.Screen
          name="notif"
          options={{
            title: "notif",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={icons.notif} name="" focused={focused} />
            ),
          }}
        />
      
      <Tabs.Screen
        name="profile"  
        options={{
          title: "profile",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={icons.Profile} name="" focused={focused} />
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={() => {
                router.push('/profile/userdetails');
              }}
            />
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
    marginTop: StatusBar.currentHeight || 0,
  },
  // header: {
  //   backgroundColor: '#7DC36B',
  //   justifyContent: 'space-between',
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   height: 150, 
  // },

  logoContainer: {
    width: 250,
    height: 250,
    borderRadius: 50,
  },
  logo: {
    width: 100,        // Adjust this size based on your image content
    height: 100,       // Adjust this size based on your image content
    borderRadius: 50,  // Maintain circular shape
  },
  profileContainer: {
  // 
  },
  profileImage: {
    width: 50, // Adjust width as needed
    height: 50, // Adjust height as needed
  },
  tabBox: {
    display: 'flex',
    // flexDirection: 'row',
    // justifyContent: 'center',
    // gap: 8,
    paddingTop: 10, 
    alignItems: 'center',   
    borderRadius: 5, // Curved corners
    height: 60,
    width: 100,
    paddingHorizontal: 25, // Horizontal padding
    paddingVertical: 20, //vertical padding
    borderColor: '#000000', // Black border color
    borderWidth: 2, // Thickness of the border
  },

  icon: {
    width: 32, // Adjust width as needed
    height: 32, // Adjust height as needed
  },
  text: {
    color: 'black',
    marginLeft: 10,
    fontSize: 15, // This corresponds to `text-xs`
  },
  fontPsBold: {
    fontFamily: 'Poppins-Bold', // Update with your actual font family name
  },
  fontPRegular: {
    fontFamily: 'Poppins-Regular', // Update with your actual font family name
  },
});

export default TabLayout;