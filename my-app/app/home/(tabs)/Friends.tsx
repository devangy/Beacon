import { View, Text, FlatList, Image, TouchableOpacity, TextInput, Pressable } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from 'expo-web-browser';
import { useAppSelector } from "@/hooks/hooks";
import { useState } from "react";
import { Search } from 'lucide-react-native';
import { useRef } from 'react';




WebBrowser.maybeCompleteAuthSession();

type FriendStatus = 'Online' | 'Away' | 'Offline';

interface Friend {
  id: string;
  name: string;
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


  const searchBoxOpen = useAppSelector((state) => state.search.searchBoxOpen);

  const [searchText, searchBoxText] = useState('')

  const inputRef = useRef<TextInput>(null);



  const filteredFriends = mockFriends.filter((friend) =>
    friend.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const navigateToChat = (friend: Friend) => {
    router.push({
      pathname: '/home/ChatScreen',
      params: {
        friendId: friend.id,
        friendName: friend.name,
        friendStatus: friend.status,
      },
    });
  };

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
        data={filteredFriends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigateToChat(item)}
            activeOpacity={0.7}
            className="mb-3 border-b border-gray-600 pb-2 flex-row items-center text-md"
          >
            <View className="relative mr-3">
              <Image
                source={{ uri: getAvatarUrl(item.name) }}
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
