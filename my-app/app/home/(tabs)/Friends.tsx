import { View, Text, FlatList, Image, TouchableOpacity, TextInput, Pressable } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from 'expo-web-browser';
import { useAppSelector } from "@/hooks/hooks";
import { useState } from "react";
import { Search } from 'lucide-react-native';
import { useRef } from 'react';
import { getUserFriends } from "@/hooks/getUserFriends";



WebBrowser.maybeCompleteAuthSession();

type FriendStatus = 'Online' | 'Away' | 'Offline';

interface Friend {
  id: string;
  username: string;
  status: FriendStatus;
}

const mockFriends: Friend[] = [
  { id: '1', name: 'Aarav Mehta', status: 'Online' },
  { id: '2', name: 'Riya Sharma', status: 'Offline' },
  { id: '3', name: 'Kabir Verma', status: 'Online' },
  { id: '4', name: 'Isha Patel', status: 'Away' },
  { id: '5', name: 'Arjun Singh', status: 'Offline' },
];

const getAvatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Online': return 'bg-green-500';
    case 'Away': return 'bg-yellow-500';
    case 'Offline': return 'bg-gray-500';
    default: return 'bg-gray-500';
  }
};




export default function Friends() {
  const router = useRouter();


  const userId = useAppSelector((state) => state.auth.userId);

  if (!userId) { throw new Error("User ID not provided"); }

  const { data: friends, isLoading, isError } = getUserFriends(userId);


  console.log("Friends Data:", friends);

  const filteredFriends = friends?.map((friend) => friend.name);



  console.log("Formatted Friends List:", filteredFriends);


  // const token = useAppSelector((state) => state.auth.accessToken);
  const searchBoxOpen = useAppSelector((state) => state.search.searchBoxOpen);

  const [searchText, searchBoxText] = useState('')

  const inputRef = useRef<TextInput>(null);

  // const filteredFriends = friends?.filter((friend) =>
  //   friend.name.toLowerCase().includes(searchText.toLowerCase())
  // );


  // const navigateToChat = (friend: Friend) => {\

  return (
    <View className="flex-1 bg-black p-4">

      {/* Search Input Box*/}

      {searchBoxOpen && (
        <Pressable onPress={() => inputRef.current?.focus()}>
          <TextInput
            ref={inputRef}
            placeholder="Search Username..."
            className="bg-gray-800 text-gray-400 px-4 py-2 rounded-full mb-4"
            underlineColorAndroid="transparent"
          />
        </Pressable>
      )}



      {/* Friend List */}
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigateToChat(item)}
            activeOpacity={0.7}
            className="mb-3 border-b border-gray-600 pb-2 flex-row items-center text-md"
          >
            <View className="relative mr-3">
              <Image
                source={{ uri: getAvatarUrl(item.avatarUrl) }}
                className="w-10 h-10 rounded-full"
              />
              <View
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${getStatusColor(item.status)}`}
              />
            </View>
            <View>
              <Text className="text-white text-lg">{item.name}</Text>
              <Text className="text-gray-400">{item.status}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
