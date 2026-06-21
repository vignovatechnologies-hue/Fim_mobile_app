import { useEffect } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { useAuth } from "../lib/auth";
import { ActivityIndicator, View, Platform } from "react-native";
import "../global.css";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { apiFetch } from "../lib/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as any),
});

function RootLayoutNav() {
  const { user, ready } = useAuth();
  const segments = useSegments() as string[];
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;

    const inAuthGroup = segments[0] === "(auth)";
    const isPublicRoute = segments[0] === "privacy-policy" || segments[0] === "terms-of-use";
    
    if (!user) {
      if (!inAuthGroup && !isPublicRoute) {
        router.replace("/(auth)/auth");
      }
    } else if (!user.verified) {
      if (segments[1] !== "verify" && !isPublicRoute) {
        router.replace("/(auth)/verify");
      }
    } else {
      if (inAuthGroup) {
        router.replace("/(tabs)");
      }
    }
  }, [user, ready, segments]);

  useEffect(() => {
    if (user && user.verified) {
      registerAndUploadToken();
    }
  }, [user]);

  async function registerAndUploadToken() {
    try {
      const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
      if (isExpoGo) {
        console.log("Running in Expo Go: Skipping remote notification token setup.");
        await apiFetch("/api/user/fcm-token", {
          method: "POST",
          body: JSON.stringify({ fcm_token: `mock_expogo_token_${user?.id}_${Platform.OS}` }),
        });
        return;
      }

      let token = null;
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366f1',
        });
      }

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus === 'granted') {
          try {
            token = (await Notifications.getDevicePushTokenAsync()).data;
          } catch (e) {
            console.log("Could not get device push token. Using mock simulator token.", e);
            token = `mock_device_token_${user?.id}_${Platform.OS}`;
          }
        }
      } else {
        token = `mock_simulator_token_${user?.id}_${Platform.OS}`;
      }

      if (token) {
        console.log("FCM/Device Push Token retrieved:", token);
        await apiFetch("/api/user/fcm-token", {
          method: "POST",
          body: JSON.stringify({ fcm_token: token }),
        });
      }
    } catch (error) {
      console.log("Error in registerAndUploadToken:", error);
    }
  }

  if (!ready) {
    return (
      <View className="flex-1 justify-center items-center bg-[#0d1512]">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return <RootLayoutNav />;
}
