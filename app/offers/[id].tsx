import { getOffers } from "@/lib/firebase";
import { Offer } from "@/type";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Offerdetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const formatOfferDate = (date: Date | null) => {
    if (!date) return "N/A";
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    const loadOffers = async () => {
      try {
        const data = await getOffers();
        setOffers(data);
      } finally {
        setLoading(false);
      }
    };

    loadOffers();
  }, []);

  const offer = useMemo(
    () => offers.find((item) => item.id === id),
    [offers, id],
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {loading ? (
          <View className="px-4 pt-6">
            <Text>Loading offer...</Text>
          </View>
        ) : !offer ? (
          <View className="px-4 pt-6">
            <Text className="text-lg font-semibold text-gray-900">
              Offer not found
            </Text>
          </View>
        ) : (
          <View className="px-4 pt-4">
            {offer.image_url ? (
              <Image
                source={{ uri: offer.image_url }}
                className="w-full h-56 rounded-3xl"
                resizeMode="cover"
              />
            ) : null}

            <Text className="text-3xl font-bold text-gray-900 mt-4">
              {offer.name}
            </Text>

            <Text className="text-base text-gray-600 mt-3 leading-6">
              {offer.description}
            </Text>

            <View className="mt-5 self-start bg-orange-100 px-3 py-1 rounded-full">
              <Text className="text-orange-700 font-semibold uppercase">
                Applies to {offer.applies_to}
              </Text>
            </View>

            {offer.discount_type === "bogo" ? (
              <View className="mt-3 self-start bg-orange-50 px-3 py-2 rounded-2xl">
                <Text className="text-orange-700 font-semibold">
                  Buy {offer.buy_quantity ?? 1}, get {offer.free_quantity ?? 1}{" "}
                  free
                </Text>
              </View>
            ) : null}

            <View className="mt-3">
              <Text className="text-sm text-gray-500">
                Starts: {formatOfferDate(offer.startAt)}
              </Text>
              <Text className="text-sm text-gray-500 mt-1">
                Ends: {formatOfferDate(offer.endAt)}
              </Text>
            </View>

            {offer.is_active ? (
              <View className="mt-5 self-start bg-orange-100 px-3 py-1 rounded-full">
                <Text className="text-orange-700 font-semibold">
                  Active offer
                </Text>
              </View>
            ) : null}

            <Pressable
              className="mt-6 bg-orange-500 rounded-xl py-3 px-4"
              onPress={() =>
                router.push(
                  offer.applies_to === "order"
                    ? "/(tabs)/order"
                    : {
                        pathname: "/category/[id]",
                        params: {
                          id: offer.id,
                          name: offer.name,
                          offerTag: offer.offer_tag ?? "",
                        },
                      },
                )
              }
            >
              <Text className="text-white text-center text-base font-semibold">
                {offer.applies_to === "order"
                  ? "Go to Order"
                  : "Browse Offer Items"}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Offerdetails;
