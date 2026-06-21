import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import {
  Sparkles as SparklesIcon,
  TrendingDown as TrendingDownIcon,
  AlertTriangle as AlertTriangleIcon,
  Lightbulb as LightbulbIcon,
  Send as SendIcon
} from "lucide-react-native";

const Sparkles = SparklesIcon as any;
const TrendingDown = TrendingDownIcon as any;
const AlertTriangle = AlertTriangleIcon as any;
const Lightbulb = LightbulbIcon as any;
const Send = SendIcon as any;

import { apiFetch } from "../../lib/api";

type Msg = { from: "you" | "fim"; text: string };

type InsightItem = {
  tone: "primary" | "warning" | "success";
  title: string;
  body: string;
  cta: string;
  type: string;
  icon?: any;
};

const toneIcons: Record<string, any> = {
  primary: Lightbulb,
  warning: AlertTriangle,
  success: TrendingDown,
};

export default function InsightsPage() {
  const [score, setScore] = useState(78);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [submittingChat, setSubmittingChat] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const chatScrollViewRef = useRef<ScrollView>(null);

  const fetchInsightsData = async () => {
    try {
      const summary = await apiFetch("/api/dashboard/summary");
      setScore(summary.health_score);

      const items = await apiFetch<InsightItem[]>("/api/insights");
      const mapped = items.map((it) => ({
        ...it,
        icon: toneIcons[it.tone] || Lightbulb,
      }));
      setInsights(mapped);
    } catch (err) {
      console.log("Error loading insights:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsightsData();
  }, []);

  const handleAsk = async () => {
    const q = input.trim();
    if (!q || submittingChat) return;

    setMsgs((m) => [...m, { from: "you", text: q }]);
    setInput("");
    setSubmittingChat(true);

    // Auto-scroll to bottom of chat
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
      chatScrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const res = await apiFetch<{ text: string }>("/api/insights/ask", {
        method: "POST",
        body: JSON.stringify({ text: q }),
      });
      setMsgs((m) => [...m, { from: "fim", text: res.text }]);
    } catch (err) {
      setMsgs((m) => [...m, { from: "fim", text: "Sorry, I am having trouble connecting right now." }]);
    } finally {
      setSubmittingChat(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
        chatScrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleInsightClick = (type: string, cta: string) => {
    if (type === "shopping_warning") {
      Alert.alert("Recent Transactions", "You have spent over budget on shopping this month.");
    } else if (type === "refinance") {
      Alert.alert("Pre-qualified!", "Refinancing pre-qualification rate is 11.2% APR.");
    } else if (type === "savings_boost") {
      Alert.alert("Auto-save updated", "Auto-save budget increased by ₹ 2,000");
    } else {
      Alert.alert("Insight", cta);
    }
  };

  if (loading && insights.length === 0) {
    return (
      <View className="flex-grow justify-center items-center bg-[#f9fafb]">
        <ActivityIndicator size="large" color="#0f4a3f" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
      style={{ flex: 1 }}
      className="bg-[#f9fafb]"
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        className="flex-grow px-5 pt-4 pb-6"
        style={{ flex: 1 }}
      >
        {/* Page Subtitle Header */}
        <View className="mb-4">
          <Text className="text-2xl font-extrabold text-[#0f3a31]">Insights</Text>
          <Text className="text-xs text-[#7c8a87] font-semibold">AI-powered for you</Text>
        </View>

        {/* Circular Health Score Ring Card */}
        <View className="bg-white border border-[#e5e7eb] rounded-3xl p-6 items-center shadow-sm">
          <View className="w-40 h-40 rounded-full border-[10px] border-[#f3f4f6] justify-center items-center relative">
            {/* Outline indicator ring */}
            <View className="absolute w-40 h-40 rounded-full border-[10px] border-[#10b981] opacity-80" />
            <Text className="text-[10px] uppercase tracking-wider text-[#7c8a87] font-bold">Health Score</Text>
            <Text className="text-4xl font-extrabold text-[#0f3a31] mt-0.5">{score}</Text>
            <Text className="text-[10px] text-emerald-500 font-bold mt-1">
              {score >= 80 ? "Excellent" : score >= 70 ? "Good" : "Fair"} · on track
            </Text>
          </View>

          {/* Core breakdown pills */}
          <View className="flex-row justify-between w-full mt-6">
            {[
              { label: "Debt", value: "Good", desc: "Your debt-to-income ratio is under control." },
              { label: "Savings", value: "On Track", desc: "You are consistent with emergency savings." },
              { label: "Spending", value: "Stable", desc: "Most category spends are within monthly limits." }
            ].map((pill, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => Alert.alert(`${pill.label} Status`, pill.desc)}
                className="w-[30%] bg-emerald-50 rounded-2xl py-2.5 items-center"
              >
                <Text className="text-sm font-extrabold text-emerald-600">{pill.value}</Text>
                <Text className="text-[9px] uppercase tracking-wide text-emerald-600/70 font-bold mt-0.5">
                  {pill.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Personalized insights list */}
        <View className="mt-5 space-y-3">
          {insights.map((insight, idx) => {
            const Icon = insight.icon || Lightbulb;

            // Map styles
            let colors = "bg-indigo-50";
            let iconColor = "#6366f1";
            if (insight.tone === "warning") {
              colors = "bg-amber-50";
              iconColor = "#d97706";
            } else if (insight.tone === "success") {
              colors = "bg-emerald-50";
              iconColor = "#10b981";
            }

            return (
              <View
                key={idx}
                className="bg-white border border-[#e5e7eb] rounded-3xl p-4 mb-3 flex-row shadow-sm"
              >
                <View className={`w-10 h-10 rounded-xl justify-center items-center shrink-0 ${colors}`}>
                  <Icon size={18} color={iconColor} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="font-bold text-sm text-[#0f3a31]">{insight.title}</Text>
                  <Text className="text-xs text-[#7c8a87] mt-1 leading-relaxed font-semibold">
                    {insight.body}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleInsightClick(insight.type, insight.cta)}
                    className="mt-3.5"
                  >
                    <Text className="text-xs font-bold text-[#0f4a3f]">{insight.cta} →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Chat assistant container */}
        <View className="bg-[#0f3a31] rounded-3xl p-5 mt-6 mb-8 relative overflow-hidden">
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-amber-100 justify-center items-center mr-2">
              <Sparkles size={14} color="#f59e0b" fill="#f59e0b" />
            </View>
            <Text className="font-bold text-white text-sm">Ask FIM</Text>
          </View>

          {msgs.length === 0 ? (
            <Text className="text-xs text-white/80 mt-3 font-semibold">
              Try: "Can I afford a ₹8L car loan?" or "Should I refinance my loans?"
            </Text>
          ) : (
            <ScrollView
              ref={chatScrollViewRef}
              style={{ maxHeight: 200, flexGrow: 0 }}
              contentContainerStyle={{ flexGrow: 1 }}
              nestedScrollEnabled={true}
              className="mt-4"
            >
              {msgs.map((m, i) => (
                <View
                  key={i}
                  className={`rounded-2xl px-3.5 py-2.5 max-w-[85%] mb-2 ${m.from === "you" ? "bg-white/10 self-end" : "bg-white self-start"
                    }`}
                >
                  <Text className={`text-xs font-semibold leading-normal ${m.from === "you" ? "text-white" : "text-[#0f3a31]"}`}>{m.text}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Ask TextInput Form */}
          <View className="mt-4 flex-row items-center bg-white/10 rounded-2xl pl-4 pr-1.5 py-1.5">
            <TextInput
              value={input}
              onChangeText={setInput}
              editable={!submittingChat}
              placeholder="Ask anything about your money…"
              placeholderTextColor="rgba(255,255,255,0.4)"
              className="flex-grow text-xs text-white h-9"
            />
            <TouchableOpacity
              onPress={handleAsk}
              disabled={submittingChat}
              className="w-9 h-9 rounded-xl bg-white justify-center items-center shadow-sm"
            >
              <Send size={14} color="#0f3a31" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
