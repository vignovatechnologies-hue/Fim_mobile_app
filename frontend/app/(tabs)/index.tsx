import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated
} from "react-native";
import { useRouter } from "expo-router";
import {
  Bell as BellIcon,
  ArrowUpRight as ArrowUpRightIcon,
  ArrowDownRight as ArrowDownRightIcon,
  Zap as ZapIcon,
  Plus as PlusIcon,
  Calendar as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Shield as ShieldIcon,
  ChevronRight as ChevronRightIcon,
  Sparkles as SparklesIcon,
  Bot as BotIcon,
  Send as SendIcon,
  X as XIcon
} from "lucide-react-native";

const Bell = BellIcon as any;
const ArrowUpRight = ArrowUpRightIcon as any;
const ArrowDownRight = ArrowDownRightIcon as any;
const Zap = ZapIcon as any;
const Plus = PlusIcon as any;
const Calendar = CalendarIcon as any;
const TrendingUp = TrendingUpIcon as any;
const Shield = ShieldIcon as any;
const ChevronRight = ChevronRightIcon as any;
const Sparkles = SparklesIcon as any;
const Bot = BotIcon as any;
const Send = SendIcon as any;
const XClose = XIcon as any;
const AnimatedView = Animated.View as any;

import { apiFetch } from "../../lib/api";
import { useAuth } from "../../lib/auth";

type Summary = {
  net_balance: number;
  income: number;
  spent: number;
  active_loans_count: number;
  outstanding_loans_amount: number;
  health_score: number;
  savings_goal_percent: number;
  savings_goal_text: string;
  next_emi_days: string;
  next_emi_name: string;
};

type Emi = {
  id: number;
  name: string;
  type: string;
  emi: number;
  left: number;
  tenure: string;
  rate: number;
  due: number;
  logo: string;
  paid: boolean;
};

type ChatMsg = { from: "you" | "fim"; text: string };

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [upcoming, setUpcoming] = useState<Emi[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Good morning");
  const [confirmModal, setConfirmModal] = useState(false);

  // FIM Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for bot icon
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const fetchData = async () => {
    try {
      const summaryData = await apiFetch<Summary>("/api/dashboard/summary");
      setSummary(summaryData);

      const loansData = await apiFetch<Emi[]>("/api/loans");
      const unpaid = loansData.filter((l) => !l.paid).slice(0, 3);
      setUpcoming(unpaid);
    } catch (err: any) {
      console.log("Error loading dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set greeting
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Good morning");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  const handleSendChat = async () => {
    const q = chatInput.trim();
    if (!q || chatLoading) return;
    setChatMsgs(m => [...m, { from: "you", text: q }]);
    setChatInput("");
    setChatLoading(true);
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      const res = await apiFetch<{ text: string }>("/api/insights/ask", {
        method: "POST",
        body: JSON.stringify({ text: q }),
      });
      setChatMsgs(m => [...m, { from: "fim", text: res.text }]);
    } catch {
      setChatMsgs(m => [...m, { from: "fim", text: "Sorry, I'm having trouble right now. Please try again!" }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handlePayAll = async () => {
    setConfirmModal(false);
    const totalAmount = upcoming.reduce((sum, l) => sum + l.emi, 0);
    const unpaidLoanIds = upcoming.map((l) => l.id);

    setLoading(true);
    try {
      // Simulate payment flow directly
      const result = await apiFetch("/api/payments/verify-signature", {
        method: "POST",
        body: JSON.stringify({
          razorpay_order_id: `order_mock_${Date.now()}`,
          razorpay_payment_id: `mock_pay_${Date.now()}`,
          razorpay_signature: "mock_signature",
          loan_ids: unpaidLoanIds,
          amount: totalAmount,
          is_mock: true,
        }),
      });
      Alert.alert(
        "Payment Successful",
        `Payment of ₹${totalAmount.toLocaleString("en-IN")} processed! ${result.loans_paid?.length ?? unpaidLoanIds.length} EMI(s) marked paid.`
      );
      fetchData();
    } catch (err: any) {
      Alert.alert("Payment Failed", err.message || "Failed to make simulated payment");
      setLoading(false);
    }
  };

  if (loading || !summary) {
    return (
      <View className="flex-grow justify-center items-center bg-[#f9fafb]">
        <ActivityIndicator size="large" color="#0f4a3f" />
      </View>
    );
  }

  const totalUnpaidEmi = upcoming.reduce((sum, l) => sum + l.emi, 0);

  const statCards = [
    {
      label: "Active Loans",
      value: summary.active_loans_count.toString(),
      sub: `₹ ${(summary.outstanding_loans_amount / 100000).toFixed(1)}L outstanding`,
      icon: TrendingUp,
      color: "bg-[#0f4a3f]/10 text-[#0f4a3f]",
      action: () => router.push("/(tabs)/emis")
    },
    {
      label: "Health Score",
      value: summary.health_score.toString(),
      sub: "Good · improving",
      icon: Shield,
      color: "bg-emerald-500/10 text-emerald-600",
      action: () => router.push("/(tabs)/insights")
    },
    {
      label: "Savings Goal",
      value: `${summary.savings_goal_percent}%`,
      sub: summary.savings_goal_text,
      icon: TrendingUp,
      color: "bg-amber-500/10 text-amber-600",
      action: () => router.push("/savings")
    },
    {
      label: "Next EMI",
      value: summary.next_emi_days,
      sub: summary.next_emi_name,
      icon: Calendar,
      color: "bg-orange-500/10 text-orange-600",
      action: () => router.push("/(tabs)/emis")
    }
  ];

  return (
    <ScrollView className="flex-grow bg-[#f9fafb]">
        {/* Header */}
      <View className="px-5 pt-6 pb-3 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/profile")}
          className="flex-row items-center"
        >
          <View className="w-11 h-11 rounded-full bg-[#0f4a3f] justify-center items-center">
            <Text className="text-white font-extrabold text-sm">{user?.initials || "FI"}</Text>
          </View>
          <View className="ml-3">
            <Text className="text-xs text-[#7c8a87] font-semibold">{greeting}</Text>
            <Text className="text-sm font-bold text-[#0f3a31]">{user?.name || "Guest"}</Text>
          </View>
        </TouchableOpacity>

        {/* Right header icons: Bot + Bell */}
        <View className="flex-row items-center gap-2">
          {/* FIM Chatbot Icon */}
          <AnimatedView style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              onPress={() => setChatOpen(true)}
              className="relative p-2.5 rounded-full bg-[#0f3a31] border border-[#0f4a3f]"
              style={{ shadowColor: "#10b981", shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }}
            >
              <Bot size={18} color="#10b981" />
              <View className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />
            </TouchableOpacity>
          </AnimatedView>

          {/* Bell Icon */}
          <TouchableOpacity
            onPress={() => Alert.alert("Alerts", `${upcoming.length} EMIs due soon.`)}
            className="relative p-2.5 rounded-full bg-white border border-[#e5e7eb]"
          >
            <Bell size={18} color="#0f3a31" />
            {upcoming.length > 0 && (
              <View className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Balance Card */}
      <View className="px-5 mt-3">
        <View className="bg-[#0f4a3f] rounded-3xl p-6 relative overflow-hidden shadow-lg">
          <Text className="text-xs uppercase tracking-wider text-white/70 font-bold">Net Balance this month</Text>
          <Text className="text-3xl font-extrabold text-white mt-1">₹ {summary.net_balance.toLocaleString("en-IN")}</Text>
          <View className="mt-5 flex-row space-x-3">
            <TouchableOpacity
              onPress={() => router.push("/income")}
              className="flex-grow flex-1 bg-white/10 rounded-2xl p-3"
            >
              <View className="flex-row items-center text-white/80">
                <ArrowDownRight className="w-3.5 h-3.5 text-white/80 mr-1" />
                <Text className="text-xs text-white/80 font-bold">Income</Text>
              </View>
              <Text className="font-bold text-white mt-1 text-sm">₹ {summary.income.toLocaleString("en-IN")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/expenses")}
              className="flex-grow flex-1 bg-white/10 rounded-2xl p-3"
            >
              <View className="flex-row items-center text-white/80">
                <ArrowUpRight className="w-3.5 h-3.5 text-white/80 mr-1" />
                <Text className="text-xs text-white/80 font-bold">Spent</Text>
              </View>
              <Text className="font-bold text-white mt-1 text-sm">₹ {summary.spent.toLocaleString("en-IN")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Smart Pay Action */}
      <View className="px-5 mt-4">
        <TouchableOpacity
          onPress={() => {
            if (upcoming.length === 0) {
              Alert.alert("On Track", "All EMIs paid for this cycle ✓");
            } else {
              setConfirmModal(true);
            }
          }}
          className="bg-white border border-[#e5e7eb] rounded-3xl p-4 flex-row items-center shadow-sm"
        >
          <View className="w-12 h-12 rounded-2xl bg-amber-100 justify-center items-center mr-4">
            <Zap className="w-6 h-6 text-amber-600" />
          </View>
          <View className="flex-grow">
            <Text className="text-sm font-bold text-[#0f3a31]">
              {upcoming.length === 0 ? "All EMIs paid this month" : `Smart Pay ${upcoming.length} EMIs`}
            </Text>
            <Text className="text-xs text-[#7c8a87] mt-0.5">
              {upcoming.length === 0
                ? "Next due in 30 days"
                : `One tap. ₹ ${totalUnpaidEmi.toLocaleString("en-IN")} due soon`}
            </Text>
          </View>
          <ChevronRight className="w-5 h-5 text-[#7c8a87]" />
        </TouchableOpacity>
      </View>

      {/* Statistics Cards */}
      <View className="px-5 mt-5 flex-row flex-wrap justify-between">
        {statCards.map((card, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={card.action}
            className="w-[48%] bg-white border border-[#e5e7eb] rounded-2xl p-4 mb-3 shadow-sm"
          >
            <View className={`w-9 h-9 rounded-xl justify-center items-center ${card.color}`}>
              <card.icon size={18} color="currentColor" />
            </View>
            <Text className="text-xl font-extrabold text-[#0f3a31] mt-3">{card.value}</Text>
            <Text className="text-[10px] text-[#7c8a87] font-bold mt-0.5">{card.label}</Text>
            <Text className="text-[9px] text-[#9ca3af] mt-0.5" numberOfLines={1}>{card.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Upcoming EMIs */}
      <View className="px-5 mt-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-bold text-sm text-[#0f3a31]">Upcoming EMIs</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/emis")}>
            <Text className="text-xs font-semibold text-[#10b981]">See all</Text>
          </TouchableOpacity>
        </View>

        <View className="space-y-2.5">
          {upcoming.length === 0 ? (
            <View className="items-center justify-center bg-white border border-[#e5e7eb] rounded-3xl p-6">
              <Text className="text-2xl">🎉</Text>
              <Text className="text-xs text-[#7c8a87] mt-1 font-bold">All EMIs paid for this month!</Text>
            </View>
          ) : (
            upcoming.map((e) => (
              <TouchableOpacity
                key={e.id}
                onPress={() => router.push("/(tabs)/emis")}
                className="flex-row items-center bg-white border border-[#e5e7eb] rounded-2xl p-3.5 mb-2"
              >
                <View className="w-11 h-11 rounded-xl bg-gray-100 justify-center items-center">
                  <Text className="text-lg">{e.logo}</Text>
                </View>
                <View className="ml-3 flex-grow">
                  <Text className="font-bold text-sm text-[#0f3a31]">{e.name}</Text>
                  <Text className="text-xs text-[#7c8a87] mt-0.5">Due {e.due} of this month</Text>
                </View>
                <View className="items-end">
                  <Text className="font-bold text-sm text-[#0f3a31]">₹{e.emi.toLocaleString("en-IN")}</Text>
                  <Text className="text-[10px] text-emerald-500 font-bold mt-0.5">On track</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>

      {/* AI Insight Teaser */}
      <View className="px-5 mt-4">
        <View className="bg-[#0f3a31] rounded-3xl p-5 relative overflow-hidden">
          <View className="flex-row items-center bg-white/10 self-start px-2.5 py-1 rounded-full">
            <Sparkles size={10} color="#10b981" className="mr-1" />
            <Text className="text-[9px] font-bold text-white uppercase tracking-wider">AI Insight</Text>
          </View>
          <Text className="text-white text-base font-bold mt-3 leading-snug">
            You can save ₹14,200/yr by refinancing your personal loan.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/insights")}
            className="mt-4 bg-white rounded-full py-2 px-4 self-start"
          >
            <Text className="text-[#0f3a31] text-xs font-bold">Show me how →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View className="px-5 mt-6 mb-8">
        <Text className="font-bold text-sm text-[#0f3a31] mb-3">Quick actions</Text>
        <View className="flex-row justify-between">
          {[
            { label: "Add Loan", icon: Plus, action: () => router.push("/(tabs)/emis") },
            { label: "Log Spent", icon: ArrowUpRight, action: () => router.push("/expenses") },
            { label: "Add Income", icon: ArrowDownRight, action: () => router.push("/income") },
            { label: "Set Goal", icon: TrendingUp, action: () => router.push("/savings") }
          ].map((action, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={action.action}
              className="items-center"
            >
              <View className="w-12 h-12 rounded-2xl bg-white border border-[#e5e7eb] justify-center items-center mb-1">
                <action.icon size={20} color="#0f4a3f" />
              </View>
              <Text className="text-[10px] font-semibold text-[#7c8a87] text-center">{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ═══════ FIM Chat Modal ═══════ */}
      <Modal
        visible={chatOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setChatOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1 }} className="justify-end">
            {/* Backdrop */}
            <TouchableOpacity
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)" }}
              onPress={() => setChatOpen(false)}
              activeOpacity={1}
            />

            {/* Chat Sheet */}
            <View className="bg-[#0b2d25] rounded-t-3xl" style={{ maxHeight: "80%", minHeight: 420 }}>
              {/* Handle bar */}
              <View className="items-center pt-3 pb-1">
                <View className="w-10 h-1 rounded-full bg-white/20" />
              </View>

              {/* Header */}
              <View className="flex-row items-center px-5 py-3 border-b border-white/10">
                <View className="w-10 h-10 rounded-full bg-emerald-900 justify-center items-center mr-3"
                  style={{ shadowColor: "#10b981", shadowOpacity: 0.6, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }}
                >
                  <Bot size={20} color="#10b981" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-sm">Ask FIM</Text>
                  <Text className="text-emerald-400 text-[10px] font-semibold">● Gemini 2.5 Flash · Online</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setChatOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 justify-center items-center"
                >
                  <XClose size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {/* Messages */}
              <ScrollView
                ref={chatScrollRef}
                className="flex-1 px-4 pt-4"
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
                keyboardShouldPersistTaps="handled"
              >
                {chatMsgs.length === 0 && (
                  <View className="items-center mt-6">
                    <View className="w-16 h-16 rounded-full bg-emerald-900/60 justify-center items-center mb-3"
                      style={{ shadowColor: "#10b981", shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } }}
                    >
                      <Bot size={32} color="#10b981" />
                    </View>
                    <Text className="text-white font-bold text-base">Hi, I'm FIM! 👋</Text>
                    <Text className="text-white/60 text-xs mt-1 text-center px-8">
                      Your personal AI financial advisor. Ask me anything about your money.
                    </Text>
                    <View className="mt-5 w-full gap-2">
                      {["Can I afford a car loan?", "How much am I saving?", "Which loan to prepay first?"].map((s, i) => (
                        <TouchableOpacity
                          key={i}
                          onPress={() => { setChatInput(s); }}
                          className="bg-white/10 rounded-2xl px-4 py-2.5"
                        >
                          <Text className="text-white/80 text-xs font-semibold">{s}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                {chatMsgs.map((m, i) => (
                  <View
                    key={i}
                    className={`rounded-2xl px-3.5 py-2.5 mb-2 max-w-[85%] ${
                      m.from === "you"
                        ? "bg-emerald-700 self-end"
                        : "bg-white/10 self-start"
                    }`}
                  >
                    <Text className="text-white text-xs leading-relaxed font-semibold">{m.text}</Text>
                  </View>
                ))}
                {chatLoading && (
                  <View className="bg-white/10 self-start rounded-2xl px-4 py-3 mb-2">
                    <View className="flex-row gap-1.5">
                      <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ opacity: 0.6 }} />
                      <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ opacity: 0.8 }} />
                      <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Input */}
              <View className="flex-row items-center px-4 pb-6 pt-3 border-t border-white/10">
                <TextInput
                  value={chatInput}
                  onChangeText={setChatInput}
                  editable={!chatLoading}
                  placeholder="Ask anything about your money…"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  className="flex-1 bg-white/10 rounded-2xl px-4 py-3 text-white text-xs mr-2"
                  onSubmitEditing={handleSendChat}
                  returnKeyType="send"
                />
                <TouchableOpacity
                  onPress={handleSendChat}
                  disabled={chatLoading || !chatInput.trim()}
                  className="w-11 h-11 rounded-2xl bg-emerald-500 justify-center items-center"
                  style={{ opacity: chatLoading || !chatInput.trim() ? 0.5 : 1 }}
                >
                  <Send size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Confirm Payment Modal */}
      <Modal
        visible={confirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <Text className="text-lg font-bold text-[#0f3a31] mb-2">Smart Pay {upcoming.length} EMIs?</Text>
            <Text className="text-sm text-[#7c8a87] mb-6">
              ₹ {totalUnpaidEmi.toLocaleString("en-IN")} will be debited from your primary bank account.
            </Text>
            <View className="flex-row space-x-3 justify-end">
              <TouchableOpacity
                onPress={() => setConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl bg-gray-100"
              >
                <Text className="text-xs font-bold text-[#7c8a87]">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePayAll}
                className="px-4 py-2.5 rounded-xl bg-[#0f4a3f]"
              >
                <Text className="text-xs font-bold text-white">Pay ₹ {totalUnpaidEmi.toLocaleString("en-IN")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
