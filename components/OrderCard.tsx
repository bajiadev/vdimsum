import { Order } from "@/type";
import { Pressable, Text, View } from "react-native";
import { formatCurrency } from "../lib/formatter";

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
  //onReorder?: () => void;
  //hideReorder?: boolean;
}

export default function OrderCard({
  order,
  onPress,
  //onReorder,
  //hideReorder = false,
}: OrderCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-xl p-4 mb-3 shadow-sm"
    >
      <View className="flex-row justify-between items-center">
        <Text className="font-bold text-base">{order.orderNumber}</Text>
        <Text className="text-gray-500 text-sm">
          {new Date(order.createdAt.seconds * 1000).toDateString()}
        </Text>
      </View>

      <View className="flex-row justify-between items-center">
        <Text className="text-gray-600 mt-1">
          {order.itemCount ?? 0} items · {formatCurrency(order.amount ?? 0)}
        </Text>
        <View className="flex-row items-center gap-2">
          <Text className="text-gray-500 text-sm">
            {order.orderType?.toUpperCase() || "N/A"}
          </Text>
          <Text className="text-gray-500 text-sm font-bold">
            {order.status.toUpperCase()}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
