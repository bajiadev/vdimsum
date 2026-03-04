import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text, TouchableOpacity } from "react-native";

type IoniconName =
  | "person-outline"
  | "notifications-outline"
  | "lock-closed-outline";

const Row = ({
  icon,
  label,
  onPress,
}: {
  icon: IoniconName;
  label: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200"
  >
    <View className="flex-row items-center gap-3">
      <Ionicons name={icon} size={22} />
      <Text>{label}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} />
  </TouchableOpacity>
);

export default function Settings() {
  return (
    <SafeAreaView>
      <Row
        icon="person-outline"
        label="Account"
        onPress={() => router.push("/settings/account")}
      />
      <Row
        icon="notifications-outline"
        label="Notifications"
        onPress={() => router.push("/settings/notifications")}
      />
      <Row
        icon="lock-closed-outline"
        label="Privacy"
        onPress={() => router.push("/settings/privacy")}
      />
    </SafeAreaView>
  );
}
