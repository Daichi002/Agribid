import { ImageSourcePropType, StatusBar } from "react-native";
import { Tabs} from "expo-router";
import { SafeAreaView, Image, Text, View, StyleSheet,} from "react-native";
import { icons } from "../../constants";

// Define a type for your icons
type IconProps = {
  icon: ImageSourcePropType;
  name: string;
  focused: boolean;
};

const TabIcon: React.FC<IconProps> = ({ icon, name, focused }) => {
  return (
    <View style={[styles.tabBox, focused ? styles.activeTab : styles.inactiveTab]}>
      <Image source={icon} resizeMode="contain" style={styles.icon} />
      <Text style={[styles.text, focused ? styles.fontPsBold : styles.fontPRegular]}>
        {name}
      </Text>
    </View>
  );
};

const ProfileLayout = () => {
  return (
    <SafeAreaView style={styles.container}>

      {/* Tabs */}
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBarStyle,
          tabBarItemStyle: styles.tabBarItemStyle,
        }}
      >
        <Tabs.Screen
          name="userdetails"
          options={{
            title: "Userdetails",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={icons.Profile} name="User" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="recents"
          options={{
            title: "Recents",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={icons.recents} name="Recents" focused={focused} />
            ),
          }}
        />
      </Tabs>
      <StatusBar backgroundColor="#161622" barStyle="light-content"  />
    </SafeAreaView>
  );
};

export default ProfileLayout;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#161622',
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    resizeMode: 'contain',
  },
  profile: {
    width: 60,
    height: 60,
    borderRadius: 30,
    resizeMode: 'contain',
  },
  tabBarStyle: {
    backgroundColor: "#D9D9D9",
    borderTopWidth: 1,
    borderTopColor: "#232533",
    height: 60,
    paddingBottom: 2,
  },
  tabBarItemStyle: {
    width: 80,
    justifyContent: 'center',
  },
  tabBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    height: 60,
    width: 150,
    paddingHorizontal: 25,
    paddingVertical: 20,
    borderColor: '#000000',
    borderWidth: 2,
  },
  activeTab: {
    backgroundColor: "#B2EE6D",
    borderTopWidth: 0,
  },
  inactiveTab: {
    backgroundColor: "#f0f0f0",
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  icon: {
    width: 24,
    height: 24,
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
