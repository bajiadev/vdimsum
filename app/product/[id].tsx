import Header from "@/components/Header";
import ProductOrderFooter from "@/components/ProductOrderFooter";
import { formatCurrency } from "@/lib/formatter";
import useAuthStore from "@/store/auth.store";
import { useMenu } from "@/store/menu.store";
import { useOrderStore } from "@/store/order.store";
import useShopStore from "@/store/shop.store";
import { OrderCustomization } from "@/type";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProductDetails() {
  //const [isFavourite, setIsFavourite] = useState(false);
  const [selectedCustomizations, setSelectedCustomizations] = useState<
    Record<string, string[]>
  >({});
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fetchMenuItemById } = useMenu();
  const { user } = useAuthStore();
  const { shopId, orderType } = useShopStore();

  const { addItem } = useOrderStore();

  const product = useMenu((s) => s.getMenuItemById(id));

  useEffect(() => {
    if (!id) return;
    // Always fetch fresh data to get customizations
    fetchMenuItemById(id);
  }, [id]);

  const imageUrl = product?.image_url ? `${product.image_url}` : undefined;

  const handleCustomizationChange = (
    groupId: string,
    optionId: string,
    isMultiple: boolean,
  ) => {
    setSelectedCustomizations((prev) => {
      const current = prev[groupId] || [];
      if (isMultiple) {
        if (current.includes(optionId)) {
          return {
            ...prev,
            [groupId]: current.filter((id) => id !== optionId),
          };
        }
        return { ...prev, [groupId]: [...current, optionId] };
      } else {
        // Toggle for single choice: deselect if already selected
        if (current.length === 1 && current[0] === optionId) {
          return { ...prev, [groupId]: [] };
        }
        return { ...prev, [groupId]: [optionId] };
      }
    });
  };

  const validateCustomizations = (): boolean => {
    if (!product?.customizations) return true;

    for (const group of product.customizations) {
      if (group.required) {
        const selected = selectedCustomizations[group.id] || [];
        if (selected.length === 0) {
          Alert.alert(
            "Required Selection",
            `Please choose ${group.type === "single" ? "one option" : "at least one option"} for "${group.name}"`,
          );
          return false;
        }
      }
    }
    return true;
  };

  const buildOrderCustomizations = (): OrderCustomization[] => {
    if (!product?.customizations) return [];

    const result: OrderCustomization[] = [];
    product.customizations.forEach((group) => {
      const selectedIds = selectedCustomizations[group.id] || [];
      selectedIds.forEach((optionId) => {
        const option = group.options.find((opt) => opt.id === optionId);
        if (option) {
          result.push({
            groupId: group.id,
            groupName: group.name,
            optionId: option.id,
            optionName: option.name,
            price: option.price,
          });
        }
      });
    });
    return result;
  };

  const handleAddToOrder = (qty: number) => {
    if (!product) {
      Alert.alert("Unavailable", "Product details are not loaded yet.");
      return;
    }

    if (!user) {
      Alert.alert(
        "Sign In Required",
        "Please sign in to add items to your order",
        [
          { text: "Cancel", onPress: () => {} },
          {
            text: "Sign In",
            onPress: () => router.push("/(auth)/sign-in"),
          },
          {
            text: "Sign Up",
            onPress: () => router.push("/(auth)/sign-up"),
          },
        ],
      );
      return;
    }

    if (!validateCustomizations()) return;

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

    const customizations = buildOrderCustomizations();
    addItem(product, qty, customizations);
    router.back();
  };

  return (
    <View className="flex-1">
      <View className="px-5 pt-4">
        <Header onOrderPress={() => router.push("/shops")} />
      </View>
      <ScrollView className="flex-1" contentContainerClassName="p-4 px-5">
        <View className="w-full flex-row items-center justify-between mb-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back-circle" size={32} color="orange" />
          </TouchableOpacity>
          {/* <TouchableOpacity onPress={() => setIsFavourite(!isFavourite)}>
            <Ionicons
              name={isFavourite ? "heart" : "heart-outline"}
              size={32}
              color="orange"
            />
          </TouchableOpacity> */}
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
            <Text className="font-semibold text-lg">
              {product ? formatCurrency(product.price) : ""}
            </Text>
          </View>
        </View>

        {/* Customizations */}
        {product?.customizations && product.customizations.length > 0 && (
          <View className="w-full mt-8">
            {product.customizations.map((group) => (
              <View key={group.id} className="mb-6">
                <Text className="font-semibold text-base mb-2">
                  {group.name}
                  {group.required && <Text className="text-red-500"> *</Text>}
                </Text>
                <Text className="text-sm text-gray-500 mb-3">
                  {group.required ? "Required" : "Optional"} ·{" "}
                  {group.type === "multiple" ? "Choose one or more" : " "}
                </Text>
                {Array.isArray(group.options) &&
                  group.options.map((option) => {
                    const isSelected = (
                      selectedCustomizations[group.id] || []
                    ).includes(option.id);
                    return (
                      <TouchableOpacity
                        key={option.id}
                        onPress={() =>
                          handleCustomizationChange(
                            group.id,
                            option.id,
                            group.type === "multiple",
                          )
                        }
                        className={`flex-row items-center justify-between p-3 mb-2 rounded-lg border ${
                          isSelected
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-200 bg-white"
                        }`}
                      >
                        <View className="flex-row items-center flex-1">
                          <View
                            className={`w-5 h-5 rounded-full border-2 ${
                              isSelected
                                ? "border-orange-500 bg-orange-500"
                                : "border-gray-300"
                            } items-center justify-center mr-3`}
                          >
                            {isSelected && (
                              <Ionicons
                                name="checkmark"
                                size={14}
                                color="white"
                              />
                            )}
                          </View>
                          <Text
                            className={`flex-1 ${
                              isSelected ? "font-semibold" : ""
                            }`}
                          >
                            {option.name}
                          </Text>
                        </View>
                        {option.price > 0 && (
                          <Text
                            className={`font-semibold ${
                              isSelected ? "text-orange-500" : "text-gray-600"
                            }`}
                          >
                            +{formatCurrency(option.price)}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      {product && (
        <ProductOrderFooter
          product={product}
          selectedCustomizations={buildOrderCustomizations()}
          onAddToOrder={handleAddToOrder}
        />
      )}
    </View>
  );
}
