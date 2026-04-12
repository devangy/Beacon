import {
    View,
    Text,
    TouchableOpacity,
    Image,
    Animated,
    Platform,
    Dimensions,
    ScrollView,
    SafeAreaView,
} from "react-native";
import SvgComponent from "../components/SvgComponent";
import { useEffect, useState, useRef } from "react";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri, useAuthRequest } from "expo-auth-session";
import axios from "axios";
import { useRouter } from "expo-router";
import { ApiResponse } from "@/types/api-response";
import { useAppDispatch } from "../hooks/hooks";
import { authUser } from "@/types/authUser";
import { setAuthUser } from "@/slices/authSlice";

WebBrowser.maybeCompleteAuthSession();

const discovery = {
    authorizationEndpoint: "https://github.com/login/oauth/authorize",
    tokenEndpoint: "https://github.com/login/oauth/access_token",
};

/**
 * Responsive beacon pulse with layered rings
 * Creates a subtle, professional "listening" effect
 */
function BeaconPulse() {
    const pulse1 = useRef(new Animated.Value(0)).current;
    const pulse2 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const createPulse = (anim: Animated.Value, delay: number) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ]),
            );
        createPulse(pulse1, 0).start();
        createPulse(pulse2, 1000).start();
    }, []);

    const ringStyle = (anim: Animated.Value) => ({
        position: "absolute" as const,
        width: 80,
        height: 80,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: "#22c55e",
        opacity: anim.interpolate({
            inputRange: [0, 0.3, 1],
            outputRange: [0.6, 0.15, 0],
        }),
        transform: [
            {
                scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 2.5],
                }),
            },
        ],
    });

    return (
        <>
            <Animated.View style={ringStyle(pulse1)} />
            <Animated.View style={ringStyle(pulse2)} />
        </>
    );
}

/**
 * Responsive scaling helper
 */
const getResponsiveValue = (
    baseSmall: number,
    baseMedium: number,
    baseLarge: number,
    screenWidth: number,
) => {
    if (screenWidth < 380) return baseSmall;
    if (screenWidth < 500) return baseMedium;
    return baseLarge;
};

export default function Index() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { width, height } = Dimensions.get("window");

    const [loading, setLoading] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // Responsive values
    const logoSize = getResponsiveValue(56, 64, 80, width);
    const titleSize = getResponsiveValue(42, 56, 72, width);
    const taglineSize = getResponsiveValue(13, 14, 16, width);
    const topSpacing = Math.max(height * 0.15, 60);
    const middleSpacing = Math.max(height * 0.12, 40);
    const buttonSpacing = Math.max(height * 0.12, 50);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.92,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
        }).start();
    };

    const [request, response, promptAsync] = useAuthRequest(
        {
            clientId: "Iv23liH1VM9aPXjaTsUu",
            scopes: ["read:user", "user:email"],
            redirectUri: Platform.select({
                web: process.env.EXPO_PUBLIC_REDIRECT_WEB,
                default: makeRedirectUri({
                    scheme: "myapp",
                    path: "home/chats",
                }),
            }),
            usePKCE: true,
        },
        discovery,
    );

    useEffect(() => {
        const handleOAuth = async () => {
            console.log(response);
            if (loading || response?.type !== "success") return;
            if (response?.type === "success") {
                setLoading(true);
                const { code } = response.params;

                try {
                    const res = await axios<ApiResponse<authUser>>({
                        method: "post",
                        url: `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/github`,
                        data: {
                            code,
                            code_verifier: request?.codeVerifier,
                        },
                    });

                    const { accessToken, userId } = res.data.data;

                    dispatch(
                        setAuthUser({
                            accessToken,
                            userId,
                        }),
                    );

                    router.push("/home/chats");
                } catch (error: any) {
                    console.error("Authentication failed:", error);
                    setLoading(false);
                }
            }
        };

        handleOAuth();
    }, [response, loading]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#0a0f1a" }}>
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                scrollEnabled={height < 700}
                showsVerticalScrollIndicator={false}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "#0a0f1a",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingHorizontal: 24,
                        paddingBottom: 32,
                        marginTop: 70,
                    }}
                >
                    {/* Header Section */}
                    <View
                        style={{
                            marginTop: 100,
                            alignItems: "center",
                            gap: 30,
                        }}
                    >
                        {/* Logo with pulse effect */}
                        <View
                            style={{
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <BeaconPulse />
                            <View
                                style={{
                                    width: logoSize,
                                    height: logoSize,
                                    backgroundColor: "#22c55e",
                                    borderRadius: logoSize / 2,
                                    justifyContent: "center",
                                    alignItems: "center",
                                    overflow: "hidden",
                                    shadowColor: "#22c55e",
                                    shadowOffset: { width: 0, height: 0 },
                                    shadowOpacity: 200,
                                    shadowRadius: 50,
                                    elevation: 8,
                                }}
                            >
                                <SvgComponent />
                            </View>
                        </View>

                        {/* Title */}
                        <Text
                            style={{
                                fontSize: titleSize,
                                fontWeight: "300",
                                color: "#ffffff",
                                marginTop: 40,
                                letterSpacing: 3,
                                fontFamily: "System",
                            }}
                        >
                            Beacon
                        </Text>

                        {/* Tagline */}
                        <Text
                            style={{
                                fontSize: taglineSize,
                                color: "#94a3b8",
                                fontWeight: "300",
                                textAlign: "center",
                                textDecorationStyle: "dotted",
                                letterSpacing: 0.3,
                                marginTop: 4,
                                lineHeight: taglineSize * 1.5,
                                maxWidth: 300,
                                fontFamily: "System",
                            }}
                        >
                            "Speak freely. We aren't listening."
                        </Text>
                    </View>

                    {/* Spacer */}
                    <View style={{ height: middleSpacing }} />

                    {/* Login Button */}
                    <View
                        style={{
                            width: "100%",
                            alignItems: "center",
                            marginBottom: buttonSpacing,
                        }}
                    >
                        <Animated.View
                            style={{
                                transform: [{ scale: scaleAnim }],
                                width: "100%",
                                maxWidth: 320,
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => promptAsync()}
                                onPressIn={handlePressIn}
                                onPressOut={handlePressOut}
                                disabled={loading}
                                activeOpacity={0.8}
                                style={{
                                    backgroundColor: "#1a1f2e",
                                    borderWidth: 1,
                                    borderColor: "#22c55e",
                                    paddingVertical: 12,
                                    paddingHorizontal: 10,
                                    borderRadius: 15,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginTop: -200,
                                    gap: 12,
                                    opacity: loading ? 0.6 : 1,
                                    shadowColor: "#22c55e",
                                    shadowOffset: { width: 0, height: 0 },
                                    shadowOpacity: loading ? 0 : 0.2,
                                    shadowRadius: 8,
                                    elevation: 4,
                                }}
                            >
                                {!loading && (
                                    <Image
                                        className="rounded-full"
                                        source={{
                                            uri: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
                                        }}
                                        style={{
                                            width: 35,
                                            height: 35,
                                            marginRight: 15,
                                        }}
                                    />
                                )}
                                <Text
                                    style={{
                                        color: "#ffffff",
                                        fontSize: 16,
                                        fontWeight: "500",
                                        letterSpacing: 0.3,
                                        fontFamily: "mono",
                                    }}
                                >
                                    {loading
                                        ? "Connecting..."
                                        : "Continue with GitHub"}
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
