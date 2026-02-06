import { db } from "@/lib/firebase";
import { useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

interface ShopDetails {
  id: string;
  name: string;
  description?: string;
  address: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  phone: string;
  email: string;
  location: {
    latitude: number;
    longitude: number;
  };
  openingHours?: {
    [key: string]: {
      open?: string;
      close?: string;
      closed?: boolean;
    };
  };
  distance?: number;
}

const getLatLng = (location: any) => {
  if (!location) {
    return { latitude: 0, longitude: 0 };
  }

  if (typeof location.lat === "number" && typeof location.lng === "number") {
    return { latitude: location.lat, longitude: location.lng };
  }

  if (
    typeof location.latitude === "number" &&
    typeof location.longitude === "number"
  ) {
    return { latitude: location.latitude, longitude: location.longitude };
  }

  return { latitude: 0, longitude: 0 };
};

export default function ShopDetailsPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [shop, setShop] = useState<ShopDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShopDetails = async () => {
      if (!id) return;

      try {
        const shopRef = doc(db, "shops", id);
        const snapshot = await getDoc(shopRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          const { latitude, longitude } = getLatLng(data.location);

          setShop({
            id: snapshot.id,
            name: data.name,
            description: data.description,
            address: data.address || {},
            phone: data.phone || "",
            email: data.email || "",
            location: {
              latitude,
              longitude,
            },
            openingHours: data.openingHours,
          });
        } else {
          Alert.alert("Error", "Shop not found");
        }
      } catch (error) {
        console.error("Error fetching shop details:", error);
        Alert.alert("Error", "Failed to load shop details");
      } finally {
        setLoading(false);
      }
    };

    fetchShopDetails();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text className="mt-4">Loading shop details...</Text>
      </SafeAreaView>
    );
  }

  if (!shop) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text className="text-lg text-gray-600">Shop not found</Text>
      </SafeAreaView>
    );
  }

  const daysOfWeek = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const today = new Date()
    .toLocaleDateString("en-US", {
      weekday: "long",
    })
    .toLowerCase();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView>
        {/* Map */}
        <View className="h-64 bg-gray-200 relative">
          {shop.location.latitude !== 0 && shop.location.longitude !== 0 ? (
            <MapView
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1 }}
              initialRegion={{
                latitude: shop.location.latitude,
                longitude: shop.location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: shop.location.latitude,
                  longitude: shop.location.longitude,
                }}
                title={shop.name}
                description={shop.address.formatted || ""}
              />
            </MapView>
          ) : (
            <View className="flex-1 justify-center items-center">
              <Text className="text-gray-500">
                Location information not available
              </Text>
            </View>
          )}
        </View>

        {/* Shop Details */}
        <View className="p-5">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-dark-100 mb-2">
              {shop.name}
            </Text>
            {shop.description && (
              <Text className="text-base text-gray-600">
                {shop.description}
              </Text>
            )}
          </View>

          {/* Address */}
          <View className="mb-6 pb-6 border-b border-gray-200">
            <Text className="font-bold text-lg mb-2">📍 Location</Text>
            <Text className="text-gray-700">
              {shop.address.formatted || ""}
            </Text>
          </View>

          {/* Contact */}
          <View className="mb-6 pb-6 border-b border-gray-200">
            <Text className="font-bold text-lg mb-3">📞 Contact</Text>
            <TouchableOpacity className="mb-3">
              <Text className="text-orange-500 text-base">{shop.phone}</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text className="text-orange-500 text-base">{shop.email}</Text>
            </TouchableOpacity>
          </View>

          {/* Opening Hours */}
          {shop.openingHours && (
            <View className="mb-6 pb-6 border-b border-gray-200">
              <Text className="font-bold text-lg mb-3">🕐 Opening Hours</Text>
              <View className="gap-2">
                {daysOfWeek.map((day) => {
                  const hours = shop.openingHours?.[day];
                  const isClosed = hours?.closed;
                  const isToday = day === today;

                  return (
                    <View
                      key={day}
                      className={`flex-row justify-between p-2 rounded ${
                        isToday ? "bg-orange-50" : "bg-white"
                      }`}
                    >
                      <Text
                        className={`capitalize font-semibold ${isToday ? "text-orange-600" : "text-gray-800"}`}
                      >
                        {day}
                      </Text>
                      <Text
                        className={`${
                          isClosed
                            ? "text-red-500 font-semibold"
                            : "text-gray-700"
                        }`}
                      >
                        {isClosed
                          ? "Closed"
                          : `${hours?.open || "N/A"} - ${hours?.close || "N/A"}`}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View className="gap-3 mt-6">
            <TouchableOpacity className="bg-orange-500 py-4 px-6 rounded-lg">
              <Text className="text-white text-center font-bold text-lg">
                Order from {shop.name}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity className="border-2 border-orange-500 py-4 px-6 rounded-lg">
              <Text className="text-orange-500 text-center font-bold text-lg">
                View Menu
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
