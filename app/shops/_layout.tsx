import { Stack } from "expo-router";

export default function ShopsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Back to Home",
          headerShown: true,
          headerTitleStyle: { fontSize: 14 },
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Back to Shops",
          headerShown: true,
          headerTitleStyle: { fontSize: 14 },
        }}
      />
    </Stack>
  );
}
