import { Stack } from "expo-router";

export default function ShopsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "",
          headerShown: true,
          headerTitleStyle: { fontSize: 14 },
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "",
          headerShown: true,
          headerTitleStyle: { fontSize: 14 },
        }}
      />
    </Stack>
  );
}
