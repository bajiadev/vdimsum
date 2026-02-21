import "./global.css";
import useAuthStore from "@/store/auth.store";
import { StripeProvider } from "@stripe/stripe-react-native";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isLoading, fetchAuthenticatedUser } = useAuthStore();
  const [fontsLoaded, error] = useFonts({
    "QuickSand-Bold": require("../assets/fonts/Quicksand-Bold.ttf"),
    "QuickSand-Medium": require("../assets/fonts/Quicksand-Medium.ttf"),
    "QuickSand-Regular": require("../assets/fonts/Quicksand-Regular.ttf"),
    "QuickSand-SemiBold": require("../assets/fonts/Quicksand-SemiBold.ttf"),
    "QuickSand-Light": require("../assets/fonts/Quicksand-Light.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, error]);

  useEffect(() => {
    const unsubscribe = fetchAuthenticatedUser();
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [fetchAuthenticatedUser]);

  if (!fontsLoaded || isLoading) return null;

  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!;
  if (!publishableKey) {
    throw new Error("Missing Stripe publishable key");
  }

  return (
    <StripeProvider publishableKey={publishableKey}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="order" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="orders" options={{ headerShown: false }} />
        <Stack.Screen name="settings/index" options={{ title: "Settings" }} />
        <Stack.Screen name="rewards" options={{ headerShown: false }} />
        <Stack.Screen name="shops" options={{ headerShown: false }} />
        <Stack.Screen name="category/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="offers" options={{ headerShown: false }} />
      </Stack>
    </StripeProvider>
  );
}
