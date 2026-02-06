import Header from "@/components/Header";
import MenuCard from "@/components/MenuCard";
import { getCategories, getMenu } from "@/lib/firebase";
import useFirebase from "@/lib/useFirebase";
import { MenuItem } from "@/type";
import cn from "clsx";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Filter from "@/components/Filter";
import SearchBar from "@/components/SearchBar";

import { useMenu } from "@/store/menu.store";

const Menu = () => {
  const setMenu = useMenu((state) => state.setMenu);

  const { category, query } = useLocalSearchParams<{
    query: string;
    category: string;
  }>();

  const { data, refetch, loading } = useFirebase({
    fn: getMenu,
    params: { category, query, limit: 6 },
  });

  const { data: categories } = useFirebase({ fn: getCategories });

  useEffect(() => {
    refetch({ category, query, limit: 6 });
  }, [category, query]);

  useEffect(() => {
    if (data) {
      const menuItem: MenuItem[] = (data as MenuItem[]).map((doc) => ({
        id: doc.id,
        name: doc.name,
        price: doc.price,
        image_url: doc.image_url,
        description: doc.description,
        calories: doc.calories,
        rating: doc.rating,
        type: doc.type,
      }));
      setMenu(menuItem);
    }
  }, [data]);

  return (
    <SafeAreaView className="bg-white h-full">
      <FlatList
        data={data}
        renderItem={({ item, index }) => {
          const isFirstRightColItem = index % 2 === 0;

          return (
            <View
              className={cn(
                "flex-1 max-w-[48%]",
                !isFirstRightColItem ? "mt-10" : "mt-0",
              )}
            >
              <MenuCard item={item as MenuItem} />
            </View>
          );
        }}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperClassName="gap-7"
        contentContainerClassName="gap-7 px-5 pb-32"
        ListHeaderComponent={() => (
          <View className="my-5 gap-5">
            <Header onOrderPress={() => router.push("/shops")} />
            <SearchBar />

            <Filter categories={categories!} />
          </View>
        )}
        ListEmptyComponent={() => !loading && <Text>No results</Text>}
      />
    </SafeAreaView>
  );
};

export default Menu;
