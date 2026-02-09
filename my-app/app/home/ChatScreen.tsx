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
import AesGcmCrypto from "react-native-aes-gcm-crypto";

// interface Message {
//     id: string;
//     chatId: string;
//     content: string;
//     senderId: string;
//     createdAt: string;
// }

const ChatScreen = () => {
    const [message, setMessage] = useState<string>("");

    const otherMember = useAppSelector((state) => state.chat.otherMember);
    const chatId = useAppSelector((state) => state.chat.selectedChatId);
    const userId = useAppSelector((state) => state.auth.userId);

    console.log("otherMember", otherMember);
    console.log("chatID", chatId);

    if (!chatId) throw new Error("Unable to get chat-Id from state");
    if (!userId) throw new Error("Unable to get user-Id from state");

    const messagesFromState = useAppSelector(
        (state) => state.message.messages.byId[chatId],
    );

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

        const startSession = async () => {
            // Get or generate private key
            let priv_k_bytes;
            let priv_k_base64 =
                Platform.OS === "web"
                    ? localStorage.getItem(`priv_k${userId}`)
                    : await secureStore.getItemAsync(`priv_k${userId}`);

            if (priv_k_base64) {
                priv_k_bytes = new Uint8Array(
                    Buffer.from(priv_k_base64, "base64"),
                );
                console.log("Using existing private key", priv_k_bytes);
            } else {
                // Generate a key pair
                const kyber = new MlKem512();
                const [pub_key, priv_k] = await kyber.generateKeyPair();

                priv_k_bytes = priv_k;
                const string_priv_k = Buffer.from(priv_k).toString("base64");

                console.log("Generated new key pair");

                // Store in local storage on web and secure store on phone
                if (Platform.OS === "web") {
                    localStorage.setItem(`priv_k${userId}`, string_priv_k);
                } else {
                    await secureStore.setItemAsync(
                        `priv_k${userId}`,
                        string_priv_k,
                    );
                }

                // Upload the public key to server
                await uploadPublicKeys(pub_key);
            }

            // establish shared secret
            await establishSharedSecret(priv_k_bytes);

            async function uploadPublicKeys(pub_key: Uint8Array) {
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

            async function establishSharedSecret(priv_k_bytes: Uint8Array) {
                try {
                    // first check if SSK already exists locally
                    const localSsk = await getSskLocally(chatId!);

                    if (localSsk) {
                        console.log("SSK already exists locally:", localSsk);
                        return; // return if ssk exists locally
                    }

                    // if SSK doesn't exist locally check if other user already created one
                    const ct_from_server = await getCiphertextFromServer();

                    if (ct_from_server) {
                        // Other user already created the SSK, we decapsulate their ciphertext
                        console.log("Decapsulating ciphertext from other user");
                        const ssk_bytes = await decapsulateCiphertext(
                            ct_from_server,
                            priv_k_bytes,
                        );

                        await storeSskLocally(ssk_bytes);
                        console.log(
                            "SSK derived from server ciphertext:",
                            ssk_bytes,
                        );
                    } else {
                        // No ciphertext exists, we need to create one
                        console.log("Creating new SSK and ciphertext");

                        // Get the other user's public key
                        const otherUserPubKey = await getReceiverPubKey();

                        // Encapsulate to create ciphertext and SSK
                        const sender = new MlKem512();
                        const [ct, ssk] = await sender.encap(otherUserPubKey);

                        console.log("Generated ct:", ct);
                        console.log("Generated ssk:", ssk);

                        // Store SSK locally
                        await storeSskLocally(ssk);

                        // Send ciphertext to server
                        await sendCipherText(ct);
                    }
                } catch (err) {
                    console.error("Error establishing shared secret:", err);
                    throw err;
                }
            }

            async function getReceiverPubKey(): Promise<Uint8Array> {
                try {
                    const res = await axios.post(
                        `${process.env.EXPO_PUBLIC_BASE_URL}/api/keys/get`,
                        {
                            userId: otherMember?.userId,
                        },
                    );
                    console.log("Fetched other user's public key");

                    // Converting incoming data from base64 back to uint8array
                    const pk = new Uint8Array(
                        Buffer.from(res.data.pk, "base64"),
                    );

                    return pk;
                } catch (err: any) {
                    if (err.response && err.response.status === 404) {
                        console.log(
                            "Receiver public key not found on server (404)",
                        );
                    } else {
                        console.error(
                            "Network error fetching public key:",
                            err.message,
                        );
                    }
                    console.error("Error fetching receiver public key:", err);
                    throw err;
                }
            }

            async function getCiphertextFromServer(): Promise<string | null> {
                try {
                    const ct_from_server = await axios.post(
                        `${process.env.EXPO_PUBLIC_BASE_URL}/api/ciphertext/get`,
                        {
                            chatId: chatId,
                            userId: otherMember?.userId, // Get ciphertext sent BY the other user
                            receiverId: userId, // Intended FOR you
                        },
                    );

                    if (ct_from_server.data.success === false) {
                        console.log("No ciphertext found on server");
                        return null;
                    }

                    return ct_from_server.data.ciphertext;
                } catch (err) {
                    console.error(
                        "Error fetching ciphertext from server:",
                        err,
                    );
                    return null;
                }
            }

            async function decapsulateCiphertext(
                ct_base64: string,
                priv_k_bytes: Uint8Array,
            ): Promise<Uint8Array> {
                const ct_bytes = new Uint8Array(
                    Buffer.from(ct_base64, "base64"),
                );

                console.log("ct_bytes: ", ct_bytes);
                console.log("priv_k_bytes: ", priv_k_bytes);

                const recipient = new MlKem512();
                const ssk_bytes = await recipient.decap(ct_bytes, priv_k_bytes);

                console.log("Decapsulated ssk_bytes: ", ssk_bytes);

                return ssk_bytes;
            }

            async function sendCipherText(ct: Uint8Array) {
                try {
                    let ct_string = Buffer.from(ct).toString("base64");
                    console.log("Sending ciphertext to server:", ct_string);

                    const response = await axios.post(
                        `${process.env.EXPO_PUBLIC_BASE_URL}/api/ciphertext`,
                        {
                            ciphertext: ct_string,
                            chatId: chatId,
                            receiverId: otherMember?.userId,
                            userId: userId,
                        },
                    );

                    console.log("Ciphertext sent successfully:", response.data);
                } catch (err) {
                    console.error("Error sending ciphertext:", err);
                    throw err;
                }
            }

            // async function getSskLocally(
            //     chatId: string,
            // ): Promise<Uint8Array | null> {
            //     if (Platform.OS === "web") {
            //         const localSskWeb = localStorage.getItem(`ssk_${chatId}`);

            //         if (localSskWeb) {
            //             const ssk_bytes = new Uint8Array(
            //                 Buffer.from(localSskWeb, "base64"),
            //             );
            //             console.log("Found SSK in localStorage");
            //             return ssk_bytes;
            //         }
            //     } else {
            //         const localSskPhone = await secureStore.getItemAsync(
            //             `ssk_${chatId}`,
            //         );

            //         if (localSskPhone) {
            //             const ssk_bytes = new Uint8Array(
            //                 Buffer.from(localSskPhone, "base64"),
            //             );
            //             console.log("Found SSK in secureStore");
            //             return ssk_bytes;
            //         }
            //     }

            //     return null;
            // }

            async function storeSskLocally(ssk_bytes: Uint8Array) {
                const ssk_string = Buffer.from(ssk_bytes).toString("base64");

                if (Platform.OS === "web") {
                    localStorage.setItem(`ssk_${chatId}`, ssk_string);
                    console.log("Stored SSK in localStorage");
                } else {
                    await secureStore.setItemAsync(`ssk_${chatId}`, ssk_string);
                    console.log("Stored SSK in secureStore");
                }
            }
        };

        startSession();
    }, [chatId, userId]); // Reset chat when friend changes

    // console.log('reduxmessage', messages)

    async function getSskLocally(chatId: string): Promise<Uint8Array | null> {
        if (Platform.OS === "web") {
            const localSskWeb = localStorage.getItem(`ssk_${chatId}`);

            if (localSskWeb) {
                const ssk_bytes = new Uint8Array(
                    Buffer.from(localSskWeb, "base64"),
                );
                console.log("Found SSK in localStorage");
                return ssk_bytes;
            }
        } else {
            const localSskPhone = await secureStore.getItemAsync(
                `ssk_${chatId}`,
            );

            if (localSskPhone) {
                const ssk_bytes = new Uint8Array(
                    Buffer.from(localSskPhone, "base64"),
                );
                console.log("Found SSK in secureStore");
                return ssk_bytes;
            }
        }

        return null;
    }

    const inputRef = useRef<TextInput>(null);

    const player = useAudioPlayer(require("../../assets/sounds/sent.mp3"));

    const dispatch = useAppDispatch();

    const encryptSendMessage = async (): Promise<void> => {
        if (message.trim() === "") return; // if the message is empty simply return dont send it

        player.seekTo(0);
        player.play();
        player.release();

        const ssk = await getSskLocally(chatId);
        if (!ssk) throw new Error("sendmessage:SSK not found");

        const ssk_string = Buffer.from(ssk).toString("base64");

        // encrypt the payload using AES-GCM
        const encryptedPayload = await AesGcmCrypto.encrypt(
            message.trim(),
            false,
            ssk_string,
        );

        // create temp ID for msg
        const tempId = Date.now().toString();

        // Add user message to chat
        const newMessage: Message = {
            id: tempId,
            chatId: chatId,
            senderId: userId,
            payload: encryptedPayload,
            createdAt: new Date().toISOString(),
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
                            onSubmitEditing={() => encryptSendMessage()}
                            ref={inputRef}
                        />
                        <TouchableOpacity
                            className="absolute right-0 top-1/2 -translate-y-1/2 bg-blue-500 w-14 h-10 rounded-lg items-center justify-center"
                            onPress={encryptSendMessage}
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
