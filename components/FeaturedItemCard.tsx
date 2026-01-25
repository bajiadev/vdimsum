// components/FeaturedItemCard.tsx
import { formatCurrency } from "@/lib/formatter";
import { View, Text, Image, TouchableOpacity } from "react-native";
//import { getImageUrl } from "@/lib/image";
//import { appwriteConfig } from "@/lib/firebase";
type FeaturedItemCardProps = {
  item: {
    $id: string;
    name: string;
    price: number;
    image_url?: string;
  };
  onPress?: () => void;
};



export const FeaturedItemCard = ({ item, onPress }: FeaturedItemCardProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="w-64 mr-4 bg-white rounded-3xl shadow-md overflow-hidden"
    >
      {item.image_url ? (
        <Image
          source={{
            uri: `${item.image_url}`,
          }}
          className="w-full h-32 rounded-xl"
          resizeMode="cover"
        />
      ) : (
        <View className="w-full h-32 bg-gray-200 items-center justify-center">
          <Text className="text-gray-400 text-xs">No image</Text>
        </View>
      )}

      <View className="p-4">
        <Text className="text-lg font-semibold" numberOfLines={1}>
          {item.name}
        </Text>

        <Text className="text-gray-500 mt-1">{formatCurrency(item.price)}</Text>

        <View className="mt-3 self-start bg-orange-500 px-3 py-1 rounded-full">
          <Text className="text-white text-xs font-semibold">Featured</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
