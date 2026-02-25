// ...existing code...
// ...existing code...
import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import useAuthStore from "@/store/auth.store";
import * as Facebook from "expo-auth-session/providers/facebook";
import * as Google from "expo-auth-session/providers/google";
import { Link, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
export const config = {
  title: "",
  headerBackVisible: true,
  headerTitle: "",
};

import { auth, db } from "@/lib/firebase"; // Firebase imports
import {
  createUserWithEmailAndPassword,
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

WebBrowser.maybeCompleteAuthSession();

const SignUp = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOAuthSubmitting, setIsOAuthSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  // Add setUser from auth store
  const setUser = useAuthStore((state: any) => state.setUser);

  // const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
  // const googleAndroidClientId =
  //   process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || googleWebClientId;
  // const googleIosClientId =
  //   process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || googleWebClientId;

  // const [googleRequest, googleResponse, promptGoogleAuth] =
  //   Google.useAuthRequest({
  //     webClientId: googleWebClientId || "missing-google-web-client-id",
  //     androidClientId:
  //       googleAndroidClientId || "missing-google-android-client-id",
  //     iosClientId: googleIosClientId || "missing-google-ios-client-id",
  //   });

  // const [facebookRequest, facebookResponse, promptFacebookAuth] =
  //   Facebook.useAuthRequest({
  //     clientId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || "",
  //     scopes: ["public_profile", "email"],
  //   });

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

  // useEffect(() => {
  //   const signInWithGoogleCredential = async () => {
  //     if (googleResponse?.type !== "success") return;

  //     const idToken =
  //       googleResponse.authentication?.idToken ||
  //       googleResponse.params?.id_token;

  //     if (!idToken) {
  //       Alert.alert("Error", "Google sign-in failed. Missing ID token.");
  //       return;
  //     }

  //     setIsOAuthSubmitting(true);
  //     try {
  //       const credential = GoogleAuthProvider.credential(idToken);
  //       console.log("Google credential created:", credential);
  //       const userCredential = await signInWithCredential(auth, credential);
  //       console.log("Firebase user after Google sign-in:", userCredential.user);
  //       await ensureUserDoc(userCredential.user);
  //       // Update app state with user info
  //       setUser({
  //         id: userCredential.user.uid,
  //         email: userCredential.user.email,
  //         name: userCredential.user.displayName || "",
  //         avatar:
  //           userCredential.user.photoURL ||
  //           `https://ui-avatars.com/api/?name=${encodeURIComponent(userCredential.user.displayName || "User")}&background=random`,
  //       });
  //       router.replace("/(tabs)");
  //     } catch (error: any) {
  //       Alert.alert("Error", error?.message || "Google sign-in failed");
  //     } finally {
  //       setIsOAuthSubmitting(false);
  //     }
  //   };

  //   signInWithGoogleCredential();
  // }, [googleResponse]);

  // useEffect(() => {
  //   const signInWithFacebookCredential = async () => {
  //     if (facebookResponse?.type !== "success") return;

  //     const accessToken =
  //       facebookResponse.authentication?.accessToken ||
  //       facebookResponse.params?.access_token;

  //     if (!accessToken) {
  //       Alert.alert("Error", "Facebook sign-in failed. Missing access token.");
  //       return;
  //     }

  //     setIsOAuthSubmitting(true);
  //     try {
  //       const credential = FacebookAuthProvider.credential(accessToken);
  //       console.log("Facebook credential created:", credential);
  //       const userCredential = await signInWithCredential(auth, credential);
  //       console.log(
  //         "Firebase user after Facebook sign-in:",
  //         userCredential.user,
  //       );
  //       await ensureUserDoc(userCredential.user);
  //       setUser({
  //         id: userCredential.user.uid,
  //         email: userCredential.user.email,
  //         name: userCredential.user.displayName || "",
  //         avatar:
  //           userCredential.user.photoURL ||
  //           `https://ui-avatars.com/api/?name=${encodeURIComponent(userCredential.user.displayName || "User")}&background=random`,
  //       });
  //       router.replace("/(tabs)");
  //     } catch (error: any) {
  //       Alert.alert("Error", error?.message || "Facebook sign-in failed");
  //     } finally {
  //       setIsOAuthSubmitting(false);
  //     }
  //   };

  //   signInWithFacebookCredential();
  // }, [facebookResponse]);

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
      // 1️⃣ Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const firebaseUser = userCredential.user;

      // 2️⃣ Update displayName (optional)
      await updateProfile(firebaseUser, { displayName: name });

      // 3️⃣ Create user document in Firestore
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

      {/* <CustomButton
        title="Continue with Google"
        isLoading={isOAuthSubmitting}
        onPress={async () => {
          const hasRequiredGoogleClientId =
            Platform.OS === "android"
              ? !!googleAndroidClientId
              : Platform.OS === "ios"
                ? !!googleIosClientId
                : !!googleWebClientId;

          if (!hasRequiredGoogleClientId) {
            Alert.alert(
              "Missing config",
              "Set Google client IDs in .env (EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID / EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID / EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID).",
            );
            return;
          }

          if (!googleRequest) {
            Alert.alert("Please wait", "Google auth is still loading.");
            return;
          }

          await promptGoogleAuth();
        }}
      /> */}

      {/* <CustomButton
        title="Continue with Facebook"
        isLoading={isOAuthSubmitting}
        onPress={async () => {
          if (!process.env.EXPO_PUBLIC_FACEBOOK_APP_ID) {
            Alert.alert(
              "Missing config",
              "Set EXPO_PUBLIC_FACEBOOK_APP_ID in .env",
            );
            return;
          }

          if (!facebookRequest) {
            Alert.alert("Please wait", "Facebook auth is still loading.");
            return;
          }

          await promptFacebookAuth();
        }}
      /> */}

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
