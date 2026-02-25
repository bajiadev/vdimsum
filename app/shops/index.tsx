import { db } from "@/lib/firebase";
import useShopStore from "@/store/shop.store";
import cn from "clsx";
import * as Location from "expo-location";
import { router } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

type Address = {
  houseNumber?: string;
  street1?: string;
  street2?: string;
  city?: string;
  postcode?: string;
  formatted: string;
};

interface Shop {
  id: string;
  name: string;
  address: Address | null;
  phone: string;
  email: string;
  location: {
    latitude: number;
    longitude: number;
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

export default function ShopsPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const { shopId: selectedShopId, orderType: selectedOrderType } =
    useShopStore();
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const initialLocation: Region = {
    latitude: 51.36268,
    longitude: -0.16778,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  }; // London coords

  //const translateY = useRef(new Animated.Value(0)).current;
  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 0.621371; // Distance in miles
  };

  // Get user location
  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          console.warn(
            "Location permission denied, showing shops without distance",
          );
          // Continue without location - don't set loading to false here
          return;
        }

        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest,
          });
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        } catch (locationError: any) {
          console.warn(
            "Unable to get current location:",
            locationError.message,
          );
          // Continue without location - shops will be shown but without distance sorting
        }
      } catch (error) {
        console.error("Error in location setup:", error);
      }
    };

    getLocation();
  }, []);

  // Fetch shops from Firestore
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const shopsRef = collection(db, "shops");
        const snapshot = await getDocs(shopsRef);

        let shopsList: Shop[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          const { latitude, longitude } = getLatLng(data.location);

          return {
            id: doc.id,
            name: data.name,
            address: data.address || null,
            phone: data.phone || "",
            email: data.email || "",
            location: {
              latitude,
              longitude,
            },
          };
        });

        // Calculate distances if user location is available
        if (userLocation) {
          shopsList = shopsList.map((shop) => ({
            ...shop,
            distance: calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              shop.location.latitude,
              shop.location.longitude,
            ),
          }));

          // Sort by distance
          shopsList.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        }

        setShops(shopsList);
      } catch (error) {
        console.error("Error fetching shops:", error);
        Alert.alert("Error", "Failed to load shops");
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, [userLocation]);

  function formatUKAddress(a: any) {
    return [
      [a.houseNumber, a.street1].filter(Boolean).join(" "),
      a.street2,
      a.city,
      a.postcode,
    ]
      .filter(Boolean)
      .join(", ");
  }

  const handleOrderSelection = (
    shopId: string,
    shopName: string,
    shopAddress: string,
    type: "pickup" | "delivery",
  ) => {
    // Save selected shop and order type to store
    useShopStore.setState({
      shopId,
      shopName,
      shopAddress,
      orderType: type,
    });
    // Navigate back
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text className="mt-4">Loading shops...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-5 py-4 h-72">
        <Text className="text-sm text-gray-600 mb-4">
          Choose a shop and select your order type
        </Text>
        <View className="overflow-hidden rounded-xl border border-gray-200 mx-1">
          <MapView
            provider={PROVIDER_GOOGLE}
            style={{ width: "100%", height: 200 }}
            initialRegion={{
              latitude:
                userLocation?.latitude ||
                shops[0]?.location.latitude ||
                51.5074,
              longitude:
                userLocation?.longitude ||
                shops[0]?.location.longitude ||
                -0.1278,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            //initialRegion={initialLocation}
          >
            {shops.map((shop) => (
              <Marker
                key={shop.id}
                coordinate={{
                  latitude: shop.location.latitude,
                  longitude: shop.location.longitude,
                }}
                title={shop.name}
                description={shop.address?.formatted || ""}
              />
            ))}
            {userLocation && (
              <Marker
                coordinate={userLocation}
                pinColor="blue"
                title="You are here"
              />
            )}
          </MapView>
        </View>
      </View>

      <FlatList
        data={shops}
        keyExtractor={(item) => item.id}
        scrollEnabled={true}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push(`/shops/${item.id}`)}>
            <View className="mb-5 p-4 rounded-xl border border-gray-200 bg-white">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-dark-100">
                    {item.name}
                  </Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    {item.address?.formatted || formatUKAddress(item.address)}
                  </Text>
                </View>
                {item.distance !== undefined && (
                  <Text className="text-sm font-semibold text-orange-500 ml-2">
                    {item.distance.toFixed(1)} miles
                  </Text>
                )}
              </View>

              <View className="flex-row justify-between items-center mb-3 py-2 border-t border-gray-100">
                <View className="gap-1">
                  <Text className="text-xs text-gray-600">📞 {item.phone}</Text>
                  <Text className="text-xs text-gray-600">📧 {item.email}</Text>
                </View>
              </View>
              <Text className="text-xs text-center text-gray-500 mt-3 font-semibold">
                Order from here
              </Text>
              {/* Delivery and Pickup Buttons */}
              <View className="gap-2 mt-3 flex-row justify-center gap-x-4">
                <TouchableOpacity
                  onPress={() =>
                    handleOrderSelection(
                      item.id,
                      item.name,
                      item.address?.formatted || "",
                      "delivery",
                    )
                  }
                  className={cn(
                    "py-3 px-4 rounded-lg border-2 border-gray-500",
                    selectedShopId === item.id &&
                      selectedOrderType === "delivery"
                      ? "bg-orange-500 border-orange-500"
                      : "bg-white",
                  )}
                >
                  <Text className="text-center font-semibold">🚚 Delivery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    handleOrderSelection(
                      item.id,
                      item.name,
                      item.address?.formatted || "",
                      "pickup",
                    )
                  }
                  className={cn(
                    "py-3 px-4 rounded-lg border-2 border-gray-500",
                    selectedShopId === item.id && selectedOrderType === "pickup"
                      ? "bg-orange-500 border-orange-500"
                      : "bg-white",
                  )}
                >
                  <Text className="text-center font-semibold">🏪 Pickup</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
