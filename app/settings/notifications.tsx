import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Switch, Text, View } from "react-native";

const NotificationRow = ({
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

export default function NotificationsScreen() {
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);
  const [rewardsAlerts, setRewardsAlerts] = useState(true);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="w-[92%] self-center mt-4 rounded-2xl border border-gray-200 bg-white px-4 py-1">
        <NotificationRow
          label="Order updates"
          description="Get notified when your order status changes."
          value={orderUpdates}
          onChange={setOrderUpdates}
        />
        <NotificationRow
          label="Promotions"
          description="Receive offers, deals and campaign notifications."
          value={promotions}
          onChange={setPromotions}
        />
        <NotificationRow
          label="Rewards alerts"
          description="Get reminders for points and reward redemptions."
          value={rewardsAlerts}
          onChange={setRewardsAlerts}
        />
      </View>
    </SafeAreaView>
  );
}
