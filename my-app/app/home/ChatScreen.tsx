import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ListRenderItemInfo
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SendHorizontal } from 'lucide-react-native';

import { socket } from '../../socket'
import axios from 'axios';
import { useAppSelector } from '@/hooks/hooks';



interface ChatMessage {
  id: string;
  sender: 'user' | 'friend';
  text: string;
  timestamp: string;
}

// Define types for route params
interface ChatParams {
  friendId: string;
  friendName: string;
  friendStatus: string;
}

// Function to get avatar URL from a reliable API
const getAvatarUrl = (name: string): string => {
  const formattedName = encodeURIComponent(name);
  return `https://ui-avatars.com/api/?name=${formattedName}&background=random&color=fff&size=128`;
};

const ChatScreen = () => {
  const params = useLocalSearchParams<ChatParams>();
  const { friendId, friendName, friendStatus } = params;

  const [message, setMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const otherMember = useAppSelector((state) => state.chat.otherMember);
  const chatId = useAppSelector((state) => state.chat.selectedChatId);

  console.log('otherMember', otherMember)
  console.log('chatID', chatId)



  // Initialize chat history when component mounts
  useEffect(() => {
    // Add a welcome message from the friend

    async () => {
      const messages = axios.get(`http://localhost:3000/api/messages/${chatId}`, )
    }


    setChatHistory([
      {
        id: '1',
        sender: 'friend',
        text: `Hey there! What's up?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [friendId]); // Reset chat when friend changes

  const sendMessage = (): void => {
    if (message.trim() === '') return;  // if the message is empty simply return dont send it
    // socket.emit('message', 'gaynigger');


    // Add user message to chat
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: message.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    socket.emit('message', newMessage);
    setChatHistory(prevChat => [...prevChat, newMessage]);
    setMessage('');

    // Simulate reply after a short delay
    setTimeout(() => {
      const replyMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'friend',
        text: `I got your message: "${message.trim()}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatHistory(prevChat => [...prevChat, replyMessage]);
    }, 1000);
  };


  // rendering individual chat message box depending on the user type
  const renderChatItem = ({ item }: ListRenderItemInfo<ChatMessage>) => {
  const isUser = item.sender === 'user';

  return (
    <View
      className={`mb-2 flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
    >  
      <View
        className={`flex  items-center justify-center rounded-lg px-4 py-2 max-w-[65%] ${
          isUser ? 'bg-blue-700 rounded-br-none' : 'bg-gray-700 rounded-tl-none'
        }`}
      > 
        <Text className="text-white">{item.text}</Text>
      </View>
      <Text className="text-gray-400 text-xs mt-1">
        {item.timestamp}
      </Text>
    </View>
  );
};

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen
        options={{
          title: friendName,
          headerBackTitle: "Friends",
          headerTintColor: 'white',
          headerStyle: { backgroundColor: '#111' },
          headerShown: false,
        }}
      />

      <View className="flex-row items-center p-2  bg-gray-900">
        <Image
          source={{ uri: otherMember?.avatarUrl }}
          className="w-9 h-9 rounded-full ml-2"
        />
        <Text className=" text-lg  text-gray-200 ml-4">
          {otherMember?.name}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          data={chatHistory}
          keyExtractor={(item) => item.id}
          className="flex-1 p-4"
          renderItem={renderChatItem}
          contentContainerStyle={{ paddingBottom: 10 }}
          showsVerticalScrollIndicator={false}
        />

        {/* Message Input */}
        <View className="flex-row items-center border-t border-gray-800 p-4">
          <View className="flex-1 relative">
            <TextInput
              className="bg-gray-800 text-white rounded-lg px-4 py-3"
              placeholder="Type a message..."
              placeholderTextColor="#A0AEC0"
              value={message}
              onChangeText={setMessage}
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-blue-500 w-14 h-10 rounded-lg items-center justify-center"
              onPress={sendMessage}
              disabled={message.trim() === ''}
            >
              <SendHorizontal color="white" size={22}/>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ChatScreen;