import { MenuItem } from "@/type";
import { Alert, Image, Platform, Text, TouchableOpacity } from "react-native";
import { formatCurrency } from "@/lib/formatter";
import useAuthStore from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import { Link, router } from "expo-router";

const MenuCard = ({ item }: { item: MenuItem }) => {
  const imageUrl = `${item.image_url}`;
  const { addItem } = useCartStore();
  const { user } = useAuthStore();

  const handleAddToCart = () => {
    if (!user) {
      // Show auth modal/redirect to sign up
      Alert.alert(
        "Sign In Required",
        "Please sign in to add items to your cart",
        [
          { text: "Cancel", onPress: () => {} },
          { text: "Sign In", onPress: () => router.push("/sign-in") },
          { text: "Sign Up", onPress: () => router.push("/sign-up") },
        ],
      );
      return;
    }
    addItem(item);
  };

  return (
    <Link href={{ pathname: "/product/[id]", params: { id: item.id } }} asChild>
      <TouchableOpacity
        className="menu-card"
        style={
          Platform.OS === "android"
            ? { elevation: 10, shadowColor: "#878787" }
            : {}
        }
      >
        <Image
          source={{ uri: imageUrl }}
          className="size-32 absolute -top-10"
          resizeMode="contain"
        />
        <Text
          className="text-center base-bold text-dark-100 mb-2"
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text className="body-regular text-gray-200 mb-4">
          {formatCurrency(item.price)}
        </Text>
        <TouchableOpacity onPress={handleAddToCart}>
          <Text className="paragraph-bold text-primary">Add to Cart +</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Link>
  );
};
export default MenuCard;
