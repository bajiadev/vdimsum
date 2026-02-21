import Header from "@/components/Header";
import { getCategories } from "@/lib/firebase";
import useFirebase from "@/lib/useFirebase";
import { Category } from "@/type";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const Menu = () => {
  const { data: categories, loading: categoriesLoading } = useFirebase({
    fn: getCategories,
  });
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const handleOpenCategory = (category: Category) => {
    router.push({
      pathname: "/category/[id]",
      params: { id: category.id, name: category.name },
    });
  };

  return (
    <SafeAreaView className="bg-white h-full">
      <FlatList
        data={(categories as Category[]) ?? []}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-5 pb-32"
        ListHeaderComponent={() => (
          <View className="my-5 gap-5">
            <Header onOrderPress={() => router.push("/shops")} />
            <Text className="text-2xl font-semibold text-dark-100">
              Categories
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View className="mb-1">
            <TouchableOpacity
              onPress={() => handleOpenCategory(item)}
              className="flex-row items-center justify-between rounded-2xl border border-gray-100 bg-white p-3"
            >
              <View className="flex-row items-center gap-3">
                {item.image_url && !failedImages[item.id] ? (
                  <Image
                    source={{
                      uri: encodeURI(String(item.image_url).trim()),
                    }}
                    className="h-14 w-14 rounded-xl"
                    resizeMode="cover"
                    onError={(event) => {
                      console.log(
                        "Category image failed:",
                        item.id,
                        item.image_url,
                        event.nativeEvent?.error,
                      );
                      setFailedImages((prev) => ({
                        ...prev,
                        [item.id]: true,
                      }));
                    }}
                  />
                ) : (
                  <View className="h-14 w-14 items-center justify-center rounded-xl bg-gray-100">
                    <Text className="text-xs text-gray-400">No image</Text>
                  </View>
                )}
                <View>
                  <Text
                    className="text-2xl font-extrabold text-dark-100"
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  {!!item.description && (
                    <Text className="text-xs text-gray-400" numberOfLines={1}>
                      {item.description}
                    </Text>
                  )}
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() =>
          !categoriesLoading && <Text>No categories found</Text>
        }
      />
    </SafeAreaView>
  );
};

export default Menu;
