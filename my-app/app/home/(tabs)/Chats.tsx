import { View, Text, FlatList, Image, TouchableOpacity, Pressable } from "react-native";
import ChatScreen from "@/app/home/ChatScreen";
import { MessageSquarePlus } from 'lucide-react-native';
import { useRouter } from "expo-router";
import { useGetUserChats } from "@/hooks/getUserChats";
import { useAppDispatch, useAppSelector } from "@/hooks/hooks";
import { Chat, Member } from "@/types/chat";


// Mock friends data without hardcoded avatar URLs
const mockFriends = [
  { id: '1', name: 'Aarav Mehta', status: 'Online' },
  { id: '2', name: 'Riya Sharma', status: 'Offline' },
  { id: '3', name: 'Kabir Verma', status: 'Online' },
  { id: '4', name: 'Isha Patel', status: 'Away' },
  { id: '5', name: 'Arjun Singh', status: 'Offline' },
  { id: '5', name: 'Arjun Singh', status: 'Offline' },
  { id: '5', name: 'Arjun Singh', status: 'Offline' },
  { id: '5', name: 'Arjun Singh', status: 'Offline' },
  { id: '5', name: 'Arjun Singh', status: 'Offline' },
  { id: '5', name: 'Arjun Singh', status: 'Offline' },
  { id: '5', name: 'Arjun Singh', status: 'Offline' },
  { id: '5', name: 'Arjun Singh', status: 'Offline' },
  { id: '5', name: 'Arjun Singh', status: 'Offline' },
  { id: '5', name: 'Arjun Singh', status: 'Offline' },
  { id: '5', name: 'Arjun Singh', status: 'Offline' },
  { id: '5', name: 'Arjun Singh', status: 'Offline' },
];



// func to get avatar url
const getAvatarUrl = (name: string) => {
  const formattedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${formattedName}&background=random&color=fff&size=128`;
};

// Helper for status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Online': return 'bg-green-500';
    case 'Away': return 'bg-yellow-500';
    case 'Offline': return 'bg-gray-500';
    default: return 'bg-gray-500';
  }
};

export default function Chats() {

  const userId = useAppSelector((state) => state.auth.userId);
  const token = useAppSelector((state) => state.auth.accessToken);

  if (!userId) throw new Error("User ID is not available")

  if (!token) throw new Error("Access token is not available");

  const dispatch = useAppDispatch();

  console.log("User ID:", userId);
  console.log("Token:", token);


  const { data: chats, isLoading } = useGetUserChats(userId , token);

  // const memberNames = chats?.flatMap(chat =>
  //   chat.members.map(member => member.name)
  // chats for each chat object in the chats array we will iterate over each chat object and push it into chatMemberNames array


  const members = chats?.map((chat: any) => {
    const otherMember = Array.isArray(chat.members) ? chat.members.find((member: any) => member.user && member.user.id !== userId) : undefined;
    // finding the other member element int the members array of the chat object and returning a new object with simp
    return {
      id: chat.id,
      name: otherMember?.user?.username || "Unknown",
      avatarUrl: otherMember?.user?.avatarUrl || "",
      // status: "Offline", // Placeholder — adjust if you store real-time status
    };
  });

 console.log("chats data:", members);


  // console.log('memberNames', allUserNames)
  // console.log('fetched chats', fetchedChats);


  console.log("Chats data:", chats);

  const router = useRouter();
  const handleStartChat = () => {
    console.log("Start new chat");
    // dispatch({ type: "", payload: {} });
    router.push("/home/ChatScreen");
  };

  return (
    <View className="flex-1 bg-black p-4">
      <FlatList
        data={members}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable onPress={handleStartChat}>
            <View className="mb-3 border-b border-gray-600 pb-2 flex-row items-center text-md">
              {/* Avatar Container with Status Indicator */}
              <View className="relative mr-3">
                <Image
                  source={{ uri: item.avatarUrl }}
                  className="w-10 h-10 rounded-full"
                />
                {/* Status Indicator */}
                <View
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black ${getStatusColor(item.status)}`}
                />
              </View>

              <View>
                <Text className="text-white text-lg">{item.name}</Text>
                <Text className="text-gray-400 text-sm">{item.status}</Text>
              </View>
            </View>
          </Pressable>
        )}
      />

      {/* Floating New Chat Button */}
      <TouchableOpacity
        className="absolute bottom-7 right-10 bg-gray-800 p-3 rounded-lg shadow-lg"
        onPress={handleStartChat}
      >
        <MessageSquarePlus size={24} color="#93FC00" />
      </TouchableOpacity>
    </View>
  );
}
