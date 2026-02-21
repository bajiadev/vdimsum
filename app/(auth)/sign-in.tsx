import { View, Text, Alert, Platform } from "react-native";
import { Link, router, useRootNavigationState } from "expo-router";
import { use, useEffect, useState } from "react";
import CustomInput from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as Facebook from "expo-auth-session/providers/facebook";

import { auth, db } from "@/lib/firebase";
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

WebBrowser.maybeCompleteAuthSession();

const SignIn = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOAuthSubmitting, setIsOAuthSubmitting] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [pendingNavigation, setPendingNavigation] = useState<boolean>(false);
  const navigationState = useRootNavigationState();

  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
  const googleAndroidClientId =
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || googleWebClientId;
  const googleIosClientId =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || googleWebClientId;

  const [googleRequest, googleResponse, promptGoogleAuth] =
    Google.useAuthRequest({
      webClientId: googleWebClientId || "missing-google-web-client-id",
      androidClientId:
        googleAndroidClientId || "missing-google-android-client-id",
      iosClientId: googleIosClientId || "missing-google-ios-client-id",
    });

  const [facebookRequest, facebookResponse, promptFacebookAuth] =
    Facebook.useAuthRequest({
      clientId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || "",
      scopes: ["public_profile", "email"],
    });

  const ensureUserDoc = async (firebaseUser: any) => {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || "",
        avatar: `https://ui-avatars.com/api/?name=${firebaseUser.displayName || "User"}&background=random`,
        createdAt: new Date(),
      });
    }
  };

  useEffect(() => {
    const signInWithGoogleCredential = async () => {
      if (!navigationState?.key) return;
      if (googleResponse?.type !== "success") return;

      const idToken =
        googleResponse.authentication?.idToken ||
        googleResponse.params?.id_token;

      if (!idToken) {
        Alert.alert("Error", "Google sign-in failed. Missing ID token.");
        return;
      }

      setIsOAuthSubmitting(true);
      try {
        const credential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, credential);
        await ensureUserDoc(userCredential.user);
        router.replace("/(tabs)");
      } catch (error: any) {
        Alert.alert("Error", error?.message || "Google sign-in failed");
      } finally {
        setIsOAuthSubmitting(false);
      }
    };

    signInWithGoogleCredential();
  }, [googleResponse, navigationState]);

  useEffect(() => {
    const signInWithFacebookCredential = async () => {
      if (!navigationState.key) return;
      if (facebookResponse?.type !== "success") return;

      const accessToken =
        facebookResponse.authentication?.accessToken ||
        facebookResponse.params?.access_token;

      if (!accessToken) {
        Alert.alert("Error", "Facebook sign-in failed. Missing access token.");
        return;
      }

      setIsOAuthSubmitting(true);
      try {
        const credential = FacebookAuthProvider.credential(accessToken);
        const userCredential = await signInWithCredential(auth, credential);
        await ensureUserDoc(userCredential.user);
        router.replace("/(tabs)");
      } catch (error: any) {
        Alert.alert("Error", error?.message || "Facebook sign-in failed");
      } finally {
        setIsOAuthSubmitting(false);
      }
    };

    signInWithFacebookCredential();
  }, [facebookResponse, navigationState]);

  const submit = async () => {
    const { email, password } = form;

    if (!email || !password) {
      return Alert.alert(
        "Error",
        "Please enter a valid email address & password.",
      );
    }

    setIsSubmitting(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const firebaseUser = userCredential.user;
      await ensureUserDoc(firebaseUser);
      router.replace("/(tabs)");
    } catch (error: any) {
      // console.error(error.code, error.message);
      Alert.alert("Error", "Invalid username or password");
    } finally {
      setIsSubmitting(false);
    }
  };

  // useEffect(() => {
  //   if (pendingNavigation && navigationState?.key) {
  //     router.replace("/(tabs)");
  //   }
  // }, [pendingNavigation, navigationState]);

  return (
    <View className="gap-10 bg-white rounded-lg p-5 mt-5">
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

      <CustomButton title="Sign In" isLoading={isSubmitting} onPress={submit} />

      <CustomButton
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
      />

      <CustomButton
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
      />

      <View className="flex justify-center mt-5 flex-row gap-2">
        <Text>Don't have an account?</Text>
        <Link href="/(auth)/sign-up" className="base-bold text-primary">
          <Text>Sign Up</Text>
        </Link>
      </View>
    </View>
  );
};

export default SignIn;
