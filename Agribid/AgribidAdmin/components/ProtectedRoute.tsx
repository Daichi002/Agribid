import React, { useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { AuthContext } from '../components/authcontext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // Ensure the component is mounted
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace('/(tabs)/login'); // Redirect to login if unauthenticated
    }
  }, [isAuthenticated, router, mounted]);

  if (!mounted || !isAuthenticated) {
    return null; // Render nothing until mounting or redirecting
  }

  return <>{children}</>;
};

export default ProtectedRoute;
