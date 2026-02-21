import { getUserRedemptions } from "@/lib/firebase";
import useAuthStore from "@/store/auth.store";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Redemption {
  id: string;
  itemName: string;
  quantity: number;
  totalPoints: number;
  status: string;
  createdAt: any;
}

const RedemptionCard = ({ redemption }: { redemption: Redemption }) => {
  const statusColors = {
    pending_collection: "bg-yellow-100 text-yellow-800",
    collected: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const statusText = {
    pending_collection: "Pending Collection",
    collected: "Collected",
    cancelled: "Cancelled",
  };

  const statusColor =
    statusColors[redemption.status as keyof typeof statusColors] ||
    "bg-gray-100 text-gray-800";
  const displayStatus =
    statusText[redemption.status as keyof typeof statusText] ||
    redemption.status;

  return (
    <View className="bg-white rounded-2xl p-4 mx-4 mb-3 border border-gray-200">
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900">
            {redemption.itemName}
          </Text>
          <Text className="text-sm text-gray-500 mt-1">
            Quantity: {redemption.quantity}
          </Text>
          <View className="flex-row items-center mt-2">
            <Ionicons name="star" size={16} color="#3b82f6" />
            <Text className="text-blue-600 font-semibold ml-1">
              {redemption.totalPoints} points
            </Text>
          </View>
        </View>
        <View className={`px-3 py-1 rounded-full ${statusColor}`}>
          <Text className="text-xs font-semibold">{displayStatus}</Text>
        </View>
      </View>
      {redemption.createdAt && (
        <Text className="text-xs text-gray-400 mt-3">
          {new Date(redemption.createdAt.seconds * 1000).toLocaleDateString(
            "en-GB",
            {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            },
          )}
        </Text>
      )}
    </View>
  );
};

export default function RedemptionHistory() {
  const { user } = useAuthStore();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRedemptions = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await getUserRedemptions(user.id);
      setRedemptions(data as Redemption[]);
    } catch (error) {
      console.error("Failed to fetch redemptions:", error);
      Alert.alert("Error", "Failed to load redemption history");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchRedemptions();
  }, [fetchRedemptions]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-xl font-bold">Redemption History</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={redemptions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RedemptionCard redemption={item} />}
        contentContainerStyle={{ paddingVertical: 16 }}
        refreshing={loading}
        onRefresh={fetchRedemptions}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-20 px-6">
            <Ionicons name="receipt-outline" size={80} color="#D1D5DB" />
            <Text className="text-xl font-semibold mt-6 text-gray-600">
              No redemptions yet
            </Text>
            <Text className="text-gray-500 text-center mt-2">
              Start redeeming items with your points
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
