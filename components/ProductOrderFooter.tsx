import { formatCurrency } from "@/lib/formatter";
import { MenuItem, OrderCustomization } from "@/type";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ProductOrderFooterProps {
  product: MenuItem;
  selectedCustomizations?: OrderCustomization[];
  onAddToOrder: (quantity: number) => void;
}

export default function ProductOrderFooter({
  product,
  selectedCustomizations = [],
  onAddToOrder,
}: ProductOrderFooterProps) {
  const [quantity, setQuantity] = useState(1);

  const increment = () => setQuantity((q) => q + 1);
  const decrement = () => setQuantity((q) => Math.max(1, q - 1));

  const customizationsPrice = selectedCustomizations.reduce(
    (sum, c) => sum + c.price,
    0,
  );
  const totalPrice = (product.price + customizationsPrice) * quantity;

  return (
    <SafeAreaView className="bg-white border-t border-gray-200">
      <View className="flex-row items-center justify-between p-4">
        <View className="flex-row items-center bg-gray-100 rounded-full px-3 py-1">
          <TouchableOpacity onPress={decrement} className="px-2">
            <Text className="text-xl font-bold">-</Text>
          </TouchableOpacity>

          <Text className="px-4 font-semibold text-lg">{quantity}</Text>

          <TouchableOpacity onPress={increment} className="px-2">
            <Text className="text-xl font-bold">+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => onAddToOrder(quantity)}
          className="bg-orange-500 px-6 py-3 rounded-full flex-row items-center"
        >
          <Text className="text-white font-bold text-lg">Add to Order</Text>
          <Text className="text-white font-bold text-lg ml-2">
            {formatCurrency(totalPrice)}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
