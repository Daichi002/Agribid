import React, { useContext, useEffect } from 'react';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { AuthProvider, AuthContext } from '../components/authcontext'; // Import AuthContext and AuthProvider
import { useFonts } from 'expo-font';
import { AlertProvider } from '../components/AlertContext';
import { GlowProvider } from '../components/GlowContext';

// Prevent splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
  const { isAuthenticated } = useContext(AuthContext); // Get authentication state from context
  const [fontsLoaded, error] = useFonts({
    "Poppins-Black": require("../assets/fonts/Poppins-Black.ttf"),
    "Poppins-Bold": require("../assets/fonts/Poppins-Bold.ttf"),
    "Poppins-ExtraBold": require("../assets/fonts/Poppins-ExtraBold.ttf"),
    "Poppins-ExtraLight": require("../assets/fonts/Poppins-ExtraLight.ttf"),
    "Poppins-Light": require("../assets/fonts/Poppins-Light.ttf"),
    "Poppins-Medium": require("../assets/fonts/Poppins-Medium.ttf"),
    "Poppins-Regular": require("../assets/fonts/Poppins-Regular.ttf"),
    "Poppins-SemiBold": require("../assets/fonts/Poppins-SemiBold.ttf"),
    "Poppins-Thin": require("../assets/fonts/Poppins-Thin.ttf"),
  });

  useEffect(() => {
    if (isAuthenticated) {
      SplashScreen.hideAsync(); // Hide splash screen if authenticated
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (error) throw error;
    if (fontsLoaded) {
      SplashScreen.hideAsync(); // Hide splash screen if fonts are loaded
    }
  }, [fontsLoaded, error]);

  if (!fontsLoaded) {
    return null; // Show nothing if fonts are not loaded yet
  }

  return (
    <AuthProvider>
      <GlowProvider>
      <AlertProvider>
        <StatusBar backgroundColor="#161622" barStyle="light-content" />
          <Stack>
            {/* public screen */}
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/signup" options={{ headerShown: false }} />
            <Stack.Screen name="ForgotPassword" options={{ headerShown: false }} />

            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="updateuser" options={{ headerShown: false }} />
            <Stack.Screen name="history/buy" options={{ headerShown: false }} />
            <Stack.Screen name="history/sold" options={{ headerShown: false }} />
            <Stack.Screen name="history/torate" options={{ headerShown: false }} />
            <Stack.Screen name="createsell" options={{ headerShown: false }} />
            <Stack.Screen name="ProductDetails" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen name="message/messagesender" options={{ headerShown: false }} />
            <Stack.Screen name="message/messagereceiver" options={{ headerShown: false }} />
            <Stack.Screen name="testpage" options={{ headerShown: false }} />
            <Stack.Screen name="verifynumber" options={{ headerShown: false }} />
            <Stack.Screen name="updateproduct" options={{ headerShown: false }} />
            <Stack.Screen name="Reports/reportproduct" options={{ headerShown: false }} />
            <Stack.Screen name="Reports/reportcomments" options={{ headerShown: false }} />
            <Stack.Screen name="Reports/reportmessage" options={{ headerShown: false }} />
            <Stack.Screen name="Rating" options={{ headerShown: false }} />
            <Stack.Screen name="userproduct" options={{ headerShown: false }} />
          </Stack>
      </AlertProvider>
      </GlowProvider>
    </AuthProvider>
  );
};

export default RootLayout;
