import CustomButton from "@/components/CustomButton";
import CustomHeader from "@/components/CustomHeader";
import { formatCurrency } from "@/lib/formatter";
import { useCartStore } from "@/store/cart.store";
import { useOrdersStore } from "@/store/orders.store";
import { Order } from "@/type";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OrderDetail() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const { orders } = useOrdersStore();
  const { reorder } = useCartStore();

  const order = orders.find((o) => o.id === orderId) as Order | undefined;

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <CustomHeader title="Order Details" />
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-400">Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleReorder = () => {
    reorder(
      order.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    );
    router.push("/(tabs)/cart");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "text-green-600";
      case "pending":
        return "text-yellow-600";
      case "cancelled":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100";
      case "pending":
        return "bg-yellow-100";
      case "cancelled":
        return "bg-red-100";
      default:
        return "bg-gray-100";
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <CustomHeader title="Order Details" />

      <FlatList
        data={order.items || []}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        ListHeaderComponent={
          <View className="px-4 py-4">
            {/* Order Header */}
            <View className="bg-gray-50 rounded-xl p-4 mb-6">
              <View className="flex-row justify-between items-start mb-4">
                <View>
                  <Text className="text-gray-600 text-sm">Order ID</Text>
                  <Text className="font-bold text-lg">
                    #{order.id.slice(0, 8)}
                  </Text>
                </View>
                <View
                  className={`${getStatusBgColor(order.status)} px-3 py-1 rounded-full`}
                >
                  <Text
                    className={`font-semibold text-sm capitalize ${getStatusColor(order.status)}`}
                  >
                    {order.status}
                  </Text>
                </View>
              </View>

              <View className="border-t border-gray-200 pt-3">
                <Text className="text-gray-600 text-sm">Order Date</Text>
                <Text className="font-semibold">
                  {new Date(order.createdAt.seconds * 1000).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Order Items Header */}
            <Text className="text-lg font-bold mb-3">Order Items</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="px-4 mb-4">
            <View className="bg-gray-50 rounded-lg p-3">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="font-semibold text-base">{item.name}</Text>
                  <Text className="text-gray-600 text-sm mt-1">
                    Qty: {item.quantity}
                  </Text>
                </View>
                <Text className="font-semibold text-base">
                  {formatCurrency(item.price * item.quantity)}
                </Text>
              </View>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View className="px-4 pb-6">
            {/* Order Summary */}
            <View className="border-t border-gray-200 pt-4 mt-4 mb-6">
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-600">Subtotal</Text>
                <Text className="text-gray-600">
                  {formatCurrency(
                    (order.items || []).reduce(
                      (sum, item) => sum + item.price * item.quantity,
                      0,
                    ),
                  )}
                </Text>
              </View>

              <View className="flex-row justify-between mb-4">
                <Text className="text-gray-600">Delivery Fee</Text>
                <Text className="text-gray-600">£0.00</Text>
              </View>

              <View className="bg-black rounded-lg p-4 flex-row justify-between">
                <Text className="text-white font-bold text-lg">Total</Text>
                <Text className="text-white font-bold text-lg">
                  {formatCurrency(order.total)}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="gap-3">
              <CustomButton
                title="Re-order"
                style="bg-black"
                onPress={handleReorder}
              />
              <CustomButton
                title="Back to Orders"
                style="bg-gray-200"
                textStyle="text-black"
                onPress={() => router.back()}
              />
            </View>
          </View>
        }
        scrollEnabled={false}
        nestedScrollEnabled={false}
      />
    </SafeAreaView>
  );
}
