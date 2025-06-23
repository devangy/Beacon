import { View, Text, TouchableOpacity, Image, Animated, Platform } from "react-native";
import Svg from '../components/SvgComponent';
import { useNavigation } from "expo-router";
import { socket } from '../socket'
import { useEffect, useState } from "react";
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { useRef } from 'react';
import axios from 'axios'
import { useRouter } from "expo-router";
import { ApiResponse } from "@/types/api.response";
import { useAppDispatch } from "../hooks/hooks";
import { authUser } from "@/types/authUser";
import { setAuthUser } from "@/slices/authSlice";
import { setToken, getToken } from "@/hooks/authToken";



WebBrowser.maybeCompleteAuthSession();

// Endpoint for github oauth 
const discovery = {
  authorizationEndpoint: 'https://github.com/login/oauth/authorize',
  tokenEndpoint: 'https://github.com/login/oauth/access_token',
};

export default function Index () {
  const dispatch = useAppDispatch();
  const router = useRouter();


  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState('N/A');


  // useEffect(() => {

  //   if (socket.connected) {
  //     onConnect();
  //   }

  //   socket.emit('message', 'hello nerdd');


  //   function onConnect() {
  //     setIsConnected(true);
  //     setTransport(socket.io.engine.transport.name);

  //     socket.emit('message', 'hello nerdd');

  //     socket.io.engine.on('upgrade', (transport) => {
  //       setTransport(transport.name);
  //       console.log('transport:', transport.name);
  //     });
  //   }

  //   function onDisconnect() {
  //     setIsConnected(false);
  //     setTransport('N/A');
  //   }

  //   socket.on('connect', onConnect);
  //   socket.on('disconnect', onDisconnect);

  //   return () => {
  //     socket.off('connect', onConnect);
  //     socket.off('disconnect', onDisconnect);
  //   };
  // }, []);

  //

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
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
      clientId: process.env.EXPO_PUBLIC_GHUB_CID || 'add',
      scopes: ['read:user', 'user:email'],
      redirectUri: Platform.select({
        web: 'http://localhost:8081', // For web browser
        default: makeRedirectUri({     // For mobile
          scheme: 'myapp',
          path: 'oauth'
        })
      })
    },
    discovery
  );




  useEffect(() => {
    const handleOAuth = async () => {
      if (response?.type === 'success') {
        const { code } = response.params;
        console.log('Auth code:', code);

        try {
          const res = await axios<ApiResponse<authUser>>({
            method: 'post',
            url: `${process.env.EXPO_PUBLIC_BASE_URL}/api/auth/github`,
            data: { code },
          });

          console.log('Login successful:', res.data);

          const accessToken = res.data.data.accessToken;
          const refreshToken = res.data.data.refreshToken;
          const userId = res.data.data.userId; 


          console.log('Token received:', accessToken);
          console.log('Refresh Token:', refreshToken);
          console.log('User ID:', userId);

  

        //   if (refreshToken) {
        //     setToken(refreshToken);
        //   } else {
        //     console.error('No refresh token received');
        //     throw new Error('No refresh token received');
        //   }

        //   const refreshTokenExpoStore = await getToken()

        //  console.log('Refresh Token from Expo Secure Store:', refreshTokenExpoStore);

          

          // Dispatch using the accessToken and decoded userId
          dispatch(setAuthUser({ accessToken: accessToken, userId: userId }));

          router.push('/home/Friends');
        } catch (error: any) {
          console.error('Error logging in:', error);
          response.error = error.message || 'An error occurred during login';
        }
      }
    };

    handleOAuth();
  }, [response]);

  return (
    <View
      className="flex-1 flex-col border-1 border-red-400 bg-[#101820] items-center"
    >
      <View className="flex flex-row w-full items-center justify-center mt-60 gap-10">
        {/* Wrapped Image inside a View */}
        <View className="flex h-20 w-20 p-4 bg-green-300 rounded-xl justify-center items-center">
          <Svg height={92} width={92} />
        </View>
        <Text className="flex text-7xl font-light  mt-4 text-white subpixel-antialiased">
          Beacon
        </Text>
      </View>

      <View className="flex border-2 border-red-500 h-20 w-full justify-center items-center mt-80">
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            onPress={() => promptAsync()}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.8}
            style={{
              backgroundColor: '#24292e',
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.2,
              shadowRadius: 5,
              elevation: 5,
            }}
          >
            <Image
              source={{
                uri: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
              }}
              style={{ width: 28, height: 28, marginRight: 12, borderRadius: 10, }}
            />
            <Text
              style={{
                color: '#ffffff',
                fontSize: 18,
                fontWeight: '600',
                fontFamily: 'GeistMono',
              }}
            >
              Sign in with GitHub
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View >
  );
}
