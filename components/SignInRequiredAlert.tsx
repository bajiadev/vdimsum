import { router } from "expo-router";
import { useEffect } from "react";
import { Alert } from "react-native";

interface SignInRequiredAlertProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  message?: string;
  showSignUp?: boolean;
}

const SignInRequiredAlert = ({
  visible,
  setVisible,
  message = "Please sign in to add items to your order",
  showSignUp = true,
}: SignInRequiredAlertProps) => {
  useEffect(() => {
    if (!visible) return;

    const closeAlert = () => setVisible(false);

    Alert.alert(
      "Sign In Required",
      message,
      [
        { text: "Cancel", style: "cancel", onPress: closeAlert },
        {
          text: "Sign In",
          onPress: () => {
            closeAlert();
            router.push("/(auth)/sign-in");
          },
        },
        ...(showSignUp
          ? [
              {
                text: "Sign Up",
                onPress: () => {
                  closeAlert();
                  router.push("/(auth)/sign-up");
                },
              },
            ]
          : []),
      ],
      { cancelable: true, onDismiss: closeAlert },
    );
  }, [message, setVisible, showSignUp, visible]);

  return null;
};

export default SignInRequiredAlert;
