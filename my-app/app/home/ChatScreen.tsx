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
    ActivityIndicator,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { SendHorizontal, ChevronLeft } from "lucide-react-native";

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
    const router = useRouter();

    const otherMember = useAppSelector((state) => state.chat.otherMember);
    const chatId = useAppSelector((state) => state.chat.selectedChatId);
    const userId = useAppSelector((state) => state.auth.userId);
    const isAIChat = useAppSelector((state) => state.chat.isAIChat);

    const dispatch = useAppDispatch();

    const [ssk_string, setSsk_string] = useState<string>("");
    const [isAI, setIsAI] = useState<boolean>(isAIChat);
    const isAIRef = useRef<boolean>(isAIChat);
    const [botThinking, setBotThinking] = useState<boolean>(false);

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
            const combined = Uint8Array.from(Buffer.from(payload, "base64"));

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

        // Re-join room on socket reconnect (e.g. after network blip)
        const handleReconnect = () => {
            console.log("Socket reconnected, re-joining chat room");
            socket.emit("chat:join", userId, chatId);
        };
        socket.on("connect", handleReconnect);

        // Main init function - fetches isAI first, then loads messages and session
        async function initChat() {
            // Check if this is an AI chat from the server
            let chatIsAI = isAIChat; // fallback to Redux state
            try {
                const res = await axios.get(
                    `${process.env.EXPO_PUBLIC_BASE_URL}/api/chats/is-ai/${chatId}`,
                );
                chatIsAI = res.data.isAI ?? false;
                setIsAI(chatIsAI);
                isAIRef.current = chatIsAI;
            } catch (err) {
                // fallback to Redux state
            }

            // Start encryption session first (skipped for AI chats)
            if (!chatIsAI) {
                await startSession();
            }

            // Load messages after session is established so SSK is available
            await getChatMessages(chatIsAI);
        }

        async function getChatMessages(chatIsAI: boolean) {
            try {
                const response = await axios.get(
                    `${process.env.EXPO_PUBLIC_BASE_URL}/api/messages/${chatId}`,
                );
                const messages = response.data.data;

                if (!chatId) return;

                // AI chats use plaintext - no decryption needed
                if (chatIsAI) {
                    const plainMessages = messages.map((msg: any) => ({
                        id: msg.id,
                        chatId: msg.chatId,
                        senderId: msg.senderId,
                        payload: msg.payload,
                        createdAt: msg.createdAt,
                    }));
                    dispatch(
                        setMessagesByChatId({
                            chatId,
                            messages: plainMessages,
                        }),
                    );
                    return;
                }

                // Decrypt old messages from database
                const ssk = await getSskLocally(chatId);
                if (!ssk) {
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
                            console.error(err);
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
            } catch (err) {}
        }

        initChat();

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
            } else {
                // Generate a key pair
                const kyber = new MlKem512();
                const [pub_key, priv_k] = await kyber.generateKeyPair();

                priv_k_bytes = priv_k;
                const string_priv_k = Buffer.from(priv_k).toString("base64");

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
                    localStorage.setItem(`ssk_${chatId}_${userId}`, ssk_string);
                    console.log("Stored SSK in localStorage");
                } else {
                    await secureStore.setItemAsync(
                        `ssk_${chatId}_${userId}`,
                        ssk_string,
                    );
                    console.log("Stored SSK in secureStore");
                }
            }
        };

        const handleIncomingMessage = async (incomingMessage: Message) => {
            try {
                // Skip your own messages (already added locally)
                if (incomingMessage.senderId === userId) {
                    console.log("Skipping own message echo");
                    return;
                }

                console.log("Received message from socket:", incomingMessage);

                let displayPayload: string;

                if (isAIRef.current) {
                    // AI chat messages are plaintext
                    displayPayload = incomingMessage.payload;
                } else {
                    // Decrypt messages from OTHER users
                    const ssk = await getSskLocally(chatId);
                    if (!ssk) {
                        console.error("SSK not found for decryption");
                        return;
                    }

                    const ssk_string = Buffer.from(ssk).toString("base64");
                    displayPayload = await decryptMessage(
                        incomingMessage.payload,
                        ssk_string,
                    );
                }

                console.log("Display payload:", displayPayload);

                const displayMessage: Message = {
                    id: incomingMessage.id,
                    chatId: incomingMessage.chatId,
                    senderId: incomingMessage.senderId,
                    payload: displayPayload,
                    createdAt: incomingMessage.createdAt,
                };

                // Clear thinking indicator when bot replies
                if (isAIRef.current) {
                    setBotThinking(false);
                }

                dispatch(
                    addNewMessage({
                        chatId: chatId,
                        message: displayMessage,
                    }),
                );
            } catch (err) {
                console.error("Error handling incoming message:", err);
                // Clear thinking indicator on error so UI doesn't hang
                if (isAIRef.current) {
                    setBotThinking(false);
                }
            }
        };

        // Register socket listener inside useEffect
        socket.on("message", handleIncomingMessage);

        return () => {
            socket.off("message", handleIncomingMessage);
            socket.off("connect", handleReconnect);
            socket.emit("chat:exit", chatId);
            console.log("Exiting chat");
        };
    }, [chatId, userId]); // Reset chat when friend changes

    // console.log('reduxmessage', messages)

    async function getSskLocally(chatId: string): Promise<Uint8Array | null> {
        if (Platform.OS === "web") {
            const localSskWeb = localStorage.getItem(`ssk_${chatId}_${userId}`);

            if (localSskWeb) {
                const ssk_bytes = new Uint8Array(
                    Buffer.from(localSskWeb, "base64"),
                );
                console.log("Found SSK in localStorage");
                return ssk_bytes;
            }
        } else {
            const localSskPhone = await secureStore.getItemAsync(
                `ssk_${chatId}_${userId}`,
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
        const text = messageInput.trim();

        player.seekTo(0);
        player.play();

        const tempId = Date.now().toString();
        const now = new Date().toISOString();

        // Immediately update UI before any async work
        const localMessage: Message = {
            id: tempId,
            chatId: chatId,
            senderId: userId,
            payload: text,
            createdAt: now,
        };

        dispatch(
            addNewMessage({
                chatId: chatId,
                message: localMessage,
            }),
        );
        setMessageInput("");

        // Show thinking indicator for AI chats immediately
        if (isAIRef.current) {
            setBotThinking(true);
        }

        try {
            let payload: string;

            if (isAIRef.current) {
                payload = text;
            } else {
                const ssk = await getSskLocally(chatId);
                if (!ssk) throw new Error("sendmessage:SSK not found");

                const ssk_string = Buffer.from(ssk).toString("base64");
                payload = await encryptMessage(text, ssk_string);
            }

            const messageToSend = {
                id: tempId,
                chatId: chatId,
                senderId: userId,
                userId: userId,
                receiverId: otherMember?.userId,
                payload: payload,
                createdAt: now,
            };

            socket.emit("message", messageToSend, (response: any) => {
                console.log("msgack", response);
            });
        } catch (err) {
            console.error("Error sending message:", err);
            // Clear thinking on error
            setBotThinking(false);
        }
    };

    const renderChatItem = ({ item }: ListRenderItemInfo<Message>) => {
        const isUser = item.senderId === userId;

        return (
            <View
                className={`mb-3 flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
                <View
                    className={`rounded-2xl px-4 py-2.5 max-w-[78%] ${
                        isUser ? "rounded-br-sm" : "rounded-bl-sm"
                    }`}
                    style={{
                        backgroundColor: isUser ? "#1a2e1a" : "#1a1a2e",
                        borderWidth: 1,
                        borderColor: isUser
                            ? "rgba(147, 252, 0, 0.15)"
                            : "rgba(255, 255, 255, 0.06)",
                    }}
                >
                    <Text
                        className="text-base leading-5"
                        style={{
                            color: isUser ? "#d4f5b0" : "#e2e8f0",
                            flexWrap: "wrap",
                        }}
                    >
                        {item.payload}
                    </Text>
                </View>
                <Text
                    className="mt-1 px-1"
                    style={{
                        fontSize: 10,
                        color: "#555",
                        fontFamily: "GeistMono",
                    }}
                >
                    {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </Text>
            </View>
        );
    };

    return (
        <View className="flex-1" style={{ backgroundColor: "#0a0f1a" }}>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />

            {/* Header */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: "#1a1f2e",
                    backgroundColor: "#0a0f1a",
                }}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        padding: 4,
                        marginRight: 8,
                    }}
                >
                    <ChevronLeft color="#93FC00" size={24} />
                </TouchableOpacity>

                <View style={{ position: "relative" }}>
                    <Image
                        source={{ uri: otherMember?.avatarUrl }}
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            borderWidth: 1.5,
                            borderColor: "#22c55e30",
                        }}
                    />
                    <View
                        style={{
                            position: "absolute",
                            bottom: 0,
                            right: 0,
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: "#22c55e",
                            borderWidth: 2,
                            borderColor: "#0a0f1a",
                        }}
                    />
                </View>

                <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text
                        style={{
                            color: "#ffffff",
                            fontSize: 16,
                            fontWeight: "600",
                            fontFamily: "GeistMono",
                        }}
                    >
                        {otherMember?.name}
                    </Text>
                    {isAI && (
                        <Text
                            style={{
                                color: "#93FC00",
                                fontSize: 11,
                                fontFamily: "GeistMono",
                                marginTop: 1,
                                opacity: 0.7,
                            }}
                        >
                            AI Assistant
                        </Text>
                    )}
                </View>
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
                    renderItem={renderChatItem}
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                        paddingTop: 16,
                        paddingBottom: 12,
                        flexGrow: 1,
                        justifyContent: messagesFromState?.length
                            ? undefined
                            : "center",
                    }}
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
                    ListEmptyComponent={
                        <View style={{ alignItems: "center", opacity: 0.4 }}>
                            <Text
                                style={{
                                    color: "#94a3b8",
                                    fontSize: 14,
                                    fontFamily: "GeistMono",
                                }}
                            >
                                No messages yet
                            </Text>
                            <Text
                                style={{
                                    color: "#64748b",
                                    fontSize: 12,
                                    fontFamily: "GeistMono",
                                    marginTop: 4,
                                }}
                            >
                                Say something to start the conversation
                            </Text>
                        </View>
                    }
                />

                {/* Bot thinking indicator */}
                {botThinking && (
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingHorizontal: 20,
                            paddingVertical: 10,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                backgroundColor: "#1a1a2e",
                                borderWidth: 1,
                                borderColor: "rgba(255, 255, 255, 0.06)",
                                borderRadius: 16,
                                borderBottomLeftRadius: 4,
                                paddingHorizontal: 16,
                                paddingVertical: 10,
                            }}
                        >
                            <ActivityIndicator size="small" color="#93FC00" />
                            <Text
                                style={{
                                    color: "#94a3b8",
                                    fontSize: 13,
                                    marginLeft: 10,
                                    fontFamily: "GeistMono",
                                }}
                            >
                                thinking...
                            </Text>
                        </View>
                    </View>
                )}

                {/* Message Input */}
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderTopWidth: 1,
                        borderTopColor: "#1a1f2e",
                        backgroundColor: "#0a0f1a",
                    }}
                >
                    <View
                        style={{
                            flex: 1,
                            flexDirection: "row",
                            alignItems: "center",
                        }}
                    >
                        <TextInput
                            style={{
                                flex: 1,
                                backgroundColor: "#1a1f2e",
                                color: "#e2e8f0",
                                borderRadius: 22,
                                paddingHorizontal: 18,
                                paddingVertical: 10,
                                fontSize: 15,
                                borderWidth: 1,
                                borderColor: "#2a2f3e",
                                fontFamily: "GeistMono",
                            }}
                            placeholder="Message..."
                            placeholderTextColor="#4a5568"
                            value={messageInput}
                            onChangeText={setMessageInput}
                            onSubmitEditing={() => encryptSendMessage()}
                            ref={inputRef}
                        />
                        <TouchableOpacity
                            onPress={encryptSendMessage}
                            disabled={messageInput.trim() === ""}
                            style={{
                                marginLeft: 10,
                                width: 42,
                                height: 42,
                                borderRadius: 21,
                                backgroundColor:
                                    messageInput.trim() === ""
                                        ? "#1a1f2e"
                                        : "#93FC00",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <SendHorizontal
                                color={
                                    messageInput.trim() === ""
                                        ? "#4a5568"
                                        : "#0a0f1a"
                                }
                                size={20}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

export default ChatScreen;
