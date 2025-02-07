import { View, Text, Image, Button, TouchableOpacity } from "react-native";
import Svg from '../components/SvgComponent';
import { Link, router, useRouter, useNavigation } from "expo-router";

export default function Index() {


  const navigation = useNavigation();

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
        <TouchableOpacity
          onPress={() => navigation.navigate('home/(tabs)')}
        className="bg-blue-500 p-4 rounded-lg w-64"
        >
        <Text className="text-center text-white  text-2xl font-semibold font-GeistMono">
          Start Messaging!
        </Text>
      </TouchableOpacity>
    </View>
    </View >
  );
}
