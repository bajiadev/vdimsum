import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";

export default function CartFooter({ onAddToCart }) {
  const [quantity, setQuantity] = useState(1);

  const increment = () => setQuantity(q => q + 1);
  const decrement = () => setQuantity(q => Math.max(1, q)); // min 1

  return (
    <View className="flex-row items-center justify-between p-4 bg-white border-t border-gray-200">
      
      {/* Quantity selector */}
      <View className="flex-row items-center bg-gray-100 rounded-full px-3 py-1">
        <TouchableOpacity onPress={decrement} className="px-2">
          <Text className="text-xl font-bold">-</Text>
        </TouchableOpacity>

        <Text className="px-4 font-semibold text-lg">{quantity}</Text>

        <TouchableOpacity onPress={increment} className="px-2">
          <Text className="text-xl font-bold">+</Text>
        </TouchableOpacity>
      </View>

      {/* Add to Cart button */}
      <TouchableOpacity
        onPress={() => onAddToCart(quantity)}
        className="bg-orange-500 px-6 py-3 rounded-full"
      >
        <Text className="text-white font-bold text-lg">Add to Cart</Text>
      </TouchableOpacity>
    </View>
  );
}
