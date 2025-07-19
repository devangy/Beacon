import { View, Text, FlatList, Image, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import api from "@/utils/axios-Intercept";

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

interface Friend {
  id: string,
  name: string,
}


export default function NewChat() {
  const navigation = useNavigation();

  const handleSelectFriend = async (friend: Friend) => {
    console.log(`Starting chat with ${friend.name}`);

    try {

      const res = await axios.post(`${process.env.EXPO_PUBLIC_BASE_URL}/api/chats/new-chat`, {
        friendId: friend.id
      })

      if (res?.status=="success") {

      }

      console.log("newChat:", res.data)

    } catch (error) {
      console.error("Failed to Start a New chat")
    }
  }

  // navigate to chat screen or trigger a chat creation logic here


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
};

// return (
//   <View className="flex-1 bg-black p-4">
//     <FlatList
//       data={mockFriends}
//       keyExtractor={(item) => item.id}
//       showsVerticalScrollIndicator={false}
//       renderItem={({ item }) => (
//         <TouchableOpacity
//           className="mb-3 border-b border-gray-700 pb-2 flex-row items-center"
//           onPress={() => handleSelectFriend(item.id)}
//         >
//           <Image
//             source={{ uri: getAvatarUrl(item.name) }}
//             className="w-10 h-10 rounded-full mr-3"
//           />
//           <Text className="text-white text-lg">{item.name}</Text>
//         </TouchableOpacity>
//       )}
//     />
//   </View>
// );

