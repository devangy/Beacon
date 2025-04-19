import React, { useState, useEffect } from 'react';
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

// Define types for chat messages
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

const ChatScreen: React.FC = () => {
  const params = useLocalSearchParams<ChatParams>();
  const { friendId, friendName, friendStatus } = params;
  
  const [message, setMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Initialize chat history when component mounts
  useEffect(() => {
    // Add a welcome message from the friend
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
    if (message.trim() === '') return;
    
    // Add user message to chat
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: message.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
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

  const renderChatItem = ({ item }: ListRenderItemInfo<ChatMessage>) => (
    <View 
      className={`mb-4 ${
        item.sender === 'user' ? 'items-end ml-auto' : 'items-start'
      }`}
    >
      <View 
        className={`rounded-lg p-3 max-w-3/4 ${
          item.sender === 'user' ? 'bg-blue-600' : 'bg-gray-700'
        }`}
      >
        <Text className="text-white">{item.text}</Text>
      </View>
      <Text className="text-gray-500 text-xs mt-1">{item.timestamp}</Text>
    </View>
  );

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
      
      {/* Friend info banner (optional) */}
      <View className="flex-row items-center p-2 bg-gray-900">
        <Image
          source={{ uri: getAvatarUrl(friendName) }}
          className="w-8 h-8 rounded-full mr-2"
        />
        <Text className="text-gray-400">
          {friendName} - {friendStatus}
        </Text>
      </View>
      
      {/* Chat Messages */}
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
        />

        {/* Message Input */}
        <View className="flex-row items-center border-t border-gray-800 p-4">
          <TextInput
            className="flex-1 bg-gray-800 text-white rounded-full px-4 py-2 mr-2"
            placeholder="Type a message..."
            placeholderTextColor="#A0AEC0"
            value={message}
            onChangeText={setMessage}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity 
            className="bg-blue-500 w-10 h-10 rounded-full items-center justify-center"
            onPress={sendMessage}
            disabled={message.trim() === ''}
          >
            <Text className="text-white font-bold">→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ChatScreen;