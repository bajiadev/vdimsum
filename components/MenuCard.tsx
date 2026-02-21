import { formatCurrency } from "@/lib/formatter";
import useAuthStore from "@/store/auth.store";
import { useOrderStore } from "@/store/order.store";
import useShopStore from "@/store/shop.store";
import { MenuItem } from "@/type";
import { Link, router } from "expo-router";
import {
  Alert,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const MenuCard = ({ item }: { item: MenuItem }) => {
  const imageUrl = item.image_url ? `${item.image_url}` : undefined;
  const { addItem } = useOrderStore();
  const { user } = useAuthStore();
  const { shopId, orderType } = useShopStore();

  const handleAddToOrder = () => {
    if (!user) {
      // Show auth modal/redirect to sign up
      Alert.alert(
        "Sign In Required",
        "Please sign in to add items to your order",
        [
          { text: "Cancel", onPress: () => {} },
          {
            text: "Sign In",
            onPress: () => router.push("/(tabs)/(auth)/sign-in"),
          },
          {
            text: "Sign Up",
            onPress: () => router.push("/(tabs)/(auth)/sign-up"),
          },
        ],
      );
      return;
    }

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

    // If item has customizations, navigate to product page
    if (item.customizations && item.customizations.length > 0) {
      router.push({ pathname: "/product/[id]", params: { id: item.id } });
      return;
    }

    // Otherwise add directly with no customizations
    addItem(item, 1, []);
  };

  return (
    <Link href={{ pathname: "/product/[id]", params: { id: item.id } }} asChild>
      <TouchableOpacity
        className="flex-row items-center gap-4 rounded-2xl bg-white p-4"
        style={
          Platform.OS === "android"
            ? { elevation: 8, shadowColor: "#878787" }
            : {}
        }
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            className="h-20 w-20 rounded-xl"
            resizeMode="cover"
          />
        ) : (
          <View className="h-20 w-20 items-center justify-center rounded-xl bg-gray-100">
            <Text className="text-xs text-gray-400">No image</Text>
          </View>
        )}

        <View className="flex-1 items-end">
          <Text
            className="base-bold text-dark-100 mb-1 text-right"
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text className="body-regular text-gray-200 mb-3 text-right">
            {formatCurrency(item.price)}
          </Text>
          <TouchableOpacity onPress={handleAddToOrder}>
            <Text className="paragraph-bold text-primary">Add to Order +</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Link>
  );
};
export default MenuCard;
