import { View, Text, Image } from "react-native";

export default function Profile() {
  const avatarUrl = 'https://avatars.githubusercontent.com/u/54235989?v=4';

  return (
    <View className="flex-1 bg-black items-center px-4">
      <View className="relative mt-32 ">
        {/* Profile Image Container */}
        <View className="w-48 h-48 rounded-full overflow-hidden border-4 border-gray-700">
          <Image
            source={{ uri: avatarUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>
        <Text className="text-white text-2xl font-semibold text-center mt-10">Devang</Text>
      </View>
    </View>
  );
}
