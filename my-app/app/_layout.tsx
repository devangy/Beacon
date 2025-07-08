import { Provider as ReduxProvider } from "react-redux";
import { store } from "@/store/store";
import { Stack } from "expo-router";
import "../global.css";
import { useFonts } from "expo-font";
import { ActivityIndicator, View } from "react-native";
import { Search } from "lucide-react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create the QueryClient once
const queryClient = new QueryClient();

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
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="home/(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="NewChat"
            options={{
              headerShown: true,
              title: "Start New Chat",
              headerStyle: {
                backgroundColor: "black",
              },
              headerTintColor: "white",
              headerTitleStyle: {
                fontWeight: "light",
              },
              headerRight: () => (
                <Search
                  size={22}
                  color="#93FC00"
                  style={{ marginRight: 28 }}
                  onPress={() => {
                    // future: toggle something
                  }}
                />
              ),
            }}
          />
        </Stack>
      </QueryClientProvider>
    </ReduxProvider>
  );
}
