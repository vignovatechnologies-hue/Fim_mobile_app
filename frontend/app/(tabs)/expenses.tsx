import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal
} from "react-native";
import { useRouter } from "expo-router";
import {
  Plus as PlusIcon,
  ArrowDownRight as ArrowDownRightIcon,
  ArrowUpRight as ArrowUpRightIcon,
  Utensils as UtensilsIcon,
  ShoppingBag as ShoppingBagIcon,
  Car as CarIcon,
  Film as FilmIcon,
  Home as HomeIcon
} from "lucide-react-native";

const Plus = PlusIcon as any;
const ArrowDownRight = ArrowDownRightIcon as any;
const ArrowUpRight = ArrowUpRightIcon as any;
const Utensils = UtensilsIcon as any;
const ShoppingBag = ShoppingBagIcon as any;
const Car = CarIcon as any;
const Film = FilmIcon as any;
const Home = HomeIcon as any;

import { apiFetch } from "../../lib/api";

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
  const [txns, setTxns] = useState<Txn[]>([]);
  const [cats, setCats] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCat, setFormCat] = useState("Food");
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);

  const fetchData = async () => {
    try {
      const txnsData = await apiFetch<Txn[]>("/api/transactions");
      setTxns(txnsData);

      const budgetsData = await apiFetch<BudgetCategory[]>("/api/budgets");
      const mapped = budgetsData.map((b) => ({
        ...b,
        icon: iconMap[b.name] || Home,
      }));
      setCats(mapped);
    } catch (err: any) {
      Alert.alert("Error", "Failed to load financial records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddExpense = async () => {
    const amt = Number(formAmount);
    if (!formName || !amt) {
      Alert.alert("Input Error", "Please provide a name/description and amount.");
      return;
    }

    setLoading(true);
    setModalOpen(false);
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
      fetchData();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to log expense");
      setLoading(false);
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
      <View className="px-5 pt-6 pb-3 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-extrabold text-[#0f3a31]">Money</Text>
          <Text className="text-xs text-[#7c8a87] font-semibold">June 2026</Text>
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
            onPress={() => router.push("/income")}
            className="flex-grow flex-1 py-2 items-center rounded-xl"
          >
            <Text className="text-xs font-bold text-[#7c8a87]">Income</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/savings")}
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

      {/* Recent transactions list */}
      <View className="px-5 mt-6 pb-8">
        <Text className="font-bold text-sm text-[#0f3a31] mb-3">Recent transactions</Text>
        <View className="bg-white border border-[#e5e7eb] rounded-3xl divide-y divide-[#e5e7eb] shadow-sm">
          {txns.map((t) => (
            <View key={t.id} className="flex-row items-center justify-between p-4 border-b border-[#f3f4f6]">
              <View>
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
          ))}
        </View>
      </View>

      {/* Log Expense Dialog Modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-[#0f3a31] mb-1">Log expense</Text>
            <Text className="text-xs text-[#7c8a87] mb-5">Quickly capture a spend.</Text>

            <View className="space-y-4">
              <View>
                <Text className="text-xs font-bold text-[#7c8a87] mb-1">Description</Text>
                <TextInput
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="Swiggy dinner"
                  className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#0f3a31]"
                />
              </View>

              <View className="flex-row space-x-3 mt-3">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-[#7c8a87] mb-1">Amount (₹)</Text>
                  <TextInput
                    value={formAmount}
                    onChangeText={setFormAmount}
                    keyboardType="numeric"
                    placeholder="250"
                    className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#0f3a31]"
                  />
                </View>
              </View>

              <View className="mt-3">
                <Text className="text-xs font-bold text-[#7c8a87] mb-1">Category</Text>
                <View className="relative">
                  <TouchableOpacity
                    onPress={() => setCatDropdownOpen(!catDropdownOpen)}
                    className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl px-4 py-3.5 flex-row justify-between items-center"
                  >
                    <Text className="text-sm text-[#0f3a31] font-semibold">{formCat}</Text>
                    <Text className="text-xs text-[#7c8a87] font-bold">{catDropdownOpen ? "▲" : "▼"}</Text>
                  </TouchableOpacity>

                  {catDropdownOpen && (
                    <View className="mt-1 bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-md">
                      {["Food", "Shopping", "Transport", "Entertainment", "Home"].map((c) => (
                        <TouchableOpacity
                          key={c}
                          onPress={() => {
                            setFormCat(c);
                            setCatDropdownOpen(false);
                          }}
                          className={`px-4 py-3 border-b border-[#f3f4f6] ${
                            formCat === c ? "bg-emerald-50/50" : ""
                          }`}
                        >
                          <Text className={`text-xs ${formCat === c ? "font-bold text-[#0f4a3f]" : "text-[#0f3a31] font-semibold"}`}>
                            {c}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              <View className="flex-row space-x-3 mt-6 pt-4 border-t border-[#e5e7eb]">
                <TouchableOpacity
                  onPress={() => {
                    setModalOpen(false);
                    setCatDropdownOpen(false);
                  }}
                  className="flex-1 py-3.5 rounded-2xl bg-gray-100 items-center"
                >
                  <Text className="text-xs font-bold text-[#7c8a87]">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddExpense}
                  className="flex-1 py-3.5 rounded-2xl bg-[#0f4a3f] items-center"
                >
                  <Text className="text-xs font-bold text-white">Log expense</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
