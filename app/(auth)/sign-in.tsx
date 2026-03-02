import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import { auth, db } from "@/lib/firebase";
import useAuthStore from "@/store/auth.store";
import { AntDesign, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { getRandomBytes } from "expo-random";
import { Link, router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import {
  AccessToken,
  AuthenticationToken,
  LoginManager,
} from "react-native-fbsdk-next";

WebBrowser.maybeCompleteAuthSession();

const SignIn = () => {
  // Auto-login: check for existing Firebase user
  useEffect(() => {
    if (auth.currentUser) {
      // Restore user info in store
      const firebaseUser = auth.currentUser;
      setUser({
        id: firebaseUser.uid,
        name: firebaseUser.displayName || "",
        email: firebaseUser.email || "",
        avatar:
          firebaseUser.photoURL ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(firebaseUser.displayName || "User")}&background=random`,
      });
      router.replace("/(tabs)");
    }
  }, []);
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
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const userInfo = await GoogleSignin.signIn();
      if (userInfo.type === "success") {
        const user = userInfo.data;
        const idToken = user.idToken;
        if (!idToken) {
          Alert.alert("Error", "Google sign-in failed. Missing ID token.");
          setIsGoogleOAuthSubmitting(false);
          return;
        }
        const credential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, credential);
        await ensureUserDoc(userCredential.user);
        router.replace("/(tabs)");
      }

      // const { idToken } = await GoogleSignin.getTokens();
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Google sign-in failed");
      router.replace("/(auth)/sign-up");
    } finally {
      setIsGoogleOAuthSubmitting(false);
    }
  };

  function generateNonce(length = 32) {
    const bytes = getRandomBytes(length);
    return Array.from(bytes)
      .map((b) => (b as number).toString(16).padStart(2, "0"))
      .join("");
  }

  const handleFacebookSignIn = async () => {
    setIsFacebookOAuthSubmitting(true);
    try {
      let credential;
      if (Platform.OS === "ios") {
        // Generate raw nonce
        const rawNonce = generateNonce();
        // Hash the nonce (SHA-256)
        const hashedNonce = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          rawNonce,
        );
        // Facebook login with hashed nonce
        const result = await LoginManager.logInWithPermissions(
          ["public_profile", "email"],
          "limited",
          hashedNonce,
        );
        if (result.isCancelled) return;
        const authTokenResult =
          await AuthenticationToken.getAuthenticationTokenIOS();
        if (!authTokenResult?.authenticationToken) {
          Alert.alert(
            "Error",
            "Facebook sign-in failed. Missing authentication token.",
          );
          return;
        }
        // Pass rawNonce to Firebase
        const provider = new OAuthProvider("facebook.com");
        credential = provider.credential({
          idToken: authTokenResult.authenticationToken,
          rawNonce: rawNonce,
        });
      } else {
        // Android / normal login
        const result = await LoginManager.logInWithPermissions([
          "public_profile",
          "email",
        ]);
        if (result.isCancelled) return;
        const accessTokenResult = await AccessToken.getCurrentAccessToken();
        if (!accessTokenResult?.accessToken) {
          Alert.alert(
            "Error",
            "Facebook sign-in failed. Missing access token.",
          );
          return;
        }
        credential = FacebookAuthProvider.credential(
          accessTokenResult.accessToken,
        );
      }
      const userCredential = await signInWithCredential(auth, credential);
      await ensureUserDoc(userCredential.user);
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Facebook sign-in failed");
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
        //rawNonce: credential.user, // If you use nonce, otherwise omit
      });

      const userCredential = await signInWithCredential(auth, authCredential);
      await ensureUserDoc(userCredential.user);
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Apple sign-in failed");
      //router.replace("/(auth)/sign-up");
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
    <View className="gap-4 bg-white rounded-lg p-5 mt-5">
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
        leftIcon={
          <MaterialIcons
            name="email"
            size={24}
            color="white"
            style={{ marginRight: 8 }}
          />
        }
      />
      {Platform.OS === "ios" && (
        <CustomButton
          title="Sign In with Apple"
          isLoading={isAppleOAuthSubmitting}
          onPress={handleAppleSignIn}
          leftIcon={
            <AntDesign
              name="apple"
              size={24}
              color="white"
              style={{ marginRight: 8 }}
            />
          }
        />
      )}
      <CustomButton
        title="Sign In with Google"
        isLoading={isGoogleOAuthSubmitting}
        onPress={handleGoogleSignIn}
        leftIcon={
          <AntDesign
            name="google"
            size={24}
            color="white"
            style={{ marginRight: 8 }}
          />
        }
      />
      <CustomButton
        title="Sign In with Facebook"
        isLoading={isFacebookOAuthSubmitting}
        onPress={handleFacebookSignIn}
        leftIcon={
          <FontAwesome
            name="facebook"
            size={24}
            color="white"
            style={{ marginRight: 8 }}
          />
        }
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
