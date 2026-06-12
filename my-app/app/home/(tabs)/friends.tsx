import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useAppSelector } from "@/hooks/hooks";
import { useState } from "react";
import { Plus } from "lucide-react-native";
import { useRef } from "react";
import { getUserFriends } from "@/hooks/getUserFriends";
import { searchUsers, type SearchUser } from "@/hooks/searchUsers";
import { useAddFriend } from "@/hooks/useAddFriend";
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
    ActivityIndicator,
} from "react-native";

WebBrowser.maybeCompleteAuthSession();

type FriendStatus = "Online" | "Away" | "Offline";

interface Friend {
    id: string;
    username?: string;
    status?: FriendStatus;
    name?: string;
    avatarUrl?: string;
}

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
    const [searchText, setSearchText] = useState("");
    const { data: searchResults = [], isLoading: isSearching } = searchUsers(
        userId,
        searchText,
    );
    const { mutate: addFriend, isPending: isAddingFriend } = useAddFriend();

    const searchBoxOpen = useAppSelector((state) => state.search.searchBoxOpen);
    const inputRef = useRef<TextInput>(null);

    const handleAddFriend = (friendId: string) => {
        addFriend(
            { userId, friendId },
            {
                onSuccess: () => {
                    setSearchText("");
                },
            },
        );
    };

    if (isLoading) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "black",
                }}
            >
                <ActivityIndicator size="large" />
            </View>
        );
    }

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
                            placeholderTextColor="#9CA3AF"
                            className="bg-gray-800 text-white px-4 py-2 rounded-full"
                            style={{ width: "100%" }}
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                    </Pressable>
                )}

                {/* Search Results Dropdown */}
                {searchText && searchResults.length > 0 && (
                    <View className="bg-gray-800 rounded-lg mt-2 max-h-64 mb-4">
                        <FlatList
                            data={searchResults}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={true}
                            renderItem={({ item }: { item: SearchUser }) => (
                                <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-700">
                                    <View className="flex-row items-center flex-1">
                                        <Image
                                            source={{
                                                uri:
                                                    item.avatarUrl ||
                                                    `https://ui-avatars.com/api/?name=${item.username}&background=random&color=fff`,
                                            }}
                                            className="w-8 h-8 rounded-full mr-3"
                                        />
                                        <Text className="text-white text-sm flex-1">
                                            {item.username}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleAddFriend(item.id)}
                                        disabled={isAddingFriend}
                                        className="bg-blue-600 rounded-full p-2"
                                    >
                                        {isAddingFriend ? (
                                            <ActivityIndicator
                                                size="small"
                                                color="white"
                                            />
                                        ) : (
                                            <Plus
                                                width={16}
                                                height={16}
                                                color="white"
                                            />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    </View>
                )}

                {/* No Results Message */}
                {searchText && searchResults.length === 0 && !isSearching && (
                    <View className="px-4 py-3 mt-2">
                        <Text className="text-gray-400 text-sm">
                            No users found
                        </Text>
                    </View>
                )}

                {/* Friends List */}
                <FlatList
                    data={friends || []}
                    keyExtractor={(item) => item.id}
                    className="border-t"
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 80 }}
                    renderItem={({ item }: { item: Friend }) => (
                        <TouchableOpacity
                            onPress={() => console.log(item)}
                            activeOpacity={0.7}
                            className={`w-full mb-3 bg-gray-900 rounded-full border-gray-600 p-1 flex-row items-center text-md ${
                                searchBoxOpen ? "mt-3" : ""
                            }`}
                        >
                            <View className="relative mr-3">
                                <Image
                                    source={{
                                        uri:
                                            item.avatarUrl ||
                                            `https://ui-avatars.com/api/?name=${item.username}&background=random&color=fff`,
                                    }}
                                    className="w-10 h-10 rounded-full"
                                />
                                {item.status && (
                                    <View
                                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${getStatusColor(
                                            item.status,
                                        )}`}
                                    />
                                )}
                            </View>
                            <View>
                                <Text className="text-white text-lg">
                                    {item.username}
                                </Text>
                                {item.status && (
                                    <Text className="text-gray-400">
                                        {item.status}
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    )}
                />
            </View>
        </KeyboardAvoidingView>
    );
}
