import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import { updateUserProfile } from "@/lib/firebase";
import useAuthStore from "@/store/auth.store";
import { router, Stack } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const InfoRow = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) => (
  <View className="py-3 border-b border-gray-100">
    <Text className="text-xs text-gray-500">{label}</Text>
    <Text className="text-base text-gray-900 mt-1">
      {value || "Not provided"}
    </Text>
  </View>
);

export default function AccountScreen() {
  const { user, logout, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    addressLine1: user?.addressLine1 || user?.address || "",
    city: user?.city || "",
    postcode: user?.postcode || "",
    country: user?.country || "",
  });

  const address = useMemo(() => {
    if (user?.addressLine1) {
      return [user.addressLine1, user.city, user.postcode, user.country]
        .filter(Boolean)
        .join(", ");
    }

    return (
      user?.address ||
      [user?.city, user?.postcode, user?.country].filter(Boolean).join(", ")
    );
  }, [user]);

  const startEdit = () => {
    setForm({
      name: user?.name || "",
      phone: user?.phone || "",
      addressLine1: user?.addressLine1 || user?.address || "",
      city: user?.city || "",
      postcode: user?.postcode || "",
      country: user?.country || "",
    });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user?.id) return;

    if (!form.name.trim()) {
      Alert.alert("Validation", "Full name is required.");
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        addressLine1: form.addressLine1.trim(),
        city: form.city.trim(),
        postcode: form.postcode.trim(),
        country: form.country.trim(),
      };

      await updateUserProfile(user.id, payload);
      setUser({
        ...user,
        ...payload,
        address: payload.addressLine1,
      });

      setIsEditing(false);
      Alert.alert("Success", "Account details updated.");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to update account.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/(tabs)");
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerTitle: "",
          //headerBackTitleVisible: false,
        }}
      />
      <SafeAreaView className="flex-1 bg-white">
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {isEditing ? (
            <View className="w-[92%] self-center mt-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 gap-3">
              <CustomInput
                label="Full name"
                value={form.name}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, name: text }))
                }
                placeholder="Enter full name"
              />
              <CustomInput
                label="Email"
                value={user?.email || ""}
                placeholder="Email"
              />
              <CustomInput
                label="Phone"
                value={form.phone}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, phone: text }))
                }
                keyboardType="phone-pad"
                placeholder="Enter phone number"
              />
              <CustomInput
                label="Address"
                value={form.addressLine1}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, addressLine1: text }))
                }
                placeholder="Address line"
              />
              <CustomInput
                label="City"
                value={form.city}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, city: text }))
                }
                placeholder="City"
              />
              <CustomInput
                label="Postcode"
                value={form.postcode}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, postcode: text }))
                }
                placeholder="Postcode"
              />
              <CustomInput
                label="Country"
                value={form.country}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, country: text }))
                }
                placeholder="Country"
              />
              <CustomButton
                title="Save"
                onPress={handleSave}
                isLoading={isSaving}
              />
              <CustomButton
                title="Cancel"
                onPress={cancelEdit}
                style="bg-gray-300"
                textStyle="text-black"
              />
            </View>
          ) : (
            <>
              <View className="w-[92%] self-center mt-4 rounded-2xl border border-gray-200 bg-white px-4 py-2">
                <InfoRow label="Full Name" value={user?.name} />
                <InfoRow label="Email" value={user?.email} />
                <InfoRow label="Phone" value={user?.phone} />
                <InfoRow label="Address" value={address} />
              </View>

              <View className="w-[92%] self-center mt-4 gap-3">
                <CustomButton title="Edit Account" onPress={startEdit} />
                <CustomButton title="Logout" onPress={handleLogout} />
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
