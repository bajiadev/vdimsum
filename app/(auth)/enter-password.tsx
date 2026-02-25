import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import { auth } from "@/lib/firebase";
import useAuthStore from "@/store/auth.store";
import { useLocalSearchParams, useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { Alert, Text, View } from "react-native";

const EnterPassword = () => {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);

  const handleSignIn = async () => {
    if (!password) {
      Alert.alert("Error", "Please enter your password.");
      return;
    }
    setIsSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const firebaseUser = userCredential.user;
      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || "",
        avatar: firebaseUser.photoURL || undefined,
      });
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Invalid password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="gap-10 bg-white rounded-lg p-5 mt-5">
      <Text className="mb-2">Email</Text>
      <CustomInput value={email} editable={false} label="Email" />
      <CustomInput
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        label="Password"
        secureTextEntry
      />
      <CustomButton
        title="Sign In"
        isLoading={isSubmitting}
        onPress={handleSignIn}
      />
    </View>
  );
};

export default EnterPassword;
