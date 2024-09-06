import { Text, View } from 'react-native';
import { StatusBar } from "expo-status-bar";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function app() {
  return ( 
    <SafeAreaView className='h-full' style={{backgroundColor: '#7DC36B'}}>
      <Link href={'/sell'}> daasdasa </Link>
      <Link href={'/login'}> login </Link>
    </SafeAreaView>
)
}


