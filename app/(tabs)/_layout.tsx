import { Ionicons } from "@expo/vector-icons";
import cn from "clsx";
import { Tabs } from "expo-router";
import { Text, View } from "react-native";

type TabIconProps = {
  focused: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
};

const TabBarIcon = ({ focused, icon, title }: TabIconProps) => (
  <View className="tab-icon items-center gap-1">
    <Ionicons name={icon} size={26} color={focused ? "#FE8C00" : "#5D5F6D"} />
    <Text
      className={cn(
        "text-sm font-bold",
        focused ? "text-primary" : "text-gray-200",
      )}
    >
      {title}
    </Text>
  </View>
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          borderTopLeftRadius: 50,
          borderTopRightRadius: 50,
          borderBottomLeftRadius: 50,
          borderBottomRightRadius: 50,
          marginHorizontal: 20,
          height: 80,
          position: "absolute",
          bottom: 40,
          backgroundColor: "white",
          shadowColor: "#1a1a1a",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              title="Home"
              icon={focused ? "home" : "home-outline"}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="rewards"
        options={{
          title: "Rewards",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              title="Rewards"
              icon={focused ? "pricetags" : "pricetags-outline"}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="menu"
        options={{
          title: "Menu",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              title="Menu"
              icon={focused ? "menu" : "menu-outline"}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="order"
        options={{
          title: "Order",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              title="Order"
              icon={focused ? "receipt" : "receipt-outline"}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              title="Profile"
              icon={focused ? "person" : "person-outline"}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}
