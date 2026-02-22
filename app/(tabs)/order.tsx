import CustomButton from "@/components/CustomButton";
import CustomHeader from "@/components/CustomHeader";
import OrderItem from "@/components/OrderItem";
import { cloudFunctions, markOrderAsPaid } from "@/lib/firebase";
import { formatCurrency } from "@/lib/formatter";
import useAuthStore from "@/store/auth.store";
import { useOrderStore } from "@/store/order.store";
import useShopStore from "@/store/shop.store";
import {
  createPaymentIntentRequest,
  createPaymentIntentResponse,
  PaymentInfoStripeProps,
} from "@/type";
import { useStripe } from "@stripe/stripe-react-native";
import cn from "clsx";
import { getAuth } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { Alert, FlatList, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const PaymentInfoStripe = ({
  label,
  value,
  labelStyle,
  valueStyle,
}: PaymentInfoStripeProps) => (
  <View className="flex-between flex-row my-1">
    <Text className={cn("paragraph-medium text-gray-200", labelStyle)}>
      {label}
    </Text>
    <Text className={cn("paragraph-bold text-dark-100", valueStyle)}>
      {value}
    </Text>
  </View>
);

const Order = () => {
  const { user } = useAuthStore();
  const { items, getTotalItems, getTotalPrice } = useOrderStore();
  const { shopName, shopAddress, orderType } = useShopStore();
  const stripe = useStripe();
  const functions = cloudFunctions;

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const chargeableItems = items.filter((item) => !item.isRewardRedemption);
  const deliveryFee = 0;
  const discount = 0;
  const finalTotal = totalPrice + deliveryFee - discount;

  const orderInfoTitle = !orderType
    ? "Choose shop and delivery/pickup"
    : orderType === "delivery"
      ? `Delivery from ${shopName || ""}`
      : `Pickup from ${shopName || ""}`;

  const handleOrderNow = async () => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to place your order.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign In",
          onPress: () => router.push("/(auth)/sign-in"),
        },
      ]);
      return;
    }

    if (items.length === 0) {
      Alert.alert("Order is empty");
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("User not logged in");

      const orderId = await useOrderStore.getState().createOrder(user.uid);

      if (chargeableItems.length === 0 || totalPrice <= 0) {
        await markOrderAsPaid(orderId, user.uid);
        Alert.alert(
          "Order placed",
          "Your order has been sent to the restaurant.",
        );
        useOrderStore.getState().clearOrder();
        router.replace("/orders");
        return;
      }

      const createPaymentIntent = httpsCallable<
        createPaymentIntentRequest,
        createPaymentIntentResponse
      >(functions, "createPaymentIntent");

      const orderItemsPayload = chargeableItems.map((i) => ({
        id: i.id,
        quantity: i.quantity,
      }));

      const { data } = await createPaymentIntent({
        orderItems: orderItemsPayload,
        orderId,
      });
     
      const clientSecret = data.clientSecret;
      if (!clientSecret)
        throw new Error("PaymentIntent client secret not returned");

      const initResult = await stripe.initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "Your Restaurant",
        allowsDelayedPaymentMethods: true,
      });

      if (initResult.error) throw initResult.error;

      const presentResult = await stripe.presentPaymentSheet();
      if (presentResult.error) {
        Alert.alert("Payment failed", presentResult.error.message);
      } else {
        // Mark order as paid and award points
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          try {
            await markOrderAsPaid(orderId, user.uid);
          } catch (pointError) {
            console.error("Error awarding points:", pointError);
            // Don't fail the order if points fail
          }
        }

        Alert.alert("Payment Success", "Your order has been placed!");
        useOrderStore.getState().clearOrder();
        router.replace("/orders");
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Something went wrong");
    }
  };

  return (
    <SafeAreaView className="bg-white h-full">
      <FlatList
        data={items}
        renderItem={({ item }) => <OrderItem item={item} />}
        keyExtractor={(item) => {
          const itemType = item.isRewardRedemption ? "reward" : "menu";
          const redemptionKey = item.redemptionId || "none";
          const customizationKey = (item.customizations || [])
            .map((custom) => `${custom.groupId}:${custom.optionId}`)
            .sort()
            .join("|");

          return `${item.id}-${itemType}-${redemptionKey}-${customizationKey}`;
        }}
        contentContainerClassName="pb-28 px-5 pt-5"
        ListHeaderComponent={() => (
          <View>
            <CustomHeader title="Order" />
            <TouchableOpacity
              onPress={() => router.push("/shops")}
              activeOpacity={0.8}
              className="mb-4 rounded-2xl border border-gray-200 bg-white px-4 py-3"
            >
              <Text className="font-bold uppercase text-gray-900 text-center">
                Order info
              </Text>
              <Text className="mt-1 text-base font-semibold text-dark-100 text-center">
                {orderInfoTitle}
              </Text>
              {shopAddress ? (
                <Text className="mt-1 text-sm text-gray-600 text-center">
                  {shopAddress}
                </Text>
              ) : null}
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center mt-32 px-6">
            <Ionicons name="receipt-outline" size={80} color="#D1D5DB" />

            <Text className="text-xl font-semibold mt-6">
              Your order is empty
            </Text>

            <Text className="text-gray-500 text-center mt-2">
              Looks like you haven’t added anything yet.
            </Text>
            <View className="mt-6 w-full">
              <CustomButton
                title="Browse menu"
                onPress={() => router.push("/(tabs)/menu")}
              />
            </View>
          </View>
        )}
        ListFooterComponent={() =>
          totalItems > 0 && (
            <View className="gap-5">
              <View className="mt-6 border border-gray-200 p-5 rounded-2xl">
                <Text className="h3-bold text-dark-100 mb-5">
                  Payment Summary
                </Text>

                <PaymentInfoStripe
                  label={`Total Items (${totalItems})`}
                  value={`${formatCurrency(totalPrice)}`}
                />
                <PaymentInfoStripe
                  label={`Delivery Fee`}
                  value={`${formatCurrency(deliveryFee)}`}
                />
                <PaymentInfoStripe
                  label={`Discount`}
                  value={`- ${formatCurrency(discount)}`}
                  valueStyle="!text-success"
                />
                <View className="border-t border-gray-300 my-2" />
                <PaymentInfoStripe
                  label={`Total`}
                  value={`${formatCurrency(finalTotal)}`}
                  labelStyle="base-bold !text-dark-100"
                  valueStyle="base-bold !text-dark-100 !text-right"
                />
              </View>

              <View className="flex-row gap-3">
                <CustomButton
                  title="Add More"
                  onPress={() => router.push("/(tabs)/menu")}
                  style="flex-1 bg-white border border-black"
                  textStyle="!text-black"
                />
                {user ? (
                  <CustomButton
                    title="Order Now"
                    onPress={handleOrderNow}
                    style="flex-1"
                  />
                ) : (
                  <CustomButton
                    title="Sign In to Checkout"
                    onPress={() => router.push("/(auth)/sign-in")}
                    style="flex-1"
                  />
                )}
              </View>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

export default Order;
