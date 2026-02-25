import { updateUserPrivacySettings } from "@/lib/firebase";
import useAuthStore from "@/store/auth.store";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert, Linking, Switch, Text, View } from "react-native";
import * as Location from "expo-location";
import { Stack } from "expo-router";

const PrivacyRow = ({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) => (
  <View className="py-4 border-b border-gray-100">
    <View className="flex-row items-start justify-between gap-4">
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-900">{label}</Text>
        <Text className="text-sm text-gray-500 mt-1">{description}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  </View>
);

export default function PrivacyScreen() {
  const { user, setUser } = useAuthStore();

  const [shareUsageData, setShareUsageData] = useState(
    user?.privacySettings?.shareUsageData ?? false,
  );
  const [saveOrderHistory, setSaveOrderHistory] = useState(
    user?.privacySettings?.saveOrderHistory ?? true,
  );
  const [useLocation, setUseLocation] = useState(
    user?.privacySettings?.useLocation ?? false,
  );
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<
    "granted" | "denied" | "undetermined"
  >(user?.privacySettings?.locationPermissionStatus ?? "undetermined");

  const persistPrivacySettings = async (
    next: Partial<{
      shareUsageData: boolean;
      saveOrderHistory: boolean;
      useLocation: boolean;
      locationPermissionStatus: "granted" | "denied" | "undetermined";
    }>,
  ) => {
    if (!user?.id) return;

    const merged = {
      shareUsageData,
      saveOrderHistory,
      useLocation,
      locationPermissionStatus,
      ...next,
    };

    await updateUserPrivacySettings(user.id, merged);
    setUser({
      ...user,
      privacySettings: merged,
    });
  };

  const handleShareUsageDataToggle = async (value: boolean) => {
    setShareUsageData(value);
    try {
      await persistPrivacySettings({ shareUsageData: value });
    } catch (error: any) {
      setShareUsageData(!value);
      Alert.alert("Error", error?.message || "Failed to save setting.");
    }
  };

  const handleSaveOrderHistoryToggle = async (value: boolean) => {
    setSaveOrderHistory(value);
    try {
      await persistPrivacySettings({ saveOrderHistory: value });
    } catch (error: any) {
      setSaveOrderHistory(!value);
      Alert.alert("Error", error?.message || "Failed to save setting.");
    }
  };

  const handleUseLocationToggle = async (value: boolean) => {
    if (!value) {
      setUseLocation(false);
      try {
        await persistPrivacySettings({ useLocation: false });
      } catch (error: any) {
        setUseLocation(true);
        Alert.alert("Error", error?.message || "Failed to save setting.");
      }
      return;
    }

    try {
      const currentPermission = await Location.getForegroundPermissionsAsync();
      let status = currentPermission.status as
        | "granted"
        | "denied"
        | "undetermined";

      if (status !== "granted") {
        const requested = await Location.requestForegroundPermissionsAsync();
        status = requested.status as "granted" | "denied" | "undetermined";
      }

      const granted = status === "granted";
      setLocationPermissionStatus(status);
      setUseLocation(granted);

      await persistPrivacySettings({
        useLocation: granted,
        locationPermissionStatus: status,
      });

      if (!granted) {
        Alert.alert(
          "Location permission denied",
          "Enable location permission in system settings to use this feature.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ],
        );
      }
    } catch (error: any) {
      setUseLocation(false);
      Alert.alert(
        "Error",
        error?.message || "Failed to update location permission.",
      );
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerTitle: "",
        }}
      />
      <SafeAreaView className="flex-1 bg-white">
      <View className="w-[92%] self-center mt-4 rounded-2xl border border-gray-200 bg-white px-4 py-1">
        <PrivacyRow
          label="Share analytics data"
          description="Allow anonymous usage data to improve the app experience."
          value={shareUsageData}
          onChange={handleShareUsageDataToggle}
        />
        <PrivacyRow
          label="Save order history"
          description="Keep your previous orders visible in your account."
          value={saveOrderHistory}
          onChange={handleSaveOrderHistoryToggle}
        />
        <PrivacyRow
          label="Use my location"
          description={`Allow location access for nearby services. Status: ${locationPermissionStatus}`}
          value={useLocation}
          onChange={handleUseLocationToggle}
        />
      </View>

      <View className="w-[92%] self-center mt-4 rounded-2xl border border-gray-200 bg-white px-4 py-4">
        <Text className="text-base font-semibold text-gray-900">
          Privacy policy
        </Text>
        <Text className="text-sm text-gray-500 mt-2">
          Your account information is only used to provide ordering, rewards and
          account services.
        </Text>
      </View>
      </SafeAreaView>
    </>
  );
}
