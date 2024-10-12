import React from 'react';
import { Text, View } from 'react-native'; // Import Text component
import { Tabs } from 'expo-router';
import { styled } from 'nativewind';

const StyledView = styled(View);

const Navbar = () => {
  return (
    <StyledView className="w-screen h-screen flex flex-col">
      {/* Container for the tabs */}
      <StyledView className="w-full flex justify-center items-center">
        <Tabs
          screenOptions={{
            tabBarStyle: {
              backgroundColor: '#fff', // Customize the background color
              elevation: 0, // Remove shadow on Android
              shadowOpacity: 0, // Remove shadow on iOS
              borderBottomWidth: 1, // Add a bottom border if needed
              borderBottomColor: '#ccc', // Color of the border
            },
            tabBarLabelStyle: {
              fontSize: 12, // Font size for the labels
            },
            tabBarIconStyle: {
              marginBottom: -5, // Adjust icon position if necessary
            },
            tabBarItemStyle: {
              width: 'auto', // Auto width to fit content
            },
          }}
        >
          {/* Sell Tab */}
          <Tabs.Screen
          name="Sell"
          options={{
            title: 'Sell',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="Srp"
          options={{
            title: 'Srp',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'code-slash' : 'code-slash-outline'} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="Buy"
          options={{
            title: 'Buy',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name={focused ? 'code-slash' : 'code-slash-outline'} color={color} />
            ),
          }}
        />
        </Tabs>
      </StyledView>
    </StyledView>
  );
};

export default Navbar;


