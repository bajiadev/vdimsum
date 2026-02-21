import { getRedeemableItems, getUserPoints, redeemItem } from "@/lib/firebase";
import useAuthStore from "@/store/auth.store";
import { useOrderStore } from "@/store/order.store";
import useShopStore from "@/store/shop.store";
import { RedeemableItem } from "@/type";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const RewardItemCard = ({
  item,
  userPoints,
  onRedeem,
}: {
  item: RedeemableItem;
  userPoints: number;
  onRedeem: (item: RedeemableItem) => void;
}) => {
  const canAfford = userPoints >= (item.points_cost || 0);

  return (
    <View className="bg-white rounded-2xl p-4 mb-4 mx-4 border border-gray-200 shadow-sm">
      <View className="flex-row">
        {item.image_url && (
          <Image
            source={{ uri: item.image_url }}
            className="w-20 h-20 rounded-lg"
            resizeMode="cover"
          />
        )}
        <View className="flex-1 ml-4">
          <Text className="text-lg font-bold text-gray-900">{item.name}</Text>
          <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>
            {item.description}
          </Text>
          <View className="flex-row items-center mt-2">
            <Ionicons name="star" size={16} color="#3b82f6" />
            <Text className="text-blue-600 font-bold ml-1">
              {item.points_cost || 0} points
            </Text>
          </View>
          {item.reward_stock !== undefined && (
            <Text className="text-xs text-gray-400 mt-1">
              Stock: {item.reward_stock}
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        onPress={() => onRedeem(item)}
        disabled={!canAfford || !item.is_available || item.reward_stock === 0}
        className={`mt-3 py-3 rounded-lg items-center ${
          canAfford && item.is_available && item.reward_stock !== 0
            ? "bg-blue-600"
            : "bg-gray-300"
        }`}
      >
        <Text
          className={`font-semibold ${canAfford && item.is_available && item.reward_stock !== 0 ? "text-white" : "text-gray-500"}`}
        >
          {!item.is_available
            ? "Not Available"
            : item.reward_stock === 0
              ? "Out of Stock"
              : !canAfford
                ? `Need ${(item.points_cost || 0) - userPoints} more points`
                : "Redeem Now"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default function RewardsPage() {
  const { user } = useAuthStore();
  const { shopId, orderType } = useShopStore();
  const { addRedeemedItem } = useOrderStore();
  const [items, setItems] = useState<RedeemableItem[]>([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [redeemableItems, userPoints] = await Promise.all([
        getRedeemableItems(),
        getUserPoints(user.id),
      ]);
      setItems(redeemableItems);
      setPoints(userPoints);
    } catch (error) {
      console.error("Failed to fetch rewards:", error);
      Alert.alert("Error", "Failed to load rewards");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRedeem = async (item: RedeemableItem) => {
    if (!user?.id) return;

    if (!shopId || !orderType) {
      Alert.alert(
        "Order info required",
        "Please choose a shop and delivery/pickup first.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Choose now", onPress: () => router.push("/shops") },
        ],
      );
      return;
    }

    Alert.alert(
      "Confirm Redemption",
      `Redeem ${item.name} for ${item.points_cost || 0} points?\n\nThis item is for collection only.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Redeem",
          onPress: async () => {
            try {
              setRedeeming(true);
              const redemptionId = await redeemItem(user.id, item.id, 1);
              addRedeemedItem(item, 1, redemptionId);
              Alert.alert(
                "Success!",
                "Item added to your order at £0.00. You can continue ordering or check out now.",
                [
                  {
                    text: "Continue",
                    style: "cancel",
                  },
                  {
                    text: "Go to Order",
                    onPress: () => router.push("/(tabs)/order"),
                  },
                ],
              );
              fetchData(); // Refresh data
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to redeem item");
            } finally {
              setRedeeming(false);
            }
          },
        },
      ],
    );
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-lg text-gray-600">
            Please sign in to view rewards
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-gradient-to-r from-blue-600 to-blue-500 mx-4 mt-4 p-6 rounded-2xl shadow-md">
        <View className="flex-row items-center justify-between">
          <View className="items-center justify-center">
            <Text className="text-sm">Your Points</Text>
            <Text className="text-4xl font-bold mt-1 text-[#3b82f6]">
              {points}
            </Text>
          </View>
          <Ionicons name="star" size={60} color="#3b82f6" />
        </View>
      </View>

      <View className="px-4 mt-3">
        <TouchableOpacity
          className="self-end"
          onPress={() => router.push("/rewards/history")}
          activeOpacity={0.8}
        >
          <View className="flex-row items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5">
            <Ionicons name="time-outline" size={18} color="#2563EB" />
            <Text className="text-sm font-semibold text-blue-700 uppercase">
              Redemption History
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#2563EB" />
          </View>
        </TouchableOpacity>
      </View>

      <View className="px-4 py-3">
        <Text className="text-sm font-semibold text-gray-500 uppercase">
          Collection Only Items
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RewardItemCard
            item={item}
            userPoints={points}
            onRedeem={handleRedeem}
          />
        )}
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshing={loading}
        onRefresh={fetchData}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-20 px-6">
            <Ionicons name="gift-outline" size={80} color="#D1D5DB" />
            <Text className="text-xl font-semibold mt-6 text-gray-600">
              No rewards available
            </Text>
            <Text className="text-gray-500 text-center mt-2">
              Check back later for redeemable items
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
