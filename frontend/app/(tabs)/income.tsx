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
  Briefcase as BriefcaseIcon,
  Laptop as LaptopIcon,
  TrendingUp as TrendingUpIcon,
  Pencil as PencilIcon,
  Trash2 as Trash2Icon
} from "lucide-react-native";

const Plus = PlusIcon as any;
const Briefcase = BriefcaseIcon as any;
const Laptop = LaptopIcon as any;
const TrendingUp = TrendingUpIcon as any;
const Pencil = PencilIcon as any;
const Trash2 = Trash2Icon as any;

import { apiFetch } from "../../lib/api";

type Src = {
  id: number;
  name: string;
  type: string;
  amount: number;
  when: string;
  color: string;
  icon?: any;
};

const iconMap: Record<string, any> = {
  Salary: Briefcase,
  Freelance: Laptop,
  Investment: TrendingUp,
  Rental: Briefcase,
};

export default function IncomePage() {
  const router = useRouter();
  const [sources, setSources] = useState<Src[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [editingIncome, setEditingIncome] = useState<Src | null>(null);
  const [deleteConfirmIncome, setDeleteConfirmIncome] = useState<Src | null>(null);
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formType, setFormType] = useState("Salary");
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);

  const fetchIncome = async () => {
    try {
      const data = await apiFetch<any[]>("/api/income");
      const mapped = data.map((item) => ({
        ...item,
        icon: iconMap[item.type] || Briefcase,
      }));
      setSources(mapped);
    } catch (err: any) {
      Alert.alert("Error", "Failed to load income sources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncome();
  }, []);

  const handleOpenAdd = () => {
    setEditingIncome(null);
    setFormName("");
    setFormAmount("");
    setFormType("Salary");
    setTypeDropdownOpen(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (s: Src) => {
    setEditingIncome(s);
    setFormName(s.name);
    setFormAmount(String(s.amount));
    setFormType(s.type);
    setTypeDropdownOpen(false);
    setModalOpen(true);
  };

  const handleAddIncome = async () => {
    const amt = Number(formAmount);
    if (!formName || !amt) {
      Alert.alert("Input Error", "Please provide a source description and amount.");
      return;
    }

    setLoading(true);
    setModalOpen(false);
    setTypeDropdownOpen(false);
    try {
      if (editingIncome) {
        await apiFetch(`/api/income/${editingIncome.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: formName,
            amount: amt,
            type: formType,
          }),
        });
        Alert.alert("Success", `Income source '${formName}' updated successfully`);
      } else {
        await apiFetch("/api/income", {
          method: "POST",
          body: JSON.stringify({
            name: formName,
            amount: amt,
            type: formType,
          }),
        });
        Alert.alert("Success", `Income source '${formName}' logged successfully`);
      }
      setFormName("");
      setFormAmount("");
      setFormType("Salary");
      setEditingIncome(null);
      fetchIncome();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save income source");
      setLoading(false);
    }
  };

  const handleDeleteIncome = (s: Src) => {
    setDeleteConfirmIncome(s);
  };

  const performDeleteIncome = async () => {
    if (!deleteConfirmIncome) return;
    setLoading(true);
    const incomeToDelete = deleteConfirmIncome;
    setDeleteConfirmIncome(null);
    try {
      await apiFetch(`/api/income/${incomeToDelete.id}`, { method: "DELETE" });
      Alert.alert("Success", "Income source deleted successfully");
      fetchIncome();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to delete income source");
      setLoading(false);
    }
  };

  const totalIncome = sources.reduce((s, x) => s + x.amount, 0);

  if (loading && sources.length === 0) {
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
          <Text className="text-2xl font-extrabold text-[#0f3a31]">Income</Text>
          <Text className="text-xs text-[#7c8a87] font-semibold">All sources</Text>
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
          <TouchableOpacity className="flex-grow flex-1 py-2 items-center bg-white rounded-xl shadow-sm">
            <Text className="text-xs font-bold text-[#0f3a31]">Income</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/savings")}
            className="flex-grow flex-1 py-2 items-center rounded-xl"
          >
            <Text className="text-xs font-bold text-[#7c8a87]">Savings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Total inflow Card */}
      <View className="px-5 mt-5">
        <View className="bg-emerald-800 rounded-3xl p-6 relative overflow-hidden shadow-md">
          <Text className="text-xs uppercase tracking-wider text-emerald-100/75 font-bold">Monthly inflow</Text>
          <Text className="text-3xl font-extrabold text-white mt-1">₹ {totalIncome.toLocaleString("en-IN")}</Text>
          <View className="mt-3 flex-row space-x-2">
            <View className="bg-white/10 px-3 py-1 rounded-full">
              <Text className="text-[10px] text-white font-bold">↑ 12% MoM</Text>
            </View>
            <View className="bg-white/10 px-3 py-1 rounded-full">
              <Text className="text-[10px] text-white font-bold">{sources.length} sources</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Sources List */}
      <View className="px-5 mt-5 space-y-3 pb-8">
        {sources.map((s) => {
          const Icon = s.icon || Briefcase;

          let bgHex = "bg-indigo-50 text-indigo-600";
          if (s.color.includes("emerald-100")) bgHex = "bg-emerald-50 text-emerald-600";
          else if (s.color.includes("amber-100")) bgHex = "bg-amber-50 text-amber-600";
          else if (s.color.includes("sky-100")) bgHex = "bg-sky-50 text-sky-600";

          return (
            <View
              key={s.id}
              className="bg-white border border-[#e5e7eb] rounded-3xl p-4 mb-3 shadow-sm"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className={`w-11 h-11 rounded-xl justify-center items-center ${bgHex}`}>
                    <Icon size={18} color="currentColor" />
                  </View>
                  <View className="ml-3">
                    <Text className="font-bold text-sm text-[#0f3a31]">{s.name}</Text>
                    <Text className="text-[10px] text-[#7c8a87] font-semibold mt-0.5">
                      {s.type} · {s.when}
                    </Text>
                  </View>
                </View>
                <Text className="font-extrabold text-sm text-emerald-600">
                  +₹{s.amount.toLocaleString("en-IN")}
                </Text>
              </View>

              {/* Actions row */}
              <View className="mt-3 pt-3 border-t border-[#f3f4f6] flex-row justify-end space-x-2">
                <TouchableOpacity
                  onPress={() => handleOpenEdit(s)}
                  className="px-3 py-1.5 rounded-xl bg-gray-50 flex-row items-center space-x-1"
                >
                  <Pencil size={11} color="#0f3a31" />
                  <Text className="text-[10px] font-bold text-[#0f3a31]">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteIncome(s)}
                  className="px-3 py-1.5 rounded-xl bg-red-50 flex-row items-center space-x-1"
                >
                  <Trash2 size={11} color="#ef4444" />
                  <Text className="text-[10px] font-bold text-[#ef4444]">Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* Add New Income Source Modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setModalOpen(false);
          setEditingIncome(null);
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-[#0f3a31] mb-1">
              {editingIncome ? "Edit income source" : "Add income source"}
            </Text>
            <Text className="text-xs text-[#7c8a87] mb-5">
              {editingIncome ? `Modify details for ${editingIncome.name}` : "Track a new inflow."}
            </Text>

            <View className="space-y-4">
              <View>
                <Text className="text-xs font-bold text-[#7c8a87] mb-1">Source description</Text>
                <TextInput
                  value={formName}
                  onChangeText={setFormName}
                  placeholder=""
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
                    placeholder=""
                    className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#0f3a31]"
                  />
                </View>
              </View>

              <View className="mt-3">
                <Text className="text-xs font-bold text-[#7c8a87] mb-1">Type</Text>
                <View className="relative">
                  <TouchableOpacity
                    onPress={() => setTypeDropdownOpen(!typeDropdownOpen)}
                    className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl px-4 py-3.5 flex-row justify-between items-center"
                  >
                    <Text className="text-sm text-[#0f3a31] font-semibold">{formType}</Text>
                    <Text className="text-xs text-[#7c8a87] font-bold">{typeDropdownOpen ? "▲" : "▼"}</Text>
                  </TouchableOpacity>

                  {typeDropdownOpen && (
                    <View className="mt-1 bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-md">
                      {["Salary", "Freelance", "Investment", "Rental"].map((c) => (
                        <TouchableOpacity
                          key={c}
                          onPress={() => {
                            setFormType(c);
                            setTypeDropdownOpen(false);
                          }}
                          className={`px-4 py-3 border-b border-[#f3f4f6] ${
                            formType === c ? "bg-emerald-50/50" : ""
                          }`}
                        >
                          <Text className={`text-xs ${formType === c ? "font-bold text-[#0f4a3f]" : "text-[#0f3a31] font-semibold"}`}>
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
                    setEditingIncome(null);
                    setTypeDropdownOpen(false);
                  }}
                  className="flex-1 py-3.5 rounded-2xl bg-gray-100 items-center"
                >
                  <Text className="text-xs font-bold text-[#7c8a87]">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddIncome}
                  className="flex-1 py-3.5 rounded-2xl bg-[#0f4a3f] items-center"
                >
                  <Text className="text-xs font-bold text-white">
                    {editingIncome ? "Save changes" : "Add income"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteConfirmIncome !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmIncome(null)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <Text className="text-lg font-bold text-[#0f3a31] mb-2">Delete income source?</Text>
            <Text className="text-xs text-[#7c8a87] mb-6">
              Are you sure you want to delete the income source "{deleteConfirmIncome?.name}"? This action cannot be undone.
            </Text>

            <View className="flex-row space-x-3 justify-end">
              <TouchableOpacity
                onPress={() => setDeleteConfirmIncome(null)}
                className="px-4 py-2.5 rounded-xl bg-gray-100"
              >
                <Text className="text-xs font-bold text-[#7c8a87]">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={performDeleteIncome}
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
