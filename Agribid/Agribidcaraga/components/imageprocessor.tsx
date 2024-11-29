import React, { useEffect, useState } from 'react';
import { Image, ActivityIndicator, Text, View, ImageStyle } from 'react-native';
import * as FileSystem from 'expo-file-system';
import BASE_URL from '../components/ApiConfig';

// Simple image cache
const imageCache: { [key: string]: string } = {};

interface ImageLoaderProps {
  imageUri: string; // Can be either product?.image or item.image
  style?: ImageStyle; // Optional custom styles passed from the parent
}

const ImageLoader: React.FC<ImageLoaderProps> = ({ imageUri, style }) => {
  const [loading, setLoading] = useState(true);
  const [uri, setUri] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      const fullUri = `${BASE_URL}/storage/product/images/${imageUri}`;
      setLoading(true);
      setError(false);

      try {
        // Check if URI is already cached
        if (imageCache[fullUri]) {
          setUri(imageCache[fullUri]);
        } else {
          const filename = fullUri.split('/').pop();
          const fileUri = `${FileSystem.documentDirectory}${filename}`;
          const info = await FileSystem.getInfoAsync(fileUri);

          if (info.exists) {
            imageCache[fullUri] = fileUri;
            setUri(fileUri);
          } else {
            // Download the image if it isn't locally available
            const response = await FileSystem.downloadAsync(fullUri, fileUri);
            imageCache[fullUri] = response.uri;
            setUri(response.uri);
          }
        }
      } catch (e) {
        console.error('Error loading image:', e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [imageUri]); // Trigger whenever imageUri changes

  if (loading) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text>Error loading image</Text>
      </View>
    );
  }

  return (
    uri ? (
      <Image
        source={{ uri }}
        style={[{ resizeMode: 'cover' }, style]} // Allow custom styles to override default styles
      />
    ) : null
  );
};

export default ImageLoader;
