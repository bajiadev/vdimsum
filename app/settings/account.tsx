import { formatUKAddress } from "@/components/AddressModal";
import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import { db, updateUserProfile } from "@/lib/firebase";
import useAuthStore from "@/store/auth.store";
import { Address } from "@/type";
import { router, Stack } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
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
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    addressName: "",
    street1: "",
    street2: "",
    city: "",
    postcode: "",
  });

  const primaryAddress = user?.addresses?.[0];
  const addressDisplay = primaryAddress?.formatted || "Not provided";
  const hasMultipleAddresses = (user?.addresses?.length || 0) > 1;

  const startEdit = () => {
    loadAddressForm(0);
  };

  const loadAddressForm = (addressIndex: number) => {
    const selectedAddr = user?.addresses?.[addressIndex];
    setSelectedAddressIndex(addressIndex);
    setForm({
      name: user?.name || "",
      phone: user?.phone || "",
      addressName: selectedAddr?.name || "",
      street1: selectedAddr?.street1 || "",
      street2: selectedAddr?.street2 || "",
      city: selectedAddr?.city || "",
      postcode: selectedAddr?.postcode || "",
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

      await updateUserProfile(user.id, {
        name: form.name.trim(),
        phone: form.phone.trim(),
      });

      let updatedAddresses = user.addresses ? [...user.addresses] : [];

      if (form.street1.trim() || form.city.trim() || form.postcode.trim()) {
        const addressObj: Address = {
          name: form.addressName.trim(),
          street1: form.street1.trim(),
          street2: form.street2.trim(),
          city: form.city.trim(),
          postcode: form.postcode.trim(),
          formatted: formatUKAddress({
            street1: form.street1.trim(),
            street2: form.street2.trim(),
            city: form.city.trim(),
            postcode: form.postcode.trim(),
          }),
        };

        const userRef = doc(db, "users", user.id);

        // Update existing address at selectedAddressIndex or add new
        if (selectedAddressIndex < updatedAddresses.length) {
          updatedAddresses[selectedAddressIndex] = addressObj;
        } else {
          updatedAddresses.push(addressObj);
        }

        // Write updated array back to Firestore
        await updateDoc(userRef, {
          addresses: updatedAddresses,
        });
      }

      setUser({
        ...user,
        name: form.name.trim(),
        phone: form.phone.trim(),
        addresses: updatedAddresses,
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
              {hasMultipleAddresses && (
                <View className="mb-4 pb-4 border-b border-gray-200">
                  <Text className="text-sm font-semibold text-gray-700 mb-3">
                    Select Address to Edit
                  </Text>
                  {user?.addresses?.map((addr, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => loadAddressForm(idx)}
                      className="flex-row items-center p-3 mb-2 border border-gray-200 rounded-lg"
                      style={{
                        backgroundColor:
                          selectedAddressIndex === idx ? "#FFF3E6" : "#fff",
                      }}
                    >
                      <View
                        className="w-5 h-5 rounded-full border-2 mr-3"
                        style={{
                          borderColor:
                            selectedAddressIndex === idx ? "#FF6B00" : "#ccc",
                          backgroundColor:
                            selectedAddressIndex === idx
                              ? "#FF6B00"
                              : "transparent",
                        }}
                      />
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-900">
                          {addr.name || `Address ${idx + 1}`}
                        </Text>
                        <Text className="text-xs text-gray-600 mt-1">
                          {addr.formatted}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
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
                label="Address Label (e.g. Home)"
                value={form.addressName}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, addressName: text }))
                }
                placeholder="Home, Office..."
              />
              <CustomInput
                label="Street"
                value={form.street1}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, street1: text }))
                }
                placeholder="Street address"
              />
              <CustomInput
                label="Street 2 (optional)"
                value={form.street2}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, street2: text }))
                }
                placeholder="Apt, suite, flat..."
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
              <CustomButton
                title="Save"
                onPress={handleSave}
                isLoading={isSaving}
              />
              <CustomButton
                title="Cancel"
                onPress={cancelEdit}
                style="bg-gray-600"
                textStyle="text-black"
              />
            </View>
          ) : (
            <>
              <View className="w-[92%] self-center mt-4 rounded-2xl border border-gray-200 bg-white px-4 py-2">
                <InfoRow label="Full Name" value={user?.name} />
                <InfoRow label="Email" value={user?.email} />
                <InfoRow label="Phone" value={user?.phone} />
                <InfoRow label="Address" value={addressDisplay} />
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
