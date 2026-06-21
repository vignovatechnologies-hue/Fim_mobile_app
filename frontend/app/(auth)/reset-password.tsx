import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform
} from "react-native";
import { KeyRound as KeyRoundIcon, Mail as MailIcon, ArrowLeft as ArrowLeftIcon } from "lucide-react-native";

const KeyRound = KeyRoundIcon as any;
const Mail = MailIcon as any;
const ArrowLeft = ArrowLeftIcon as any;

import { requestPasswordReset, resetPassword } from "../../lib/auth";
import { useRouter } from "expo-router";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSendInstructions = async () => {
    if (!email) {
      Alert.alert("Input Error", "Please enter your email address.");
      return;
    }
    setBusy(true);
    try {
      await requestPasswordReset(email);
      Alert.alert("Sent", "Reset instructions and verification code sent to your email 📬");
      setStep("reset");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to request password reset");
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    try {
      await requestPasswordReset(email);
      Alert.alert("Resent", "A new reset code has been sent to your email.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to resend code");
    }
  };

  const handleSubmitReset = async () => {
    if (!code || !password || !confirm) {
      Alert.alert("Input Error", "Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Input Error", "Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await resetPassword(email, code, password);
      Alert.alert("Success", "Password updated successfully. Please sign in with your new password.");
      router.replace("/(auth)/auth");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update password");
    } finally {
      setBusy(false);
    }
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
            <KeyRound className="w-8 h-8 text-white" />
          </View>
          <Text className="text-2xl font-extrabold text-[#0f3a31] mt-4 tracking-tight">
            {step === "request" ? "Forgot password?" : "Set new password"}
          </Text>
          <Text className="text-xs text-[#7c8a87] mt-1 text-center font-medium px-4">
            {step === "request"
              ? "Enter your email and we'll send reset instructions."
              : `Enter the 6-digit code sent to ${email}`}
          </Text>
        </View>

        <View className="bg-white border border-[#e5e7eb] rounded-3xl p-6 shadow-sm">
          {step === "request" ? (
            <View className="space-y-4">
              <View>
                <Text className="text-xs font-bold text-[#7c8a87] mb-1">Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="you@email.com"
                  placeholderTextColor="#9ca3af"
                  className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#0f3a31]"
                />
              </View>
              <TouchableOpacity
                onPress={handleSendInstructions}
                disabled={busy || !email}
                className="w-full bg-[#0f4a3f] rounded-2xl py-3.5 flex-row justify-center items-center mt-4 shadow-glow"
              >
                <Mail className="w-4 h-4 text-white mr-2" />
                <Text className="text-white text-sm font-bold">
                  {busy ? "Sending…" : "Send reset instructions"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="space-y-4">
              <View>
                <Text className="text-xs font-bold text-[#7c8a87] mb-1">6-digit code</Text>
                <TextInput
                  value={code}
                  onChangeText={(val: string) => setCode(val.replace(/\D/g, ""))}
                  keyboardType="numeric"
                  maxLength={6}
                  placeholder="••••••"
                  placeholderTextColor="#9ca3af"
                  className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl px-4 py-3 text-center text-sm font-bold tracking-[0.5em] text-[#0f3a31]"
                />
              </View>
              <View className="mt-3">
                <Text className="text-xs font-bold text-[#7c8a87] mb-1">New password</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#0f3a31]"
                />
              </View>
              <View className="mt-3">
                <Text className="text-xs font-bold text-[#7c8a87] mb-1">Confirm password</Text>
                <TextInput
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry
                  autoCapitalize="none"
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#0f3a31]"
                />
              </View>
              <TouchableOpacity
                onPress={handleSubmitReset}
                disabled={busy}
                className="w-full bg-[#0f4a3f] rounded-2xl py-3.5 items-center mt-4 shadow-glow"
              >
                <Text className="text-white text-sm font-bold">
                  {busy ? "Updating…" : "Update password"}
                </Text>
              </TouchableOpacity>
              <View className="flex-row justify-between items-center mt-4 px-1">
                <TouchableOpacity onPress={handleResend}>
                  <Text className="text-xs font-bold text-[#10b981]">Resend code</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep("request")}>
                  <Text className="text-xs font-bold text-[#7c8a87]">Use different email</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() => router.replace("/(auth)/auth")}
          className="flex-row justify-center items-center mt-8 p-2"
        >
          <ArrowLeft className="w-4 h-4 text-[#7c8a87] mr-1.5" />
          <Text className="text-xs font-bold text-[#7c8a87]">Back to sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
