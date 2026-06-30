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
import * as FileSystem from "expo-file-system/legacy";
import { EncodingType } from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useRouter } from "expo-router";
import {
  Shield as ShieldIcon,
  Bell as BellIcon,
  CreditCard as CreditCardIcon,
  FileText as FileTextIcon,
  HelpCircle as HelpCircleIcon,
  LogOut as LogOutIcon,
  ChevronRight as ChevronRightOriginal,
  Crown as CrownIcon,
  Plus as PlusIcon,
  Download as DownloadIcon,
  Calendar as CalendarIconComponent,
} from "lucide-react-native";

const Shield = ShieldIcon as any;
const Bell = BellIcon as any;
const CreditCard = CreditCardIcon as any;
const FileText = FileTextIcon as any;
const HelpCircle = HelpCircleIcon as any;
const LogOut = LogOutIcon as any;
const ChevronRight = ChevronRightOriginal as any;
const ChevronRightIcon = ChevronRightOriginal as any;
const Crown = CrownIcon as any;
const Plus = PlusIcon as any;
const Download = DownloadIcon as any;
const CalendarIcon = CalendarIconComponent as any;

import { useAuth, signOut } from "../../lib/auth";
import { apiFetch } from "../../lib/api";
import SmartCalendarModal from "../../components/SmartCalendarModal";

type Bank = { id: number; name: string; masked: string };

const POPULAR_BANKS = ["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak Mahindra", "Yes Bank", "IDFC First", "PNB"];

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [premium, setPremium] = useState(user?.premium || false);

  // Linked banks
  const [banks, setBanks] = useState<Bank[]>([]);
  const [banksOpen, setBanksOpen] = useState(false);
  const [addBankOpen, setAddBankOpen] = useState(false);
  const [newBankName, setNewBankName] = useState("");
  const [newBankAcc, setNewBankAcc] = useState("");
  const [newBankIfsc, setNewBankIfsc] = useState("");
  const [linking, setLinking] = useState(false);
  const [loading, setLoading] = useState(true);

  // Statements
  const [reportsOpen, setReportsOpen] = useState(false);
  const [range, setRange] = useState<"day" | "month" | "year" | "custom">("month");
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  // Calendar modal
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState<"from" | "to">("from");

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const fetchBanks = async () => {
    try {
      const data = await apiFetch<Bank[]>("/api/user/banks");
      setBanks(data);
    } catch (err) {
      console.log("Error loading banks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setPremium(user.premium || false);
      fetchBanks();
    }
  }, [user]);

  const togglePremiumStatus = async () => {
    setLoading(true);
    try {
      const updatedUser = await apiFetch("/api/user/premium", { method: "POST" });
      setPremium(updatedUser.premium);
      if (updatedUser.premium) {
        Alert.alert("Premium Activated", "Welcome to FIM Premium ✨ 30-day free trial activated");
      } else {
        Alert.alert("Premium Deactivated", "Your premium features have been deactivated.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to toggle premium status");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkBank = async () => {
    const cleanAcc = newBankAcc.replace(/\s/g, "");
    const ifsc = newBankIfsc.trim().toUpperCase();

    if (!newBankName.trim()) {
      Alert.alert("Input Error", "Please select or type a bank name");
      return;
    }
    if (cleanAcc.length < 9 || cleanAcc.length > 18 || !/^\d+$/.test(cleanAcc)) {
      Alert.alert("Input Error", "Account number must be 9–18 digits (numbers only)");
      return;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
      Alert.alert("Input Error", "Invalid IFSC code format (e.g. HDFC0001234)");
      return;
    }

    setLinking(true);
    try {
      // Simulate verification delays
      await new Promise((resolve) => setTimeout(resolve, 800));
      const bank = await apiFetch<Bank>("/api/user/banks", {
        method: "POST",
        body: JSON.stringify({
          name: newBankName,
          account_number: newBankAcc,
          ifsc_code: ifsc,
        }),
      });
      setNewBankName("");
      setNewBankAcc("");
      setNewBankIfsc("");
      setAddBankOpen(false);
      Alert.alert(
        "Verification Successful",
        `Bank account verified & linked ✓\n${bank.name} ${bank.masked} · IFSC ${ifsc}`
      );
      fetchBanks();
    } catch (err: any) {
      Alert.alert("Verification Failed", err.message || "Failed to link bank account");
    } finally {
      setLinking(false);
    }
  };

  const handleRemoveBank = async (id: number) => {
    Alert.alert(
      "Unlink Bank Account",
      "Are you sure you want to remove this bank account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await apiFetch(`/api/user/banks/${id}`, { method: "DELETE" });
              Alert.alert("Success", "Bank account unlinked successfully");
              fetchBanks();
            } catch (err) {
              Alert.alert("Error", "Failed to remove bank account");
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDownloadReport = async () => {
    if (range === "custom" && (!fromDate || !toDate)) {
      Alert.alert("Input Error", "Please pick both From and To dates.");
      return;
    }

    setLoading(true);
    setReportsOpen(false);
    try {
      console.log("[Statement] Step 1: calling API...");
      const res = await apiFetch<{ status: string; filename: string; csv_content: string; row_count: number }>("/api/user/statement", {
        method: "POST",
        body: JSON.stringify({
          range,
          fromDate: fromDate?.toISOString() || null,
          toDate: toDate?.toISOString() || null,
        }),
      });

      console.log("[Statement] Step 2: API response —", "status:", res.status, "filename:", res.filename, "rows:", res.row_count, "csv_content length:", res.csv_content?.length);

      if (!res.csv_content) {
        Alert.alert("No Data", "No transactions found for the selected period.");
        return;
      }

      if (Platform.OS === "web") {
        // ── Web: trigger a browser file download via Blob ──
        console.log("[Statement] Step 3 (web): creating Blob and triggering download");
        const blob = new Blob([res.csv_content], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = res.filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
        console.log("[Statement] Step 4 (web): download triggered for", res.filename);
      } else {
        // ── Native (iOS / Android): write to cache then share ──
        const fileUri = (FileSystem.cacheDirectory ?? "") + res.filename;
        console.log("[Statement] Step 3 (native): writing file to", fileUri);
        await FileSystem.writeAsStringAsync(fileUri, res.csv_content, {
          encoding: EncodingType.UTF8,
        });
        console.log("[Statement] Step 4 (native): file written successfully");

        const canShare = await Sharing.isAvailableAsync();
        console.log("[Statement] Step 5 (native): canShare =", canShare);
        if (canShare) {
          console.log("[Statement] Step 6 (native): opening share sheet...");
          await Sharing.shareAsync(fileUri, {
            mimeType: "text/csv",
            dialogTitle: "Save your FIM Statement",
            UTI: "public.comma-separated-values-text",
          });
          console.log("[Statement] Step 7 (native): share sheet closed.");
        } else {
          Alert.alert("Statement Ready", `File saved at:\n${fileUri}`);
        }
      }
    } catch (err: any) {
      console.error("[Statement] ERROR:", err);
      Alert.alert("Download Error", err.message || "Failed to generate statement");
    } finally {
      setLoading(false);
    }
  };

  const openCalendar = (target: "from" | "to") => {
    setCalendarTarget(target);
    setCalendarOpen(true);
  };

  const handleSelectCalendarDay = (date: Date) => {
    if (calendarTarget === "from") setFromDate(date);
    else setToDate(date);
    setCalendarOpen(false);
  };

  const handleSignOut = async () => {
    setSignOutOpen(false);
    await signOut();
    Alert.alert("Signed Out", "You have been logged out successfully.");
    router.replace("/(auth)/auth");
  };

  const groups = [
    {
      title: "Account",
      items: [
        { icon: Shield, label: "Security & KYC", note: "", comingSoon: true, onClick: () => Alert.alert("Coming Soon", "Secure & KYC verification will be available soon.") },
        { icon: CreditCard, label: "Linked accounts", note: "", comingSoon: true, onClick: () => Alert.alert("Coming Soon", "Bank account linking will be available soon.") },
        { icon: Bell, label: "Notifications", note: "", comingSoon: false, onClick: () => Alert.alert("Notifications", "You are fully up to date.") },
      ],
    },
    {
      title: "Money tools",
      items: [
        { icon: FileText, label: "Reports & statements", note: "", comingSoon: false, onClick: () => setReportsOpen(true) },
        { icon: HelpCircle, label: "Help & support", note: "", comingSoon: false, onClick: () => Alert.alert("Support Details", "support@fim.in\n+91 1800-FIM-HELP") },
      ],
    },
    {
      title: "Legal",
      items: [
        { icon: Shield, label: "Privacy Policy", note: "", comingSoon: false, onClick: () => router.push("/privacy-policy") },
        { icon: FileText, label: "Terms of Use", note: "", comingSoon: false, onClick: () => router.push("/terms-of-use") },
      ],
    },
  ];

  return (
    <ScrollView className="flex-grow bg-[#f9fafb] px-5 py-4">
      {/* Header */}
      <View className="mb-4">
        <Text className="text-2xl font-extrabold text-[#0f3a31]">Profile</Text>
      </View>

      {/* User Info Card */}
      <View className="bg-white border border-[#e5e7eb] rounded-3xl p-5 flex-row items-center shadow-sm">
        <View className="w-16 h-16 rounded-[20px] bg-[#0f4a3f] justify-center items-center">
          <Text className="text-white font-extrabold text-xl">{user?.initials || "FI"}</Text>
        </View>
        <View className="ml-4 flex-1">
          <Text className="text-lg font-bold text-[#0f3a31]">{user?.name || "Guest"}</Text>
          <Text className="text-xs text-[#7c8a87] font-semibold">{user?.email}{user?.phone ? ` · ${user.phone}` : ""}</Text>
          <View className="flex-row gap-1.5 mt-1.5">
            {premium && (
              <View className="bg-emerald-50 px-2 py-0.5 rounded-full">
                <Text className="text-[10px] text-emerald-600 font-bold">Premium</Text>
              </View>
            )}
            <View className="bg-amber-50 px-2 py-0.5 rounded-full">
              <Text className="text-[10px] text-amber-600 font-bold">KYC - Coming Soon</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Premium upgrade promo */}
      <View className="bg-[#0f4a3f] rounded-3xl p-5 mt-4 relative overflow-hidden shadow-lg">
        <View className="flex-row items-start">
          <View className="w-10 h-10 rounded-xl bg-amber-100 justify-center items-center mr-3">
            <Crown size={20} color="#f59e0b" fill="#f59e0b" />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-white text-base">FIM Premium</Text>
            <Text className="text-xs text-white/80 mt-1 font-semibold">
              {premium ? "Active · renews in 30 days" : "Unlimited Smart Pay, AI advisor, refinance alerts — ₹199/mo"}
            </Text>
            <TouchableOpacity
              onPress={togglePremiumStatus}
              className="mt-4 bg-white rounded-full py-2 px-4 self-start"
            >
              <Text className="text-[#0f3a31] text-xs font-extrabold">
                {premium ? "Deactivate Premium" : "Try 30 days free"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Settings list groups */}
      {groups.map((g, idx) => (
        <View key={idx} className="mt-6">
          <Text className="text-[10px] uppercase tracking-wider font-extrabold text-[#7c8a87] mb-2 px-1">
            {g.title}
          </Text>
          <View className="bg-white border border-[#e5e7eb] rounded-3xl overflow-hidden shadow-sm">
            {g.items.map((item, itemIdx) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={itemIdx}
                  onPress={item.onClick}
                  className="flex-row items-center justify-between p-4 border-b border-[#f3f4f6]"
                >
                  <View className="flex-row items-center">
                    <View className="w-9 h-9 rounded-xl bg-gray-100 justify-center items-center mr-3">
                      <Icon size={16} color="#0f3a31" />
                    </View>
                    <Text className="text-sm font-bold text-[#0f3a31]">{item.label}</Text>
                  </View>
                  <View className="flex-row items-center">
                    {item.comingSoon ? (
                      <View className="bg-amber-100 px-2 py-0.5 rounded-full mr-1.5">
                        <Text className="text-[10px] font-extrabold text-amber-600">Coming Soon</Text>
                      </View>
                    ) : item.note ? (
                      <Text className="text-xs text-[#7c8a87] mr-1.5 font-bold">{item.note}</Text>
                    ) : null}
                    <ChevronRight size={14} color="#7c8a87" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      {/* Sign out button */}
      <View className="mt-6 mb-12">
        <TouchableOpacity
          onPress={() => setSignOutOpen(true)}
          className="w-full flex-row justify-center items-center py-4 rounded-3xl bg-white border border-red-100 shadow-sm"
        >
          <LogOut size={16} color="#ef4444" className="mr-2" />
          <Text className="text-[#ef4444] font-bold text-sm">Sign out</Text>
        </TouchableOpacity>
        <Text className="text-center text-[10px] text-[#7c8a87] font-semibold mt-4">
          FIM Mobile v2.0 · Made in India 🇮🇳
        </Text>
      </View>

      {/* Linked Accounts Dialog Modal */}
      <Modal
        visible={banksOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setBanksOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            <Text className="text-lg font-bold text-[#0f3a31] mb-1">Linked bank accounts</Text>
            <Text className="text-xs text-[#7c8a87] mb-4">Manage banks used for auto-pay and tracking.</Text>

            <ScrollView className="space-y-3">
              {loading ? (
                <ActivityIndicator size="small" color="#0f4a3f" className="my-6" />
              ) : banks.length === 0 ? (
                <Text className="text-center text-xs text-[#7c8a87] py-6 font-bold">No banks linked yet.</Text>
              ) : (
                banks.map((b) => (
                  <View
                    key={b.id}
                    className="flex-row items-center justify-between p-3.5 border border-[#e5e7eb] rounded-2xl bg-gray-50 mb-2"
                  >
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-xl bg-[#0f4a3f] justify-center items-center mr-3">
                        <Text className="text-white font-extrabold text-xs">
                          {b.name.slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-sm font-bold text-[#0f3a31]">{b.name}</Text>
                        <Text className="text-xs text-[#7c8a87] mt-0.5">{b.masked}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveBank(b.id)}>
                      <Text className="text-xs font-bold text-[#ef4444]">Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={() => {
                setBanksOpen(false);
                setAddBankOpen(true);
              }}
              className="mt-6 w-full bg-[#0f4a3f] py-3.5 rounded-2xl flex-row justify-center items-center space-x-2"
            >
              <Plus size={16} color="#ffffff" />
              <Text className="text-white font-bold text-xs">Add & link new bank</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Bank Dialog Modal */}
      <Modal
        visible={addBankOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setAddBankOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-[#0f3a31] mb-1">Link a new bank</Text>
            <Text className="text-xs text-[#7c8a87] mb-5">
              Verified with Razorpay before linking.
            </Text>

            <ScrollView className="space-y-4">
              <View>
                <Text className="text-xs font-bold text-[#7c8a87] mb-1">Select bank</Text>
                <View className="flex-row flex-wrap gap-1.5 mt-1 bg-gray-50 p-1.5 rounded-2xl mb-3">
                  {POPULAR_BANKS.map((b) => (
                    <TouchableOpacity
                      key={b}
                      onPress={() => setNewBankName(b)}
                      className={`px-3 py-1.5 rounded-xl ${newBankName === b ? "bg-[#0f4a3f] shadow-sm" : "bg-transparent"
                        }`}
                    >
                      <Text
                        className={`text-[10px] font-bold ${newBankName === b ? "text-white" : "text-[#7c8a87]"
                          }`}
                      >
                        {b}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  value={newBankName}
                  onChangeText={setNewBankName}
                  placeholder="Or type bank name"
                  className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#0f3a31]"
                />
              </View>

              <View className="mt-3">
                <Text className="text-xs font-bold text-[#7c8a87] mb-1">Account number</Text>
                <TextInput
                  value={newBankAcc}
                  onChangeText={(val: string) => setNewBankAcc(val.replace(/\D/g, ""))}
                  keyboardType="numeric"
                  placeholder="9–18 digit account number"
                  className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#0f3a31]"
                />
              </View>

              <View className="mt-3">
                <Text className="text-xs font-bold text-[#7c8a87] mb-1">IFSC code</Text>
                <TextInput
                  value={newBankIfsc}
                  onChangeText={(val: string) => setNewBankIfsc(val.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  placeholder="e.g. HDFC0001234"
                  className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm font-mono tracking-wider text-[#0f3a31]"
                />
              </View>

              <View className="flex-row space-x-3 mt-6 pt-4 border-t border-[#e5e7eb]">
                <TouchableOpacity
                  onPress={() => setAddBankOpen(false)}
                  className="flex-1 py-3.5 rounded-2xl bg-gray-100 items-center"
                >
                  <Text className="text-xs font-bold text-[#7c8a87]">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleLinkBank}
                  disabled={linking}
                  className="flex-1 py-3.5 rounded-2xl bg-[#0f4a3f] items-center"
                >
                  <Text className="text-xs font-bold text-white">
                    {linking ? "Verifying…" : "Verify & Link"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Reports Dialog Modal */}
      <Modal
        visible={reportsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setReportsOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-[#0f3a31] mb-1">Reports & statements</Text>
            <Text className="text-xs text-[#7c8a87] mb-5">Pick a range to download your statement.</Text>

            <View className="flex-row bg-[#f3f4f6] rounded-2xl p-1 mb-5">
              {(["day", "month", "year", "custom"] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setRange(r)}
                  className={`flex-grow flex-1 py-2 items-center rounded-xl ${range === r ? "bg-white shadow-sm" : ""
                    }`}
                >
                  <Text className={`text-xs font-bold ${range === r ? "text-[#0f3a31]" : "text-[#7c8a87]"}`}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {range !== "custom" ? (
              <View className="bg-gray-50 border border-[#e5e7eb] rounded-2xl p-4 items-center">
                <Text className="text-[10px] uppercase tracking-wider text-[#7c8a87] font-bold">Current {range}</Text>
                <Text className="text-base font-extrabold text-[#0f3a31] mt-1">
                  {range === "day" && new Date().toLocaleDateString("en-IN", { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  {range === "month" && new Date().toLocaleDateString("en-IN", { month: 'long', year: 'numeric' })}
                  {range === "year" && new Date().getFullYear()}
                </Text>
              </View>
            ) : (
              <View className="flex-row space-x-2">
                <TouchableOpacity
                  onPress={() => openCalendar("from")}
                  className="flex-1 bg-white border border-[#e5e7eb] rounded-2xl px-3 py-3 flex-row items-center justify-center space-x-2"
                >
                  <CalendarIcon size={14} color="#7c8a87" />
                  <Text className="text-xs text-[#0f3a31] font-bold">
                    {fromDate ? fromDate.toLocaleDateString("en-IN") : "From Date"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => openCalendar("to")}
                  className="flex-1 bg-white border border-[#e5e7eb] rounded-2xl px-3 py-3 flex-row items-center justify-center space-x-2"
                >
                  <CalendarIcon size={14} color="#7c8a87" />
                  <Text className="text-xs text-[#0f3a31] font-bold">
                    {toDate ? toDate.toLocaleDateString("en-IN") : "To Date"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View className="flex-row space-x-3 mt-6 pt-4 border-t border-[#e5e7eb]">
              <TouchableOpacity
                onPress={() => setReportsOpen(false)}
                className="flex-1 py-3.5 rounded-2xl bg-gray-100 items-center"
              >
                <Text className="text-xs font-bold text-[#7c8a87]">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDownloadReport}
                className="flex-1 py-3.5 rounded-2xl bg-[#0f4a3f] flex-row justify-center items-center space-x-2"
              >
                <Download size={14} color="#ffffff" />
                <Text className="text-white font-bold text-xs">Download</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sign Out Confirm Modal */}
      <Modal
        visible={signOutOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSignOutOpen(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <Text className="text-lg font-bold text-[#0f3a31] mb-2">Sign out?</Text>
            <Text className="text-sm text-[#7c8a87] mb-6">
              You'll need to log in again to view your finances.
            </Text>
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity
                onPress={() => setSignOutOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-gray-100"
              >
                <Text className="text-xs font-bold text-[#7c8a87]">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSignOut}
                className="px-4 py-2.5 rounded-xl bg-red-500"
              >
                <Text className="text-xs font-bold text-white">Sign out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Smart Calendar Modal */}
      <SmartCalendarModal
        visible={calendarOpen}
        value={calendarTarget === "from" ? fromDate : toDate}
        title={calendarTarget === "from" ? "Select From Date" : "Select To Date"}
        onSelect={handleSelectCalendarDay}
        onClose={() => setCalendarOpen(false)}
      />
    </ScrollView>
  );
}
