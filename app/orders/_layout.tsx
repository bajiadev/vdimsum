import { Stack } from "expo-router";

export default function RewardsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[orderId]"
        options={{
          title: "",
        }}
      />
    </Stack>
  );
}
