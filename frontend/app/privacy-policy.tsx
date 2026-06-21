import React from "react";
import {
  View as ViewComponent,
  Text as TextComponent,
  ScrollView as ScrollViewComponent,
  TouchableOpacity as TouchableOpacityComponent,
  SafeAreaView as SafeAreaViewComponent,
  Platform,
  StatusBar
} from "react-native";
// @ts-ignore
import { useRouter } from "expo-router";
import { ArrowLeft as ArrowLeftIcon, Shield as ShieldIcon, Lock as LockIcon, Bot as BotIcon } from "lucide-react-native";

const View = ViewComponent as any;
const Text = TextComponent as any;
const ScrollView = ScrollViewComponent as any;
const TouchableOpacity = TouchableOpacityComponent as any;
const SafeAreaView = SafeAreaViewComponent as any;

const ArrowLeft = ArrowLeftIcon as any;
const Shield = ShieldIcon as any;
const Lock = LockIcon as any;
const Bot = BotIcon as any;

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-grow bg-[#f9fafb]">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      {/* Header */}
      <View className="flex-row items-center px-5 py-4 border-b border-gray-100 bg-white">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-50 justify-center items-center mr-4 border border-gray-100"
        >
          <ArrowLeft size={20} color="#0f3a31" />
        </TouchableOpacity>
        <View>
          <Text className="text-xl font-extrabold text-[#0f3a31]">Privacy Policy</Text>
          <Text className="text-[10px] font-bold text-[#7c8a87] uppercase tracking-wider">FIM App · Vignova</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} className="flex-1">
        <View className="mb-6">
          <Text className="text-xs text-[#7c8a87] font-semibold leading-relaxed">
            Effective Date: June 20, 2026 {"\n"}
            Last Updated: June 20, 2026
          </Text>
          <Text className="text-sm text-[#0f3a31] mt-3 font-semibold leading-relaxed">
            At FIM (Financial Intelligence Manager), developed by Vignova Technologies ("we", "us", or "our"), we respect your privacy and are committed to protecting your personal financial data. This Privacy Policy describes how we handle, process, and protect your information.
          </Text>
        </View>

        {/* Highlight Banner */}
        <View className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6 flex-row items-start">
          <Shield size={20} color="#059669" className="mr-3 mt-0.5" />
          <View className="flex-1">
            <Text className="font-bold text-emerald-800 text-sm">Strict Security Guardrails</Text>
            <Text className="text-xs text-emerald-700 mt-1 font-semibold leading-relaxed">
              We do NOT scrape or automatically access your real-time bank accounts or fetch credentials. All entries are manually tracked by you.
            </Text>
          </View>
        </View>

        {/* 1. Information We Collect */}
        <View className="mb-6">
          <Text className="text-base font-extrabold text-[#0f3a31] mb-2">1. Information We Collect</Text>
          <Text className="text-xs text-[#52605d] font-semibold leading-relaxed mb-2">
            FIM collects and stores data to provide financial projections, amortization schedules, and reminders:
          </Text>
          <View className="space-y-2 pl-2">
            <Text className="text-xs text-[#52605d] leading-relaxed font-semibold">
              • <Text className="font-bold text-[#0f3a31]">Personal Info:</Text> Name, email, and phone number provided by you during registration.
            </Text>
            <Text className="text-xs text-[#52605d] leading-relaxed font-semibold">
              • <Text className="font-bold text-[#0f3a31]">Financial Profiles:</Text> EMI dates, loan amounts, interest rates, tenures, income, expenses, and savings goals manually entered.
            </Text>
            <Text className="text-xs text-[#52605d] leading-relaxed font-semibold">
              • <Text className="font-bold text-[#0f3a31]">Linked Banks (Display Only):</Text> Bank name, IFSC code, and masked account number to help you group EMIs. We do NOT connect to core banking APIs or view real balances.
            </Text>
          </View>
        </View>

        {/* 2. AI Security & Google Gemini API */}
        <View className="bg-white border border-[#e5e7eb] rounded-3xl p-5 mb-6 shadow-sm">
          <View className="flex-row items-center mb-3">
            <Bot size={22} color="#0f4a3f" className="mr-2" />
            <Text className="text-sm font-extrabold text-[#0f3a31]">Ask FIM AI Assistant Security</Text>
          </View>
          <Text className="text-xs text-[#52605d] font-semibold leading-relaxed mb-2">
            Our interactive chatbot utility is powered by the Google Gemini 2.5 Flash API. To safeguard your financial privacy:
          </Text>
          <View className="space-y-2 pl-2">
            <Text className="text-xs text-[#52605d] leading-relaxed font-semibold">
              • We <Text className="font-bold text-[#0f3a31]">never</Text> transmit bank account numbers, passwords, netbanking PINs, or governmental IDs (such as PAN or Aadhaar) to the AI model.
            </Text>
            <Text className="text-xs text-[#52605d] leading-relaxed font-semibold">
              • The AI is only provided aggregated loan summaries (e.g. loan tenure, rates, balance) to give you contextual payoff advice.
            </Text>
            <Text className="text-xs text-[#52605d] leading-relaxed font-semibold">
              • Google's API service terms state that API inputs are not used to train public foundational AI models.
            </Text>
          </View>
        </View>

        {/* 3. How We Use Information */}
        <View className="mb-6">
          <Text className="text-base font-extrabold text-[#0f3a31] mb-2">3. How We Use Information</Text>
          <Text className="text-xs text-[#52605d] font-semibold leading-relaxed mb-2">
            We use your data solely to run the app's internal functions:
          </Text>
          <View className="space-y-2 pl-2">
            <Text className="text-xs text-[#52605d] leading-relaxed font-semibold">
              • Running calculations, amortization timelines, and payoff simulators.
            </Text>
            <Text className="text-xs text-[#52605d] leading-relaxed font-semibold">
              • Dispatching email alerts for upcoming EMI payments from <Text className="font-bold text-[#0f3a31]">vignova.official@gmail.com</Text>.
            </Text>
            <Text className="text-xs text-[#52605d] leading-relaxed font-semibold">
              • Triggering push notification tokens on your mobile device for local reminders.
            </Text>
          </View>
        </View>

        {/* 4. Third-Party Integrations */}
        <View className="mb-6">
          <Text className="text-base font-extrabold text-[#0f3a31] mb-2">4. Third-Party Partners</Text>
          <Text className="text-xs text-[#52605d] font-semibold leading-relaxed">
            • <Text className="font-bold text-[#0f3a31]">Razorpay:</Text> Used in demo mode to mock premium trial setups. We do not process or store credit/debit card numbers directly.
            {"\n\n"}
            • <Text className="font-bold text-[#0f3a31]">Google Gemini API:</Text> Processing of natural language questions in insights.
          </Text>
        </View>

        {/* 5. Data Security & Encryption */}
        <View className="bg-white border border-[#e5e7eb] rounded-3xl p-5 mb-6 shadow-sm">
          <View className="flex-row items-center mb-3">
            <Lock size={20} color="#0f4a3f" className="mr-2" />
            <Text className="text-sm font-extrabold text-[#0f3a31]">Data Protection</Text>
          </View>
          <Text className="text-xs text-[#52605d] font-semibold leading-relaxed">
            We store data using industry-standard 256-bit encryption. Databases are secured behind access control firewalls. You may request account closure and total deletion of your tracking records at any time.
          </Text>
        </View>

        {/* 6. Contact and Jurisdiction */}
        <View className="mb-12 border-t border-gray-200 pt-6">
          <Text className="text-base font-extrabold text-[#0f3a31] mb-2">6. Contact Us</Text>
          <Text className="text-xs text-[#52605d] font-semibold leading-relaxed">
            If you have questions regarding this privacy policy or wish to request data removal, please reach out to us at:
            {"\n\n"}
            <Text className="font-extrabold text-[#0f3a31]">Vignova Technologies</Text>
            {"\n"}
            Email: <Text className="text-emerald-600 font-bold">vignova.official@gmail.com</Text>
            {"\n"}
            Jurisdiction: India (Indian RBI guidelines are referenced for verification processes).
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
