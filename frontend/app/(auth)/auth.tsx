import React, { useEffect, useState } from "react";
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
import {
  Wallet as WalletIcon,
  ShieldCheck as ShieldCheckIcon,
  Sparkles as SparklesIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon
} from "lucide-react-native";

const Wallet = WalletIcon as any;
const ShieldCheck = ShieldCheckIcon as any;
const Sparkles = SparklesIcon as any;
const Eye = EyeIcon as any;
const EyeOff = EyeOffIcon as any;

import { signIn, signUp, useAuth } from "../../lib/auth";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AuthPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [customServerUrl, setCustomServerUrl] = useState("");

  useEffect(() => {
    AsyncStorage.getItem("fim.api.url").then((url) => {
      if (url) setCustomServerUrl(url);
    });
  }, []);

  const handleSaveServerUrl = async () => {
    if (customServerUrl.trim()) {
      await AsyncStorage.setItem("fim.api.url", customServerUrl.trim());
      Alert.alert("Server Configured", "API Server URL updated successfully!");
    } else {
      await AsyncStorage.removeItem("fim.api.url");
      Alert.alert("Server Reset", "Reset to default auto-detected server URL.");
    }
    setShowServerSettings(false);
  };

  useEffect(() => {
    if (user) {
      if (user.verified) {
        router.replace("/(tabs)");
      } else {
        router.replace({
          pathname: "/(auth)/verify",
          params: { email: user.email }
        });
      }
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!email || !password || (mode === "signup" && !name)) {
      Alert.alert("Input Error", "Please fill in all required fields.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const u = await signIn(email, password);
        if (!u.verified) {
          Alert.alert("Verify Email", "Please verify your email address to continue.");
          router.push({
            pathname: "/(auth)/verify",
            params: { email: u.email }
          });
          return;
        }
        Alert.alert("Welcome!", `Welcome back, ${u.name.split(" ")[0]} 👋`);
        router.replace("/(tabs)");
      } else {
        const u = await signUp(name, email, password);
        Alert.alert("Success", "Account created ✨ Please enter the 6-digit OTP sent to your email.");
        router.push({
          pathname: "/(auth)/verify",
          params: { email: u.email }
        });
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleDemo = async () => {
    setEmail("demo@fim.in");
    setPassword("demo1234");
    setBusy(true);
    try {
      const u = await signIn("demo@fim.in", "demo1234");
      Alert.alert("Welcome!", `Demo mode active. Welcome, ${u.name.split(" ")[0]} 👋`);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Demo Error", err.message || "Failed to log in with demo account");
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
            <Wallet className="w-9 h-9 text-white" />
          </View>
          <Text className="text-3xl font-extrabold text-[#0f3a31] mt-4 tracking-tight">FIM</Text>
          <Text className="text-xs text-[#7c8a87] mt-1 font-medium">Financial Intelligence Manager</Text>
        </View>

        <View className="bg-white border border-[#e5e7eb] rounded-3xl p-6 shadow-sm">
          {/* Sign in / Sign up Mode Toggle */}
          <View className="flex-row bg-[#f3f4f6] rounded-2xl p-1 mb-6">
            <TouchableOpacity
              onPress={() => setMode("signin")}
              className={`flex-1 py-2.5 items-center rounded-xl ${
                mode === "signin" ? "bg-white shadow-sm" : ""
              }`}
            >
              <Text className={`text-xs font-bold ${mode === "signin" ? "text-[#0f3a31]" : "text-[#7c8a87]"}`}>
                Sign in
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode("signup")}
              className={`flex-1 py-2.5 items-center rounded-xl ${
                mode === "signup" ? "bg-white shadow-sm" : ""
              }`}
            >
              <Text className={`text-xs font-bold ${mode === "signup" ? "text-[#0f3a31]" : "text-[#7c8a87]"}`}>
                Sign up
              </Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-4">
            {mode === "signup" && (
              <View>
                <Text className="text-xs font-bold text-[#7c8a87] mb-1">Full name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Arjun Reddy"
                  placeholderTextColor="#9ca3af"
                  className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#0f3a31]"
                />
              </View>
            )}

            <View className="mt-3">
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

            <View className="mt-3">
              <Text className="text-xs font-bold text-[#7c8a87] mb-1">Password</Text>
              <View className="relative justify-center">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl pl-4 pr-12 py-3 text-sm text-[#0f3a31]"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-4 p-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-[#7c8a87]" />
                  ) : (
                    <Eye className="w-5 h-5 text-[#7c8a87]" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {mode === "signin" && (
              <TouchableOpacity
                onPress={() => router.push("/(auth)/reset-password")}
                className="align-self-end items-end mt-2"
              >
                <Text className="text-xs font-semibold text-[#10b981]">Forgot password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={busy}
              className="w-full bg-[#0f4a3f] rounded-2xl py-3.5 items-center mt-6 shadow-glow"
            >
              <Text className="text-white text-sm font-bold">
                {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleDemo}
            className="w-full mt-4 flex-row justify-center items-center"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#10b981] mr-1.5" />
            <Text className="text-xs font-bold text-[#10b981]">Continue with demo account</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center justify-center mt-8 opacity-70">
          <ShieldCheck className="w-3.5 h-3.5 text-[#7c8a87] mr-1.5" />
          <Text className="text-[10px] text-[#7c8a87] font-semibold">
            Secured with 256-bit encryption · Made in India 🇮🇳
          </Text>
        </View>

        <View className="items-center mt-6">
          <TouchableOpacity
            onPress={() => setShowServerSettings(!showServerSettings)}
            className="flex-row items-center opacity-60 py-1.5 px-3 bg-[#e5e7eb] rounded-full"
          >
            <Text className="text-[9px] font-bold text-[#0f3a31]">
              {showServerSettings ? "Hide Connection Settings" : "Configure Server Connection"}
            </Text>
          </TouchableOpacity>
          
          {showServerSettings && (
            <View className="w-full bg-white border border-[#e5e7eb] rounded-2xl p-4 mt-3 shadow-sm">
              <Text className="text-[11px] font-bold text-[#7c8a87] mb-1.5">
                Backend Server URL
              </Text>
              <TextInput
                value={customServerUrl}
                onChangeText={setCustomServerUrl}
                placeholder="e.g. https://bumpy-bobcats-admire.loca.lt"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoCorrect={false}
                className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3 py-2 text-xs text-[#0f3a31] mb-3"
              />
              <View className="flex-row space-x-2">
                <TouchableOpacity
                  onPress={handleSaveServerUrl}
                  className="flex-1 bg-[#0f4a3f] rounded-xl py-2 items-center"
                >
                  <Text className="text-white text-[11px] font-bold">Save & Apply</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    setCustomServerUrl("");
                    await AsyncStorage.removeItem("fim.api.url");
                    Alert.alert("Server Reset", "Reset to auto-detect server URL.");
                    setShowServerSettings(false);
                  }}
                  className="flex-1 bg-[#f3f4f6] border border-[#e5e7eb] rounded-xl py-2 items-center"
                >
                  <Text className="text-[#0f3a31] text-[11px] font-bold">Reset</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        <View className="flex-row items-center justify-center mt-6 space-x-2">
          <TouchableOpacity onPress={() => router.push("/privacy-policy")}>
            <Text className="text-[10px] text-[#10b981] font-bold underline">Privacy Policy</Text>
          </TouchableOpacity>
          <Text className="text-[10px] text-[#7c8a87]">•</Text>
          <TouchableOpacity onPress={() => router.push("/terms-of-use")}>
            <Text className="text-[10px] text-[#10b981] font-bold underline">Terms of Use</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
