import { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ListRenderItemInfo,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SendHorizontal } from "lucide-react-native";

import { socket } from "../../socket";
import axios, { AxiosResponse } from "axios";
import { useAppDispatch, useAppSelector } from "@/hooks/hooks";
import { addNewMessage, setMessagesByChatId } from "@/slices/messageSlice";
import { Message } from "@/types/message";
import { useAudioPlayer } from "expo-audio";
import { MlKem512 } from "mlkem";
import * as secureStore from "expo-secure-store";
import { ApiResponse } from "@/types/api-response";
import { User, PublicKey } from "@/types/user";
import api from "@/utils/axios-Intercept";
import { Buffer } from "buffer";
import { AsyncLocalStorage } from "async_hooks";
import console from "console";

// interface Message {
//     id: string;
//     chatId: string;
//     content: string;
//     senderId: string;
//     createdAt: string;
// }

const ChatScreen = () => {
    useEffect(() => {
        async function getChatMessages() {
            const response = await axios.get(
                `${process.env.EXPO_PUBLIC_BASE_URL}/api/messages/${chatId}`,
            );
            console.log("messages", response.data);

            const messages = response.data.data;

            // const newmessages = messages.byId[chatId].data

            // console.log(new)

            if (!chatId) return;

            dispatch(setMessagesByChatId({ chatId, messages }));

            console.log("messagefromstate", messagesFromState);
        }

        getChatMessages();

        const startSession = async (): Promise<void> => {
            //generate a key pair
            const kyber = new MlKem512();

            const [pub_key, priv_k] = await kyber.generateKeyPair();

            const string_priv_k = Buffer.from(priv_k).toString();
            console.log("str_pk", string_priv_k);

            // store in local storage on web nd sstore on phone
            if (Platform.OS == "web") {
                localStorage.setItem("priv_k", string_priv_k);
            } else {
                await secureStore.setItemAsync("priv_k", string_priv_k);
            }

            // post the public key
            async function uploadPublicKeys() {
                try {
                    const res = await axios.post(
                        `${process.env.EXPO_PUBLIC_BASE_URL}/api/keys`,
                        {
                            publicKey: Buffer.from(pub_key).toString("base64"),
                            userId: userId,
                        },
                    );

                    console.log("sendPublicKeysStatus: ", res.statusText);
                } catch (err) {
                    console.error("err sending public keys of user: ", err);
                    throw err;
                }
            }

            await uploadPublicKeys();

            // uploadPublicKeys();

            async function getReceiverPubKey() {
                try {
                    const res = await axios.post(
                        `${process.env.EXPO_PUBLIC_BASE_URL}/api/keys/get`,
                        {
                            userId: otherMember?.userId,
                        },
                    );
                    console.log("resdata", res.data);

                    // converting incoming data from base64 back to uint8array
                    const pk = new Uint8Array(
                        Buffer.from(res.data.pk, "base64"),
                    );

                    //run encapsulate on received key to generate ct and shared secret key
                    const sender = new MlKem512();
                    const [ct, ssk] = await sender.encap(pk);
                    console.log("ct", ct);
                    console.log("ssk", ssk);

                    let ssk_string = Buffer.from("ssk").toString();

                    if (Platform.OS == "web") {
                        localStorage.setItem("ssk", ssk_string);
                    } else {
                        await secureStore.setItemAsync(
                            `ssk_${chatId}`,
                            ssk_string,
                        );
                    }
                } catch (err) {
                    console.error("getting keys", err);
                    throw err;
                }
            }
            await getReceiverPubKey();

            async function sendCipherText() {
                try {
                    let ct_string = Buffer.from("ssk").toString();
                    // send the ciphertext with ssk to the receiver
                    const sendCipherText = await axios.post(
                        `${process.env.EXPO_PUBLIC_BASE_URL}/api/ciphertext`,
                        {
                            ct: ct_string,
                            otherMember: otherMember?.userId,
                        },
                    );

                    console.log("sendCipherText", sendCipherText);
                } catch (err) {
                    console.error(err);
                    throw err;
                }
            }

            await sendCipherText();

            async function checkSsk() {
                if (Platform.OS == "web") {
                    const localSskWeb = localStorage.getItem("ssk");
                    if (localSskWeb) {
                        console.log(
                            "using ssk found in localStorage: ",
                            localSskWeb,
                        );
                    }
                } else {
                    const localSskPhone = await secureStore.getItemAsync(
                        `ssk_${chatId}`,
                    );
                    if (localSskPhone != null) {
                        console.log(
                            "using ssk found in localSecurestor: ",
                            localSskPhone,
                        );
                    }
                }

                const getChatSsk = await axios.post(
                    `${process.env.EXPO_PUBLIC_BASE_URL}/api/ssk`,
                    {
                        chatId: chatId,
                    },
                );

                const ssk_string = getChatSsk.data.ssk;

                localStorage.setItem("ssk", ssk_string);
            }

            await checkSsk();
        };

        startSession();
    }, []); // Reset chat when friend changes

    const [message, setMessage] = useState<string>("");

    const otherMember = useAppSelector((state) => state.chat.otherMember);
    const chatId = useAppSelector((state) => state.chat.selectedChatId);
    const userId = useAppSelector((state) => state.auth.userId);

    if (!chatId) throw new Error("Unable to get chat-Id from state");
    if (!userId) throw new Error("Unable to get user-Id from state");

    const messagesFromState = useAppSelector(
        (state) => state.message.messages.byId[chatId],
    );

    // console.log('reduxmessage', messages)
    //
    const inputRef = useRef<TextInput>(null);

    const player = useAudioPlayer(require("../../assets/sounds/sent.mp3"));

    console.log("otherMember", otherMember);
    console.log("chatID", chatId);

    const dispatch = useAppDispatch();

    // Initialize chat history when component mounts
    useEffect(() => {
        if (Platform.OS !== "web") return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't hijack focus if user is already in an input or pressing system keys (Ctrl/Cmd)
            const isInput =
                document.activeElement?.tagName === "INPUT" ||
                document.activeElement?.tagName === "TEXTAREA";
            const isModifier = e.metaKey || e.ctrlKey || e.altKey;

            // Only focus if it's a single character (printable) and not a system shortcut
            if (!isInput && !isModifier && e.key.length === 1) {
                inputRef.current?.focus();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []); // Reset chat when friend changes

    const sendMessage = (): void => {
        if (message.trim() === "") return; // if the message is empty simply return dont send it

        player.seekTo(0);
        player.play();
        player.release();

        // create temp ID for msg
        const tempId = Date.now().toString();

        // Add user message to chat
        const newMessage: Message = {
            id: tempId,
            chatId: chatId,
            senderId: userId,
            content: message.trim(),
            createdAt: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };

        socket.emit("message", newMessage, (response: string) => {
            console.log("msgack", response);
        });

        // dispatching newMessage with chatId
        dispatch(
            addNewMessage({
                chatId: chatId,
                message: newMessage,
            }),
        );

        // set text message box back to empty after message is sent
        setMessage("");
    };

    // rendering individual chat message box depending on the user type
    const renderChatItem = ({ item }: ListRenderItemInfo<Message>) => {
        const isUser = item.senderId === userId;

        console.log("renderChatItem: ", item);

        return (
            // This is main container with nested message box views
            <View
                className={`mb-2 flex flex-col ${isUser ? "items-start" : " items-end"}`}
            >
                <View // This is message box rendered based on user or the other chat member type based styling
                    className={`flex  items-center justify-center rounded-lg px-4 py-2 max-w-[65%] ${
                        isUser
                            ? "bg-blue-700 rounded-bl-none"
                            : "bg-stone-600 rounded-tr-none"
                    }`}
                >
                    <Text className="text-white text-md font-sans">
                        {item.content}
                    </Text>
                </View>

                <Text className="text-gray-400 text-xs mt-1">
                    {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </Text>
            </View>
        );
    };

    // const handleKeyPress = (e: any) => {
    //     // Check if the 'Enter' key was pressed without the 'Shift' key
    //     if (e.nativeEvent.key === "Enter" && !e.nativeEvent.shiftKey) {
    //         e.preventDefault(); // Prevents a new line from being added
    //         sendMessage();
    //     }
    // };

    return (
        <View className="flex-1 bg-black">
            <Stack.Screen
                options={{
                    title: otherMember?.username,
                    headerBackTitle: "Friends",
                    headerTintColor: "white",
                    headerStyle: { backgroundColor: "#111" },
                    headerShown: false,
                }}
            />

            <View className="flex-row items-center p-2  bg-gray-900">
                <Image
                    source={{ uri: otherMember?.avatarUrl }}
                    className="w-9 h-9 rounded-full ml-2"
                />
                <Text className="text-lg  text- ml-4 font-sans mt-1 text-slate-200">
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
                            className="bg-gray-800 text-white rounded-lg px-4 py-3 outline-none"
                            placeholder="Type a message..."
                            placeholderTextColor="#A0AEC0"
                            value={message}
                            onChangeText={setMessage}
                            onSubmitEditing={() => sendMessage()}
                            ref={inputRef}
                        />
                        <TouchableOpacity
                            className="absolute right-0 top-1/2 -translate-y-1/2 bg-blue-500 w-14 h-10 rounded-lg items-center justify-center"
                            onPress={sendMessage}
                            disabled={message.trim() === ""}
                        >
                            <SendHorizontal color="white" size={22} />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

export default ChatScreen;
