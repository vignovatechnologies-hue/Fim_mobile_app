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
  Animated,
  StyleSheet,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
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
  X as XIcon,
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

// ── Colour tokens ──────────────────────────────────────────────
const C = {
  bg: "#f4f6f5",          // page background (light sage-grey)
  surface: "#ffffff",
  border: "#e4e9e7",
  primary: "#0f4a3f",     // deep forest green
  primaryMid: "#0f3a31",
  accent: "#10b981",      // emerald green
  muted: "#6b7a76",
  mutedLighter: "#9eaaa6",
  warning: "#d97706",
  warningBg: "#fef3c7",
  successBg: "#d1fae5",
  success: "#059669",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  if (h >= 17 && h < 21) return "Good evening";
  return "Good night";
}

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [upcoming, setUpcoming] = useState<Emi[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState(false);

  // FIM Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);

  // Pulse anim for bot button
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 950, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 950, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const fetchData = async () => {
    try {
      const summaryData = await apiFetch<Summary>("/api/dashboard/summary");
      setSummary(summaryData);
      const loansData = await apiFetch<Emi[]>("/api/loans");
      setUpcoming(loansData.filter((l) => !l.paid).slice(0, 3));
    } catch (err: any) {
      console.log("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  const handleSendChat = async () => {
    const q = chatInput.trim();
    if (!q || chatLoading) return;
    setChatMsgs((m) => [...m, { from: "you", text: q }]);
    setChatInput("");
    setChatLoading(true);
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      const res = await apiFetch<{ text: string }>("/api/insights/ask", {
        method: "POST",
        body: JSON.stringify({ text: q }),
      });
      setChatMsgs((m) => [...m, { from: "fim", text: res.text }]);
    } catch {
      setChatMsgs((m) => [...m, { from: "fim", text: "Sorry, I'm having trouble right now. Try again!" }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handlePayAll = async () => {
    setConfirmModal(false);
    const totalAmount = upcoming.reduce((sum, l) => sum + l.emi, 0);
    const unpaidIds = upcoming.map((l) => l.id);
    setLoading(true);
    try {
      const result = await apiFetch("/api/payments/verify-signature", {
        method: "POST",
        body: JSON.stringify({
          razorpay_order_id: `order_mock_${Date.now()}`,
          razorpay_payment_id: `mock_pay_${Date.now()}`,
          razorpay_signature: "mock_signature",
          loan_ids: unpaidIds,
          amount: totalAmount,
          is_mock: true,
        }),
      });
      Alert.alert(
        "Payment Recorded",
        `₹${totalAmount.toLocaleString("en-IN")} logged! ${result.loans_paid?.length ?? unpaidIds.length} EMI(s) marked paid.`
      );
      fetchData();
    } catch (err: any) {
      Alert.alert("Operation Failed", err.message || "Failed to record payment");
      setLoading(false);
    }
  };

  if (loading || !summary) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  const totalUnpaidEmi = upcoming.reduce((sum, l) => sum + l.emi, 0);

  const statCards = [
    {
      label: "Active Loans",
      value: summary.active_loans_count.toString(),
      sub: `₹${(summary.outstanding_loans_amount / 100000).toFixed(1)}L outstanding`,
      icon: TrendingUp,
      iconBg: "#dbeafe", iconColor: "#1d4ed8",
      action: () => router.push("/(tabs)/emis"),
    },
    {
      label: "Health Score",
      value: summary.health_score.toString(),
      sub: "Good · improving",
      icon: Shield,
      iconBg: C.successBg, iconColor: C.success,
      action: () => router.push("/(tabs)/insights"),
    },
    {
      label: "Savings Goal",
      value: `${summary.savings_goal_percent}%`,
      sub: summary.savings_goal_text,
      icon: TrendingUp,
      iconBg: "#fef3c7", iconColor: C.warning,
      action: () => router.push("/(tabs)/savings"),
    },
    {
      label: "Next EMI",
      value: summary.next_emi_days,
      sub: summary.next_emi_name,
      icon: Calendar,
      iconBg: "#fee2e2", iconColor: "#dc2626",
      action: () => router.push("/(tabs)/emis"),
    },
  ];

  const quickActions = [
    { label: "Add Loan", icon: Plus, action: () => router.push("/(tabs)/emis") },
    { label: "Log Expense", icon: ArrowUpRight, action: () => router.push("/(tabs)/expenses") },
    { label: "Add Income", icon: ArrowDownRight, action: () => router.push("/(tabs)/income") },
    { label: "Set Goal", icon: TrendingUp, action: () => router.push("/(tabs)/savings") },
  ];

  return (
    <ScrollView style={s.page} showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/profile")} style={s.headerLeft}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{user?.initials || "FI"}</Text>
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={s.greetText}>{getGreeting()}</Text>
            <Text style={s.nameText}>{user?.name || "Guest"}</Text>
          </View>
        </TouchableOpacity>

        <View style={s.headerRight}>
          {/* FIM Bot */}
          <AnimatedView style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity onPress={() => setChatOpen(true)} style={s.botBtn}>
              <Bot size={18} color={C.accent} />
              <View style={s.botDot} />
            </TouchableOpacity>
          </AnimatedView>

          {/* Bell */}
          <TouchableOpacity
            onPress={() => Alert.alert("Alerts", `${upcoming.length} EMIs due soon.`)}
            style={s.bellBtn}
          >
            <Bell size={18} color={C.primary} />
            {upcoming.length > 0 && <View style={s.bellDot} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Balance Card ── */}
      <View style={s.px}>
        <View style={s.balanceCard}>
          {/* decorative circles */}
          <View style={s.deco1} />
          <View style={s.deco2} />

          <Text style={s.balanceLabel}>Net Balance</Text>
          <Text style={s.balanceAmount}>₹ {summary.net_balance.toLocaleString("en-IN")}</Text>

          <View style={s.balanceRow}>
            <TouchableOpacity onPress={() => router.push("/(tabs)/income")} style={s.balanceChip}>
              <View style={s.balanceChipLabel}>
                <ArrowDownRight size={13} color="rgba(255,255,255,0.8)" />
                <Text style={s.balanceChipLabelTxt}>Income</Text>
              </View>
              <Text style={s.balanceChipAmt}>₹ {summary.income.toLocaleString("en-IN")}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/(tabs)/expenses")} style={s.balanceChip}>
              <View style={s.balanceChipLabel}>
                <ArrowUpRight size={13} color="rgba(255,255,255,0.8)" />
                <Text style={s.balanceChipLabelTxt}>Spent</Text>
              </View>
              <Text style={s.balanceChipAmt}>₹ {summary.spent.toLocaleString("en-IN")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Record Payment CTA ── */}
      <View style={[s.px, { marginTop: 14 }]}>
        <TouchableOpacity
          onPress={() => upcoming.length === 0
            ? Alert.alert("On Track", "All EMIs paid for this cycle ✓")
            : setConfirmModal(true)
          }
          style={s.smartPayBtn}
          activeOpacity={0.82}
        >
          <View style={s.smartPayIcon}>
            <Zap size={22} color={C.warning} fill={C.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.smartPayTitle}>
              {upcoming.length === 0 ? "All EMIs marked paid" : `Record ${upcoming.length} Payments`}
            </Text>
            <Text style={s.smartPaySub}>
              {upcoming.length === 0
                ? "No upcoming EMIs"
                : "Mark upcoming EMIs as paid"}
            </Text>
          </View>
          <ChevronRight size={18} color={C.mutedLighter} />
        </TouchableOpacity>
      </View>

      {/* ── Stat Cards ── */}
      <View style={[s.px, s.statsGrid]}>
        {statCards.map((card, i) => (
          <TouchableOpacity key={i} onPress={card.action} style={s.statCard} activeOpacity={0.82}>
            <View style={s.statHeaderRow}>
              <View style={[s.statIconWrap, { backgroundColor: card.iconBg }]}>
                <card.icon size={16} color={card.iconColor} />
              </View>
              <Text style={s.statValue}>{card.value}</Text>
            </View>
            <Text style={s.statLabel}>{card.label}</Text>
            <Text style={s.statSub} numberOfLines={1}>{card.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Quick Actions ── */}
      <View style={[s.px, { marginTop: 20 }]}>
        <Text style={s.sectionTitle}>Quick actions</Text>
        <View style={s.quickRow}>
          {quickActions.map((a, i) => (
            <TouchableOpacity key={i} onPress={a.action} style={s.quickAction} activeOpacity={0.8}>
              <View style={s.quickIconWrap}>
                <a.icon size={20} color={C.primary} />
              </View>
              <Text style={s.quickLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Upcoming EMIs ── */}
      <View style={[s.px, { marginTop: 22 }]}>
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Upcoming EMIs</Text>
          <TouchableOpacity onPress={() => router.push("/(tabs)/emis")}>
            <Text style={s.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {upcoming.length === 0 ? (
          <View style={s.emptyEmi}>
            <Text style={{ fontSize: 26 }}>🎉</Text>
            <Text style={s.emptyEmiText}>All EMIs paid for this month!</Text>
          </View>
        ) : (
          upcoming.map((e) => (
            <TouchableOpacity
              key={e.id}
              onPress={() => router.push("/(tabs)/emis")}
              style={s.emiRow}
              activeOpacity={0.82}
            >
              <View style={s.emiLogo}>
                <Text style={{ fontSize: 20 }}>{e.logo}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.emiName}>{e.name}</Text>
                <Text style={s.emiDue}>Due {e.due} of this month</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={s.emiAmt}>₹{e.emi.toLocaleString("en-IN")}</Text>
                <Text style={s.emiStatus}>On track</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* ── AI Insight Teaser ── */}
      <View style={[s.px, { marginTop: 22 }]}>
        <View style={s.insightCard}>
          <View style={s.insightBadge}>
            <Sparkles size={10} color={C.accent} />
            <Text style={s.insightBadgeTxt}>AI INSIGHT</Text>
          </View>
          <Text style={s.insightBody}>
            You can save ₹14,200/yr by refinancing your personal loan.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/insights")}
            style={s.insightBtn}
            activeOpacity={0.85}
          >
            <Text style={s.insightBtnTxt}>Show me how →</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 36 }} />

      {/* ════════ FIM Chat Modal ════════ */}
      <Modal visible={chatOpen} transparent animationType="slide" onRequestClose={() => setChatOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <View style={{ flex: 1, justifyContent: "flex-end" }}>
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              onPress={() => setChatOpen(false)}
              activeOpacity={1}
            >
              <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} />
            </TouchableOpacity>

            <View style={s.chatSheet}>
              <View style={s.chatHandle} />

              {/* Chat header */}
              <View style={s.chatHeader}>
                <View style={s.chatAvatarWrap}>
                  <Bot size={20} color={C.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.chatTitle}>Ask FIM</Text>
                  <Text style={s.chatOnline}>● Gemini 2.5 Flash · Online</Text>
                </View>
                <TouchableOpacity onPress={() => setChatOpen(false)} style={s.chatClose}>
                  <XClose size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {/* Messages */}
              <ScrollView
                ref={chatScrollRef}
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}
                keyboardShouldPersistTaps="handled"
              >
                {chatMsgs.length === 0 && (
                  <View style={{ alignItems: "center", marginTop: 24 }}>
                    <View style={s.chatEmptyIcon}>
                      <Bot size={32} color={C.accent} />
                    </View>
                    <Text style={s.chatEmptyTitle}>Hi, I'm FIM! 👋</Text>
                    <Text style={s.chatEmptyBody}>Your personal AI financial advisor. Ask me anything about your money.</Text>
                    <View style={{ marginTop: 20, width: "100%", gap: 8 }}>
                      {["Can I afford a car loan?", "How much am I saving?", "Which loan to prepay first?"].map((s_, i) => (
                        <TouchableOpacity key={i} onPress={() => setChatInput(s_)} style={s.chatSuggestion}>
                          <Text style={s.chatSuggestionTxt}>{s_}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {chatMsgs.map((m, i) => (
                  <View
                    key={i}
                    style={[
                      s.bubble,
                      m.from === "you" ? s.bubbleYou : s.bubbleFim,
                    ]}
                  >
                    <Text style={s.bubbleTxt}>{m.text}</Text>
                  </View>
                ))}

                {chatLoading && (
                  <View style={[s.bubble, s.bubbleFim]}>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {[0, 1, 2].map((i) => (
                        <View key={i} style={s.typingDot} />
                      ))}
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Input */}
              <View style={s.chatInputRow}>
                <TextInput
                  value={chatInput}
                  onChangeText={setChatInput}
                  editable={!chatLoading}
                  placeholder="Ask anything about your money…"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  style={s.chatInput}
                  onSubmitEditing={handleSendChat}
                  returnKeyType="send"
                />
                <TouchableOpacity
                  onPress={handleSendChat}
                  disabled={chatLoading || !chatInput.trim()}
                  style={[s.chatSendBtn, { opacity: chatLoading || !chatInput.trim() ? 0.45 : 1 }]}
                >
                  <Send size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ════════ Confirm Payment Modal ════════ */}
      <Modal visible={confirmModal} transparent animationType="fade" onRequestClose={() => setConfirmModal(false)}>
        <View style={s.confirmOverlay}>
          <View style={s.confirmCard}>
            <Text style={s.confirmTitle}>Record {upcoming.length} Payments?</Text>
            <Text style={s.confirmBody}>
              ₹{totalUnpaidEmi.toLocaleString("en-IN")} across {upcoming.length} lenders will be marked as paid in your tracker.
            </Text>
            <View style={s.confirmBtns}>
              <TouchableOpacity onPress={() => setConfirmModal(false)} style={s.confirmCancel}>
                <Text style={s.confirmCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePayAll} style={s.confirmPay}>
                <Text style={s.confirmPayTxt}>Mark ₹{totalUnpaidEmi.toLocaleString("en-IN")} Paid</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  px: { paddingHorizontal: 20 },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.primary, justifyContent: "center", alignItems: "center",
  },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  greetText: { fontSize: 11, color: C.muted, fontWeight: "600" },
  nameText: { fontSize: 15, fontWeight: "800", color: C.primaryMid },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  botBtn: {
    padding: 10, borderRadius: 22,
    backgroundColor: C.primaryMid, borderWidth: 1, borderColor: C.primary,
  },
  botDot: {
    position: "absolute", top: -2, right: -2,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: C.accent, borderWidth: 2, borderColor: C.bg,
  },
  bellBtn: {
    padding: 10, borderRadius: 22,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
  },
  bellDot: {
    position: "absolute", top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444",
  },

  // Balance card
  balanceCard: {
    backgroundColor: C.primary, borderRadius: 24, padding: 18,
    overflow: "hidden", position: "relative",
    ...Platform.select({
      web: { boxShadow: `0px 8px 20px 0px ${C.primary}59` },
      default: { shadowColor: C.primary, shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
    }),
  },
  deco1: {
    position: "absolute", top: -50, right: -50,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: "rgba(16,185,129,0.15)",
  },
  deco2: {
    position: "absolute", bottom: -60, left: -30,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  balanceLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  balanceAmount: { fontSize: 28, fontWeight: "800", color: "#ffffff", marginTop: 3 },
  balanceRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  balanceChip: { flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 14, padding: 10 },
  balanceChipLabel: { flexDirection: "row", alignItems: "center", gap: 4 },
  balanceChipLabelTxt: { fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: "700" },
  balanceChipAmt: { fontSize: 13, fontWeight: "700", color: "#ffffff", marginTop: 5 },

  // Smart Pay
  smartPayBtn: {
    backgroundColor: C.surface, borderRadius: 24, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 14,
    borderWidth: 1, borderColor: C.border,
    ...Platform.select({
      web: { boxShadow: "0px 3px 10px 0px rgba(0,0,0,0.06)" },
      default: { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
    }),
  },
  smartPayIcon: {
    width: 50, height: 50, borderRadius: 16,
    backgroundColor: C.warningBg, justifyContent: "center", alignItems: "center",
  },
  smartPayTitle: { fontSize: 14, fontWeight: "800", color: C.primaryMid },
  smartPaySub: { fontSize: 12, color: C.muted, marginTop: 2 },

  // Stat cards
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 14, gap: 10 },
  statCard: {
    width: "47.8%", backgroundColor: C.surface, borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: C.border,
    ...Platform.select({
      web: { boxShadow: "0px 2px 6px 0px rgba(0,0,0,0.04)" },
      default: { shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    }),
  },
  statHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  statIconWrap: { width: 30, height: 30, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800", color: C.primaryMid },
  statLabel: { fontSize: 10, color: C.muted, fontWeight: "700", marginTop: 2 },
  statSub: { fontSize: 9, color: C.mutedLighter, marginTop: 2 },

  // Quick actions
  sectionTitle: { fontSize: 14, fontWeight: "800", color: C.primaryMid, marginBottom: 14 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  seeAll: { fontSize: 12, fontWeight: "700", color: C.accent },
  quickRow: { flexDirection: "row", justifyContent: "space-between" },
  quickAction: { alignItems: "center" },
  quickIconWrap: {
    width: 52, height: 52, borderRadius: 18,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    justifyContent: "center", alignItems: "center", marginBottom: 6,
    ...Platform.select({
      web: { boxShadow: "0px 2px 6px 0px rgba(0,0,0,0.05)" },
      default: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    }),
  },
  quickLabel: { fontSize: 10, fontWeight: "600", color: C.muted, textAlign: "center" },

  // EMI rows
  emptyEmi: {
    alignItems: "center", justifyContent: "center",
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 24, paddingVertical: 24,
  },
  emptyEmiText: { fontSize: 12, color: C.muted, fontWeight: "700", marginTop: 6 },
  emiRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 20, padding: 14, marginBottom: 10,
    ...Platform.select({
      web: { boxShadow: "0px 2px 6px 0px rgba(0,0,0,0.04)" },
      default: { shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
    }),
  },
  emiLogo: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" },
  emiName: { fontSize: 14, fontWeight: "700", color: C.primaryMid },
  emiDue: { fontSize: 11, color: C.muted, marginTop: 2 },
  emiAmt: { fontSize: 14, fontWeight: "800", color: C.primaryMid },
  emiStatus: { fontSize: 10, fontWeight: "700", color: C.success, marginTop: 2 },

  // Insight card
  insightCard: {
    backgroundColor: C.primaryMid, borderRadius: 24, padding: 22, overflow: "hidden",
  },
  insightBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(255,255,255,0.12)", alignSelf: "flex-start",
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, marginBottom: 14,
  },
  insightBadgeTxt: { fontSize: 9, fontWeight: "800", color: "#ffffff", letterSpacing: 1.2 },
  insightBody: { fontSize: 16, fontWeight: "700", color: "#ffffff", lineHeight: 24 },
  insightBtn: {
    marginTop: 16, backgroundColor: "#ffffff", alignSelf: "flex-start",
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 50,
  },
  insightBtnTxt: { fontSize: 12, fontWeight: "800", color: C.primaryMid },

  // Chat modal
  chatSheet: {
    backgroundColor: "#0b2d25", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: "82%", minHeight: 420,
  },
  chatHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "center", marginTop: 12, marginBottom: 4,
  },
  chatHeader: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)",
  },
  chatAvatarWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#134d3a", justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  chatTitle: { fontSize: 14, fontWeight: "700", color: "#ffffff" },
  chatOnline: { fontSize: 10, color: C.accent, fontWeight: "600", marginTop: 1 },
  chatClose: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", alignItems: "center",
  },
  chatEmptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "rgba(16,185,129,0.15)", justifyContent: "center", alignItems: "center", marginBottom: 12,
  },
  chatEmptyTitle: { fontSize: 16, fontWeight: "700", color: "#ffffff" },
  chatEmptyBody: { fontSize: 12, color: "rgba(255,255,255,0.6)", textAlign: "center", marginTop: 6, paddingHorizontal: 24 },
  chatSuggestion: {
    backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  chatSuggestionTxt: { fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: "600" },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8, maxWidth: "85%" },
  bubbleYou: { backgroundColor: "#0d5c3e", alignSelf: "flex-end" },
  bubbleFim: { backgroundColor: "rgba(255,255,255,0.1)", alignSelf: "flex-start" },
  bubbleTxt: { fontSize: 13, color: "#ffffff", lineHeight: 20, fontWeight: "500" },
  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent, opacity: 0.8 },
  chatInputRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: Platform.OS === "ios" ? 32 : 20, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)", gap: 10,
  },
  chatInput: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12,
    color: "#ffffff", fontSize: 13,
  },
  chatSendBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: C.accent, justifyContent: "center", alignItems: "center",
  },

  // Confirm modal
  confirmOverlay: {
    flex: 1, justifyContent: "center", alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 24,
  },
  confirmCard: { backgroundColor: "#ffffff", borderRadius: 28, padding: 24, width: "100%" },
  confirmTitle: { fontSize: 18, fontWeight: "800", color: C.primaryMid, marginBottom: 8 },
  confirmBody: { fontSize: 14, color: C.muted, lineHeight: 20, marginBottom: 24 },
  confirmBtns: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  confirmCancel: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, backgroundColor: "#f3f4f6" },
  confirmCancelTxt: { fontSize: 13, fontWeight: "700", color: C.muted },
  confirmPay: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, backgroundColor: C.primary },
  confirmPayTxt: { fontSize: 13, fontWeight: "700", color: "#ffffff" },
});