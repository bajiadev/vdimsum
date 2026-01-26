import { View, Text, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import OrderCard from "@/components/OrderCard";
import { router } from "expo-router";
import { useOrdersStore } from "@/store/orders.store";

export default function Orders() {
  const { orders } = useOrdersStore();

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
          <Text className="text-center mt-10 text-gray-400">
            No orders yet
          </Text>
        }
      />
    </SafeAreaView>
  );
}
