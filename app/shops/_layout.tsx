import { Stack } from "expo-router";

export default function ShopsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
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
