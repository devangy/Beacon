import { View, Text, FlatList, Image } from "react-native";
import ChatScreen  from "../ChatScreen";

// Mock friends data without hardcoded avatar URLs
const mockFriends = [
  { id: '1', name: 'Aarav Mehta', status: 'Online' },
  { id: '2', name: 'Riya Sharma', status: 'Offline' },
  { id: '3', name: 'Kabir Verma', status: 'Online' },
  { id: '4', name: 'Isha Patel', status: 'Away' },
  { id: '5', name: 'Arjun Singh', status: 'Offline' },
];

// func to get avatar url
const getAvatarUrl = (name : string) => {
  const formattedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${formattedName}&background=random&color=fff&size=128`;
};

// Helper for status color
const getStatusColor = (status : string) => {
  switch (status) {
    case 'Online': return 'bg-green-500';
    case 'Away': return 'bg-yellow-500';
    case 'Offline': return 'bg-gray-500';
    default: return 'bg-gray-500';
  }
};

export default function Friends() {
  return (
    <View className="flex-1 bg-black p-4">
      <FlatList
        data={mockFriends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="mb-3 border-b border-gray-600 pb-2 flex-row items-center">
            {/* Avatar Container with Status Indicator */}
            <View className="relative mr-3">
              <Image
                source={{ uri: getAvatarUrl(item.name) }}
                className="w-10 h-10 rounded-full"
              />
              {/* Status Indicator */}
              <View 
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${getStatusColor(item.status)}`} 
              />
            </View>
            
            <View>
              <Text className="text-white text-lg font-semibold">{item.name}</Text>
              <Text className="text-gray-400">{item.status}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}
export function Chats() {
    

    return(
        <View className="flex-1 flex` border-2 bg-black">
            <Text>Profile Tab</Text>
        </View>
    )
}