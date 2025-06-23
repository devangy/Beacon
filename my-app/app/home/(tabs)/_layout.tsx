import { Tabs, useRouter } from "expo-router";
import { MessageCircleDashed, View } from "lucide-react-native";
import { Settings, UsersRound } from "lucide-react-native";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { ActivityIndicator, View as RNView } from "react-native";

export default function TabLayout() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirecting to my index page that is login page if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      // Slight delay to ensure layout is mounted
      setTimeout(() => {
        router.replace("/");
      }, 0);
    }
  }, [isAuthenticated]);

  // Preventing premature renderng here
  if (!isAuthenticated) {
    return (
      <RNView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#101820',}}>
        <ActivityIndicator size="large" color='#7CFC00'/>
      </RNView>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "black",
        tabBarActiveBackgroundColor: "white",
        headerShown: true,
        tabBarStyle: {
          height: 70,
          borderColor: "white",
          backgroundColor: "black",
        },
        tabBarLabelStyle: {
          fontSize: 16,
          padding: 1,
          fontFamily: "GeistMono",
        },
        tabBarItemStyle: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderCurve: "circular",
        },
        tabBarBadgeStyle: {
          backgroundColor: "black",
          fontFamily: "GeistMono",
        }
      }}
    >
      <Tabs.Screen
        name="Friends"
        options={{
          title: 'Contacts',
          headerStyle: { backgroundColor: 'black' },
          headerTintColor: 'white',
          tabBarIcon: () => <UsersRound size={30} color="#93FC00" />
        }}
      />
      <Tabs.Screen
        name="Chats"
        options={{
          title: 'Chats',
          headerStyle: { backgroundColor: 'black' },
          headerTintColor: 'white',
          tabBarIcon: () => <MessageCircleDashed size={30} color="#93FC00" />
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          title: 'Profile',
          headerStyle: { backgroundColor: 'black' },
          headerTintColor: 'white',
          tabBarIcon: () => <Settings size={30} color="#93FC00" />
        }}
      />
    </Tabs>
  );
}
