import { images } from "@/constants";
import { cancelRedemption } from "@/lib/firebase";
import { formatCurrency } from "@/lib/formatter";
import { useOrderStore } from "@/store/order.store";
import useAuthStore from "@/store/auth.store";
import { OrderItemType } from "@/type";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";

const OrderItem = ({ item }: { item: OrderItemType }) => {
  const { increaseQty, decreaseQty, removeItem } = useOrderStore();
  const { user } = useAuthStore();
  const isRedeemedReward = item.isRewardRedemption;

  const handleRemove = async () => {
    try {
      if (isRedeemedReward && item.redemptionId && user?.id) {
        await cancelRedemption(user.id, item.redemptionId);
      }

      removeItem(
        item.id,
        item.customizations || [],
        !!item.isRewardRedemption,
        item.redemptionId,
      );
    } catch (error: any) {
      Alert.alert(
        "Unable to remove item",
        error?.message || "Please try again",
      );
    }
  };

  return (
    <View className="order-item">
      <View className="flex flex-row items-center gap-x-3">
        <View className="order-item__image">
          <Image
            source={{ uri: item.image_url }}
            className="size-4/5 rounded-lg"
            resizeMode="cover"
          />
        </View>

        <View>
          <Text className="base-bold text-dark-100">{item.name}</Text>
          {item.customizations && item.customizations.length > 0 && (
            <View className="mt-1">
              {item.customizations.map((custom, index) => (
                <Text
                  key={`${custom.groupId}-${custom.optionId}-${index}`}
                  className="text-xs text-gray-500"
                >
                  • {custom.optionName}
                  {custom.price > 0 && ` (+${formatCurrency(custom.price)})`}
                </Text>
              ))}
            </View>
          )}
          <Text className="paragraph-bold text-primary mt-1">
            {formatCurrency(item.price)}
          </Text>

          {isRedeemedReward ? (
            <View className="mt-2">
              <Text className="text-xs text-blue-600 font-semibold">
                Redeemed item · Qty {item.quantity}
              </Text>
            </View>
          ) : (
            <View className="flex flex-row items-center gap-x-4 mt-2">
              <TouchableOpacity
                onPress={() => decreaseQty(item.id, item.customizations!)}
                className="order-item__actions"
              >
                <Image
                  source={images.minus}
                  className="size-1/2"
                  resizeMode="contain"
                  tintColor={"#FF9C01"}
                />
              </TouchableOpacity>

              <Text className="base-bold text-dark-100">{item.quantity}</Text>

              <TouchableOpacity
                onPress={() => increaseQty(item.id, item.customizations!)}
                className="order-item__actions"
              >
                <Image
                  source={images.plus}
                  className="size-1/2"
                  resizeMode="contain"
                  tintColor={"#FF9C01"}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity onPress={handleRemove} className="flex-center">
        <Image source={images.trash} className="size-5" resizeMode="contain" />
      </TouchableOpacity>
    </View>
  );
};

export default OrderItem;
