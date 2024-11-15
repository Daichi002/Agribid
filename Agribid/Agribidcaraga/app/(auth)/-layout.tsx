
import React from 'react'
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from 'react-native-safe-area-context';

const authlayout = () => {
  return (
    <SafeAreaView style={{flex: 1}}>
    <>
      <Stack>
      <Stack.Screen
        name="index" // Main entry point for the auth folder
        options={{ headerShown: false }}
      />
        <Stack.Screen
          name="login"
          options={{
            headerShown: false
          }}
        />
         <Stack.Screen
          name="signup"
          options={{
            headerShown: false
          }}
        />
      </Stack>
      <StatusBar backgroundColor="#161622" style='light' />
    </>
    </SafeAreaView>
  )
}

export default authlayout