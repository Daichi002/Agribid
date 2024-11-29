import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProtectedRoute from './ProtectedRoute'; // Ensure this is the correct path to your ProtectedRoute

const Stack = createStackNavigator();

interface ProtectedRouteScreenProps {
  name: string;
  component: React.ComponentType<any>;
  options?: object;
}

const ProtectedRouteScreen: React.FC<ProtectedRouteScreenProps> = ({ name, component, options }) => (
  <Stack.Screen
    name={name}
    options={options}
  >
    {() => (
      <ProtectedRoute>
        {React.createElement(component)} {/* Dynamically create the screen component */}
      </ProtectedRoute>
    )}
  </Stack.Screen>
);

export default ProtectedRouteScreen;
