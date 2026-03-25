import useAuthStore from "@/store/auth.store";
import useShopStore from "@/store/shop.store";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import OrderButton from "./OrderButton";

interface HeaderProps {
  onOrderPress?: () => void;
}

export default function Header({ onOrderPress }: HeaderProps) {
  const { shopName, shopAddress, deliveryAddress, orderType } = useShopStore();
  const { user } = useAuthStore();
  const canOrder = Boolean(user?.id);

  const handleOrderPress = () => {
    if (!canOrder) {
      router.push("/(auth)/sign-in");
      return;
    }

    if (onOrderPress) {
      onOrderPress();
      return;
    }

    router.push("/shops");
  };

  const headerText = !orderType
    ? "Order info"
    : orderType == "delivery"
      ? `Deliver from ${shopName || ""}`
      : `Pickup from ${shopName || ""}`;

  const subtext = !canOrder
    ? "Sign In / Sign Up to order"
    : orderType === "delivery"
      ? `To: ${deliveryAddress?.formatted || "Tap to select delivery address"}`
      : `From: ${shopAddress || "Tap to select pickup location"}`;

  return (
    <View className="flex-between flex-row w-full my-5 px-5">
      <TouchableOpacity
        onPress={() => router.push(!canOrder ? "/(auth)/sign-in" : "/shops")}
      >
        <Ionicons name="chevron-down" size={36} color="#070300" />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleOrderPress}>
        <View className="flex-col gap-y-1 items-center justify-center">
          <Text className="semi-bold">{headerText}</Text>
          {subtext && <Text className="text-xs text-gray-600">{subtext}</Text>}
        </View>
      </TouchableOpacity>

      <OrderButton />
    </View>
  );
}
