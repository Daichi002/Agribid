import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';


export const AuthContext = createContext({
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

import { ReactNode } from 'react';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigation = useNavigation();

  // Check if a token exists in AsyncStorage to determine if the user is authenticated
  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          setIsAuthenticated(true); // User is logged in
          console.log('User is authenticated', setIsAuthenticated);
          navigation.navigate('(tabs)'); // Redirect to the tabs
        } else {
          setIsAuthenticated(false); // No token, stay on login page
        }
      } catch (error) {
        console.error('Error checking auth token', error);
      }
    };
    checkToken();
  }, [navigation]);

  const login = () => {
    setIsAuthenticated(true);
    navigation.navigate('(tabs)'); // Redirect to tabs
  };

  const logout = async () => {
    await AsyncStorage.removeItem('authToken');
    setIsAuthenticated(false);
    navigation.navigate('(auth)/login'); // Redirect to login page
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
