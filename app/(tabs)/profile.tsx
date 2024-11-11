import { View, Text } from 'react-native';
import React, { useEffect } from 'react';
import { useRouter } from "expo-router";

const Profile = () => {
  const router = useRouter();

  useEffect(() => {
    router.push('../profile/userdetails'); // Redirect to /app/profile/userdetails
  }, []);


  return (
    <View>
    </View>
  );
};

export default Profile;
