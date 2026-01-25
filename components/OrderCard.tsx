import { Pressable, Text, View, Image } from "react-native";
import { formatCurrency } from "../lib/formatter";
import cn from "clsx";

export default function OrderCard({ order, onPress, onReorder }) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-xl p-4 mb-3 shadow-sm"
    >
      <View className="flex-row justify-between items-center">
        <Text className="font-bold text-base">
          Order #{order.id.slice(0, 6)}
        </Text>
        <Text className="text-gray-500 text-sm">
          {new Date(order.createdAt.seconds * 1000).toDateString()}
        </Text>
      </View>

      <Text className="text-gray-600 mt-1">
        {order.items?.length ?? 0} items · {formatCurrency(order.total ?? 0)}
      </Text>

      <Pressable
        onPress={onReorder}
        className="mt-3 bg-black py-2 rounded-lg"
      >
        <Text className="text-white text-center font-semibold">
          Re-order
        </Text>
      </Pressable>
    </Pressable>
  );
}
