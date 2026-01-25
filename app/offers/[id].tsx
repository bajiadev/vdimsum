import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { View, Text, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { offers } from "@/constants";

const Offerdetails = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const offer = offers.find((o) => o.id === Number(id));
  return (
    <SafeAreaView>
      <Ionicons
        name="arrow-back-circle"
        size={32}
        color="orange"
        onPress={() => router.back()}
      />
      <Image source={offer?.image} className="w-full h-30 rounded-3xl" />
      <Text>{id}</Text>
    </SafeAreaView>
  );
};

export default Offerdetails;
