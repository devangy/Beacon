import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useAppSelector } from "@/hooks/hooks";
import { useState } from "react";
import { Search } from "lucide-react-native";
import { useRef } from "react";
import { getUserFriends } from "@/hooks/getUserFriends";
import {
    KeyboardAvoidingView,
    Platform,
    TextInput,
    Pressable,
    View,
    FlatList,
    Text,
    TouchableOpacity,
    Image,
} from "react-native";

WebBrowser.maybeCompleteAuthSession();

type FriendStatus = "Online" | "Away" | "Offline";

interface Friend {
    id: string;
    username? : string;
    status: FriendStatus;
    name: string
}

const mockFriends: Friend[] = [
    { id: "1", name: "Aarav Mehta", status: "Online" },
    { id: "2", name: "Riya Sharma", status: "Offline" },
    { id: "3", name: "Kabir Verma", status: "Online" },
    { id: "4", name: "Isha Patel", status: "Away" },
    { id: "5", name: "Arjun Singh", status: "Offline" },
];

const getAvatarUrl = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;

const getStatusColor = (status: string) => {
    switch (status) {
        case "Online":
            return "bg-green-500";
        case "Away":
            return "bg-yellow-500";
        case "Offline":
            return "bg-gray-500";
        default:
            return "bg-gray-500";
    }
};

export default function Friends() {
    const router = useRouter();

    const userId = useAppSelector((state) => state.auth.userId);

    console.log("userid", userId);

    if (!userId) {
        throw new Error("User ID not provided");
    }

    const { data: friends, isLoading, isError } = getUserFriends(userId);

    console.log("Friends Data:", friends);

    // const token = useAppSelector((state) => state.auth.accessToken);
    const searchBoxOpen = useAppSelector((state) => state.search.searchBoxOpen);

    const [searchText, searchBoxText] = useState("");

    const inputRef = useRef<TextInput>(null);

    // const filteredFriends = friends?.filter((friend) =>
    //   friend.name.toLowerCase().includes(searchText.toLowerCase())
    // );

    // const navigateToChat = (friend: Friend) => {\

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 bg-black px-4 pt-4"
        >
            <View className="flex-1">
                {searchBoxOpen && (
                    <Pressable onPress={() => inputRef.current?.focus()}>
                        <TextInput
                            ref={inputRef}
                            placeholder="Search Username..."
                            placeholderTextColor="#9CA3AF" // text-gray-400
                            className="bg-gray-800 text-gray-400 px-4 py-2 rounded-full "
                        />
                    </Pressable>
                )}

                <FlatList
                    data={friends}
                    keyExtractor={(item) => item.id}
                    className="border-t"
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 80 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => console.log(item)}
                            activeOpacity={0.7}
                            className={`w-full mb-3 bg-gray-900  rounded-full  border-gray-600 p-1  flex-row items-center text-md ${searchBoxOpen ? "mt-3" : ""}`}
                        >
                            <View className="relative mr-3">
                                <Image
                                    source={{ uri: item.avatarUrl }}
                                    className="w-10 h-10 rounded-full"
                                />
                                <View
                                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${getStatusColor(
                                        item.status,
                                    )}`}
                                />
                            </View>
                            <View>
                                <Text className="text-white text-lg ">
                                    {item.username}
                                </Text>
                                <Text className="text-gray-400">
                                    {item.status}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </KeyboardAvoidingView>
    );
}
