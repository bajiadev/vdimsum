import { Address } from "@/type";
import React, { useEffect, useState } from "react";
import { Alert, Modal, Pressable, Text, TextInput, View } from "react-native";

export function formatUKAddress(a: any) {
  return [a.street1, a.street2, a.city, a.postcode].filter(Boolean).join(", ");
}

interface AddressModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (address: Address) => void;
  onSave?: (address: Address) => Promise<void>;
  saving?: boolean;
  addresses?: Address[];
}

const AddressModal: React.FC<AddressModalProps> = ({
  visible,
  onClose,
  onConfirm,
  onSave,
  saving = false,
  addresses = [],
}) => {
  const [addressName, setAddressName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  useEffect(() => {
    if (!visible) {
      setAddressName("");
      setAddress1("");
      setAddress2("");
      setCity("");
      setPostcode("");
      setSelectedAddress(null);
    }
  }, [visible]);

  const handleSaveAndSelect = async () => {
    if (!address1 && !city && !postcode) return;
    const addressObj: Address = {
      name: addressName,
      street1: address1,
      street2: address2,
      city,
      postcode,
      formatted: formatUKAddress({
        street1: address1,
        street2: address2,
        city,
        postcode,
      }),
    };
    if (onSave) await onSave(addressObj);
    setSelectedAddress(addressObj);
    // Immediately confirm and close modal after saving
    onConfirm(addressObj);
  };

  const handleConfirm = () => {
    let addressObj: Address | null = null;
    if (selectedAddress) {
      addressObj = selectedAddress;
    } else if (address1 || city || postcode) {
      addressObj = {
        name: addressName,
        street1: address1,
        street2: address2,
        city,
        postcode,
        formatted: formatUKAddress({
          street1: address1,
          street2: address2,
          city,
          postcode,
        }),
      };
    }
    if (!addressObj || !addressObj.formatted) {
      Alert.alert("Please enter or select an address");
      return;
    }
    onConfirm(addressObj);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.3)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 24,
            width: "90%",
          }}
        >
          <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 12 }}>
            Select Delivery Address
          </Text>
          {addresses && addresses.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              {addresses.map((addr, idx) => (
                <Pressable
                  key={idx}
                  style={{
                    borderWidth: 1,
                    borderColor:
                      selectedAddress &&
                      selectedAddress.formatted === addr.formatted
                        ? "#FF6B00"
                        : "#ccc",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8,
                    backgroundColor:
                      selectedAddress &&
                      selectedAddress.formatted === addr.formatted
                        ? "#FFF3E6"
                        : "#fff",
                  }}
                  onPress={() => setSelectedAddress(addr)}
                >
                  <Text>
                    {addr.name ? `${addr.name}: ` : ""}
                    {addr.formatted}
                  </Text>
                  {selectedAddress &&
                    selectedAddress.formatted === addr.formatted && (
                      <Text style={{ color: "#FF6B00", fontSize: 12 }}>
                        Selected
                      </Text>
                    )}
                </Pressable>
              ))}
            </View>
          )}
          <Text style={{ marginBottom: 4 }}>Or enter a new address:</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 8,
              padding: 10,
              marginBottom: 8,
            }}
            placeholder="Address Name (e.g. Home, Office)"
            value={addressName}
            onChangeText={setAddressName}
            editable={!saving}
          />
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 8,
              padding: 10,
              marginBottom: 8,
            }}
            placeholder="Address 1 (Street)"
            value={address1}
            onChangeText={setAddress1}
            editable={!saving}
          />
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 8,
              padding: 10,
              marginBottom: 8,
            }}
            placeholder="Address 2 (Apt, Suite, etc)"
            value={address2}
            onChangeText={setAddress2}
            editable={!saving}
          />
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 8,
              padding: 10,
              marginBottom: 8,
            }}
            placeholder="City"
            value={city}
            onChangeText={setCity}
            editable={!saving}
          />
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 8,
              padding: 10,
              marginBottom: 8,
            }}
            placeholder="Postcode"
            value={postcode}
            onChangeText={setPostcode}
            editable={!saving}
          />
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Pressable
              style={{
                backgroundColor: "#FF6B00",
                padding: 10,
                borderRadius: 8,
                flex: 1,
                marginRight: 8,
                opacity: address1 || city || postcode ? 1 : 0.5,
              }}
              onPress={handleSaveAndSelect}
              disabled={!(address1 || city || postcode) || saving}
            >
              <Text style={{ color: "#fff", textAlign: "center" }}>
                {saving ? "Saving..." : "Save & Use"}
              </Text>
            </Pressable>
            <Pressable
              style={{
                backgroundColor: "#eee",
                padding: 10,
                borderRadius: 8,
                flex: 1,
                marginLeft: 8,
              }}
              onPress={onClose}
            >
              <Text style={{ color: "#333", textAlign: "center" }}>Cancel</Text>
            </Pressable>
          </View>
          {addresses &&
            addresses.length > 0 &&
            selectedAddress &&
            addresses.some(
              (a) => a.formatted === selectedAddress.formatted,
            ) && (
              <Pressable
                style={{
                  backgroundColor: "#FF6B00",
                  padding: 12,
                  borderRadius: 8,
                  marginTop: 4,
                }}
                onPress={handleConfirm}
              >
                <Text
                  style={{
                    color: "#fff",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                >
                  Confirm Address
                </Text>
              </Pressable>
            )}
        </View>
      </View>
    </Modal>
  );
};

export default AddressModal;
