import Header from "@/components/Header";
import MenuCard from "@/components/MenuCard";
import { getMenu } from "@/lib/firebase";
import useFirebase from "@/lib/useFirebase";
import { useMenu } from "@/store/menu.store";
import { MenuItem } from "@/type";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CategoryItems = () => {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const categoryId = Array.isArray(id) ? id[0] : id;
  const categoryName = Array.isArray(name) ? name[0] : name;
  const setMenu = useMenu((state) => state.setMenu);

  const { data, refetch, loading } = useFirebase({
    fn: getMenu,
    params: { categoryId },
    skip: true,
  });

  useEffect(() => {
    if (!categoryId) return;
    refetch({ categoryId });
  }, [categoryId]);

  useEffect(() => {
    if (data) {
      const menuItem: MenuItem[] = (data as MenuItem[]).map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        price: doc.price,
        image_url: doc.image_url,
        description: doc.description,
        rating: doc.rating,
        category_ids: doc.category_ids || [],
        category_names: doc.category_names || [],
        customizations: doc.customizations || [],
        is_available: doc.is_available ?? true,
        is_featured: doc.is_featured ?? false,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
      }));
      setMenu(menuItem);
    }
  }, [data, setMenu]);

  return (
    <SafeAreaView className="bg-white h-full">
      <FlatList
        data={(data as MenuItem[]) ?? []}
        renderItem={({ item }) => (
          <View className="mb-2">
            <MenuCard item={item as MenuItem} />
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-5 pb-32"
        ListHeaderComponent={() => (
          <View className="my-5 gap-4">
            <Header onOrderPress={() => router.push("/shops")} />
            <View className="flex-row items-center gap-3">
              <Ionicons
                name="arrow-back-circle"
                size={30}
                color="orange"
                onPress={() => router.back()}
              />
              <Text className="text-4xl font-semibold text-dark-100">
                {categoryName ?? "Category"}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={() =>
          !loading && <Text>No items in this category</Text>
        }
      />
    </SafeAreaView>
  );
};

export default CategoryItems;
