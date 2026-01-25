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
import { StatusBar } from "expo-status-bar"

const Profile = () => {
  const { user, isLoading, logout } = useAuthStore();

  if (isLoading)
    return (
      <SafeAreaView>
        <Text>loading</Text>
      </SafeAreaView>
    );

  if (!user)
    return (
      <SafeAreaView>
        <Text>No user!</Text>
      </SafeAreaView>
    );

  return (
    <SafeAreaView className="flex-1 items-center justify-center gap-4">
      <StatusBar backgroundColor='white' />
      <Text className="text-lg font-bold">{user.name}</Text>
      <Text className="text-gray-500">{user.email}</Text>
      <Text className="text-gray-500">{user.avatar}</Text>
      <Button onPressIn={logout}> Logout </Button>
      <Ionicons name="home-outline" size={24} />
      <Ionicons name="mail" size={24} />
      <Ionicons name="wallet" size={24} />
      <Ionicons name="push" size={24} />
    </SafeAreaView>
  );
};

export default Profile;
