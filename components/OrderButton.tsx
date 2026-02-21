import { images } from "@/constants";
import { useOrderStore } from "@/store/order.store";
import { router } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

const OrderButton = () => {
  const { getTotalItems } = useOrderStore();
  const totalItems = getTotalItems();

  return (
    <TouchableOpacity
      className="order-btn"
      onPress={() => router.push("/order")}
    >
      <Image source={images.bag} className="size-5" resizeMode="contain" />

      {totalItems > 0 && (
        <View className="order-badge">
          <Text className="small-bold text-white">{totalItems}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
export default OrderButton;
