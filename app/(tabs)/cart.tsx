import { View, Text, FlatList, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCartStore } from "@/store/cart.store";
import CustomHeader from "@/components/CustomHeader";
import cn from "clsx";
import CustomButton from "@/components/CustomButton";
import CartItem from "@/components/CartItem";
import { getAuth } from "firebase/auth";
import { useStripe } from "@stripe/stripe-react-native";
import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
} from "firebase/functions";
import {
  createPaymentIntentRequest,
  createPaymentIntentResponse,
  PaymentInfoStripeProps,
} from "@/type";
import { cloudFunctions } from "@/lib/firebase";
import { formatCurrency } from "@/lib/formatter";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import Header from "@/components/Header";

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

const Cart = () => {
  const { items, getTotalItems, getTotalPrice } = useCartStore();
  const stripe = useStripe();
  const functions = cloudFunctions;

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  const handleOrderNow = async () => {
    if (items.length === 0) {
      Alert.alert("Cart is empty");
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error("User not logged in");

      const orderId = await useCartStore.getState().createOrder(user.uid);

      // 2️⃣ Call Firebase Function to create PaymentIntent
      const createPaymentIntent = httpsCallable<
        createPaymentIntentRequest,
        createPaymentIntentResponse
      >(functions, "createPaymentIntent");
      console.log("Creating PaymentIntent with orderId:", orderId);
      const { data } = await createPaymentIntent({
        cartItems: items.map((i) => ({ id: i.id, quantity: i.quantity })),
        orderId, // attach order ID
      });
      console.log("PaymentIntent created:", data);
      const clientSecret = data.clientSecret;
      if (!clientSecret)
        throw new Error("PaymentIntent client secret not returned");

      // 3️⃣ Initialize and present payment sheet
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
        Alert.alert("Payment Success", "Your order has been placed!");
        useCartStore.getState().clearCart();
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
        renderItem={({ item }) => <CartItem item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pb-28 px-5 pt-5"
        ListHeaderComponent={() => <Header onOrderPress={() => router.push("/shops")} />}
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center mt-32 px-6">
            <Ionicons name="cart-outline" size={80} color="#D1D5DB" />

            <Text className="text-xl font-semibold mt-6">
              Your cart is empty
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
                  value={`${formatCurrency(200)}`}
                />
                <PaymentInfoStripe
                  label={`Discount`}
                  value={`- ${formatCurrency(50)}`}
                  valueStyle="!text-success"
                />
                <View className="border-t border-gray-300 my-2" />
                <PaymentInfoStripe
                  label={`Total`}
                  value={`${formatCurrency(totalPrice + 200 - 50)}`}
                  labelStyle="base-bold !text-dark-100"
                  valueStyle="base-bold !text-dark-100 !text-right"
                />
              </View>

              <CustomButton title="Order Now" onPress={handleOrderNow} />
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

export default Cart;
