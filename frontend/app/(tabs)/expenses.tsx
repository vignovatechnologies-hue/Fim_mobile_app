import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from "react-native";
import { useRouter } from "expo-router";
import KeyboardSafeSheet from "../../components/KeyboardSafeSheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Plus as PlusIcon,
  ArrowDownRight as ArrowDownRightIcon,
  ArrowUpRight as ArrowUpRightIcon,
  Utensils as UtensilsIcon,
  ShoppingBag as ShoppingBagIcon,
  Car as CarIcon,
  Film as FilmIcon,
  Home as HomeIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from "lucide-react-native";

const Plus = PlusIcon as any;
const ArrowDownRight = ArrowDownRightIcon as any;
const ArrowUpRight = ArrowUpRightIcon as any;
const Utensils = UtensilsIcon as any;
const ShoppingBag = ShoppingBagIcon as any;
const Car = CarIcon as any;
const Film = FilmIcon as any;
const Home = HomeIcon as any;
const ChevronLeft = ChevronLeftIcon as any;
const ChevronRight = ChevronRightIcon as any;

import { apiFetch } from "../../lib/api";

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

type Txn = {
  id: number;
  name: string;
  cat: string;
  amount: number;
  payment_status: string;
  when: string;
};

type BudgetCategory = {
  name: string;
  spent: number;
  budget: number;
  color: string;
  icon?: any;
};

const iconMap: Record<string, any> = {
  "Food & Dining": Utensils,
  "Shopping": ShoppingBag,
  "Transport": Car,
  "Entertainment": Film,
  "Home & Bills": Home,
};

export default function ExpensesPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [txns, setTxns] = useState<Txn[]>([]);
  const [cats, setCats] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const isInitialLoad = useRef(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCat, setFormCat] = useState("Food");
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState<Record<string, string>>({});

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Pagination
  const TXN_PAGE_SIZE = 10;
  const [txnPage, setTxnPage] = useState(1);

  const handlePrevMonth = () => {
    setTxnPage(1);
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    setTxnPage(1);
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  // Derived paginated slice
  const txnTotalPages = Math.max(1, Math.ceil(txns.length / TXN_PAGE_SIZE));
  const paginatedTxns = txns.slice((txnPage - 1) * TXN_PAGE_SIZE, txnPage * TXN_PAGE_SIZE);

  const fetchData = async (m: number, y: number) => {
    if (isInitialLoad.current) {
      setLoading(true);
    }
    try {
      const txnsData = await apiFetch<Txn[]>(`/api/transactions?month=${m}&year=${y}`);
      setTxns(txnsData);

      const budgetsData = await apiFetch<BudgetCategory[]>(`/api/budgets?month=${m}&year=${y}`);
      const mapped = budgetsData.map((b) => ({
        ...b,
        icon: iconMap[b.name] || Home,
      }));
      setCats(mapped);
    } catch (err: any) {
      Alert.alert("Error", "Failed to load financial records.");
    } finally {
      setLoading(false);
      isInitialLoad.current = false;
    }
  };

  useEffect(() => {
    fetchData(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  const handleAddExpense = async () => {
    const amt = Number(formAmount);
    if (!formName || !amt) {
      Alert.alert("Input Error", "Please provide a name/description and amount.");
      return;
    }

    setIsSaving(true);
    setCatDropdownOpen(false);
    try {
      await apiFetch("/api/transactions", {
        method: "POST",
        body: JSON.stringify({
          name: formName,
          category: formCat,
          amount: amt,
        }),
      });
      Alert.alert("Logged", `Logged ₹${amt} under ${formCat}`);
      setFormName("");
      setFormAmount("");
      setModalOpen(false);
      fetchData(selectedMonth, selectedYear);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to log expense");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBudgets = async () => {
    const payload: Record<string, number> = {};
    cats.forEach((c) => {
      payload[c.name] = budgetDraft[c.name] ? Number(budgetDraft[c.name]) : c.budget;
    });

    setIsSaving(true);
    try {
      await apiFetch("/api/budgets", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setBudgetDraft({});
      Alert.alert("Success", "Budgets updated successfully!");
      setBudgetModalOpen(false);
      fetchData(selectedMonth, selectedYear);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to update budgets");
    } finally {
      setIsSaving(false);
    }
  };

  const totalSpent = cats.reduce((s, c) => s + c.spent, 0);
  const totalBudget = cats.reduce((s, c) => s + c.budget, 0);

  if (loading && cats.length === 0) {
    return (
      <View className="flex-grow justify-center items-center bg-[#f9fafb]">
        <ActivityIndicator size="large" color="#0f4a3f" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-grow bg-[#f9fafb]">
      {/* Page Header */}
      <View className="px-5 pb-3 flex-row items-center justify-between" style={{ paddingTop: insets.top > 0 ? insets.top + 8 : 16 }}>
        <View>
          <Text className="text-2xl font-extrabold text-[#0f3a31]">Money</Text>
          <View className="flex-row items-center mt-1" style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={handlePrevMonth} style={{ padding: 4, borderRadius: 999, backgroundColor: '#f3f4f6', marginRight: 6 }}>
              <ChevronLeft size={13} color="#0f3a31" />
            </TouchableOpacity>
            <Text className="text-xs text-[#7c8a87] font-extrabold min-w-[75px] text-center">
              {months[selectedMonth - 1]} {selectedYear}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={{ padding: 4, borderRadius: 999, backgroundColor: '#f3f4f6', marginLeft: 6 }}>
              <ChevronRight size={13} color="#0f3a31" />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setModalOpen(true)}
          className="w-10 h-10 rounded-full bg-[#0f4a3f] justify-center items-center shadow-lg"
        >
          <Plus size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Sub tabs nav bar */}
      <View className="px-5 mt-2">
        <View className="flex-row bg-[#f3f4f6] rounded-2xl p-1">
          <TouchableOpacity className="flex-grow flex-1 py-2 items-center bg-white rounded-xl shadow-sm">
            <Text className="text-xs font-bold text-[#0f3a31]">Expenses</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/income")}
            className="flex-grow flex-1 py-2 items-center rounded-xl"
          >
            <Text className="text-xs font-bold text-[#7c8a87]">Income</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/savings")}
            className="flex-grow flex-1 py-2 items-center rounded-xl"
          >
            <Text className="text-xs font-bold text-[#7c8a87]">Savings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* spent/saved balance */}
      <View className="px-5 mt-5 flex-row space-x-3 justify-between">
        <View className="w-[48%] bg-white border border-[#e5e7eb] rounded-2xl p-4 shadow-sm">
          <View className="flex-row items-center">
            <ArrowUpRight size={14} color="#ef4444" className="mr-1" />
            <Text className="text-xs text-[#7c8a87] font-semibold">Spent</Text>
          </View>
          <Text className="text-xl font-extrabold text-[#0f3a31] mt-2">
            ₹ {totalSpent.toLocaleString("en-IN")}
          </Text>
          <Text className="text-[10px] text-[#9ca3af] mt-0.5">
            of ₹ {totalBudget.toLocaleString("en-IN")} budget
          </Text>
        </View>

        <View className="w-[48%] bg-white border border-[#e5e7eb] rounded-2xl p-4 shadow-sm">
          <View className="flex-row items-center">
            <ArrowDownRight size={14} color="#10b981" className="mr-1" />
            <Text className="text-xs text-[#7c8a87] font-semibold">Saved</Text>
          </View>
          <Text className="text-xl font-extrabold text-emerald-600 mt-2">
            ₹ {Math.max(0, totalBudget - totalSpent).toLocaleString("en-IN")}
          </Text>
          <Text className="text-[10px] text-[#9ca3af] mt-0.5">vs budget</Text>
        </View>
      </View>

      {/* Category Progress List */}
      <View className="px-5 mt-6">
        <Text className="font-bold text-sm text-[#0f3a31] mb-3">By category</Text>
        <View className="space-y-3">
          {cats.map((c) => {
            const pct = c.budget > 0 ? Math.min(100, Math.round((c.spent / c.budget) * 100)) : 0;
            const isOver = c.spent > c.budget;
            const Icon = c.icon;

            // Map tailwind backgrounds since nativewind needs standard background styles
            let bgHex = "bg-gray-100 text-gray-600";
            if (c.color.includes("indigo-100")) bgHex = "bg-indigo-50 text-indigo-600";
            else if (c.color.includes("purple-100")) bgHex = "bg-purple-50 text-purple-600";
            else if (c.color.includes("blue-100")) bgHex = "bg-blue-50 text-blue-600";
            else if (c.color.includes("pink-100")) bgHex = "bg-pink-50 text-pink-600";
            else if (c.color.includes("amber-100")) bgHex = "bg-amber-50 text-amber-600";

            return (
              <TouchableOpacity
                key={c.name}
                onPress={() =>
                  Alert.alert(
                    c.name,
                    `₹${c.spent.toLocaleString("en-IN")} spent of ₹${c.budget.toLocaleString(
                      "en-IN"
                    )} budget (${pct}%)`
                  )
                }
                className="bg-white border border-[#e5e7eb] rounded-3xl p-4 mb-3 shadow-sm"
              >
                <View className="flex-row items-center">
                  <View className={`w-10 h-10 rounded-xl justify-center items-center ${bgHex}`}>
                    {Icon && <Icon size={18} color="currentColor" />}
                  </View>
                  <View className="ml-3 flex-grow">
                    <View className="flex-row justify-between">
                      <Text className="font-bold text-sm text-[#0f3a31]">{c.name}</Text>
                      <Text className={`font-bold text-sm ${isOver ? "text-red-500" : "text-[#0f3a31]"}`}>
                        ₹{c.spent.toLocaleString("en-IN")}
                      </Text>
                    </View>
                    <View className="flex-row justify-between text-[10px] text-[#7c8a87] mt-0.5">
                      <Text>of ₹{c.budget.toLocaleString("en-IN")}</Text>
                      <Text className={isOver ? "text-red-500 font-bold" : ""}>{pct}%</Text>
                    </View>
                    <View className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                      <View
                        className={`h-full rounded-full ${isOver ? "bg-red-500" : "bg-[#0f4a3f]"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Monthly Budgets */}
      <View className="px-5 mt-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-bold text-sm text-[#0f3a31]">Monthly budgets</Text>
          <TouchableOpacity
            onPress={() => {
              const draft: Record<string, string> = {};
              cats.forEach((c) => { draft[c.name] = c.budget.toString(); });
              setBudgetDraft(draft);
              setBudgetModalOpen(true);
            }}
          >
            <Text className="text-xs font-semibold text-[#10b981]">⚙ Set budgets</Text>
          </TouchableOpacity>
        </View>
        <View className="bg-white border border-[#e5e7eb] rounded-3xl p-5 items-center shadow-sm">
          <View className="w-14 h-14 rounded-2xl bg-[#f3f4f6] items-center justify-center mb-3">
            <Text style={{ fontSize: 26 }}>🎯</Text>
          </View>
          <Text className="font-bold text-[#0f3a31] text-sm">Manage spending limits</Text>
          <Text className="text-xs text-[#7c8a87] text-center mt-1 leading-5">
            Set monthly limits per category and track how close you are to your budget.
          </Text>
          <TouchableOpacity
            onPress={() => {
              const draft: Record<string, string> = {};
              cats.forEach((c) => { draft[c.name] = c.budget.toString(); });
              setBudgetDraft(draft);
              setBudgetModalOpen(true);
            }}
            className="mt-4 px-6 py-2.5 rounded-full bg-[#0f4a3f] items-center"
          >
            <Text className="text-xs font-bold text-white">Set budgets</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent transactions list */}
      <View className="px-5 mt-6 pb-8">
        {/* Header row */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="font-bold text-sm text-[#0f3a31]">Recent transactions</Text>
          <Text className="text-[10px] text-[#7c8a87] font-medium">
            {txns.length} total
          </Text>
        </View>

        <View className="bg-white border border-[#e5e7eb] rounded-3xl overflow-hidden shadow-sm">
          {paginatedTxns.length === 0 ? (
            <View className="p-6 items-center">
              <Text className="text-xs text-[#7c8a87] font-medium">No transactions this month</Text>
            </View>
          ) : (
            paginatedTxns.map((t) => (
              <View key={t.id} className="flex-row items-center justify-between px-4 py-3.5 border-b border-[#f3f4f6]">
                <View className="flex-1 mr-3">
                  <Text className="font-bold text-sm text-[#0f3a31]">{t.name}</Text>
                  <Text className="text-[10px] text-[#7c8a87] mt-0.5 font-medium">
                    {t.cat} · {t.when} ·{" "}
                    <Text className={t.payment_status === "credit" ? "text-emerald-500" : "text-[#7c8a87]"}>
                      {t.payment_status === "credit" ? "Credited" : "Debited"}
                    </Text>
                  </Text>
                </View>
                <Text className={`font-bold text-sm ${t.payment_status === "credit" ? "text-emerald-500" : "text-[#0f3a31]"}`}>
                  {t.payment_status === "credit" ? "+" : "-"}₹{Math.abs(t.amount).toLocaleString("en-IN")}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Pagination controls */}
        {txnTotalPages > 1 && (
          <View className="flex-row items-center justify-between mt-4 px-1">
            <TouchableOpacity
              onPress={() => setTxnPage((p) => Math.max(1, p - 1))}
              disabled={txnPage === 1}
              className={`flex-row items-center space-x-1 px-4 py-2 rounded-full border ${txnPage === 1
                ? "border-[#e5e7eb] bg-[#f9fafb]"
                : "border-[#0f4a3f] bg-white"
                }`}
            >
              <ChevronLeft size={14} color={txnPage === 1 ? "#c0c7c4" : "#0f4a3f"} />
              <Text
                className={`text-xs font-bold ${txnPage === 1 ? "text-[#c0c7c4]" : "text-[#0f4a3f]"
                  }`}
              >
                Prev
              </Text>
            </TouchableOpacity>

            {/* Page dots / counter */}
            <View className="flex-row items-center space-x-1">
              {Array.from({ length: txnTotalPages }, (_, i) => i + 1).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setTxnPage(p)}
                  className={`w-7 h-7 rounded-full items-center justify-center ${p === txnPage ? "bg-[#0f4a3f]" : "bg-[#f3f4f6]"
                    }`}
                >
                  <Text
                    className={`text-[10px] font-bold ${p === txnPage ? "text-white" : "text-[#7c8a87]"
                      }`}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => setTxnPage((p) => Math.min(txnTotalPages, p + 1))}
              disabled={txnPage === txnTotalPages}
              className={`flex-row items-center space-x-1 px-4 py-2 rounded-full border ${txnPage === txnTotalPages
                ? "border-[#e5e7eb] bg-[#f9fafb]"
                : "border-[#0f4a3f] bg-white"
                }`}
            >
              <Text
                className={`text-xs font-bold ${txnPage === txnTotalPages ? "text-[#c0c7c4]" : "text-[#0f4a3f]"
                  }`}
              >
                Next
              </Text>
              <ChevronRight size={14} color={txnPage === txnTotalPages ? "#c0c7c4" : "#0f4a3f"} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Log Expense Dialog Modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => { setModalOpen(false); setCatDropdownOpen(false); }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
            <View style={{ backgroundColor: "#ffffff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === "ios" ? 40 : 28 }}>

              {/* Handle bar */}
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "#e5e7eb", alignSelf: "center", marginBottom: 20 }} />

              <Text style={{ fontSize: 18, fontWeight: "800", color: "#0f3a31", marginBottom: 4 }}>Log expense</Text>
              <Text style={{ fontSize: 12, color: "#7c8a87", marginBottom: 20 }}>Quickly capture a spend.</Text>

              {/* Description */}
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#7c8a87", marginBottom: 6 }}>Description</Text>
              <TextInput
                value={formName}
                onChangeText={setFormName}
                placeholder=""
                placeholderTextColor="#9ca3af"
                style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: "#0f3a31", marginBottom: 16 }}
              />

              {/* Amount */}
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#7c8a87", marginBottom: 6 }}>Amount (₹)</Text>
              <TextInput
                value={formAmount}
                onChangeText={setFormAmount}
                keyboardType="numeric"
                placeholder=""
                placeholderTextColor="#9ca3af"
                style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: "#0f3a31", marginBottom: 16 }}
              />

              {/* Category pills — no dropdown, works perfectly on Android */}
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#7c8a87", marginBottom: 10 }}>Category</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
                {[
                  { label: "Food", emoji: "🍽️" },
                  { label: "Shopping", emoji: "🛍️" },
                  { label: "Transport", emoji: "🚗" },
                  { label: "Entertainment", emoji: "🎬" },
                  { label: "Home", emoji: "🏠" },
                ].map((c) => {
                  const active = formCat === c.label;
                  return (
                    <TouchableOpacity
                      key={c.label}
                      onPress={() => setFormCat(c.label)}
                      style={{
                        flexDirection: "row", alignItems: "center", gap: 6,
                        paddingHorizontal: 14, paddingVertical: 9,
                        borderRadius: 50,
                        backgroundColor: active ? "#0f4a3f" : "#f3f4f6",
                        borderWidth: 1,
                        borderColor: active ? "#0f4a3f" : "#e5e7eb",
                      }}
                    >
                      <Text style={{ fontSize: 13 }}>{c.emoji}</Text>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: active ? "#ffffff" : "#0f3a31" }}>{c.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Buttons */}
              <View style={{ flexDirection: "row", gap: 12, borderTopWidth: 1, borderTopColor: "#f3f4f6", paddingTop: 16 }}>
                <TouchableOpacity
                  onPress={() => { setModalOpen(false); setCatDropdownOpen(false); }}
                  disabled={isSaving}
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center", opacity: isSaving ? 0.5 : 1 }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#7c8a87" }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddExpense}
                  disabled={isSaving}
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: "#0f4a3f", alignItems: "center", justifyContent: "center", opacity: isSaving ? 0.7 : 1 }}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#ffffff" }}>Log expense</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Set Budgets Modal */}
      <KeyboardSafeSheet
        visible={budgetModalOpen}
        onRequestClose={() => setBudgetModalOpen(false)}
      >
        <ScrollView className="flex-grow-0" style={{ maxHeight: "100%" }} showsVerticalScrollIndicator={false}>
          <Text className="text-lg font-bold text-[#0f3a31] mb-1">Set monthly budgets</Text>
          <Text className="text-xs text-[#7c8a87] mb-5">Set spending limits per category.</Text>

          {cats.map((c) => {
            const Icon = c.icon;
            let iconBg = "#f3f4f6";
            let iconColor = "#6b7280";
            if (c.name === "Food & Dining") { iconBg = "#d1fae5"; iconColor = "#059669"; }
            else if (c.name === "Shopping") { iconBg = "#fee2e2"; iconColor = "#e11d48"; }
            else if (c.name === "Transport") { iconBg = "#fef3c7"; iconColor = "#d97706"; }
            else if (c.name === "Entertainment") { iconBg = "#ede9fe"; iconColor = "#7c3aed"; }
            else if (c.name === "Home & Bills") { iconBg = "#e0f2fe"; iconColor = "#0284c7"; }

            return (
              <View key={c.name} className="flex-row items-center mb-4">
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: iconBg, justifyContent: "center", alignItems: "center", marginRight: 12 }}>
                  {Icon && <Icon size={16} color={iconColor} />}
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-[#7c8a87] mb-1">{c.name}</Text>
                  <TextInput
                    value={budgetDraft[c.name] ?? ""}
                    onChangeText={(v: string) => setBudgetDraft((d) => ({ ...d, [c.name]: v }))}
                    keyboardType="numeric"
                    placeholder={`₹${c.budget.toLocaleString("en-IN")}`}
                    placeholderTextColor="#9ca3af"
                    className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3 py-2.5 text-sm text-[#0f3a31]"
                  />
                </View>
              </View>
            );
          })}

          <View className="flex-row gap-3 mt-2 pt-4 border-t border-[#e5e7eb]">
            <TouchableOpacity
              onPress={() => setBudgetModalOpen(false)}
              disabled={isSaving}
              className="flex-1 py-3.5 rounded-2xl bg-gray-100 items-center justify-center"
              style={{ opacity: isSaving ? 0.5 : 1 }}
            >
              <Text className="text-xs font-bold text-[#7c8a87]">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSaveBudgets}
              disabled={isSaving}
              className="flex-1 py-3.5 rounded-2xl bg-[#0f4a3f] items-center justify-center"
              style={{ opacity: isSaving ? 0.7 : 1 }}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-xs font-bold text-white">Save budgets</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardSafeSheet>
    </ScrollView>
  );
}
