import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator
} from "react-native";
import { MailCheck as MailCheckIcon, ArrowLeft as ArrowLeftIcon } from "lucide-react-native";

const MailCheck = MailCheckIcon as any;
const ArrowLeft = ArrowLeftIcon as any;

import { verifyEmail, resendVerification, signOut, useAuth } from "../../lib/auth";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function VerifyPage() {
  const router = useRouter();
  const { email: paramEmail } = useLocalSearchParams();
  const { user, ready } = useAuth();
  
  const email = (paramEmail as string) || user?.email || "";
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (user && user.verified) {
      router.replace("/(tabs)");
    }
  }, [user]);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f9fafb" }}>
        <ActivityIndicator size="large" color="#0f4a3f" />
      </View>
    );
  }

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const setDigit = (i: number, val: string) => {
    const cleanVal = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = cleanVal;
    setDigits(next);

    if (cleanVal && i < 5) {
      refs.current[i + 1]?.focus();
    }
  };

  const handleKeyPress = (i: number, key: string) => {
    if (key === "Backspace" && !digits[i] && i > 0) {
      const next = [...digits];
      next[i - 1] = "";
      setDigits(next);
      refs.current[i - 1]?.focus();
    }
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSubmit = async () => {
    const code = digits.join("");
    if (code.length !== 6) {
      showAlert("Input Error", "Please enter the complete 6-digit verification code.");
      return;
    }
    setBusy(true);
    try {
      const u = await verifyEmail(email, code);
      showAlert("Verified", `Email verified successfully. Welcome, ${u.name.split(" ")[0]}! 🎉`);
      router.replace("/(tabs)");
    } catch (err: any) {
      showAlert("Verification Failed", err.message || "Invalid OTP code");
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      await resendVerification(email);
      setCooldown(30);
      showAlert("Code Resent", "A new 6-digit OTP code has been sent to your email.");
    } catch (err: any) {
      showAlert("Resend Failed", err.message || "Failed to resend code");
    }
  };

  const handleUseDifferent = async () => {
    await signOut();
    router.replace("/(auth)/auth");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-[#f9fafb]"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        className="px-6 py-12"
      >
        <View className="items-center mb-8">
          <View className="w-16 h-16 rounded-[20px] bg-[#0f4a3f] justify-center items-center shadow-lg">
            <MailCheck className="w-9 h-9 text-white" />
          </View>
          <Text className="text-2xl font-extrabold text-[#0f3a31] mt-4 tracking-tight">Verify your email</Text>
          <Text className="text-xs text-[#7c8a87] mt-1 text-center font-medium px-4">
            We sent a 6-digit code to{"\n"}
            <Text className="font-bold text-[#0f3a31]">{email}</Text>
          </Text>
        </View>

        <View className="bg-white border border-[#e5e7eb] rounded-3xl p-6 shadow-sm">
          <View className="flex-row justify-between mb-6">
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                value={d}
                onChangeText={(val: string) => setDigit(i, val)}
                onKeyPress={({ nativeEvent }: any) => handleKeyPress(i, nativeEvent.key)}
                keyboardType="numeric"
                maxLength={1}
                className="w-11 h-14 text-center text-xl font-bold rounded-xl border border-[#e5e7eb] bg-[#f9fafb] text-[#0f3a31]"
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={busy}
            className="w-full bg-[#0f4a3f] rounded-2xl py-3.5 items-center shadow-glow"
          >
            <Text className="text-white text-sm font-bold">
              {busy ? "Verifying…" : "Verify email"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-between items-center mt-6">
            <TouchableOpacity
              onPress={handleResend}
              disabled={cooldown > 0}
              className={`p-1 ${cooldown > 0 ? "opacity-40" : ""}`}
            >
              <Text className="text-xs font-bold text-[#10b981]">
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleUseDifferent}
              className="flex-row items-center p-1"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#7c8a87] mr-1" />
              <Text className="text-xs font-bold text-[#7c8a87]">Use a different email</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
