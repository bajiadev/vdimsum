import ProfileActionRow from "@/components/ProfileActionRow";
import useAuthStore from "@/store/auth.store";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Profile = () => {
  const { user, isLoading } = useAuthStore();
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  const displayName = user?.name || "Guest";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  if (isLoading)
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">Loading profile...</Text>
      </SafeAreaView>
    );

  if (!user)
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar backgroundColor="white" />
        <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
          <View className="w-[92%] self-center mt-4 bg-white rounded-2xl border border-gray-200 p-5 items-center gap-2">
            <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center overflow-hidden">
              <Text className="text-2xl font-bold text-gray-600">G</Text>
            </View>
            <Text className="text-xl font-bold text-center">Guest</Text>
            <Text className="text-gray-500 text-center">
              Sign in to view your profile and orders.
            </Text>
          </View>

          <View className="w-[92%] self-center mt-4 bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <ProfileActionRow
              icon="person-outline"
              label="Sign In"
              onPress={() => router.push("/(auth)/sign-in")}
            />
            <ProfileActionRow
              icon="person-outline"
              label="Sign Up"
              onPress={() => router.push("/(auth)/sign-up")}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar backgroundColor="white" />
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View className="w-[92%] self-center mt-4 bg-white rounded-2xl border border-gray-200 p-5 items-center gap-2">
          <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center overflow-hidden">
            {user?.avatar && !avatarLoadFailed ? (
              <Image
                source={{ uri: user.avatar }}
                className="w-24 h-24 rounded-full"
                onError={() => setAvatarLoadFailed(true)}
              />
            ) : (
              <Text className="text-2xl font-bold text-gray-600">
                {initials || "U"}
              </Text>
            )}
          </View>

          <Text className="text-xl font-bold text-center">{displayName}</Text>
          <Text className="text-gray-500 text-center">{user?.email}</Text>
        </View>

        <View className="w-[92%] self-center mt-4 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <ProfileActionRow
            icon="person-outline"
            label="Account"
            onPress={() => router.push("/settings/account")}
          />
          <ProfileActionRow
            icon="notifications-outline"
            label="Notifications"
            onPress={() => router.push("/settings/notifications")}
          />
          <ProfileActionRow
            icon="lock-closed-outline"
            label="Privacy"
            onPress={() => router.push("/settings/privacy")}
          />
        </View>
        <View className="w-[92%] self-center mt-4 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <ProfileActionRow
            icon="receipt-outline"
            label="My Orders"
            onPress={() => router.push("/orders")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
