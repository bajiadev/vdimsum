import { Stack } from "expo-router";
import { StripeProvider } from "@stripe/stripe-react-native";
import { SplashScreen } from "expo-router";
import { isLoading, useFonts } from "expo-font";
import { useEffect } from "react";
import "./global.css";
import useAuthStore from "@/store/auth.store";

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
    fetchAuthenticatedUser();
  }, []);

  if (!fontsLoaded || isLoading) return null;
  
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!;
  if (!publishableKey) {
    throw new Error("Missing Stripe publishable key");
  }

  // return (
  //   <StripeProvider publishableKey={publishableKey}>
  //     <Stack screenOptions={{ headerShown: false }} />
      
  //   </StripeProvider>
  // );

   return (
    <StripeProvider publishableKey={publishableKey}>
      <Stack>
        {/* Bottom tabs */}
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />

        {/* Stack screens (back arrow shown) */}
        <Stack.Screen
          name="orders"
          options={{ title: "My Orders" }}
        />
        <Stack.Screen
          name="settings"
          options={{ title: "Settings" }}
        />
      </Stack>
    </StripeProvider>
  );
}
