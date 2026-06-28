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
import { ArrowLeft as ArrowLeftIcon, Shield as ShieldIcon, Lock as LockIcon, Bot as BotIcon, Key as KeyIcon, Eye as EyeIcon } from "lucide-react-native";

const View = ViewComponent as any;
const Text = TextComponent as any;
const ScrollView = ScrollViewComponent as any;
const TouchableOpacity = TouchableOpacityComponent as any;
const SafeAreaView = SafeAreaViewComponent as any;

const ArrowLeft = ArrowLeftIcon as any;
const Shield = ShieldIcon as any;
const Lock = LockIcon as any;
const Bot = BotIcon as any;
const Key = KeyIcon as any;
const Eye = EyeIcon as any;

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
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

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} style={{ flex: 1 }}>
        <View className="mb-6">
          <Text className="text-xs text-[#7c8a87] font-semibold leading-relaxed">
            Effective Date: June 20, 2026 {"\n"}
            Last Updated: June 28, 2026
          </Text>
          <Text className="text-sm text-[#0f3a31] mt-3 font-semibold leading-relaxed">
            At FIM (Financial Intelligence Manager), developed by Vignova Technologies ("we", "us", or "our"), we respect your privacy and are committed to protecting your personal financial data. This Privacy Policy describes how we collect, use, store, process, and protect your information when you use our mobile application and services.
          </Text>
        </View>

        {/* Highlight Banner */}
        <View className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6 flex-row items-start">
          <Shield size={20} color="#059669" className="mr-3 mt-0.5" />
          <View className="flex-1">
            <Text className="font-bold text-emerald-800 text-sm">Strict Security & Manual Control</Text>
            <Text className="text-xs text-emerald-700 mt-1 font-semibold leading-relaxed">
              FIM is a manual personal finance tracker. We do NOT scrape, monitor, or automatically link to your real-time bank accounts, nor do we collect or store your net banking credentials, PINs, or security questions. All tracking data is entered manually by you.
            </Text>
          </View>
        </View>

        {/* 1. Information We Collect */}
        <View className="mb-6">
          <Text className="text-base font-extrabold text-[#0f3a31] mb-2">1. Information We Collect</Text>
          <Text className="text-xs text-[#52605d] font-semibold leading-relaxed mb-3">
            FIM collects and stores data that you voluntarily provide to us to enable the application's calculations, tracking features, and reminders:
          </Text>
          <View className="space-y-3 pl-2">
            <View>
              <Text className="text-xs text-[#0f3a31] font-bold">• Account Registration Information:</Text>
              <Text className="text-xs text-[#52605d] leading-relaxed font-semibold pl-3 mt-0.5">
                When you create an account, we collect your name, email address, password, and optional phone number. This is used to authenticate your identity, secure your profile, and deliver OTPs for account verification or password resets.
              </Text>
            </View>
            <View>
              <Text className="text-xs text-[#0f3a31] font-bold">• Manually Logged Financial Profiles:</Text>
              <Text className="text-xs text-[#52605d] leading-relaxed font-semibold pl-3 mt-0.5">
                To generate amortization schedules, savings progress, and budget summaries, we store the financial data you enter, including:
                {"\n"}• Loan details (lender name, principal amount, annual interest rate, tenure, start date, and due day).
                {"\n"}• Daily expenses (description, category, amount, and timestamp).
                {"\n"}• Income sources (source description, amount, and category).
                {"\n"}• Savings goals (goal name, target amount, and contributions).
              </Text>
            </View>
            <View>
              <Text className="text-xs text-[#0f3a31] font-bold">• Mock Bank Account Display (Optional):</Text>
              <Text className="text-xs text-[#52605d] leading-relaxed font-semibold pl-3 mt-0.5">
                You may enter a bank name, IFSC code, and masked account number. This is used solely as a visual label to help you organize which real-world bank account you use to pay specific EMIs. We do NOT connect to core banking APIs (such as UPI or Open Banking) and cannot view your actual bank balances.
              </Text>
            </View>
            <View>
              <Text className="text-xs text-[#0f3a31] font-bold">• Device and Push Notification Tokens:</Text>
              <Text className="text-xs text-[#52605d] leading-relaxed font-semibold pl-3 mt-0.5">
                We collect your device’s operating system (Android/iOS) and Firebase Cloud Messaging (FCM) token. This is used exclusively to dispatch push notifications to remind you of upcoming EMI due dates.
              </Text>
            </View>
          </View>
        </View>

        {/* 2. AI Security & Google Gemini API */}
        <View className="bg-white border border-[#e5e7eb] rounded-3xl p-5 mb-6 shadow-sm">
          <View className="flex-row items-center mb-3">
            <Bot size={22} color="#0f4a3f" className="mr-2" />
            <Text className="text-sm font-extrabold text-[#0f3a31]">Ask FIM AI Assistant Security</Text>
          </View>
          <Text className="text-xs text-[#52605d] font-semibold leading-relaxed mb-3">
            Our interactive financial advisor chatbot is powered by the Google Gemini 2.5 Flash API. To safeguard your financial privacy, we enforce the following security guardrails:
          </Text>
          <View className="space-y-2 pl-2">
            <Text className="text-xs text-[#52605d] leading-relaxed font-semibold">
              • We <Text className="font-bold text-[#0f3a31]">never</Text> transmit sensitive details such as bank account numbers, passwords, PINs, or government-issued IDs (like PAN or Aadhaar) to the AI model.
            </Text>
            <Text className="text-xs text-[#52605d] leading-relaxed font-semibold">
              • The AI assistant is only sent aggregated, anonymized loan summaries (e.g. loan tenure, interest rate, and outstanding balance) to provide contextually relevant payoff advice or refinancing suggestions.
            </Text>
            <Text className="text-xs text-[#52605d] leading-relaxed font-semibold">
              • According to Google's API Terms of Service, data sent via the Gemini API is kept private and is not used to train public foundational AI models.
            </Text>
          </View>
        </View>

        {/* 3. How We Use Your Information */}
        <View className="mb-6">
          <Text className="text-base font-extrabold text-[#0f3a31] mb-2">3. How We Use Information</Text>
          <Text className="text-xs text-[#52605d] font-semibold leading-relaxed mb-2">
            We use the collected data strictly to operate, maintain, and improve the features of the FIM application:
          </Text>
          <View className="space-y-2 pl-2">
            <Text className="text-xs text-[#52605d] leading-relaxed font-semibold">
              • To calculate interest savings, generate amortization schedules, and run prepayment simulators.
            </Text>
            <Text className="text-xs text-[#52605d] leading-relaxed font-semibold">
              • To send email alerts and reminders about upcoming EMI due dates from our official system address (<Text className="font-bold text-[#0f3a31]">vignova.official@gmail.com</Text>).
            </Text>
            <Text className="text-xs text-[#52605d] leading-relaxed font-semibold">
              • To trigger push notifications on your mobile device to ensure you never miss an EMI deadline.
            </Text>
            <Text className="text-xs text-[#52605d] leading-relaxed font-semibold">
              • To diagnose bugs, monitor application performance, and improve user interface layouts.
            </Text>
          </View>
        </View>

        {/* 4. Data Sharing & Third-Party Partners */}
        <View className="mb-6">
          <Text className="text-base font-extrabold text-[#0f3a31] mb-2">4. Third-Party Partners & Data Sharing</Text>
          <Text className="text-xs text-[#52605d] font-semibold leading-relaxed mb-2">
            We do **NOT** sell, rent, trade, or share your personal financial data with third-party advertisers or lenders. We only share information with trusted service providers necessary to run the app:
          </Text>
          <View className="space-y-3 pl-2">
            <View>
              <Text className="text-xs text-[#0f3a31] font-bold">• Google Gemini API:</Text>
              <Text className="text-xs text-[#52605d] leading-relaxed font-semibold pl-3">
                Used to process your natural language questions in the AI Insights tab.
              </Text>
            </View>
            <View>
              <Text className="text-xs text-[#0f3a31] font-bold">• Razorpay:</Text>
              <Text className="text-xs text-[#52605d] leading-relaxed font-semibold pl-3">
                Used in sandbox/test mode to simulate premium subscription upgrades. If live billing is enabled, Razorpay processes payments securely under PCI-DSS compliance. FIM never sees or stores your raw credit card numbers or net banking passwords.
              </Text>
            </View>
            <View>
              <Text className="text-xs text-[#0f3a31] font-bold">• Firebase (Google Cloud):</Text>
              <Text className="text-xs text-[#52605d] leading-relaxed font-semibold pl-3">
                Used to manage push notification tokens and dispatch alerts to your mobile device.
              </Text>
            </View>
          </View>
        </View>

        {/* 5. Data Security & Retention */}
        <View className="bg-white border border-[#e5e7eb] rounded-3xl p-5 mb-6 shadow-sm">
          <View className="flex-row items-center mb-3">
            <Lock size={20} color="#0f4a3f" className="mr-2" />
            <Text className="text-sm font-extrabold text-[#0f3a31]">Data Protection & Rights</Text>
          </View>
          <Text className="text-xs text-[#52605d] font-semibold leading-relaxed mb-3">
            All communications between the FIM mobile app and our servers are encrypted in transit using industry-standard HTTPS (SSL/TLS). Your data is stored in secure databases protected by firewalls and access controls.
          </Text>
          <Text className="text-xs text-[#0f3a31] font-bold">Your Rights:</Text>
          <Text className="text-xs text-[#52605d] leading-relaxed font-semibold pl-2 mt-1">
            • You have the right to access, edit, or update your financial logs at any time.
            {"\n"}• You have the right to **completely delete** your account. Requesting account deletion will permanently erase all your personal details, loan records, income logs, and expense trackers from our active databases.
          </Text>
        </View>

        {/* 6. Contact and Jurisdiction */}
        <View className="mb-12 border-t border-gray-200 pt-6">
          <Text className="text-base font-extrabold text-[#0f3a31] mb-2">6. Contact Us</Text>
          <Text className="text-xs text-[#52605d] font-semibold leading-relaxed">
            If you have questions regarding this Privacy Policy, wish to exercise your data rights, or want to request the permanent deletion of your account and data, please contact us:
            {"\n\n"}
            <Text className="font-extrabold text-[#0f3a31]">Vignova Technologies</Text>
            {"\n"}
            Email: <Text className="text-emerald-600 font-bold">vignova.official@gmail.com</Text>
            {"\n\n"}
            <Text className="font-bold text-[#0f3a31]">Jurisdiction:</Text> This policy is governed by the laws of India. Any data processing complies with applicable local guidelines, including RBI standards for manual financial calculators where referenced.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
