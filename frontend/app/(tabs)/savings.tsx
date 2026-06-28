import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Platform
} from "react-native";
import { useRouter } from "expo-router";
import {
  Plus as PlusIcon,
  Shield as ShieldIcon,
  Plane as PlaneIcon,
  GraduationCap as GraduationCapIcon,
  Home as HomeIcon,
  Pencil as PencilIcon,
  Trash2 as Trash2Icon
} from "lucide-react-native";

const Plus = PlusIcon as any;
const Shield = ShieldIcon as any;
const Plane = PlaneIcon as any;
const GraduationCap = GraduationCapIcon as any;
const Home = HomeIcon as any;
const Pencil = PencilIcon as any;
const Trash2 = Trash2Icon as any;

import { apiFetch } from "../../lib/api";

type Goal = {
  id: number;
  name: string;
  saved: number;
  target: number;
  eta: string;
  color: string;
  icon?: any;
};

const getIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("emergency") || n.includes("shield") || n.includes("fund")) return Shield;
  if (n.includes("trip") || n.includes("bali") || n.includes("travel") || n.includes("plane")) return Plane;
  if (n.includes("education") || n.includes("kid") || n.includes("college") || n.includes("school")) return GraduationCap;
  return Home;
};

export default function SavingsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [contribGoal, setContribGoal] = useState<{ id: number; idx: number; amount: string } | null>(null);

  // Form states
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deleteConfirmGoal, setDeleteConfirmGoal] = useState<Goal | null>(null);
  const [formName, setFormName] = useState("");
  const [formTarget, setFormTarget] = useState("");

  const fetchGoals = async () => {
    try {
      const data = await apiFetch<any[]>("/api/savings");
      const mapped = data.map((item) => ({
        ...item,
        icon: getIcon(item.name),
      }));
      setGoals(mapped);
    } catch (err: any) {
      Alert.alert("Error", "Failed to load savings goals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleOpenAdd = () => {
    setEditingGoal(null);
    setFormName("");
    setFormTarget("");
    setAddGoalOpen(true);
  };

  const handleOpenEdit = (g: Goal) => {
    setEditingGoal(g);
    setFormName(g.name);
    setFormTarget(String(g.target));
    setAddGoalOpen(true);
  };

  const handleAddGoal = async () => {
    const t = Number(formTarget);
    if (!formName || !t) {
      Alert.alert("Input Error", "Please provide a name and target amount.");
      return;
    }

    setLoading(true);
    setAddGoalOpen(false);
    try {
      if (editingGoal) {
        await apiFetch(`/api/savings/${editingGoal.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: formName,
            target_amount: t,
          }),
        });
        Alert.alert("Success", "Savings goal updated successfully!");
      } else {
        await apiFetch("/api/savings", {
          method: "POST",
          body: JSON.stringify({
            name: formName,
            target_amount: t,
          }),
        });
        Alert.alert("Success", "Savings goal created successfully!");
      }
      setFormName("");
      setFormTarget("");
      setEditingGoal(null);
      fetchGoals();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save savings goal");
      setLoading(false);
    }
  };

  const handleDeleteGoal = (g: Goal) => {
    setDeleteConfirmGoal(g);
  };

  const performDeleteGoal = async () => {
    if (!deleteConfirmGoal) return;
    setLoading(true);
    const goalToDelete = deleteConfirmGoal;
    setDeleteConfirmGoal(null);
    try {
      await apiFetch(`/api/savings/${goalToDelete.id}`, { method: "DELETE" });
      Alert.alert("Success", "Goal deleted successfully");
      fetchGoals();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to delete goal");
      setLoading(false);
    }
  };

  const handleContribution = async () => {
    if (!contribGoal) return;
    const amt = Number(contribGoal.amount);
    if (!amt) {
      Alert.alert("Input Error", "Please enter a valid amount.");
      return;
    }

    setLoading(true);
    const targetGoal = goals[contribGoal.idx];
    setContribGoal(null);
    try {
      await apiFetch(`/api/savings/${contribGoal.id}/add-money`, {
        method: "POST",
        body: JSON.stringify({ amount: amt }),
      });
      Alert.alert("Added Money", `Added ₹${amt.toLocaleString("en-IN")} to ${targetGoal.name}`);
      fetchGoals();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to add money");
      setLoading(false);
    }
  };

  const totalSaved = goals.reduce((s, g) => s + g.saved, 0);

  if (loading && goals.length === 0) {
    return (
      <View className="flex-grow justify-center items-center bg-[#f9fafb]">
        <ActivityIndicator size="large" color="#0f4a3f" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-grow bg-[#f9fafb]">
      {/* Page Title Header */}
      <View className="px-5 pt-6 pb-3 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-extrabold text-[#0f3a31]">Savings</Text>
          <Text className="text-xs text-[#7c8a87] font-semibold">Goals & funds</Text>
        </View>
        <TouchableOpacity
          onPress={handleOpenAdd}
          className="w-10 h-10 rounded-full bg-[#0f4a3f] justify-center items-center shadow-lg"
        >
          <Plus size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Sub tabs nav bar */}
      <View className="px-5 mt-2">
        <View className="flex-row bg-[#f3f4f6] rounded-2xl p-1">
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/expenses")}
            className="flex-grow flex-1 py-2 items-center rounded-xl"
          >
            <Text className="text-xs font-bold text-[#7c8a87]">Expenses</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/income")}
            className="flex-grow flex-1 py-2 items-center rounded-xl"
          >
            <Text className="text-xs font-bold text-[#7c8a87]">Income</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-grow flex-1 py-2 items-center bg-white rounded-xl shadow-sm">
            <Text className="text-xs font-bold text-[#0f3a31]">Savings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Total Saved Card */}
      <View className="px-5 mt-5">
        <View className="bg-amber-100 rounded-3xl p-6 relative overflow-hidden shadow-sm">
          <Text className="text-xs uppercase tracking-wider text-amber-800 font-bold">Total saved</Text>
          <Text className="text-3xl font-extrabold text-amber-900 mt-1">₹ {(totalSaved / 100000).toFixed(2)}L</Text>
          <Text className="text-xs text-amber-800/80 mt-1 font-semibold">Across {goals.length} goals · auto-saving ₹18,000/mo</Text>
        </View>
      </View>

      {/* Goals List */}
      <View className="px-5 mt-5 space-y-3 pb-8">
        {goals.map((g, i) => {
          const pct = g.target > 0 ? Math.min(100, Math.round((g.saved / g.target) * 100)) : 0;
          const Icon = g.icon || Shield;

          let bgHex = "bg-emerald-50 text-emerald-600";
          if (g.color.includes("sky-100")) bgHex = "bg-sky-50 text-sky-600";
          else if (g.color.includes("purple-100")) bgHex = "bg-purple-50 text-purple-600";
          else if (g.color.includes("rose-100")) bgHex = "bg-rose-50 text-rose-600";

          return (
            <View key={g.id} className="bg-white border border-[#e5e7eb] rounded-3xl p-4 mb-3 shadow-sm">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className={`w-11 h-11 rounded-xl justify-center items-center ${bgHex}`}>
                    <Icon size={18} color="currentColor" />
                  </View>
                  <View className="ml-3">
                    <Text className="font-bold text-sm text-[#0f3a31]">{g.name}</Text>
                    <Text className="text-[10px] text-[#7c8a87] font-semibold mt-0.5">Reach in {g.eta}</Text>
                  </View>
                </View>
                <Text className="text-sm font-extrabold text-[#0f3a31]">{pct}%</Text>
              </View>

              {/* Progress Bar */}
              <View className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                <View className="h-full bg-[#0f4a3f] rounded-full" style={{ width: `${pct}%` }} />
              </View>

              <View className="mt-2.5 flex-row justify-between">
                <Text className="text-[10px] text-[#7c8a87] font-medium">₹{Math.round(g.saved).toLocaleString("en-IN")} saved</Text>
                <Text className="text-[10px] text-[#7c8a87] font-medium">of ₹{Math.round(g.target).toLocaleString("en-IN")}</Text>
              </View>

              <View className="mt-4 flex-row space-x-2">
                <TouchableOpacity
                  onPress={() => setContribGoal({ id: g.id, idx: i, amount: "" })}
                  className="flex-grow flex-1 bg-[#0f4a3f] py-2.5 rounded-xl items-center shadow-sm"
                >
                  <Text className="text-white text-xs font-bold">Add money</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleOpenEdit(g)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 justify-center items-center"
                >
                  <Pencil size={14} color="#0f3a31" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteGoal(g)}
                  className="px-4 py-2.5 rounded-xl bg-red-50 justify-center items-center"
                >
                  <Trash2 size={14} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* Add New Goal Modal */}
      <Modal
        visible={addGoalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setAddGoalOpen(false);
          setEditingGoal(null);
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-[#0f3a31] mb-1">
              {editingGoal ? "Edit savings goal" : "New savings goal"}
            </Text>
            <Text className="text-xs text-[#7c8a87] mb-5">
              {editingGoal ? `Modify details for ${editingGoal.name}` : "Set a target and start saving."}
            </Text>

            <View className="space-y-4">
              <View>
                <Text className="text-xs font-bold text-[#7c8a87] mb-1">Goal name</Text>
                <TextInput
                  value={formName}
                  onChangeText={setFormName}
                  placeholder=""
                  className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#0f3a31]"
                />
              </View>

              <View className="mt-3">
                <Text className="text-xs font-bold text-[#7c8a87] mb-1">Target amount (₹)</Text>
                <TextInput
                  value={formTarget}
                  onChangeText={setFormTarget}
                  keyboardType="numeric"
                  placeholder=""
                  className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#0f3a31]"
                />
              </View>

              <View className="flex-row space-x-3 mt-6 pt-4 border-t border-[#e5e7eb]">
                <TouchableOpacity
                  onPress={() => {
                    setAddGoalOpen(false);
                    setEditingGoal(null);
                  }}
                  className="flex-1 py-3.5 rounded-2xl bg-gray-100 items-center"
                >
                  <Text className="text-xs font-bold text-[#7c8a87]">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddGoal}
                  className="flex-1 py-3.5 rounded-2xl bg-[#0f4a3f] items-center"
                >
                  <Text className="text-xs font-bold text-white">
                    {editingGoal ? "Save changes" : "Create goal"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Contribution Money Modal */}
      <Modal
        visible={contribGoal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setContribGoal(null)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <Text className="text-lg font-bold text-[#0f3a31] mb-1">Add money</Text>
            <Text className="text-xs text-[#7c8a87] mb-5">
              Add to {contribGoal && goals[contribGoal.idx]?.name} goal.
            </Text>

            <View className="space-y-4">
              <View>
                <Text className="text-xs font-bold text-[#7c8a87] mb-1">Amount (₹)</Text>
                <TextInput
                  value={contribGoal?.amount ?? ""}
                  onChangeText={(val: string) => contribGoal && setContribGoal({ ...contribGoal, amount: val })}
                  keyboardType="numeric"
                  placeholder=""
                  className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#0f3a31]"
                  autoFocus
                />
              </View>

              <View className="flex-row space-x-3 justify-end mt-4">
                <TouchableOpacity
                  onPress={() => setContribGoal(null)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100"
                >
                  <Text className="text-xs font-bold text-[#7c8a87]">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleContribution}
                  className="px-4 py-2.5 rounded-xl bg-[#0f4a3f]"
                >
                  <Text className="text-xs font-bold text-white">Add money</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteConfirmGoal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmGoal(null)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <Text className="text-lg font-bold text-[#0f3a31] mb-2">Delete savings goal?</Text>
            <Text className="text-xs text-[#7c8a87] mb-6">
              Are you sure you want to delete the goal "{deleteConfirmGoal?.name}"? This action cannot be undone.
            </Text>

            <View className="flex-row space-x-3 justify-end">
              <TouchableOpacity
                onPress={() => setDeleteConfirmGoal(null)}
                className="px-4 py-2.5 rounded-xl bg-gray-100"
              >
                <Text className="text-xs font-bold text-[#7c8a87]">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={performDeleteGoal}
                className="px-4 py-2.5 rounded-xl bg-red-600"
              >
                <Text className="text-xs font-bold text-white">Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
