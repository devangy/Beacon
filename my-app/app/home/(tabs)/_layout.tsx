// import { HapticTab } from "@/app-example/components/HapticTab";
import { Tabs } from "expo-router";
import { MessageCircleDashed, View } from "lucide-react-native";
import { Settings, UsersRound } from "lucide-react-native";




export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "black",
        tabBarActiveBackgroundColor: "white",
        headerShown: true,

        // tabBarButton: HapticTab,
        tabBarStyle: {
          height: 70,
          borderColor: "white",
          backgroundColor: "black",
          
        },
        tabBarLabelStyle: {
          fontSize: 16, // Adjust font size here for labels
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
          headerShown: false, // Disable header for this screen
          tabBarIcon: ({ color, size, focused }) => <UsersRound size={30} color="#93FC00" />
        }}
      />
      <Tabs.Screen
        name="Chats"
        options={{
          title: 'Chats',
          headerShown: true, // Disable header for this screen
          tabBarIcon: ({ color, size, focused }) => <MessageCircleDashed size={30} color="#93FC00" />,
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          title: 'Settings',
          headerShown: false, // Disable header for this screen
          tabBarIcon: ({ color, size, focused }) => <Settings size={30} color="#93FC00" />
          
        }}
      />
    </Tabs>
  );
}
