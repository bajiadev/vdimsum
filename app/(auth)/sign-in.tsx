export const config = {
  title: "",
  headerBackVisible: true,
  headerTitle: "",
};
import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import { auth, db } from "@/lib/firebase";
import useAuthStore from "@/store/auth.store";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import { Link, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  OAuthProvider
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { AccessToken, LoginManager } from "react-native-fbsdk-next";

WebBrowser.maybeCompleteAuthSession();

const SignIn = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleOAuthSubmitting, setIsGoogleOAuthSubmitting] = useState(false);
  const [isFacebookOAuthSubmitting, setIsFacebookOAuthSubmitting] =
    useState(false);
  const [isAppleOAuthSubmitting, setIsAppleOAuthSubmitting] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const setUser = useAuthStore((state) => state.setUser);

  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: googleWebClientId,
      offlineAccess: false,
      forceCodeForRefreshToken: false,
    });
    console.log(
      "Google Sign-In configured with Web Client ID:",
      googleWebClientId,
    );
  }, [googleWebClientId]);

  const ensureUserDoc = async (firebaseUser: any) => {
    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      let userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || "",
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || "User")}&background=random`,
          createdAt: serverTimestamp(),
        });
        userDocSnap = await getDoc(userDocRef);
      }
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setUser({
          id: firebaseUser.uid,
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar,
        });
      } else {
        console.error("User document could not be created or found.");
        throw new Error("User document could not be created or found.");
      }
    } catch (err) {
      console.error("Error in ensureUserDoc:", err);
      throw err;
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleOAuthSubmitting(true);
    console.log("Starting Google Sign-In process...", isGoogleOAuthSubmitting);
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      console.log("Google Play Services are available.");
      const idToken = (await GoogleSignin.getTokens()).idToken;
      if (!idToken) {
        Alert.alert("Error", "Google sign-in failed. Missing ID token.");
        setIsGoogleOAuthSubmitting(false);
        return;
      }
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      console.log(
        "Google Sign-In successful, User Credential:",
        userCredential,
      );
      await ensureUserDoc(userCredential.user);
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Google Sign-In error:", error);
      Alert.alert("Error", error?.message || "Google sign-in failed");
      router.replace("/(auth)/sign-up");
    } finally {
      setIsGoogleOAuthSubmitting(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setIsFacebookOAuthSubmitting(true);
    try {
      // Attempt login with permissions
      const result = await LoginManager.logInWithPermissions([
        "public_profile",
        "email",
      ]);
      if (result.isCancelled) {
        setIsFacebookOAuthSubmitting(false);
        return;
      }
      // Get the access token
      const data = await AccessToken.getCurrentAccessToken();
      if (!data?.accessToken) {
        Alert.alert("Error", "Facebook sign-in failed. Missing access token.");
        setIsFacebookOAuthSubmitting(false);
        return;
      }
      const credential = FacebookAuthProvider.credential(data.accessToken);
      const userCredential = await signInWithCredential(auth, credential);
      await ensureUserDoc(userCredential.user);
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Facebook sign-in failed");
      router.replace("/(auth)/sign-up");
    } finally {
      setIsFacebookOAuthSubmitting(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsAppleOAuthSubmitting(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        Alert.alert("Error", "Apple sign-in failed. Missing identity token.");
        setIsAppleOAuthSubmitting(false);
        return;
      }

      const provider = new OAuthProvider("apple.com");
      const authCredential = provider.credential({
        idToken: credential.identityToken,
        rawNonce: credential.user, // If you use nonce, otherwise omit
      });

      const userCredential = await signInWithCredential(auth, authCredential);
      await ensureUserDoc(userCredential.user);
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Apple sign-in failed");
      router.replace("/(auth)/sign-up");
    } finally {
      setIsAppleOAuthSubmitting(false);
    }
  };

  const submit = async () => {
    const { email, password } = form;
    if (!email || !password) {
      return Alert.alert("Error", "Please enter your email and password.");
    }
    setIsSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const firebaseUser = userCredential.user;
      try {
        await ensureUserDoc(firebaseUser);
        router.replace("/(tabs)");
      } catch (docError) {
        console.warn(
          "User doc creation failed, redirecting to sign-up.",
          docError,
        );
        Alert.alert(
          "Profile Required",
          "Please complete your profile to continue.",
        );
        router.replace("/(auth)/sign-up");
      }
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        Alert.alert("No account found", "Redirecting to sign up.");
        router.replace({ pathname: "/(auth)/sign-up", params: { email } });
      } else {
        Alert.alert("Error", error.message || "Invalid username or password");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <CustomButton
        title="Sign In with Email"
        isLoading={isSubmitting}
        onPress={submit}
      />
      <CustomButton
        title="Sign In with Google"
        isLoading={isGoogleOAuthSubmitting}
        onPress={handleGoogleSignIn}
      />
      <CustomButton
        title="Sign In with Facebook"
        isLoading={isFacebookOAuthSubmitting}
        onPress={handleFacebookSignIn}
      />
      <CustomButton
        title="Sign In with Apple"
        isLoading={isAppleOAuthSubmitting}
        onPress={handleAppleSignIn}
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
