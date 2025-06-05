import { View, Text, TouchableOpacity, Image , Animated} from "react-native";
import Svg from '../components/SvgComponent';
import { useNavigation } from "expo-router";
import { socket } from '../socket'
import { useEffect, useState } from "react";
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
// import { Animated } from 'react-native';
import { useRef } from 'react';





WebBrowser.maybeCompleteAuthSession();

// Endpoint for github oauth 
const discovery = {
  authorizationEndpoint: 'https://github.com/login/oauth/authorize',
  tokenEndpoint: 'https://github.com/login/oauth/access_token',
};

export default function Index() {
  const [setIsConnected] = useState(false);
  const [setTransport] = useState('N/A');


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
      redirectUri: makeRedirectUri({
        scheme: 'myapp'
      }),
    },
    discovery
  );



  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      console.log('Response Code:', code)
    }
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
          style={{ width: 28, height: 28, marginRight: 12  , borderRadius: 10, }}
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
