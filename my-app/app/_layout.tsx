import { Provider } from "react-redux";
import { store } from "@/store/store";
import { Stack } from "expo-router";
import "../global.css";
import { useFonts } from "expo-font";
import { Text, View, ActivityIndicator } from "react-native";

export default function RootLayout() {
  const [loaded] = useFonts({
    GeistMono: require("../assets/fonts/GeistMono-VariableFont_wght.ttf"),
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Provider store={store}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="home/(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="NewChat"
          options={{
            headerShown: true,
            title: "Select Contact",
            headerStyle: {
              backgroundColor: "black",
            },
            headerTintColor: "white",
            headerTitleStyle: {
              fontWeight: "light",
            },
          }}
        />
      </Stack>
    </Provider>
  );
}
