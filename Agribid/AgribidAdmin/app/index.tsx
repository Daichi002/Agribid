import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import 'react-native-gesture-handler';

import { icons } from "../constants";
import { useRouter } from 'expo-router';
const { width: screenWidth } = Dimensions.get('window');

// URLs for the three images
const imageUrls = [
  { uri: 'https://imgs.search.brave.com/eKfc08Hv6XjTa4aOD3TsU-22MwKTw93PEDyyvuP0gl8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvMTQz/OTE3Mjk5L3Bob3Rv/L2Zhcm1lci1jb3Vu/dHMteWllbGRzLW9u/LWEtY29tcHV0ZXIu/anBnP3M9NjEyeDYx/MiZ3PTAmaz0yMCZj/PXNmNUF4dmRFZkN0/SkxXUkE3V3d4RUsz/Zl9WNVhrMVZwOHQ4/Y2czYTNCT3M9' },
  { uri: 'https://imgs.search.brave.com/FDkRgT9CnLq4ivNI-xcawNSjuwbaV14Irk0idT5y7go/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly90My5m/dGNkbi5uZXQvanBn/LzA2LzMyLzIzLzEy/LzM2MF9GXzYzMjIz/MTIxN19tZU9Telpp/Sm1SYTh0RjBBbllt/dDc3clBxZlplYmZp/aS5qcGc' },
  { uri: 'https://imgs.search.brave.com/gZ7wDiDyXJuhR13ZMMCdZqD2gjjShOcLiYJNmPO7QKQ/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5nZXR0eWltYWdl/cy5jb20vaWQvNTg1/ODU5MjQ1L3Bob3Rv/L2Zhcm1lcnMtd2Fs/a2luZy10aHJvdWdo/LW9yZ2FuaWMtc3F1/YXNoLWZpZWxkLmpw/Zz9zPTYxMng2MTIm/dz0wJms9MjAmYz00/NzloRC15ZE8wcFJC/LTNzRENWV2VwSmh0/THBfeVE1a3JoTEo2/TXViRUFVPQ' },
];

const HomeScreen = () => {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0); // Keeps track of the current image index
  const opacity = useSharedValue(1); // Shared value for opacity animations

  // Create the animated style for opacity transitions
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(opacity.value, { duration: 500 }), // Smooth fade
    };
  });

  const handlenavtologin = (() => {
    router.push('/login');
    // navigation.navigate("verifynumber");
  });

  // Function to automatically rotate images
  useEffect(() => {
    const interval = setInterval(() => {
      opacity.value = 0; // Start fading out
      setTimeout(() => {
        setActiveIndex((prevIndex) => (prevIndex + 1) % imageUrls.length); // Update image index
        opacity.value = 1; // Fade back in
      }, 500); // Sync with the duration of fade out
    }, 3000); // Rotate every 3 seconds
    return () => clearInterval(interval); // Cleanup interval
  }, []);

  // Render each image inside the carousel
  const renderItem = () => {
    const currentImage = imageUrls[activeIndex]; // Current image based on index
    return (
      <Animated.View style={[styles.carouselItem, animatedStyle]}>
        <Image
          source={{ uri: currentImage.uri }}
          style={styles.carouselImage}
          resizeMode="cover"
        />
        {/* Text overlay on the image */}
        <View style={styles.textOverlay}>
          <Text style={styles.overlayText}>
            Revolutionizing Buying, Trading and Selling Market System
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={icons.Agribid} style={styles.logo} />
        </View>

        {/* Constantly Changing Carousel */}
        <View style={styles.carouselContainer}>
          {renderItem()}
        </View>

        <View style={styles.descriptionTitleContainer}>
          <Text style={styles.descriptionTitle}>AgriPlace</Text>
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            Streamlines connections and transactions between farmers, wholesalers, and retailers by offering a centralized platform for engaging in trading activities.
          </Text>
        </View>

        {/* Get started button */}
        <TouchableOpacity style={styles.button} onPress={handlenavtologin}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>

        {/* <Pressable onPress={() => router.push('/sell')}>
      <Text>Go to Home</Text>
    </Pressable> */}


        <View style={styles.footercontainer}> 
        <Text style={styles.footerText}>Made with ♥ by Brix Jay A. Nucos BSIS</Text> 
      </View>

        {/* for debugging only  remove after */}
        {/* <TouchableOpacity style={styles.button} onPress={handlenavtohome}>
          <Text style={styles.buttonText}>Home</Text>
        </TouchableOpacity> */}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

// StyleSheet for responsiveness and layout
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5FAF60',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  logoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 320,        // Adjust this size based on your image content
    height: 320,       // Adjust this size based on your image content
    borderRadius: 75,  // Maintain circular shape
    resizeMode: 'contain', // This ensures the image is contained within the circle
  },
  carouselContainer: {
    width: screenWidth,
    height: 250,
    marginVertical: 10,
  },
  carouselItem: {
    position: 'relative',
  },
  carouselImage: {
    width: screenWidth,
    height: 250,
  },
  textOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  overlayText: {
    fontSize: 25,
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  descriptionTitleContainer: {
    marginHorizontal: 20,
    paddingVertical: 10,
  },
  descriptionTitle: {
    fontSize: 25,
    color: '#fff',
    textAlign: 'center',
  },
  descriptionContainer: {
    marginHorizontal: 20,
    paddingVertical: 10,
  },
  descriptionText: {
    fontSize: 15,
    color: '#fff',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#00A651',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 5,
    marginTop: 20,
    alignSelf: 'center', // Center the button horizontally
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  footercontainer: { 
    flex: 1, 
    justifyContent: 'flex-end', 
    alignItems: 'center', 
    paddingBottom: 20, // Adjust padding as needed 
    }, 
  footerText: { 
    fontSize: 10, 
    fontWeight: 'bold', 
  }, 
});


