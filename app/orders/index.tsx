import OrderCard from "@/components/OrderCard";
import { getUserOrders } from "@/lib/firebase";
import useAuthStore from "@/store/auth.store";
import { useOrdersStore } from "@/store/orders.store";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Orders() {
  const { orders, setOrders } = useOrdersStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await getUserOrders(user.id);
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, setOrders]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <SafeAreaView className="flex-1">
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => router.push(`/orders/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <Text className="text-center mt-10 text-gray-400">No orders yet</Text>
        }
        onEndReachedThreshold={0.1}
        refreshing={loading}
        onRefresh={fetchOrders}
      />
    </SafeAreaView>
  );
}
