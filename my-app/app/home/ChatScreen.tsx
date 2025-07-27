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
import { useAppDispatch, useAppSelector } from '@/hooks/hooks';
import { setMessagesByChatId } from '@/slices/messageSlice';


interface Message {
  id: string;
  chatId: string
  content: string
  senderId: string;
  createdAt: string;
}


const ChatScreen = () => {

  const [message, setMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);

  const otherMember = useAppSelector((state) => state.chat.otherMember);
  const chatId = useAppSelector((state) => state.chat.selectedChatId);
  const userId = useAppSelector((state) => state.auth.userId)

  if (!chatId) throw new Error("Unable to get chatId from state");

  if (!userId) throw new Error("Unable to get chatId from state");

  
  const messagesFromState = useAppSelector((state) => state.message.messages.byId[chatId])

  // console.log('reduxmessage', messages)

  console.log('otherMember', otherMember)
  console.log('chatID', chatId)



  const dispatch = useAppDispatch()


  // Initialize chat history when component mounts
  useEffect(() => {
    // Add a welcome message from the friend

    (async () => {
      const response = await axios.get(`http://localhost:3000/api/messages/${chatId}`)
      console.log('messages', response.data)

      const messages = response.data.data

      // const newmessages = messages.byId[chatId].data

      // console.log(new)

      if (!chatId) return 

      dispatch(setMessagesByChatId({ chatId, messages }));

      console.log('messagefromstate',messagesFromState)

      // setChatHistory(messagesFromState)


    })()





    // setChatHistory([
    //   {
    //     id: '1',
    //     sender: 'friend',
    //     text: `Hey there! What's up?`,
    //     timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    //   }
    // ]);
  }, []); // Reset chat when friend changes

  const sendMessage = (): void => {
    if (message.trim() === '') return;  // if the message is empty simply return dont send it
    // socket.emit('message', 'gaynigger');


    // create temp ID for msg
    const tempId = Date.now().toString()

    // Add user message to chat
    const newMessage: Message = {
      id: tempId,
      chatId: chatId,
      senderId: userId,
      content: message.trim(),
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    socket.emit('message', newMessage, (response: string) => {
      console.log('msgack',  response)
    });
    // setChatHistory(prevChat => [...prevChat, newMessage]);
    // setMessage('');

    // Simulate reply after a short delay
    setTimeout(() => {
      const replyMessage: Message = {
        id: (Date.now() + 1).toString(),
        chatId: chatId!,
        senderId: userId,
        content: `I got your message: "${message.trim()}"`,
      };

      console.log('replymessg',replyMessage)
    }, 1000);
  };


  // rendering individual chat message box depending on the user type
  const renderChatItem = ({ item }: ListRenderItemInfo<Message>) => {
  const isUser  = item.senderId === otherMember?.id

  return (
    // This is main container with nested message box views
    <View
      className={`mb-2 flex flex-col ${isUser ? 'items-end' : 'items-start'}`} 
    >  
      <View // This is message box rendered based on user or the other chat member type based styling
        className={`flex  items-center justify-center rounded-lg px-4 py-2 max-w-[65%] ${
          isUser ? 'bg-blue-600 rounded-br-none' : 'bg-gray-600 rounded-tl-none'
        }`}
      > 
        <Text className="text-white text-md font-sans">{item.content}</Text>
      </View> 

      <Text className="text-gray-400 text-xs mt-1"> 
        {item.createdAt}
      </Text>
    </View>
  );
};

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen
        options={{
          title: otherMember?.username,
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
        <Text className=" text-lg  text-gray-200 ml-4 font-sans">
          {otherMember?.name}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          data={messagesFromState}
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
              onSubmitEditing={() => setMessage('')}
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