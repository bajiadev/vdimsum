import { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Product {
  name: string;
  price: number;
}

interface ProductCartFooterProps {
  product: Product;
  onAddToCart: (quantity: number) => void;
}

export default function ProductCartFooter({ product, onAddToCart }: ProductCartFooterProps) {
  const [quantity, setQuantity] = useState(1);

  const increment = () => setQuantity(q => q + 1);
  const decrement = () => setQuantity(q => Math.max(1, q - 1));

  const totalPrice = product.price * quantity;

  return (
    <SafeAreaView className="bg-white border-t border-gray-200">
      <View className="flex-row items-center justify-between p-4">
        
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

        {/* Add to Cart button with total price */}
        <TouchableOpacity
          onPress={() => onAddToCart(quantity)}
          className="bg-orange-500 px-6 py-3 rounded-full flex-row items-center"
        >
          <Text className="text-white font-bold text-lg">
            Add to Order
          </Text>
          <Text className="text-white font-bold text-lg ml-2">
            ${totalPrice.toFixed(2)}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
