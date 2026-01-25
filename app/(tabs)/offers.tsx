import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  TouchableOpacity,
} from "react-native";
import { router, Link } from "expo-router";
import { useEffect, useState, Fragment } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { getOffers } from "@/lib/firebase";
import cn from "clsx";
import { images } from "@/constants";

export default function Offers() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await getOffers();

        if (mounted) setOffers(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    console.log("Offers loaded:", offers);
  }, [offers]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Loading offers…</Text>
      </SafeAreaView>
    );
  }

  // const handleOfferPress = (offer) => {
  //   if (offer.applies_to === "cart") {
  //     router.push("/menu");
  //     return;
  //   }

  //   if (offer.applies_to === "item" && offer.required_item_id) {
  //     console.log("Offer pressed:", offer.required_item_id);
  //     router.push(`/(modals)/product/${offer.required_item_id}`);
  //   }
  // };

  return (
    <SafeAreaView className="bg-white flex-1">
      <FlatList
        data={offers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View className="mx-4 my-3">
            <View className="flex-row items-center justify-between bg-orange-400 rounded-3xl p-6 shadow-lg">
              {/* Left content */}
              <View className="flex-1 pr-4">
                <Text className="text-white text-2xl font-bold leading-tight">
                  {item.title}
                </Text>

                <Text className="text-white/90 mt-1 text-base">
                  {item.description}
                </Text>

                {/* Badge */}
                <View className="mt-3 self-start bg-white/20 px-3 py-1 rounded-full">
                  <Text className="text-white text-sm font-semibold">
                    {item.type === "percentage"
                      ? "Percentage discount"
                      : "Offer"}
                  </Text>
                </View>
              </View>

              {item.image_url && (
                <Image
                  source={{ uri: item.image_url }}
                  className="w-32 h-32 rounded-full"
                />
              )}

              {/* Right icon */}
              {/* <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
                <TouchableOpacity
                  onPress={() => handleOfferPress(item)}
                  activeOpacity={0.8}
                  className="w-12 h-12 bg-white/20 rounded-full items-center justify-center"
                >
                  <Text className="text-white text-2xl">→</Text>
                </TouchableOpacity>
              </View> */}
              <View>
                <Link
                  href={
                    item.applies_to === "cart"
                      ? "/menu"
                      : {
                          pathname: "/(modals)/product/[id]",
                          params: { id: item.required_item_id },
                        }
                  }
                  asChild
                >
                  <TouchableOpacity className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
                    <Text className="text-white text-2xl">→</Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
