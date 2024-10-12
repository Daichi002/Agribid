import { SplashScreen , Stack } from 'expo-router'
import { useFonts } from "expo-font";
import { useEffect } from "react";
declare module 'laravel-echo';


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const Rootlayout = () => {
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
    if (error) throw error;

    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  if (!fontsLoaded) {
    return null;
  }

  if (!fontsLoaded && !error) {
    return null;
  }


  return (
  <Stack>
    <Stack.Screen name="index" options={{ headerShown:false}}/>
    <Stack.Screen name="(auth)/login" options={{ headerShown:false}}/>
    <Stack.Screen name="(auth)/signup" options={{ headerShown:false}}/>
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    <Stack.Screen name="createsell" options={{ headerShown:false}} />  
    <Stack.Screen name="ProductDetails" options={{ headerShown: false }}/>
    <Stack.Screen name="profile" options={{ headerShown:false}}/>
    <Stack.Screen name="messagesender" options={{ headerShown:false}}/>
    <Stack.Screen name="messagereceiver" options={{ headerShown:false}}/>
    <Stack.Screen name="messagelist" options={{ headerShown:false}}/>
  </Stack>
  )
}

export default Rootlayout


