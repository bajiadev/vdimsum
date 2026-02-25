import CustomButton from "@/components/CustomButton";
import { getOrderDetails } from "@/lib/firebase";
import { formatCurrency } from "@/lib/formatter";
import { useOrderStore } from "@/store/order.store";
import { useOrdersStore } from "@/store/orders.store";
import { Order, OrderItem } from "@/type";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OrderDetail() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { orders } = useOrdersStore();
  const { reorder } = useOrderStore();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const order = orders.find((o) => o.id === orderId) as Order | undefined;

  useEffect(() => {
    const fetchOrderItems = async () => {
      if (!orderId) return;
      try {
        setLoading(true);
        const items = await getOrderDetails(orderId);
        setOrderItems(items as OrderItem[]);
      } catch (error) {
        console.error("Failed to fetch order items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderItems();
  }, [orderId]);

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-400">Order not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const handleReorder = () => {
    const reorderableItems = orderItems.filter(
      (item) => !item.isRewardRedemption,
    );

    if (reorderableItems.length === 0) {
      Alert.alert(
        "No reorderable items",
        "This order only contains redeemed reward items. Please redeem rewards again.",
      );
      return;
    }

    if (reorderableItems.length < orderItems.length) {
      Alert.alert(
        "Rewards not included",
        "Previously redeemed reward items are not included in re-order. You can redeem them again from Rewards.",
      );
    }

    reorder(
      reorderableItems.map((item) => ({
        id: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image_url: item.image_url,
        customizations: item.customizations || [],
      })),
    );
    router.push("/(tabs)/order");
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
      <FlatList
        data={orderItems || []}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerClassName="px-5 pb-32"
        ListHeaderComponent={
          <View className="px-4 py-4">
            {/* Order Header */}
            <View className="bg-white rounded-2xl p-4 mb-6 shadow-sm border border-gray-100">
              {/* Order Header */}
              <View className="flex-row justify-between items-center mb-4">
                <View>
                  <Text className="text-gray-500 text-xs">Order Number</Text>
                  <Text className="font-semibold text-base text-gray-900">
                    #{order.orderNumber}
                  </Text>
                </View>

                <View
                  className={`${getStatusBgColor(order.status)} px-3 py-1 rounded-full`}
                >
                  <Text
                    className={`text-xs font-semibold capitalize ${getStatusColor(order.status)}`}
                  >
                    {order.status}
                  </Text>
                </View>
              </View>

              {/* Order Type + Shop */}
              <View className="flex-row justify-between items-center mb-4">
                <View>
                  <Text className="text-gray-500 text-xs">Order Type</Text>
                  <Text className="font-semibold text-base capitalize">
                    {order.orderType}
                  </Text>
                </View>

                <View className="items-end">
                  <Text className="font-medium text-sm">{order.shopName}</Text>
                  {order.shopAddress && (
                    <Text className="text-gray-400 text-xs text-right max-w-[180px]">
                      {order.shopAddress}
                    </Text>
                  )}
                </View>
              </View>

              {/* Order Date */}
              <View className="border-t border-gray-100 pt-3">
                <Text className="text-gray-500 text-xs">Order Date</Text>
                <Text className="font-medium text-sm">
                  {new Date(order.createdAt.seconds * 1000).toLocaleString()}
                </Text>
              </View>
            </View>

            <Text className="text-lg font-bold mb-3 pt-3">Order Items</Text>
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
                    orderItems.reduce(
                      (sum, item) => sum + item.price * item.quantity,
                      0,
                    ),
                  )}
                </Text>
              </View>

              <View className="flex-row justify-between mb-4">
                <Text className="text-gray-500 text-sm">Delivery Fee</Text>
                <Text className="text-gray-700 text-sm">£0.00</Text>
              </View>
              <View className="border-t border-gray-100 my-3" />

              <View className="flex-row justify-between items-center">
                <Text className="text-lg font-semibold text-gray-900">
                  Total
                </Text>
                <Text className="text-xl font-bold text-black">
                  {formatCurrency(order.amount)}
                </Text>
              </View>
            </View>

            <CustomButton
              title="Re-order"
              style="mt-4"
              onPress={handleReorder}
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}
