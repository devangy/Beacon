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
import * as Crypto from "expo-crypto";

// Conditionally import native module (only on mobile)
let AesGcmCrypto: any = null;
if (Platform.OS !== "web") {
    const module = require("react-native-aes-gcm-crypto");
    AesGcmCrypto = module.default || module;
}

const ChatScreen = () => {
    const [messageInput, setMessageInput] = useState<string>("");

    const otherMember = useAppSelector((state) => state.chat.otherMember);
    const chatId = useAppSelector((state) => state.chat.selectedChatId);
    const userId = useAppSelector((state) => state.auth.userId);

    const dispatch = useAppDispatch();

    const [ssk_string, setSsk_string] = useState<string>("");

    // const [decryptedMessage, setDecryptedMessage] = useState<Message>();

    console.log("otherMember", otherMember);
    console.log("chatID", chatId);

    if (!chatId) throw new Error("Unable to get chat-Id from state");
    if (!userId) throw new Error("Unable to get user-Id from state");

    const messagesFromState = useAppSelector(
        (state) => state.message.messages.byId[chatId],
    );

    const encryptMessage = async (
        plaintext: string,
        key: string,
    ): Promise<string> => {
        if (Platform.OS === "web") {
            // Use Web Crypto API for web
            const encoder = new TextEncoder();
            const data = encoder.encode(plaintext);
            const keyData = Uint8Array.from(Buffer.from(key, "base64"));

            const cryptoKey = await crypto.subtle.importKey(
                "raw",
                keyData,
                { name: "AES-GCM" },
                false,
                ["encrypt"],
            );

            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encrypted = await crypto.subtle.encrypt(
                { name: "AES-GCM", iv },
                cryptoKey,
                data,
            );

            // combine IV + ciphertext
            const combined = new Uint8Array(iv.length + encrypted.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(encrypted), iv.length);

            return Buffer.from(combined).toString("base64");
        } else {
            // use native module for mobile logic here
            if (!AesGcmCrypto) {
                throw new Error(
                    "AesGcmCrypto is not available on this platform",
                );
            }
            const encryptedData = await AesGcmCrypto.encrypt(
                plaintext,
                false,
                key,
            );
            // Convert the object {content, iv, tag} to a combined base64 string
            const iv = Buffer.from(encryptedData.iv, "base64");
            const tag = Buffer.from(encryptedData.tag, "base64");
            const content = Buffer.from(encryptedData.content, "base64");

            // Combine: iv (12 bytes) + content + tag (16 bytes)
            const combined = Buffer.concat([iv, content, tag]);
            return combined.toString("base64");
        }
    };

    // Cross-platform decryption helper
    const decryptMessage = async (
        payload: string,
        key: string,
    ): Promise<string> => {
        if (Platform.OS === "web") {
            // Use Web Crypto API for web
            console.log("Decrypt payload:", payload);
            const combined = Uint8Array.from(Buffer.from(payload, "base64"));
            console.log("Decrypt payload combined:", combined);

            const iv = combined.slice(0, 12);
            const encrypted = combined.slice(12);

            const keyData = Uint8Array.from(Buffer.from(key, "base64"));
            const cryptoKey = await crypto.subtle.importKey(
                "raw",
                keyData,
                { name: "AES-GCM" },
                false,
                ["decrypt"],
            );

            const decrypted = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv },
                cryptoKey,
                encrypted,
            );

            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } else {
            // Use native module for mobile
            if (!AesGcmCrypto) {
                throw new Error(
                    "AesGcmCrypto is not available on this platform",
                );
            }
            // Parse the combined base64 string back into parts
            const combined = Buffer.from(payload, "base64");
            const iv = combined.slice(0, 12);
            const tag = combined.slice(-16);
            const content = combined.slice(12, -16);

            // Convert to base64 strings for the library
            const ivBase64 = iv.toString("base64");
            const tagBase64 = tag.toString("base64");
            const contentBase64 = content.toString("base64");

            return await AesGcmCrypto.decrypt(
                contentBase64,
                key,
                ivBase64,
                tagBase64,
                false,
            );
        }
    };

    useEffect(() => {
        socket.emit("chat:join", userId, chatId);

        console.log("Joined chat");

        // Socket listener for incoming messages

        // // event listener for incoming messages
        // socket.on("message", (message) => {
        //     const handleIncomingMessage = async (incomingMessage: Message) => {
        //         console.log("Received message from socket:", incomingMessage);

        //         try {
        //             // Skip your own messages (already added locally)
        //             if (incomingMessage.senderId === userId) {
        //                 console.log("Skipping own message echo");
        //                 return;
        //             }

        //             console.log(
        //                 "Received message from socket:",
        //                 incomingMessage,
        //             );

        //             // Decrypt messages from OTHER users
        //             const ssk = await getSskLocally(chatId);
        //             if (!ssk) {
        //                 console.error("SSK not found for decryption");
        //                 return;
        //             }

        //             const ssk_string = Buffer.from(ssk).toString("base64");

        //             // Decrypt using cross-platform helper

        //             const decryptedContent = await decryptMessage(
        //                 incomingMessage,
        //                 ssk_string,
        //             );

        //             console.log("Decrypted content:", decryptedContent);

        //             // Create decrypted message for display
        //             const decryptedMessage: Message = {
        //                 id: incomingMessage.id,
        //                 chatId: incomingMessage.chatId,
        //                 senderId: incomingMessage.senderId,
        //                 payload: decryptedContent,
        //                 createdAt: incomingMessage.createdAt,
        //             };

        //             dispatch(
        //                 addNewMessage({
        //                     chatId: chatId,
        //                     message: decryptedMessage,
        //                 }),
        //             );
        //         } catch (err) {
        //             console.error("Error decrypting incoming message:", err);
        //         }
        //     };
        // });

        async function getChatMessages() {
            try {
                const response = await axios.get(
                    `${process.env.EXPO_PUBLIC_BASE_URL}/api/messages/${chatId}`,
                );
                console.log("messages", response.data);

                const messages = response.data.data;

                if (!chatId) return;

                // Decrypt old messages from database
                const ssk = await getSskLocally(chatId);
                if (!ssk) {
                    console.error("SSK not found, cannot decrypt messages");
                    dispatch(setMessagesByChatId({ chatId, messages: [] }));
                    return;
                }

                const ssk_string = Buffer.from(ssk).toString("base64");

                const decryptedMessages = await Promise.all(
                    messages.map(async (msg: any) => {
                        try {
                            const decryptedContent = await decryptMessage(
                                msg.payload,
                                ssk_string,
                            );
                            return {
                                id: msg.id,
                                chatId: msg.chatId,
                                senderId: msg.senderId,
                                payload: decryptedContent,
                                createdAt: msg.createdAt,
                            };
                        } catch (err) {
                            console.error(
                                "Error decrypting message:",
                                msg.id,
                                err,
                            );
                            return {
                                id: msg.id,
                                chatId: msg.chatId,
                                senderId: msg.senderId,
                                payload: "[Failed to decrypt]",
                                createdAt: msg.createdAt,
                            };
                        }
                    }),
                );

                dispatch(
                    setMessagesByChatId({
                        chatId,
                        messages: decryptedMessages,
                    }),
                );
                console.log("Decrypted messages loaded:", decryptedMessages);
            } catch (err) {
                console.error("Error loading messages:", err);
            }
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

        return () => {
            socket.off("message", handleIncomingMessage);
            socket.emit("chat:exit", chatId);
            console.log("Exiting chat");
        };
    }, [chatId, userId]); // Reset chat when friend changes

    const handleIncomingMessage = async (incomingMessage: Message) => {
        // console.log("Received message from socket:", incomingMessage);

        // const content = incomingMessage.payload;
        // console.log("Content:", content);

        // Skip your own messages (already added locally)
        if (incomingMessage.senderId === userId) {
            console.log("Skipping own message echo");
            return;
        }

        console.log("Received message from socket:yua", incomingMessage);

        // Decrypt messages from OTHER users
        const ssk = await getSskLocally(chatId);
        if (!ssk) {
            console.error("SSK not found for decryption");
            return;
        }

        console.log("SSK:", ssk);

        const ssk_string = Buffer.from(ssk).toString("base64");

        console.log("SSK string:", ssk_string);

        // Decrypt using cross-platform helper

        const decryptedContent = await decryptMessage(
            incomingMessage.payload,
            ssk_string,
        );

        console.log("Decrypted content:", decryptedContent);

        // Create decrypted message for display
        const decryptedMessage: Message = {
            id: incomingMessage.id,
            chatId: incomingMessage.chatId,
            senderId: incomingMessage.senderId,
            payload: decryptedContent,
            createdAt: incomingMessage.createdAt,
        };

        dispatch(
            addNewMessage({
                chatId: chatId,
                message: decryptedMessage,
            }),
        );
    };

    // event listener for incoming messages
    socket.on("message", handleIncomingMessage);

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
    const flatListRef = useRef<FlatList>(null);
    const player = useAudioPlayer(require("../../assets/sounds/sent.mp3"));

    // Auto-focus input on keyboard press
    useEffect(() => {
        if (Platform.OS === "web") {
            const handleKeyPress = (event: KeyboardEvent) => {
                // Ignore if already focused on input
                if (
                    document.activeElement?.tagName === "INPUT" ||
                    document.activeElement?.tagName === "TEXTAREA"
                ) {
                    return;
                }

                // Ignore special keys (Ctrl, Alt, Shift, Esc, etc.)
                if (
                    event.ctrlKey ||
                    event.metaKey ||
                    event.altKey ||
                    event.key === "Escape" ||
                    event.key === "Tab" ||
                    event.key === "Enter" ||
                    event.key.startsWith("Arrow") ||
                    event.key === "Backspace" ||
                    event.key === "Delete"
                ) {
                    return;
                }

                // If it's a regular character key, focus the input
                if (event.key.length === 1) {
                    inputRef.current?.focus();
                }
            };

            // Add event listener
            window.addEventListener("keydown", handleKeyPress);

            // Cleanup
            return () => {
                window.removeEventListener("keydown", handleKeyPress);
            };
        }
    }, []);

    const encryptSendMessage = async (): Promise<void> => {
        if (messageInput.trim() === "") return;

        player.seekTo(0);
        player.play();

        try {
            const ssk = await getSskLocally(chatId);
            if (!ssk) throw new Error("sendmessage:SSK not found");

            const ssk_string = Buffer.from(ssk).toString("base64");

            // Encrypt using cross-platform helper
            const encryptedPayload = await encryptMessage(
                messageInput.trim(),
                ssk_string,
            );

            console.log("Encrypted payload:", encryptedPayload);

            const tempId = Date.now().toString();

            // message to send to server (ENCRYPTED)
            const messageToSend = {
                id: tempId,
                chatId: chatId,
                senderId: userId,
                userId: userId,
                receiverId: otherMember?.userId,
                payload: encryptedPayload,
                createdAt: new Date().toISOString(),
            };

            // message to store locally (DECRYPTED)
            const localMessage: Message = {
                id: tempId,
                chatId: chatId,
                senderId: userId,
                payload: messageInput.trim(),
                createdAt: new Date().toISOString(),
            };

            // Send encrypted message to server
            socket.emit("message", messageToSend, (response: any) => {
                console.log("msgack", response);
            });

            // Add YOUR decrypted message to local state
            dispatch(
                addNewMessage({
                    chatId: chatId,
                    message: localMessage,
                }),
            );

            setMessageInput("");
        } catch (err) {
            console.error("Error sending message:", err);
        }
    };

    // rendering individual chat message box depending on the user type
    const renderChatItem = ({ item }: ListRenderItemInfo<Message>) => {
        const isUser = item.senderId === userId;

        console.log("renderChatItem: ", item);

        return (
            // This is main container with nested message box views
            <View
                className={`mb-4 flex flex-col ${isUser ? "items-start" : "items-end"}`}
            >
                <View // This is message box rendered based on user or the other chat member type based styling
                    className={`rounded-lg px-4 py-2 max-w-[75%] ${
                        isUser
                            ? "bg-blue-600 rounded-bl-none"
                            : "bg-stone-700 rounded-tr-none"
                    }`}
                >
                    <Text
                        className="text-white text-base leading-5"
                        style={{ flexWrap: "wrap" }}
                    >
                        {item.payload}
                    </Text>
                </View>
                <Text className="text-gray-300 text-[10px] mt-1 px-1 justify-end">
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
                    extraData={messagesFromState?.length}
                    keyExtractor={(item) => item.id}
                    className="flex-1 p-4"
                    renderItem={renderChatItem}
                    contentContainerStyle={{ paddingBottom: 30 }}
                    showsVerticalScrollIndicator={false}
                    ref={flatListRef}
                    onContentSizeChange={() => {
                        setTimeout(() => {
                            flatListRef.current?.scrollToEnd({
                                animated: true,
                            });
                        }, 100);
                    }}
                    onLayout={() => {
                        setTimeout(() => {
                            flatListRef.current?.scrollToEnd({
                                animated: false,
                            });
                        }, 50);
                    }}
                />

                {/* Message Input */}
                <View className="flex-row items-center border-t border-gray-800 p-3">
                    <View className="flex-1 relative">
                        <TextInput
                            className="bg-gray-800 text-white rounded-lg px-4 py-3 outline-none"
                            placeholder="Type a message..."
                            placeholderTextColor="#A0AEC0"
                            value={messageInput}
                            onChangeText={setMessageInput}
                            onSubmitEditing={() => encryptSendMessage()}
                            ref={inputRef}
                        />
                        <TouchableOpacity
                            className="absolute right-0 top-1/2 -translate-y-1/2 bg-blue-500 w-14 h-10 rounded-lg items-center justify-center"
                            onPress={encryptSendMessage}
                            disabled={messageInput.trim() === ""}
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
