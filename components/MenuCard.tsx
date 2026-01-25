import { Text, TouchableOpacity, Image, Platform } from "react-native";
import { MenuItem } from "@/type";
//import { appwriteConfig } from "@/lib/appwrite";
import { useCartStore } from "@/store/cart.store";
import { Link } from "expo-router";
import { formatCurrency } from "@/lib/formatter";

const MenuCard = ({
  item,
}: {
  item: MenuItem;
}) => {
  const imageUrl = `${item.image_url}`;
  const { addItem } = useCartStore();

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
        <Text className="body-regular text-gray-200 mb-4">{formatCurrency(item.price)}</Text>
        <TouchableOpacity
          onPress={() =>
            addItem(item)
          }
        >
          <Text className="paragraph-bold text-primary">Add to Cart +</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Link>
  );
};
export default MenuCard;
