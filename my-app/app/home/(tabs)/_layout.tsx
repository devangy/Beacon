import { Tabs, useRouter } from "expo-router";
import {
    MessageCircleDashed,
    UserRoundPlus,
    UsersRound,
    Settings,
} from "lucide-react-native";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { ActivityIndicator, Pressable, View as RNView } from "react-native";
import { toggleSearchBox } from "@/slices/searchSlice";
import { useAppDispatch } from "@/hooks/hooks";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (!isAuthenticated) {
            setTimeout(() => {
                router.replace("/");
            }, 0);
        }
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <RNView
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#000",
                }}
            >
                <ActivityIndicator size="large" color="#93FC00" />
            </RNView>
        );
    }

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: "#93FC00",
                tabBarInactiveTintColor: "#555",
                headerShown: true,
                tabBarStyle: {
                    backgroundColor: "black",
                    borderTopWidth: 1,
                    height: 75 + insets.bottom,
                    paddingBottom: insets.bottom + 8,
                    elevation: 0,

                    borderTopColor: "#333",
                },
                tabBarLabelStyle: {
                    fontSize: 18,
                    fontFamily: "GeistMono",
                    fontWeight: "bold",
                    marginTop: 5,
                    marginLeft: 8,
                },
                tabBarIconStyle: {
                    marginTop: 5,
                },
                tabBarItemStyle: {
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRightColor: "#333",
                },
                headerTitleStyle: {
                    fontFamily: "GeistMono",
                    fontSize: 20,
                },
            }}
        >
            <Tabs.Screen
                name="friends"
                options={{
                    title: "Contacts",
                    headerStyle: { backgroundColor: "black" },
                    headerTintColor: "white",
                    tabBarIcon: ({ color }) => (
                        <UsersRound size={28} color={color} />
                    ),
                    headerRight: () => (
                        <Pressable
                            onPress={() => dispatch(toggleSearchBox())}
                            style={({ pressed }) => ({
                                marginRight: 15,
                                backgroundColor: pressed
                                    ? "rgba(147, 252, 0, 0.1)"
                                    : "transparent",
                                borderRadius: 10,
                                padding: 8,
                            })}
                        >
                            <UserRoundPlus size={24} color="#93FC00" />
                        </Pressable>
                    ),
                }}
            />
            <Tabs.Screen
                name="chats"
                options={{
                    title: "Chats",
                    headerStyle: { backgroundColor: "black" },
                    headerTintColor: "white",
                    tabBarIcon: ({ color }) => (
                        <MessageCircleDashed size={28} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    headerStyle: { backgroundColor: "black" },
                    headerTintColor: "white",
                    tabBarIcon: ({ color }) => (
                        <Settings size={28} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
