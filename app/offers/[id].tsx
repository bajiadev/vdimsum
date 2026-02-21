import { getOffers } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { View, Text, Image, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Offerdetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
              {offer.title}
            </Text>

            <Text className="text-base text-gray-600 mt-3 leading-6">
              {offer.description}
            </Text>

            {offer.type ? (
              <View className="mt-5 self-start bg-orange-100 px-3 py-1 rounded-full">
                <Text className="text-orange-700 font-semibold">
                  {offer.type === "percentage" ? "Percentage offer" : "Offer"}
                </Text>
              </View>
            ) : null}

            <Pressable
              className="mt-6 bg-orange-500 rounded-xl py-3 px-4"
              onPress={() => router.push("/(tabs)/menu")}
            >
              <Text className="text-white text-center text-base font-semibold">
                Go to Menu
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Offerdetails;
