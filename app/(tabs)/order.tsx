import CustomButton from "@/components/CustomButton";
import CustomHeader from "@/components/CustomHeader";
import OrderItem from "@/components/OrderItem";
import SignInRequiredAlert from "@/components/SignInRequiredAlert";
import { cloudFunctions, getOffers, markOrderAsPaid } from "@/lib/firebase";
import { formatCurrency } from "@/lib/formatter";
import useAuthStore from "@/store/auth.store";
import { useMenu } from "@/store/menu.store";
import { useOrderStore } from "@/store/order.store";
import useShopStore from "@/store/shop.store";
import {
  createPaymentIntentRequest,
  createPaymentIntentResponse,
  Offer,
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
import { useEffect, useMemo, useState } from "react";

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
  const {
    items,
    getTotalItems,
    getTotalPrice,
    addPromoFreeItem,
    removePromoFreeItem,
    clearPromoFreeItems,
  } = useOrderStore();
  const { fetchMenuItemById } = useMenu();
  const { shopName, shopAddress, deliveryAddress, orderType } = useShopStore();
  const stripe = useStripe();
  const functions = cloudFunctions;
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [thresholdFreeItemName, setThresholdFreeItemName] =
    useState<string>("");

  useEffect(() => {
    const loadOffers = async () => {
      try {
        const data = await getOffers();
        setOffers(data);
      } catch (e) {
        console.error("Failed to load offers", e);
      }
    };

    loadOffers();
  }, []);

  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();
  const chargeableItems = items.filter(
    (item) => !item.isRewardRedemption && !item.isPromoFree,
  );
  const getChargeableItemKey = (item: {
    id: string;
    price: number;
    customizations?: { groupId: string; optionId: string }[];
  }) => {
    const customizationKey = (item.customizations || [])
      .map((custom) => `${custom.groupId}:${custom.optionId}`)
      .sort()
      .join("|");

    return `${item.id}-${item.price}-${customizationKey}`;
  };
  const activeBogoOffer = useMemo(
    () =>
      offers.find(
        (offer) =>
          offer.applies_to === "menu" &&
          offer.discount_type === "bogo" &&
          Boolean(offer.offer_tag),
      ),
    [offers],
  );

  const bogoPricing = useMemo(() => {
    const payableByItemKey = new Map<string, number>();

    chargeableItems.forEach((item) => {
      const itemKey = getChargeableItemKey(item);
      payableByItemKey.set(
        itemKey,
        (payableByItemKey.get(itemKey) || 0) + item.quantity,
      );
    });

    if (!activeBogoOffer?.offer_tag) {
      return {
        discount: 0,
        payableByItemKey,
      };
    }

    const buyQty = Math.max(1, activeBogoOffer.buy_quantity ?? 1);
    const freeQty = Math.max(1, activeBogoOffer.free_quantity ?? 1);
    const groupSize = buyQty + freeQty;
    const eligibleUnits: { itemKey: string; price: number }[] = [];

    chargeableItems.forEach((item) => {
      if (!item.offer_tags?.includes(activeBogoOffer.offer_tag!)) return;
      const itemKey = getChargeableItemKey(item);

      for (let i = 0; i < item.quantity; i += 1) {
        eligibleUnits.push({ itemKey, price: item.price });
      }
    });

    const freeUnits = Math.floor(eligibleUnits.length / groupSize) * freeQty;
    if (freeUnits <= 0) {
      return {
        discount: 0,
        payableByItemKey,
      };
    }

    eligibleUnits.sort((a, b) => a.price - b.price);
    const discount = eligibleUnits
      .slice(0, freeUnits)
      .reduce((sum, unit) => sum + unit.price, 0);

    eligibleUnits.slice(0, freeUnits).forEach((unit) => {
      const currentQty = payableByItemKey.get(unit.itemKey) || 0;
      payableByItemKey.set(unit.itemKey, Math.max(0, currentQty - 1));
    });

    return {
      discount,
      payableByItemKey,
    };
  }, [activeBogoOffer, chargeableItems]);

  const deliveryFee = 0;
  const bogoDiscount = bogoPricing.discount;

  const percentageOfferCandidates = useMemo(
    () =>
      offers.filter(
        (offer) =>
          offer.applies_to === "order" &&
          offer.discount_type === "percentage_threshold" &&
          typeof offer.threshold_amount === "number" &&
          typeof offer.percentage_off === "number",
      ),
    [offers],
  );

  const activeThresholdOffer = useMemo(
    () =>
      offers.find(
        (offer) =>
          offer.applies_to === "order" &&
          offer.discount_type === "free_item_threshold" &&
          typeof offer.threshold_amount === "number" &&
          Boolean(offer.free_item_id),
      ),
    [offers],
  );

  const bogoAdjustedSubtotal = Math.max(totalPrice - bogoDiscount, 0);
  const percentageOfferEvaluation = useMemo(() => {
    let bestOffer: Offer | null = null;
    let bestDiscount = 0;

    percentageOfferCandidates.forEach((offer) => {
      const thresholdAmount = offer.threshold_amount ?? 0;
      const percentOff = offer.percentage_off ?? 0;

      if (thresholdAmount <= 0 || percentOff <= 0) return;
      if (bogoAdjustedSubtotal < thresholdAmount) return;

      const discount = Math.floor(bogoAdjustedSubtotal * (percentOff / 100));
      if (discount > bestDiscount) {
        bestDiscount = discount;
        bestOffer = offer;
      }
    });

    if (bestOffer) {
      return {
        offer: bestOffer,
        discount: bestDiscount,
        qualifies: true,
        remaining: 0,
      };
    }

    if (percentageOfferCandidates.length === 0) {
      return {
        offer: null,
        discount: 0,
        qualifies: false,
        remaining: 0,
      };
    }

    const nextOffer = [...percentageOfferCandidates].sort(
      (a, b) =>
        (a.threshold_amount ?? Infinity) - (b.threshold_amount ?? Infinity),
    )[0];
    const nextThreshold = nextOffer?.threshold_amount ?? 0;

    return {
      offer: nextOffer ?? null,
      discount: 0,
      qualifies: false,
      remaining: Math.max(nextThreshold - bogoAdjustedSubtotal, 0),
    };
  }, [bogoAdjustedSubtotal, percentageOfferCandidates]);

  const activePercentageOffer = percentageOfferEvaluation.offer;
  const qualifiesForPercentageDiscount = percentageOfferEvaluation.qualifies;
  const percentageDiscount = percentageOfferEvaluation.discount;
  const percentageRemaining = percentageOfferEvaluation.remaining;

  const totalDiscount = bogoDiscount + percentageDiscount;
  const thresholdAmount = activeThresholdOffer?.threshold_amount ?? null;
  const thresholdRemaining =
    thresholdAmount === null
      ? 0
      : Math.max(thresholdAmount - bogoAdjustedSubtotal, 0);
  const qualifiesForFreeItem =
    thresholdAmount !== null && bogoAdjustedSubtotal >= thresholdAmount;
  const thresholdProgressPercent =
    thresholdAmount === null || thresholdAmount <= 0
      ? 0
      : Math.min(
          100,
          Math.floor((bogoAdjustedSubtotal / thresholdAmount) * 100),
        );

  useEffect(() => {
    let cancelled = false;

    const loadThresholdFreeItemName = async () => {
      if (!activeThresholdOffer?.free_item_id) {
        setThresholdFreeItemName("");
        return;
      }

      try {
        const freeItem = await fetchMenuItemById(
          activeThresholdOffer.free_item_id,
        );
        if (cancelled) return;
        setThresholdFreeItemName(freeItem.name || "free item");
      } catch (e) {
        if (cancelled) return;
        setThresholdFreeItemName("free item");
      }
    };

    loadThresholdFreeItemName();

    return () => {
      cancelled = true;
    };
  }, [activeThresholdOffer?.free_item_id, fetchMenuItemById]);

  useEffect(() => {
    let cancelled = false;

    const syncThresholdFreeItem = async () => {
      if (!activeThresholdOffer?.id || !activeThresholdOffer.free_item_id) {
        clearPromoFreeItems();
        return;
      }

      if (!qualifiesForFreeItem) {
        removePromoFreeItem(activeThresholdOffer.id);
        return;
      }

      try {
        const promoItem = await fetchMenuItemById(
          activeThresholdOffer.free_item_id,
        );
        if (cancelled) return;

        addPromoFreeItem(
          promoItem,
          activeThresholdOffer.id,
          activeThresholdOffer.max_free_qty ?? 1,
        );
      } catch (e) {
        console.error("Failed to add threshold free item", e);
      }
    };

    syncThresholdFreeItem();

    return () => {
      cancelled = true;
    };
  }, [
    activeThresholdOffer,
    addPromoFreeItem,
    fetchMenuItemById,
    qualifiesForFreeItem,
    removePromoFreeItem,
    clearPromoFreeItems,
  ]);

  const finalTotal = Math.max(totalPrice + deliveryFee - totalDiscount, 0);

  const headerText = !orderType
    ? "Order info"
    : orderType == "delivery"
      ? `Deliver from ${shopName || ""}`
      : `Pickup from ${shopName || ""}`;

  const subtext =
    orderType === "delivery"
      ? `To: ${deliveryAddress?.formatted || "Tap to select delivery address"}`
      : `From: ${shopAddress || "Tap to select pickup location"}`;

  const handleOrderNow = async () => {
    if (!user) {
      setShowSignInPrompt(true);
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

      const orderId = await useOrderStore
        .getState()
        .createOrder(user.uid, finalTotal);

      if (chargeableItems.length === 0 || finalTotal <= 0) {
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

      const remainingPayableByItemKey = new Map(bogoPricing.payableByItemKey);
      const orderItemsPayload = chargeableItems
        .map((i) => {
          const itemKey = getChargeableItemKey(i);
          const remainingQty = remainingPayableByItemKey.get(itemKey) || 0;
          const quantityToCharge = Math.min(i.quantity, remainingQty);
          remainingPayableByItemKey.set(
            itemKey,
            Math.max(0, remainingQty - quantityToCharge),
          );

          return {
            id: i.id,
            quantity: quantityToCharge,
            unitPrice: i.price,
          };
        })
        .filter((item) => item.quantity > 0);

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
      <SignInRequiredAlert
        visible={showSignInPrompt}
        setVisible={setShowSignInPrompt}
        message="Please sign in to place your order."
        showSignUp={false}
      />
      <FlatList
        data={items}
        renderItem={({ item }) => <OrderItem item={item} />}
        keyExtractor={(item) => {
          const itemType = item.isRewardRedemption
            ? "reward"
            : item.isPromoFree
              ? "promo-free"
              : "menu";
          const redemptionKey = item.redemptionId || "none";
          const promoKey = item.promoOfferId || "none";
          const customizationKey = (item.customizations || [])
            .map((custom) => `${custom.groupId}:${custom.optionId}`)
            .sort()
            .join("|");

          return `${item.id}-${itemType}-${redemptionKey}-${promoKey}-${customizationKey}`;
        }}
        contentContainerClassName="pb-28 px-5 pt-5"
        ListHeaderComponent={() => (
          <View>
            <CustomHeader />
            <TouchableOpacity
              onPress={() => router.push("/shops")}
              activeOpacity={0.8}
              className="mb-4 rounded-2xl border border-gray-200 bg-white px-4 py-3"
            >
              <Text className="font-bold uppercase text-gray-900 text-center">
                Order info
              </Text>

              <View className="flex-col gap-y-1 items-center justify-center">
                <Text className="semi-bold">{headerText}</Text>
                {subtext && (
                  <Text className="text-xs text-gray-600">{subtext}</Text>
                )}
              </View>
              {orderType === "delivery" && !deliveryAddress ? (
                <Text className="mt-1 text-sm text-orange-500 text-center">
                  Tap to select a delivery address
                </Text>
              ) : null}
            </TouchableOpacity>

            {activeThresholdOffer && thresholdAmount ? (
              <View className="mb-4 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
                <Text className="text-sm font-semibold text-orange-800">
                  {qualifiesForFreeItem
                    ? `Unlocked: Free ${thresholdFreeItemName || "item"} added`
                    : `Spend ${formatCurrency(thresholdRemaining)} more to get a free ${thresholdFreeItemName || "item"}`}
                </Text>
                <Text className="mt-1 text-xs text-orange-700">
                  Progress: {thresholdProgressPercent}% (
                  {formatCurrency(bogoAdjustedSubtotal)} /{" "}
                  {formatCurrency(thresholdAmount)})
                </Text>
                <View className="mt-2 h-2 w-full overflow-hidden rounded-full bg-orange-200">
                  <View
                    className="h-2 rounded-full bg-orange-500"
                    style={{ width: `${thresholdProgressPercent}%` }}
                  />
                </View>
              </View>
            ) : null}
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
                  value={`- ${formatCurrency(totalDiscount)}`}
                  valueStyle="!text-success"
                />
                {activeBogoOffer ? (
                  <Text className="text-xs text-gray-500 mt-1">
                    BOGO applied: {activeBogoOffer.name}
                  </Text>
                ) : null}
                {activePercentageOffer ? (
                  <Text className="text-xs text-gray-500 mt-1">
                    {qualifiesForPercentageDiscount
                      ? `${activePercentageOffer.percentage_off}% off applied: ${activePercentageOffer.name}`
                      : `Spend ${formatCurrency(percentageRemaining)} more to unlock ${activePercentageOffer.percentage_off}% off`}
                  </Text>
                ) : null}
                {activeThresholdOffer ? (
                  <Text className="text-xs text-gray-500 mt-1">
                    {qualifiesForFreeItem
                      ? `${activeThresholdOffer.name} unlocked`
                      : `Spend ${formatCurrency(thresholdRemaining)} more to unlock ${activeThresholdOffer.name}`}
                  </Text>
                ) : null}
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
