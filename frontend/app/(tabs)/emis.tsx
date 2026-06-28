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
import {
  Plus as PlusIcon,
  Zap as ZapIcon,
  Calendar as CalendarIconComponent,
  Percent as PercentIcon,
  Pencil as PencilIcon,
  Trash2 as Trash2Icon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ChevronDown as ChevronDownIcon
} from "lucide-react-native";

const Plus = PlusIcon as any;
const Zap = ZapIcon as any;
const CalendarIcon = CalendarIconComponent as any;
const Percent = PercentIcon as any;
const Pencil = PencilIcon as any;
const Trash2 = Trash2Icon as any;
const ChevronLeft = ChevronLeftIcon as any;
const ChevronRight = ChevronRightIcon as any;
const ChevronDown = ChevronDownIcon as any;

import { apiFetch } from "../../lib/api";
import SmartCalendarModal from "../../components/SmartCalendarModal";

type Loan = {
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
  start_date?: string;
  end_date?: string;
};

const FILTERS = ["All", "Home", "Personal", "Auto", "Education", "Consumer"] as const;

export default function EmisPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [loading, setLoading] = useState(true);
  const [confirmAllModal, setConfirmAllModal] = useState(false);

  // Add / Edit form states
  const [formOpen, setFormOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [deleteConfirmLoan, setDeleteConfirmLoan] = useState<Loan | null>(null);
  const [formLoanName, setFormLoanName] = useState("");
  const [formLenderName, setFormLenderName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formTenure, setFormTenure] = useState("60");
  const [formLeftAmount, setFormLeftAmount] = useState("");
  const [formEmi, setFormEmi] = useState("");
  const [formRate, setFormRate] = useState("");
  const [formType, setFormType] = useState("Personal");
  const [formDueDay, setFormDueDay] = useState("5");
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // Auto-calculate EMI when Loan Amount, Rate, or Tenure changes
  useEffect(() => {
    const principal = Number(formAmount);
    const rate = Number(formRate);
    const tenure = Number(formTenure);
    
    if (principal > 0 && rate > 0 && tenure > 0) {
      const monthlyRate = rate / (12 * 100);
      const calculated = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);
      if (isFinite(calculated) && calculated > 0) {
        setFormEmi(String(Math.round(calculated)));
      } else {
        setFormEmi("");
      }
    } else {
      setFormEmi("");
    }
  }, [formAmount, formRate, formTenure]);

  // Auto-calculate endDate when startDate or formTenure changes
  useEffect(() => {
    if (startDate && formTenure) {
      const tenureVal = Number(formTenure) || 60;
      const end = new Date(startDate);
      end.setMonth(end.getMonth() + tenureVal);
      setEndDate(end);
    } else {
      setEndDate(null);
    }
  }, [startDate, formTenure]);

  const formatDateForDisplay = (d: Date | null) => {
    if (!d) return "Select Date";
    const monthsList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = String(d.getDate()).padStart(2, "0");
    const m = monthsList[d.getMonth()];
    const y = d.getFullYear();
    return `${day}-${m}-${y}`;
  };

  // Calendar modal state
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState<"start" | "end">("start");

  const fetchLoans = async () => {
    try {
      const data = await apiFetch<Loan[]>("/api/loans");
      setLoans(data);
    } catch (err: any) {
      Alert.alert("Error", "Failed to load loans.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const calculateTenure = (start: Date | null, end: Date | null) => {
    if (!start || !end) return "24 months";
    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return `${Math.max(1, diffMonths)} months`;
  };

  const handlePayOne = async (id: number, emiAmount: number) => {
    setLoading(true);
    try {
      await apiFetch("/api/payments/verify-signature", {
        method: "POST",
        body: JSON.stringify({
          razorpay_order_id: `order_mock_${Date.now()}`,
          razorpay_payment_id: `mock_pay_${Date.now()}`,
          razorpay_signature: "mock_signature",
          loan_ids: [id],
          amount: emiAmount,
          is_mock: true,
        }),
      });
      Alert.alert("Success", "EMI marked paid!");
      fetchLoans();
    } catch (err: any) {
      Alert.alert("Operation Failed", err.message || "Failed to record payment");
      setLoading(false);
    }
  };

  const handlePayAll = async () => {
    setConfirmAllModal(false);
    const unpaidLoans = loans.filter((l) => !l.paid);
    const totalAmount = unpaidLoans.reduce((s, l) => s + l.emi, 0);
    const unpaidLoanIds = unpaidLoans.map((l) => l.id);

    setLoading(true);
    try {
      await apiFetch("/api/payments/verify-signature", {
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
      Alert.alert("Success", "All EMIs marked paid!");
      fetchLoans();
    } catch (err: any) {
      Alert.alert("Operation Failed", err.message || "Failed to mark EMIs as paid");
      setLoading(false);
    }
  };

  const calculatePrincipal = (emi: number, annualRate: number, tenureMonths: number) => {
    if (!emi || !annualRate || !tenureMonths) return 0;
    const monthlyRate = annualRate / (12 * 100);
    if (monthlyRate === 0) return emi * tenureMonths;
    const principal = (emi * (Math.pow(1 + monthlyRate, tenureMonths) - 1)) / (monthlyRate * Math.pow(1 + monthlyRate, tenureMonths));
    return isFinite(principal) ? Math.round(principal) : 0;
  };

  const handleOpenAdd = () => {
    setEditingLoan(null);
    setFormLoanName("");
    setFormLenderName("");
    setFormAmount("");
    setFormRate("");
    setFormTenure("60");
    setFormEmi("");
    setFormDueDay("5");
    setFormLeftAmount("");
    setFormType("Personal");
    setStartDate(new Date());
    setEndDate(null);
    setTypeDropdownOpen(false);
    setFormOpen(true);
  };

  const handleOpenEdit = (l: Loan) => {
    setEditingLoan(l);
    
    let loanName = l.name;
    let lenderName = "";
    const match = l.name.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      loanName = match[1];
      lenderName = match[2];
    }
    setFormLoanName(loanName);
    setFormLenderName(lenderName);

    setFormEmi(String(l.emi));
    setFormRate(String(l.rate));
    setFormType(l.type);
    setFormDueDay(String(l.due));
    
    let totalTenure = 60;
    if (l.tenure && l.tenure.includes("/")) {
      totalTenure = Number(l.tenure.split("/")[1]) || 60;
    }
    setFormTenure(String(totalTenure));
    
    const principalVal = calculatePrincipal(l.emi, l.rate, totalTenure);
    setFormAmount(String(principalVal));
    setFormLeftAmount(String(Math.round(l.left)));

    setStartDate(l.start_date ? new Date(l.start_date) : new Date());
    setEndDate(l.end_date ? new Date(l.end_date) : null);
    setTypeDropdownOpen(false);
    setFormOpen(true);
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSaveLoan = async () => {
    console.log("handleSaveLoan triggered!");
    console.log("Form values:", {
      formLoanName,
      formLenderName,
      formAmount,
      formRate,
      formTenure,
      startDate,
      formEmi,
      formDueDay,
      formLeftAmount,
      formType
    });

    if (!formLoanName || !formLenderName || !formAmount || !formRate || !formTenure || !startDate) {
      showAlert("Input Error", "All fields marked with * are required.");
      return;
    }

    const parsedEmi = Number(formEmi);
    const parsedRate = Number(formRate) || 12;
    const parsedDue = Number(formDueDay) || 5;
    const tenureVal = Number(formTenure) || 60;
    
    // Calculate end date from start date + tenure
    const calculatedEndDate = new Date(startDate);
    calculatedEndDate.setMonth(calculatedEndDate.getMonth() + tenureVal);

    // Calculate left amount (Outstanding Balance)
    const elapsedMonths = startDate ? Math.max(0, (new Date().getFullYear() - startDate.getFullYear()) * 12 + (new Date().getMonth() - startDate.getMonth())) : 0;
    const paidTenureVal = Math.min(tenureVal, elapsedMonths);
    const leftAmountVal = formLeftAmount ? Number(formLeftAmount) : (parsedEmi * (tenureVal - paidTenureVal));

    const combinedName = `${formLoanName.trim()} (${formLenderName.trim()})`;

    setLoading(true);
    setFormOpen(false);
    setTypeDropdownOpen(false);
    try {
      if (editingLoan) {
        // Edit loan
        await apiFetch(`/api/loans/${editingLoan.id}`, {
          method: "PUT",
          body: JSON.stringify({
            name: combinedName,
            type: formType,
            emi: parsedEmi,
            rate: parsedRate,
            due_day: parsedDue,
            start_date: startDate.toISOString(),
            end_date: calculatedEndDate.toISOString(),
            left_amount: leftAmountVal,
            total_tenure: tenureVal,
            paid_tenure: paidTenureVal,
          }),
        });
        showAlert("Success", "Loan updated successfully");
      } else {
        // Add new loan
        await apiFetch("/api/loans", {
          method: "POST",
          body: JSON.stringify({
            name: combinedName,
            type: formType,
            emi: parsedEmi,
            rate: parsedRate,
            due_day: parsedDue,
            start_date: startDate.toISOString(),
            end_date: calculatedEndDate.toISOString(),
            left_amount: leftAmountVal,
            total_tenure: tenureVal,
            paid_tenure: paidTenureVal,
          }),
        });
        showAlert("Success", "New loan added successfully");
      }
      fetchLoans();
    } catch (err: any) {
      showAlert("Error", err.message || "Failed to save loan details");
      setLoading(false);
    }
  };

  const handleDeleteLoan = (l: Loan) => {
    setDeleteConfirmLoan(l);
  };

  const performDeleteLoan = async () => {
    if (!deleteConfirmLoan) return;
    setLoading(true);
    const loanToDelete = deleteConfirmLoan;
    setDeleteConfirmLoan(null);
    try {
      await apiFetch(`/api/loans/${loanToDelete.id}`, { method: "DELETE" });
      Alert.alert("Deleted", "Loan removed successfully");
      fetchLoans();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to delete loan");
      setLoading(false);
    }
  };

  const openCalendar = (target: "start" | "end") => {
    setCalendarTarget(target);
    setCalendarOpen(true);
  };

  const handleSelectCalendarDay = (date: Date) => {
    if (calendarTarget === "start") {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
    setCalendarOpen(false);
  };

  const visibleLoans = filter === "All" ? loans : loans.filter((l) => l.type === filter);
  const totalUnpaid = loans.filter((l) => !l.paid).reduce((s, l) => s + l.emi, 0);

  if (loading && loans.length === 0) {
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
          <Text className="text-2xl font-extrabold text-[#0f3a31]">Your EMIs</Text>
          <Text className="text-xs text-[#7c8a87] font-semibold">{loans.length} active loans</Text>
        </View>
        <TouchableOpacity
          onPress={handleOpenAdd}
          className="w-10 h-10 rounded-full bg-[#0f4a3f] justify-center items-center shadow-lg"
        >
          <Plus size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Aggregate Balance Card */}
      <View className="px-5">
        <View className="bg-[#0f4a3f] rounded-3xl p-5 relative overflow-hidden shadow-md">
          <Text className="text-xs uppercase tracking-wider text-white/75 font-bold">Total monthly EMI</Text>
          <Text className="text-3xl font-extrabold text-white mt-1">₹ {totalUnpaid.toLocaleString("en-IN")}</Text>
          <Text className="text-xs text-white/70 mt-1 font-semibold">Across {loans.length} lenders · Due by 15th</Text>

          <TouchableOpacity
            onPress={() => {
              if (totalUnpaid === 0) {
                Alert.alert("On Track", "All EMIs marked paid for this cycle ✓");
              } else {
                setConfirmAllModal(true);
              }
            }}
            className="mt-5 w-full bg-white rounded-2xl py-3.5 items-center flex-row justify-center space-x-2 shadow-sm"
          >
            <Zap size={14} color="#f59e0b" fill="#f59e0b" />
            <Text className="text-[#0f3a31] font-extrabold text-xs">Record All Payments</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Horizontal Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-5 mt-5 max-h-10"
      >
        <View className="flex-row space-x-2">
          {FILTERS.map((t) => {
            const isActive = t === filter;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setFilter(t)}
                className={`px-4 py-1.5 rounded-full border mr-2 ${
                  isActive ? "bg-[#0d1512] border-[#0d1512]" : "bg-white border-[#e5e7eb]"
                }`}
              >
                <Text className={`text-xs font-bold ${isActive ? "text-white" : "text-[#7c8a87]"}`}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Loans List */}
      <View className="px-5 mt-5 space-y-3 pb-8">
        {visibleLoans.length === 0 && (
          <Text className="text-center text-sm text-[#7c8a87] py-8">No {filter} loans tracked.</Text>
        )}

        {visibleLoans.map((l) => {
          const [done, totalT] = l.tenure.split("/").map(Number);
          const percentage = totalT > 0 ? (done / totalT) * 100 : 0;

          return (
            <View
              key={l.id}
              className={`bg-white border border-[#e5e7eb] rounded-3xl p-4 mb-3 shadow-sm ${
                l.paid ? "opacity-60" : ""
              }`}
            >
              <View className="flex-row items-start">
                <View className="w-12 h-12 rounded-2xl bg-gray-100 justify-center items-center text-xl">
                  <Text className="text-lg">{l.logo}</Text>
                </View>
                <View className="ml-3 flex-grow">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-bold text-sm text-[#0f3a31]">{l.name}</Text>
                    <Text className="font-extrabold text-sm text-[#0f3a31]">
                      ₹{l.emi.toLocaleString("en-IN")}
                    </Text>
                  </View>
                  <View className="flex-row items-center space-x-3 mt-1.5">
                    <View className="bg-gray-100 px-2.5 py-0.5 rounded-full mr-2">
                      <Text className="text-[10px] font-bold text-[#7c8a87]">{l.type}</Text>
                    </View>
                    <View className="flex-row items-center mr-2">
                      <Percent size={10} color="#7c8a87" className="mr-0.5" />
                      <Text className="text-[10px] text-[#7c8a87] font-semibold">{l.rate}%</Text>
                    </View>
                    <View className="flex-row items-center">
                      <CalendarIcon size={10} color="#7c8a87" className="mr-0.5" />
                      <Text className="text-[10px] text-[#7c8a87] font-semibold">Due {l.due}th</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Progress Slider */}
              <View className="mt-4">
                <View className="flex-row justify-between text-[10px] text-[#7c8a87] mb-1">
                  <Text>Outstanding ₹Text{(l.left / 100000).toFixed(1)}L</Text>
                  <Text>{l.tenure} months</Text>
                </View>
                <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </View>
              </View>

              {/* Action buttons */}
              <View className="mt-4 flex-row space-x-2">
                <TouchableOpacity
                  disabled={l.paid}
                  onPress={() => handlePayOne(l.id, l.emi)}
                  className={`flex-1 py-2.5 rounded-xl justify-center items-center ${
                    l.paid ? "bg-emerald-50" : "bg-[#0f4a3f]"
                  }`}
                >
                  <Text className={`text-xs font-bold ${l.paid ? "text-emerald-600" : "text-white"}`}>
                    {l.paid ? "Paid ✓" : "Mark paid"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleOpenEdit(l)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 justify-center items-center"
                >
                  <Pencil size={14} color="#0f3a31" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteLoan(l)}
                  className="px-4 py-2.5 rounded-xl bg-red-50 justify-center items-center"
                >
                  <Trash2 size={14} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* Aggregate Pay Confirm Modal */}
      <Modal
        visible={confirmAllModal}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmAllModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <Text className="text-lg font-bold text-[#0f3a31] mb-2">Record all as paid?</Text>
            <Text className="text-xs text-[#7c8a87] mb-6">
              ₹ {totalUnpaid.toLocaleString("en-IN")} across {loans.filter((l) => !l.paid).length} lenders will be marked as paid in your tracker.
            </Text>
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity
                onPress={() => setConfirmAllModal(false)}
                className="px-4 py-2.5 rounded-xl bg-gray-100"
              >
                <Text className="text-xs font-bold text-[#7c8a87]">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePayAll}
                className="px-4 py-2.5 rounded-xl bg-[#0f4a3f]"
              >
                <Text className="text-xs font-bold text-white">Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add / Edit Loan Dialog Modal */}
      <Modal
        visible={formOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFormOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
            <Text className="text-lg font-bold text-[#0f3a31] mb-1">
              {editingLoan ? "Edit Loan Tracker" : "Add a loan"}
            </Text>
            <Text className="text-xs text-[#7c8a87] mb-5">
              {editingLoan ? `Modify details for ${editingLoan.name}` : "Track a new EMI in FIM."}
            </Text>
            <ScrollView className="space-y-4">
              <View>
                <Text className="text-xs font-bold text-[#7c8a87] mb-1">Loan Name *</Text>
                <TextInput
                  value={formLoanName}
                  onChangeText={setFormLoanName}
                  placeholder=""
                  placeholderTextColor="#9ca3af"
                  className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#0f3a31]"
                />
              </View>

              <View className="mt-3">
                <Text className="text-xs font-bold text-[#7c8a87] mb-1">Lender / Bank Name *</Text>
                <TextInput
                  value={formLenderName}
                  onChangeText={setFormLenderName}
                  placeholder=""
                  placeholderTextColor="#9ca3af"
                  className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#0f3a31]"
                />
              </View>

              <View className="flex-row space-x-3 mt-3">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-[#7c8a87] mb-1">Loan Amount *</Text>
                  <TextInput
                    value={formAmount}
                    onChangeText={setFormAmount}
                    keyboardType="numeric"
                    placeholder=""
                    placeholderTextColor="#9ca3af"
                    className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#0f3a31]"
                  />
                </View>
                <View className="flex-grow flex-1">
                  <Text className="text-xs font-bold text-[#7c8a87] mb-1">Interest Rate (ROI) *</Text>
                  <TextInput
                    value={formRate}
                    onChangeText={setFormRate}
                    keyboardType="numeric"
                    placeholder=""
                    placeholderTextColor="#9ca3af"
                    className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#0f3a31]"
                  />
                </View>
              </View>

              <View className="flex-row space-x-3 mt-3">
                <View className="flex-grow flex-1">
                  <Text className="text-xs font-bold text-[#7c8a87] mb-1">Loan Tenure (Months) *</Text>
                  <TextInput
                    value={formTenure}
                    onChangeText={setFormTenure}
                    keyboardType="numeric"
                    placeholder=""
                    placeholderTextColor="#9ca3af"
                    className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#0f3a31]"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-[#7c8a87] mb-1">Loan Start Date *</Text>
                  <TouchableOpacity
                    onPress={() => openCalendar("start")}
                    className="w-full bg-white border border-[#e5e7eb] rounded-2xl px-4 py-3 flex-row items-center justify-between"
                  >
                    <Text className="text-sm text-[#0f3a31] font-semibold">
                      {formatDateForDisplay(startDate)}
                    </Text>
                    <CalendarIcon size={14} color="#7c8a87" />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row space-x-3 mt-3">
                <View className="flex-1">
                  <Text className="text-xs font-bold text-[#7c8a87] mb-1">EMI Amount (Auto Calculated)</Text>
                  <TextInput
                    value={formEmi ? `₹${Number(formEmi).toLocaleString("en-IN")}` : "Calculated automatically"}
                    editable={false}
                    className="w-full bg-gray-100 border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-gray-500 font-bold"
                  />
                </View>
                <View className="flex-grow flex-1">
                  <Text className="text-xs font-bold text-[#7c8a87] mb-1">EMI Due Day *</Text>
                  <TextInput
                    value={formDueDay}
                    onChangeText={setFormDueDay}
                    keyboardType="numeric"
                    placeholder=""
                    placeholderTextColor="#9ca3af"
                    className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#0f3a31]"
                  />
                </View>
              </View>

              <View className="mt-3">
                <Text className="text-xs font-bold text-[#7c8a87] mb-1">Outstanding Balance</Text>
                <TextInput
                  value={formLeftAmount}
                  onChangeText={setFormLeftAmount}
                  keyboardType="numeric"
                  placeholder=""
                  placeholderTextColor="#9ca3af"
                  className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-2xl px-4 py-3 text-sm text-[#0f3a31]"
                />
              </View>

              <View className="mt-3">
                <Text className="text-xs font-bold text-[#7c8a87] mb-1">Loan Category / Type</Text>
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
                      {["Home", "Personal", "Auto", "Education", "Consumer"].map((t) => (
                        <TouchableOpacity
                          key={t}
                          onPress={() => {
                            setFormType(t);
                            setTypeDropdownOpen(false);
                          }}
                          className={`px-4 py-3 border-b border-[#f3f4f6] ${
                            formType === t ? "bg-emerald-50/50" : ""
                          }`}
                        >
                          <Text className={`text-xs ${formType === t ? "font-bold text-[#0f4a3f]" : "text-[#0f3a31] font-semibold"}`}>
                            {t}
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
                    setFormOpen(false);
                    setTypeDropdownOpen(false);
                  }}
                  className="flex-1 py-3.5 rounded-2xl bg-gray-100 items-center"
                >
                  <Text className="text-xs font-bold text-[#7c8a87]">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveLoan}
                  className="flex-1 py-3.5 rounded-2xl bg-[#0f4a3f] items-center"
                >
                  <Text className="text-xs font-bold text-white">
                    {editingLoan ? "Save Changes" : "Add loan"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Smart Calendar Modal */}
      <SmartCalendarModal
        visible={calendarOpen}
        value={calendarTarget === "start" ? startDate : endDate}
        title={calendarTarget === "start" ? "Select Start Date" : "Select End Date"}
        onSelect={handleSelectCalendarDay}
        onClose={() => setCalendarOpen(false)}
      />

      {/* Delete Loan Confirmation Modal */}
      <Modal
        visible={deleteConfirmLoan !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmLoan(null)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <Text className="text-lg font-bold text-[#0f3a31] mb-2">Stop tracking loan?</Text>
            <Text className="text-xs text-[#7c8a87] mb-6">
              Are you sure you want to stop tracking {deleteConfirmLoan?.name}? This action cannot be undone.
            </Text>

            <View className="flex-row space-x-3 justify-end">
              <TouchableOpacity
                onPress={() => setDeleteConfirmLoan(null)}
                className="px-4 py-2.5 rounded-xl bg-gray-100"
              >
                <Text className="text-xs font-bold text-[#7c8a87]">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={performDeleteLoan}
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
