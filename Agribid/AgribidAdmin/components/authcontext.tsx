import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter  } from 'expo-router';


export const AuthContext = createContext({
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

import { ReactNode } from 'react';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false); // Ensure auth state is checked
  const router = useRouter();

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          setIsAuthenticated(true); // User is logged in
        }
      } catch (error) {
        console.error('Error checking auth token', error);
      } finally {
        setAuthChecked(true); // Auth check complete
      }
    };
    checkToken();
  }, []);

  // Avoid navigation until auth check is complete
  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      router.replace('/login'); // Redirect unauthenticated users
    }
  }, [authChecked, isAuthenticated, router]);

  if (!authChecked) {
    return null; // Optionally render a splash/loading screen
  }

  const login = () => {
    setIsAuthenticated(true);
    router.replace('/(home)/srp'); // Redirect after login
  };

  const logout = async () => {
    await AsyncStorage.removeItem('authToken');
    setIsAuthenticated(false);
    router.replace('/login'); // Redirect after logout
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
