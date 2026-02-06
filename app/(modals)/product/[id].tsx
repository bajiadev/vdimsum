import ProductCartFooter from "@/components/ProductCartFooter";
import useAuthStore from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import { useMenu } from "@/store/menu.store";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";

export default function ProductDetails() {
  const [isFavourite, setIsFavourite] = useState(false);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMenuItemById, fetchMenuItemById } = useMenu();
  const { user } = useAuthStore();

  const { addItem } = useCartStore();

  const product = useMenu((s) => s.getMenuItemById(id));

  useEffect(() => {
    if (!id || product) return;
    fetchMenuItemById(id);
  }, [id, product]);

  console.log("ProductDetails product:", product);
  const imageUrl = product?.image_url ? `${product.image_url}` : undefined;

  const handleAddToCart = (qty: number) => {
    if (!user) {
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
    addItem(product, qty);
    router.back();
  };

  return (
    <View className="flex-1">
      <View className="flex-1 items-center justify-center p-4 mx-8">
        <View className="flex flex-row justify-between items-center w-full m-8">
          <Ionicons
            name="arrow-back-circle"
            size={32}
            color="orange"
            onPress={() => router.replace("/menu")}
          />

          <TouchableOpacity onPress={() => setIsFavourite(!isFavourite)}>
            <Ionicons
              name={isFavourite ? "heart" : "heart-outline"}
              size={32}
              color="orange"
            />
          </TouchableOpacity>
        </View>
        <View className="w-full">
          {imageUrl && (
            <Image
              source={{ uri: imageUrl }}
              className="w-full h-80 rounded-3xl"
              resizeMode="cover"
            />
          )}
        </View>
        <View className="mt-8">
          <Text className="font-semibold text-lg">{product?.description}</Text>
        </View>
        <View className="flex flex-row items-center justify-between w-full mt-8">
          <View>
            <Text className="text-sm text-gray-500">Calories</Text>
            <Text className="font-semibold text-lg">
              {product?.calories} kcal
            </Text>
          </View>
        </View>

        {product?.rating !== undefined && (
          <View className="flex flex-row items-center justify-between w-full mt-8">
            <View className="mt-8">
              <Text className="text-sm text-gray-500">Rating</Text>
              <View className="flex flex-row items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={
                      product?.rating >= star
                        ? "star"
                        : product?.rating >= star - 0.5
                          ? "star-half"
                          : "star-outline"
                    }
                    size={18}
                    color="orange"
                  />
                ))}

                <Text className="ml-2 font-semibold text-sm">
                  {product?.rating}
                </Text>
              </View>
            </View>
          </View>
        )}
        <View className="flex flex-row items-center justify-between w-full mt-8">
          <View>
            <Text className="text-sm text-gray-500">Price</Text>
            <Text className="font-semibold text-lg">£{product?.price}</Text>
          </View>
        </View>
      </View>
      {product && (
        <ProductCartFooter product={product} onAddToCart={handleAddToCart} />
      )}
    </View>
  );
}
