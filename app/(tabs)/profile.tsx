import { getCurrentUser } from "@/lib/firebase";
import useAuthStore from "@/store/auth.store";
import { Button } from "@react-navigation/elements";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import PhotoCard from "../../components/PhotoCard";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import ProfileActionRow from "@/components/ProfileActionRow";

const Profile = () => {
  const { user, isLoading, logout } = useAuthStore();

  if (isLoading)
    return (
      <SafeAreaView>
        <Text>loading</Text>
      </SafeAreaView>
    );

 useEffect(() => {
  if (!user) {
    router.replace("../(auth)/sign-in");
  }
}, [user]);


  return (
    <SafeAreaView className="flex-1 items-center justify-center gap-4">
      <StatusBar backgroundColor="white" />
      <View className="items-center gap-2 mt-4">
        <View className="w-20 h-20 rounded-full bg-gray-200 items-center justify-center">
          <Ionicons name="person" size={40} color="#666" />
        </View>

        <Text className="text-xl font-bold">{user?.name}</Text>
        <Text className="text-gray-500">{user?.email}</Text>
      </View>
      <View className="w-full mt-6">
        <ProfileActionRow
          icon="receipt-outline"
          label="My Orders"
          onPress={() => router.push("/orders")}
        />
        <ProfileActionRow
          icon="settings-outline"
          label="Settings"
          onPress={() => router.push("/settings")}
        />
      </View>

      <Button onPressIn={logout}> Logout </Button>
    </SafeAreaView>
  );
};

export default Profile;
