import { View, Text, FlatList, Image, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

// Mock data
const mockFriends = [
  { id: '1', name: 'Aarav Mehta' },
  { id: '2', name: 'Riya Sharma' },
  { id: '3', name: 'Kabir Verma' },
  { id: '4', name: 'Isha Patel' },
  { id: '5', name: 'Arjun Singh' },
];

// Avatar generator
const getAvatarUrl = (name: string) => {
  const formattedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${formattedName}&background=random&color=fff&size=128`;
};

export default function NewChat() {
  const navigation = useNavigation();

  const handleSelectFriend = (friend: { id: string; name: string }) => {
    console.log(`Starting chat with ${friend.name}`);
    // navigate to chat screen or trigger a chat creation logic here
    navigation.goBack(); // or navigate to actual ChatScreen
  };

  return (
    <View className="flex-1 bg-black p-4">
      <FlatList
        data={mockFriends}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="mb-3 border-b border-gray-700 pb-2 flex-row items-center"
            onPress={() => handleSelectFriend(item)}
          >
            <Image
              source={{ uri: getAvatarUrl(item.name) }}
              className="w-10 h-10 rounded-full mr-3"
            />
            <Text className="text-white text-lg">{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
