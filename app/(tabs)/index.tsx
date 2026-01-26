import { SafeAreaView } from "react-native-safe-area-context";
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Fragment, use } from "react";
import cn from "clsx";
import offerImage from "@/assets/images/offer.png";
import menuImage from "@/assets/images/menu.png";

import CartButton from "@/components/CartButton";
import { images, offers } from "@/constants";
import useAuthStore from "@/store/auth.store";
import { FeaturedItemCard } from "@/components/FeaturedItemCard";
import { getFeaturedMenuItems } from "@/lib/firebase";

import { router, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { getUserOrders } from "@/lib/firebase";
import OrderCard from "@/components/OrderCard";
import { Order } from "@/type";
import { useCartStore } from "@/store/cart.store";

import { useOrdersStore } from "@/store/orders.store";

export default function Index() {
  // 🔹 Hooks MUST be at the top
  const [featured, setFeatured] = useState<any[]>([]);
  //const [orders, setOrders] = useState<Order[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const { orders, setOrders } = useOrdersStore();
  const latestOrder = orders[0];

  // 🔹 Load featured items
  useEffect(() => {
    const loadFeatured = async () => {
      const items = await getFeaturedMenuItems();
      setFeatured(items);
      setLoadingFeatured(false);
    };

    loadFeatured();
  }, []);

  // 🔹 Load user orders
  useEffect(() => {
    const loadOrders = async () => {
      const { user } = useAuthStore.getState();
      console.log("Current user:", user?.id);
      if (!user) {
        setLoadingOrders(false);
        return;
      }

      const data = await getUserOrders(user.id);
      console.log("Fetched orders data:", data);
      setOrders(data);
      setLoadingOrders(false);
    };

    loadOrders();
  }, []);

  useEffect(() => {
    console.log("Loaded orders:", orders);
  }, [orders]);

  // 🔹 Render logic AFTER hooks
  if (loadingFeatured) {
    return (
      <SafeAreaView>
        <Text>Loading featured items...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView>
        <View className="flex-between flex-row w-full my-5">
          <View className="flex-start">
            <Text className="small-bold text-primary">DELIVER TO</Text>
            <TouchableOpacity className="flex-center flex-row gap-x-1 mt-0.5">
              <Text className="paragraph-bold text-dark-100">London</Text>
              <Image
                source={images.arrowDown}
                className="size-3"
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          <CartButton />
        </View>
        <Pressable onPress={() => router.push("/(tabs)/offers")}>
          <View className="flex flex-row-reverse bg-red-700 h-48 m-4 p-8 shadow-lg rounded-3xl overflow-hidden">
            <View className={"h-full w-1/2"}>
              <Image
                source={offerImage}
                className={"size-full rounded-full"}
                resizeMode={"contain"}
              />
            </View>

            <View className="offer-card__info">
              <Text className="h1-bold text-white leading-tight">offers</Text>
              <Image
                source={images.arrowRight}
                className="size-10"
                resizeMode="contain"
                tintColor="#ffffff"
              />
            </View>
          </View>
        </Pressable>
        <Pressable onPress={() => router.push("/(tabs)/menu")}>
          <View className="flex flex-row bg-orange-500 h-48 m-5 p-8 gap-8 shadow-lg rounded-3xl overflow-hidden">
            <View className="h-full w-1/2">
              <Image
                source={menuImage} // must be a transparent PNG
                className="w-full h-full rounded-full"
                resizeMode="contain"
              />
            </View>

            <View className="justify-between">
              <Text className="text-white text-3xl font-bold">menu</Text>
              <Image
                source={images.arrowRight}
                className="w-10 h-10"
                resizeMode="contain"
                tintColor="#fff"
              />
            </View>
          </View>
        </Pressable>
        <View className="px-5 mt-2 mb-5">
          <FlatList
            data={featured.slice(0, 4)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.$id}
            contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}
            renderItem={({ item }) => (
              <FeaturedItemCard
                item={item}
                onPress={() =>
                  router.push({
                    pathname: "/(modals)/product/[id]",
                    params: { id: item.$id },
                  })
                }
              />
            )}
          />
        </View>

        <View className="px-5 mt-2 mb-5">
          <Text>Previous orders</Text>
          {latestOrder && (
            <OrderCard
              order={latestOrder}
              key={latestOrder.id}
              onPress={router.push("/(tabs)/profile")}
              onReorder={() => {
                useCartStore.getState().reorder(latestOrder.items);
                router.push("/cart");
              }}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
