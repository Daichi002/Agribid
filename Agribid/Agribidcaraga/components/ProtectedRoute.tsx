import React, { useContext, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../components/authcontext'; // Import AuthContext

import { ReactNode } from 'react';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useContext(AuthContext); // Get the authentication status from context
  const navigation = useNavigation();

  // Local state to track the loading state of authentication
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      // If the user is not authenticated, navigate them to the login page
      console.log('User is not authenticated, redirecting to login...');
      navigation.reset({
        index: 0, // Reset navigation stack to prevent back navigation
        routes: [{ name: '(auth)/login' }],
      });
    } else {
      setLoading(false); // Set loading to false once authentication is verified
    }
  }, [isAuthenticated, navigation]);

  if (loading) {
    return null; // Or render a loading spinner or message while checking auth status
  }

  return children; // Render protected content if user is authenticated
};

export default ProtectedRoute;
