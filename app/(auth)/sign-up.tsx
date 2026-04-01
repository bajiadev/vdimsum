import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import useAuthStore from "@/store/auth.store";
import { Link, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Alert, Text, View } from "react-native";
// export const config = {
//   title: "",
//   headerBackVisible: true,
//   headerTitle: "",
// };

import { auth, db } from "@/lib/firebase"; // Firebase imports
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

WebBrowser.maybeCompleteAuthSession();

const SignUp = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOAuthSubmitting, setIsOAuthSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const setUser = useAuthStore((state: any) => state.setUser);

  const ensureUserDoc = async (firebaseUser: any) => {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || "",
        email: firebaseUser.email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          firebaseUser.displayName || "User",
        )}&background=random`,
        createdAt: serverTimestamp(),
      });
    }
  };


  const submit = async () => {
    const { name, email, password } = form;

    if (!name || !email || !password) {
      return Alert.alert(
        "Error",
        "Please enter a valid name, email address & password.",
      );
    }

    setIsSubmitting(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, { displayName: name });

      await setDoc(doc(db, "users", firebaseUser.uid), {
        uid: firebaseUser.uid,
        name,
        email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
          name,
        )}&background=random`, // default avatar
        createdAt: serverTimestamp(),
      });

      // 4️⃣ Navigate to home
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="gap-10 bg-white rounded-lg p-5 mt-5">
      <CustomInput
        placeholder="Enter your full name"
        value={form.name}
        onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
        label="Full name"
      />
      <CustomInput
        placeholder="Enter your email"
        value={form.email}
        onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
        label="Email"
        keyboardType="email-address"
      />
      <CustomInput
        placeholder="Enter your password"
        value={form.password}
        onChangeText={(text) =>
          setForm((prev) => ({ ...prev, password: text }))
        }
        label="Password"
        secureTextEntry
      />

      <CustomButton title="Sign Up" isLoading={isSubmitting} onPress={submit} />

      <View className="flex justify-center mt-5 flex-row gap-2">
        <Text className="base-regular text-gray-100">
          Already have an account?
        </Text>
        <Link href="/(auth)/sign-in" className="base-bold text-primary">
          <Text>Sign In</Text>
        </Link>
      </View>
    </View>
  );
};

export default SignUp;
