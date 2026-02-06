import useShopStore from "@/store/shop.store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import CartButton from "./CartButton";

interface HeaderProps {
  onOrderPress?: () => void;
}

export default function Header({ onOrderPress }: HeaderProps) {
  const router = useRouter();
  const { shopName, shopAddress, orderType } = useShopStore();

  const headerText =
    !orderType? "Order info" : orderType == "delivery"
      ? `Deliver from ${shopName || ""}`
      : `Pickup from ${shopName || ""}`;

  const subtext = orderType === "delivery" ? shopAddress : shopAddress;

  return (
    <View className="flex-between flex-row w-full my-5 px-5">
      <TouchableOpacity onPress={() => router.push("/shops")}>
        <Ionicons name="chevron-down" size={36} color="#070300" />
      </TouchableOpacity>
      <TouchableOpacity onPress={onOrderPress}>
        <View className="flex-col gap-y-1 items-center justify-center">
          <Text className="semi-bold">{headerText}</Text>
          {subtext && <Text className="text-xs text-gray-600">{subtext}</Text>}
        </View>
      </TouchableOpacity>

      <CartButton />
    </View>
  );
}
