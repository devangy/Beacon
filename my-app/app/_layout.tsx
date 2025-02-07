import { Stack } from "expo-router";
import "../global.css";
import { useFonts } from 'expo-font';
import { Text, View, ActivityIndicator } from 'react-native';


export default function RootLayout() {
  const [loaded] = useFonts({
    "GeistMono" : require('../assets/fonts/GeistMono-VariableFont_wght.ttf'),
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack >
      <Text className="font-SpaceMono text-xl">Custom Font Loaded</Text>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="home/(tabs)" options={{ headerShown: false }}  />
    </Stack>
  );
}
