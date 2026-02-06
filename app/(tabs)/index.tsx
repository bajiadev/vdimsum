import menuImage from "@/assets/images/menu.png";
import offerImage from "@/assets/images/offer.png";
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FeaturedItemCard } from "@/components/FeaturedItemCard";
import Header from "@/components/Header";
import { images } from "@/constants";
import { getFeaturedMenuItems } from "@/lib/firebase";
import useAuthStore from "@/store/auth.store";

import OrderCard from "@/components/OrderCard";
import { getUserOrders } from "@/lib/firebase";
import { router } from "expo-router";
import { useEffect, useState } from "react";

import { useOrdersStore } from "@/store/orders.store";

export default function Index() {
  const [featured, setFeatured] = useState<any[]>([]);
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
      if (!user) {
        setLoadingOrders(false);
        return;
      }
      const data = await getUserOrders(user.id);
      setOrders(data);
      setLoadingOrders(false);
    };
    loadOrders();
  }, []);

  if (loadingFeatured || loadingOrders) {
    return (
      <SafeAreaView>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Header onOrderPress={() => router.push("/shops")} />
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
          <View className="flex flex-row bg-orange-500 h-48 m-4 p-8 gap-8 shadow-lg rounded-3xl overflow-hidden">
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
        <View className="px-5 mt-2 mb-2">
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

        <View className="px-5 mt-2 mb-2">
          <Text>Last order</Text>
          {latestOrder && (
            <OrderCard
              order={latestOrder}
              key={latestOrder.id}
              onPress={() => router.push(`/orders/${latestOrder.id}`)}
              hideReorder={true}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
