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
  Platform,
  Linking,
  Image,
  Animated,
  StyleSheet
} from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { EncodingType } from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import {
  Shield as ShieldIcon,
  Bell as BellIcon,
  CreditCard as CreditCardIcon,
  FileText as FileTextIcon,
  HelpCircle as HelpCircleIcon,
  LogOut as LogOutIcon,
  ChevronRight as ChevronRightOriginal,
  ChevronLeft as ChevronLeftOriginal,
  Crown as CrownIcon,
  Plus as PlusIcon,
  Download as DownloadIcon,
  Calendar as CalendarIconComponent,
  Phone as PhoneIcon,
  Mail as MailIcon,
  MessageSquare as MessageSquareIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  MessageCircle as MessageCircleIcon,
  Camera as CameraIcon,
  Star as StarIcon,
} from "lucide-react-native";

const Shield = ShieldIcon as any;
const Bell = BellIcon as any;
const CreditCard = CreditCardIcon as any;
const FileText = FileTextIcon as any;
const HelpCircle = HelpCircleIcon as any;
const LogOut = LogOutIcon as any;
const ChevronRight = ChevronRightOriginal as any;
const ChevronRightIcon = ChevronRightOriginal as any;
const ChevronLeft = ChevronLeftOriginal as any;
const Crown = CrownIcon as any;
const Plus = PlusIcon as any;
const Download = DownloadIcon as any;
const CalendarIcon = CalendarIconComponent as any;
const Phone = PhoneIcon as any;
const Mail = MailIcon as any;
const MessageSquare = MessageSquareIcon as any;
const Send = SendIcon as any;
const CheckCircle = CheckCircleIcon as any;
const ChevronDown = ChevronDownIcon as any;
const ChevronUp = ChevronUpIcon as any;
const MessageCircle = MessageCircleIcon as any;
const Camera = CameraIcon as any;
const Star = StarIcon as any;
const AnimatedView = Animated.View as any;

import { useAuth, signOut } from "../../lib/auth";
import { apiFetch, USER_KEY, notifyAuthChange } from "../../lib/api";
import SmartCalendarModal from "../../components/SmartCalendarModal";

const DARK_GREEN = '#0D2B22';
const GOLD = '#F5D76E';
const GOLD_MID = '#C9A227';
const GREEN_ACCENT = '#6DCF94';
const TEXT_PRIMARY = '#F0ECD8';
const TEXT_MUTED = 'rgba(240,236,216,0.55)';
const TEXT_DIM = 'rgba(240,236,216,0.4)';
const PILL_BG = 'rgba(255,255,255,0.07)';
const PILL_BORDER = 'rgba(255,255,255,0.12)';
const DIVIDER = 'rgba(255,255,255,0.08)';
const GREEN_BADGE_BG = 'rgba(109,207,148,0.12)';
const GREEN_BADGE_BORDER = 'rgba(109,207,148,0.3)';

const styles = StyleSheet.create({
  card: {
    backgroundColor: DARK_GREEN,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'column',
    alignItems: 'stretch',
    marginTop: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        // @ts-ignore
        boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
      },
    }),
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: GOLD,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: GOLD_MID,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconEmoji: {
    fontSize: 22,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: TEXT_MUTED,
    marginBottom: 8,
  },
  pillsRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PILL_BG,
    borderWidth: 0.5,
    borderColor: PILL_BORDER,
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  pillDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: GREEN_ACCENT,
  },
  pillText: {
    fontSize: 9,
    color: 'rgba(240,236,216,0.7)',
  },
  divider: {
    width: 1,
    height: 52,
    backgroundColor: DIVIDER,
    flexShrink: 0,
    marginHorizontal: 8,
  },
  rightSection: {
    alignItems: 'flex-start',
    gap: 10,
    flexShrink: 0,
  },
  priceBlock: {
    alignItems: 'flex-start',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: -0.4,
    lineHeight: 22,
  },
  pricePer: {
    fontSize: 10.5,
    fontWeight: '500',
    color: 'rgba(245,215,110,0.55)',
  },
  priceSub: {
    fontSize: 10,
    fontWeight: '700',
    color: TEXT_MUTED,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GREEN_BADGE_BG,
    borderWidth: 1,
    borderColor: GREEN_BADGE_BORDER,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GREEN_ACCENT,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: GREEN_ACCENT,
    letterSpacing: 1,
  },
});

const PulsingDot = () => {
  const scale = React.useRef(new Animated.Value(1)).current;
  const opacity = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 0.55,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.25,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <AnimatedView
      style={[styles.pulseDot, { transform: [{ scale }], opacity }]}
    />
  );
};

const FeaturePill = ({ label }: { label: string }) => (
  <View style={styles.pill}>
    <View style={styles.pillDot} />
    <Text style={styles.pillText}>{label}</Text>
  </View>
);

const CustomDropdown = ({
  value,
  options,
  onSelect,
  isOpen,
  onToggle,
  label,
}: {
  value: any;
  options: any[];
  onSelect: (val: any) => void;
  isOpen: boolean;
  onToggle: () => void;
  label?: string;
}) => {
  const handlePrev = () => {
    const currentIndex = options.indexOf(value);
    if (currentIndex > 0) {
      onSelect(options[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    const currentIndex = options.indexOf(value);
    if (currentIndex < options.length - 1) {
      onSelect(options[currentIndex + 1]);
    }
  };

  const hasPrev = options.indexOf(value) > 0;
  const hasNext = options.indexOf(value) < options.length - 1;

  return (
    <View className="relative w-full" style={{ width: "100%" }}>
      <View className="flex-row items-center bg-gray-50 border border-[#e5e7eb] rounded-2xl overflow-hidden">
        {/* Left Arrow Button */}
        <TouchableOpacity
          onPress={handlePrev}
          disabled={!hasPrev}
          className="px-3 py-3 border-r border-[#e5e7eb]"
          style={{ opacity: hasPrev ? 1 : 0.25 }}
        >
          <ChevronLeft size={14} color="#7c8a87" />
        </TouchableOpacity>

        {/* Main Dropdown Button */}
        <TouchableOpacity
          onPress={onToggle}
          className="flex-1 px-4 py-3 flex-row justify-between items-center"
        >
          <Text className="text-sm font-bold text-[#0f3a31]" style={{ paddingRight: 6 }}>
            {value}{" "}
          </Text>
          <ChevronDown size={14} color="#7c8a87" />
        </TouchableOpacity>

        {/* Right Arrow Button */}
        <TouchableOpacity
          onPress={handleNext}
          disabled={!hasNext}
          className="px-3 py-3 border-l border-[#e5e7eb]"
          style={{ opacity: hasNext ? 1 : 0.25 }}
        >
          <ChevronRight size={14} color="#7c8a87" />
        </TouchableOpacity>
      </View>

      {/* Options Selector Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={onToggle}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onToggle}
          className="flex-1 justify-center items-center bg-black/45 px-6"
        >
          <View
            onStartShouldSetResponder={() => true}
            className="bg-white rounded-3xl w-full max-w-[320px] overflow-hidden shadow-2xl"
            style={{ maxHeight: "50%" }}
          >
            {/* Header */}
            <View className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex-row justify-between items-center">
              <Text className="text-xs font-bold text-[#0f3a31] uppercase tracking-wider">
                Select {label || "Option"}
              </Text>
              <TouchableOpacity onPress={onToggle}>
                <Text className="text-xs font-bold text-[#0f4a3f]">Done</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable List */}
            <ScrollView
              className="py-1"
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => {
                    onSelect(opt);
                    onToggle();
                  }}
                  className={`px-5 py-3 flex-row justify-between items-center ${
                    value === opt ? "bg-emerald-50" : ""
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      value === opt ? "font-bold text-[#0f4a3f]" : "text-[#7c8a87]"
                    }`}
                    style={{ paddingRight: 6 }}
                  >
                    {opt}{" "}
                  </Text>
                  {value === opt && (
                    <CheckCircle size={16} color="#0f4a3f" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

type Bank = { id: number; name: string; masked: string };

const POPULAR_BANKS = ["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak Mahindra", "Yes Bank", "IDFC First", "PNB"];

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [premium, setPremium] = useState(user?.premium || false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

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
  const [selectedAnchorDate, setSelectedAnchorDate] = useState<Date>(new Date());
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handlePrevPeriod = () => {
    const next = new Date(selectedAnchorDate);
    if (range === "day") {
      next.setDate(next.getDate() - 1);
    } else if (range === "month") {
      next.setMonth(next.getMonth() - 1);
    } else if (range === "year") {
      next.setFullYear(next.getFullYear() - 1);
    }
    setSelectedAnchorDate(next);
  };

  const handleNextPeriod = () => {
    const next = new Date(selectedAnchorDate);
    if (range === "day") {
      next.setDate(next.getDate() + 1);
    } else if (range === "month") {
      next.setMonth(next.getMonth() + 1);
    } else if (range === "year") {
      next.setFullYear(next.getFullYear() + 1);
    }
    setSelectedAnchorDate(next);
  };

  // Help & Support
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportSubject, setSupportSubject] = useState("General");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSending, setSupportSending] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

  const FAQS = [
    { q: "How does Smart Pay work?", a: "Smart Pay dynamically schedules your EMIs around your cash inflows to minimize interest charges." },
    { q: "Can I link multiple bank accounts?", a: "Yes! Go to Account > Linked accounts to add as many banks as you need." },
    { q: "How long does statement generation take?", a: "Statements are generated in real-time and download instantly in CSV format." },
    { q: "How do I cancel my Premium subscription?", a: "You can toggle your Premium status at any time directly from the profile screen with a single tap." }
  ];

  const handleSendSupport = async () => {
    if (!supportMessage.trim()) {
      Alert.alert("Input Error", "Please write a message so we can help you.");
      return;
    }
    setSupportSending(true);
    try {
      await apiFetch("/api/user/support-ticket", {
        method: "POST",
        body: JSON.stringify({
          subject: supportSubject,
          message: supportMessage,
        }),
      });
      setSupportMessage("");
      setSupportSuccess(true);
      setTimeout(() => {
        setSupportSuccess(false);
        setSupportOpen(false);
      }, 1800);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to send message.");
    } finally {
      setSupportSending(false);
    }
  };

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

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

  const handlePickPhoto = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/jpeg", "image/png"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];
      
      // Validation size limit of 2MB
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (asset.size && asset.size > maxSize) {
        if (Platform.OS === "web") {
          window.alert("File Too Large: The selected file is larger than 2MB. Please choose a smaller file.");
        } else {
          Alert.alert("File Too Large", "The selected file is larger than 2MB. Please choose a smaller file.");
        }
        return;
      }

      // Verify extension is jpg or png
      const extension = asset.name.split('.').pop()?.toLowerCase();
      if (!extension || !["jpg", "jpeg", "png"].includes(extension)) {
        if (Platform.OS === "web") {
          window.alert("Invalid File Type: Only JPG and PNG files are allowed.");
        } else {
          Alert.alert("Invalid File Type", "Only JPG and PNG files are allowed.");
        }
        return;
      }

      setLoading(true);

      let dataUri = "";
      if (Platform.OS === "web") {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        dataUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        const base64Content = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const mimeType = asset.mimeType || `image/${extension === "png" ? "png" : "jpeg"}`;
        dataUri = `data:${mimeType};base64,${base64Content}`;
      }

      // Upload to backend
      const updatedUser = await apiFetch<any>("/api/user/photo", {
        method: "POST",
        body: JSON.stringify({ photo_data: dataUri }),
      });

      // Save to AsyncStorage and notify listeners
      const AsyncStorage = require("@react-native-async-storage/async-storage").default;
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      notifyAuthChange();
      
      if (Platform.OS === "web") {
        window.alert("Profile photo uploaded successfully!");
      } else {
        Alert.alert("Success", "Profile photo uploaded successfully!");
      }
    } catch (err: any) {
      console.log("Error uploading photo:", err);
      if (Platform.OS === "web") {
        window.alert(err.message || "Failed to upload photo.");
      } else {
        Alert.alert("Upload Error", err.message || "Failed to upload photo.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhoto = async () => {
    const performRemove = async () => {
      setLoading(true);
      try {
        const updatedUser = await apiFetch<any>("/api/user/photo", {
          method: "POST",
          body: JSON.stringify({ photo_data: null }),
        });
        const AsyncStorage = require("@react-native-async-storage/async-storage").default;
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        notifyAuthChange();
        if (Platform.OS === "web") {
          window.alert("Profile photo has been removed.");
        } else {
          Alert.alert("Removed", "Profile photo has been removed.");
        }
      } catch (err: any) {
        if (Platform.OS === "web") {
          window.alert(err.message || "Failed to remove profile photo");
        } else {
          Alert.alert("Error", err.message || "Failed to remove profile photo");
        }
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to remove your profile photo?")) {
        performRemove();
      }
    } else {
      Alert.alert(
        "Remove Photo",
        "Are you sure you want to remove your profile photo?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Remove", style: "destructive", onPress: performRemove },
        ]
      );
    }
  };

  const handleAvatarPress = () => {
    setPhotoModalOpen(true);
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
          fromDate: range === "custom" ? (fromDate?.toISOString() || null) : selectedAnchorDate.toISOString(),
          toDate: range === "custom" ? (toDate?.toISOString() || null) : null,
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
        { icon: HelpCircle, label: "Help & support", note: "", comingSoon: false, onClick: () => setSupportOpen(true) },
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
        <TouchableOpacity
          onPress={handleAvatarPress}
          activeOpacity={0.8}
          className="relative w-16 h-16 rounded-[20px] justify-center items-center shadow-sm"
        >
          {user?.photo_data ? (
            <Image
              source={{ uri: user.photo_data }}
              className="w-full h-full rounded-[20px] border border-[#0f4a3f]/10"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full rounded-[20px] bg-[#0f4a3f] justify-center items-center">
              <Text className="text-white font-extrabold text-xl">{user?.initials || "FI"}</Text>
            </View>
          )}
          {/* Camera overlay badge */}
          <View className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0d6e59] justify-center items-center border border-white shadow">
            <Camera size={11} color="white" />
          </View>
        </TouchableOpacity>
        <View className="ml-4 flex-1">
          <Text className="text-lg font-bold text-[#0f3a31]">{user?.name || "Guest"}</Text>
          <Text className="text-xs text-[#7c8a87] font-semibold">{user?.email}{user?.phone ? ` · ${user.phone}` : ""}</Text>
          <View className="flex-row gap-1.5 mt-1.5">
            {premium && (
              <View className="bg-emerald-50 px-2 py-0.5 rounded-full">
                <Text className="text-[10px] text-emerald-600 font-bold">Premium</Text>
              </View>
            )}
            {user?.verified ? (
              <View className="bg-emerald-50 px-2 py-0.5 rounded-full">
                <Text className="text-[10px] text-emerald-600 font-bold">Email Verified</Text>
              </View>
            ) : (
              <View className="bg-amber-50 px-2 py-0.5 rounded-full">
                <Text className="text-[10px] text-amber-600 font-bold">Email Not Verified</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Premium upgrade promo */}
      <View style={styles.card}>
        <Text style={styles.cardHeaderTitle}>FIM Premium</Text>
        <View style={styles.cardBody}>
          {/* ── Left ── */}
          <View style={styles.leftSection}>
            {/* Icon badge */}
            <View style={styles.iconWrap}>
              <Text style={styles.iconEmoji}>👑</Text>
            </View>

            {/* Text content */}
            <View style={styles.textBlock}>
              <View style={styles.pillsRow}>
                <FeaturePill label="Smart Pay" />
                <FeaturePill label="AI Advisor" />
                <FeaturePill label="Refinance Alerts" />
              </View>
            </View>
          </View>

          {/* ── Divider ── */}
          <View style={styles.divider} />

          {/* ── Right ── */}
          <View style={styles.rightSection}>
            <View style={styles.priceBlock}>
              <Text style={styles.priceText}>
                ₹199<Text style={styles.pricePer}>/Month</Text>
              </Text>
              <Text style={[styles.priceText, { marginTop: 3 }]}>
                ₹999<Text style={styles.pricePer}>/Year</Text>
              </Text>
            </View>

            <View style={styles.badge}>
              <PulsingDot />
              <Text style={styles.badgeText}>COMING SOON</Text>
            </View>
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

             {range !== "custom" && (
              <View className="space-y-4" style={{ zIndex: openDropdown ? 50 : 1 }}>
                {range === "day" && (
                  <View className="space-y-3" style={{ zIndex: openDropdown ? 50 : 1 }}>
                    {/* Day Dropdown */}
                    <View style={{ zIndex: openDropdown === "day" ? 10 : 1 }}>
                      <Text className="text-[10px] uppercase tracking-wider text-[#7c8a87] font-bold mb-1">Day</Text>
                      <CustomDropdown
                        value={selectedAnchorDate.getDate()}
                        options={Array.from({ length: 31 }, (_, i) => i + 1)}
                        isOpen={openDropdown === "day"}
                        onToggle={() => setOpenDropdown(openDropdown === "day" ? null : "day")}
                        onSelect={(day) => {
                          const next = new Date(selectedAnchorDate);
                          next.setDate(day);
                          setSelectedAnchorDate(next);
                        }}
                        label="Day"
                      />
                    </View>
                    {/* Month Dropdown */}
                    <View style={{ zIndex: openDropdown === "month" ? 10 : 1 }}>
                      <Text className="text-[10px] uppercase tracking-wider text-[#7c8a87] font-bold mb-1">Month</Text>
                      <CustomDropdown
                        value={months[selectedAnchorDate.getMonth()]}
                        options={months}
                        isOpen={openDropdown === "month"}
                        onToggle={() => setOpenDropdown(openDropdown === "month" ? null : "month")}
                        onSelect={(monthStr) => {
                          const next = new Date(selectedAnchorDate);
                          next.setMonth(months.indexOf(monthStr));
                          setSelectedAnchorDate(next);
                        }}
                        label="Month"
                      />
                    </View>
                    {/* Year Dropdown */}
                    <View style={{ zIndex: openDropdown === "year" ? 10 : 1 }}>
                      <Text className="text-[10px] uppercase tracking-wider text-[#7c8a87] font-bold mb-1">Year</Text>
                      <CustomDropdown
                        value={selectedAnchorDate.getFullYear()}
                        options={yearOptions}
                        isOpen={openDropdown === "year"}
                        onToggle={() => setOpenDropdown(openDropdown === "year" ? null : "year")}
                        onSelect={(year) => {
                          const next = new Date(selectedAnchorDate);
                          next.setFullYear(year);
                          setSelectedAnchorDate(next);
                        }}
                        label="Year"
                      />
                    </View>
                  </View>
                )}

                {range === "month" && (
                  <View className="space-y-3" style={{ zIndex: openDropdown ? 50 : 1 }}>
                    {/* Month Dropdown */}
                    <View style={{ zIndex: openDropdown === "month" ? 10 : 1 }}>
                      <Text className="text-[10px] uppercase tracking-wider text-[#7c8a87] font-bold mb-1">Month</Text>
                      <CustomDropdown
                        value={months[selectedAnchorDate.getMonth()]}
                        options={months}
                        isOpen={openDropdown === "month"}
                        onToggle={() => setOpenDropdown(openDropdown === "month" ? null : "month")}
                        onSelect={(monthStr) => {
                          const next = new Date(selectedAnchorDate);
                          next.setMonth(months.indexOf(monthStr));
                          setSelectedAnchorDate(next);
                        }}
                        label="Month"
                      />
                    </View>
                    {/* Year Dropdown */}
                    <View style={{ zIndex: openDropdown === "year" ? 10 : 1 }}>
                      <Text className="text-[10px] uppercase tracking-wider text-[#7c8a87] font-bold mb-1">Year</Text>
                      <CustomDropdown
                        value={selectedAnchorDate.getFullYear()}
                        options={yearOptions}
                        isOpen={openDropdown === "year"}
                        onToggle={() => setOpenDropdown(openDropdown === "year" ? null : "year")}
                        onSelect={(year) => {
                          const next = new Date(selectedAnchorDate);
                          next.setFullYear(year);
                          setSelectedAnchorDate(next);
                        }}
                        label="Year"
                      />
                    </View>
                  </View>
                )}

                {range === "year" && (
                  <View style={{ zIndex: openDropdown === "year" ? 10 : 1 }}>
                    <Text className="text-[10px] uppercase tracking-wider text-[#7c8a87] font-bold mb-1">Year</Text>
                    <CustomDropdown
                      value={selectedAnchorDate.getFullYear()}
                      options={yearOptions}
                      isOpen={openDropdown === "year"}
                      onToggle={() => setOpenDropdown(openDropdown === "year" ? null : "year")}
                      onSelect={(year) => {
                        const next = new Date(selectedAnchorDate);
                        next.setFullYear(year);
                        setSelectedAnchorDate(next);
                      }}
                      label="Year"
                    />
                  </View>
                )}
              </View>
            )}

            {range === "custom" && (
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

      {/* Profile Photo Management Modal */}
      <Modal
        visible={photoModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPhotoModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-lg font-bold text-[#0f3a31] mb-1">Profile Photo</Text>
            <Text className="text-xs text-[#7c8a87] mb-5">
              Upload a profile photo (JPG, PNG) under 2MB.
            </Text>

            <View className="space-y-3">
              <TouchableOpacity
                onPress={() => {
                  setPhotoModalOpen(false);
                  handlePickPhoto();
                }}
                className="w-full py-4.5 bg-[#0f4a3f] rounded-2xl justify-center items-center shadow-sm"
                style={{ paddingVertical: 14 }}
              >
                <Text className="text-white font-bold text-sm">Upload New Photo</Text>
              </TouchableOpacity>

              {user?.photo_data ? (
                <TouchableOpacity
                  onPress={() => {
                    setPhotoModalOpen(false);
                    handleRemovePhoto();
                  }}
                  className="w-full py-4.5 bg-red-50 rounded-2xl justify-center items-center border border-red-200"
                  style={{ paddingVertical: 14, marginTop: 10 }}
                >
                  <Text className="text-red-600 font-bold text-sm">Remove Current Photo</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                onPress={() => setPhotoModalOpen(false)}
                className="w-full py-4.5 bg-gray-100 rounded-2xl justify-center items-center"
                style={{ paddingVertical: 14, marginTop: 10 }}
              >
                <Text className="text-[#7c8a87] font-bold text-sm">Cancel</Text>
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

      {/* Help & Support Modal */}
      <Modal
        visible={supportOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSupportOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-white rounded-t-3xl p-6 max-h-[85%]">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-xl font-extrabold text-[#0f3a31]">Help & Support</Text>
                <Text className="text-xs text-[#7c8a87] mt-0.5">We're here to help you 24/7</Text>
              </View>
              <TouchableOpacity
                onPress={() => setSupportOpen(false)}
                className="bg-gray-100 px-3 py-1.5 rounded-full"
              >
                <Text className="text-[#7c8a87] text-xs font-bold">Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Quick Contact Grid */}
              <View className="flex-row space-x-2 mt-2">
                <TouchableOpacity
                  className="flex-1 bg-emerald-50 border border-emerald-100 rounded-2xl p-3 items-center flex-row justify-center space-x-2"
                  onPress={() => {
                    Linking.openURL("https://wa.me/9118003464357?text=Hi%20FIM%20Support%20Team,%20I%20need%20help%20with%20my%20account.");
                  }}
                >
                  <MessageCircle size={16} color="#059669" />
                  <Text className="text-emerald-700 font-bold text-xs">WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 bg-blue-50 border border-blue-100 rounded-2xl p-3 items-center flex-row justify-center space-x-2"
                  onPress={() => {
                    Linking.openURL("tel:+9118003464357");
                  }}
                >
                  <Phone size={16} color="#2563eb" />
                  <Text className="text-blue-700 font-bold text-xs">Call Us</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 bg-purple-50 border border-purple-100 rounded-2xl p-3 items-center flex-row justify-center space-x-2"
                  onPress={() => {
                    Linking.openURL(`mailto:vignovatechnologies@gmail.com?subject=FIM Support Ticket Request [${supportSubject}]&body=Hi FIM Support Team,\n\nI need assistance with: \n\n[Please describe your issue here]\n\nRegards,\n${user?.name || "User"}`);
                  }}
                >
                  <Mail size={16} color="#7c3aed" />
                  <Text className="text-purple-700 font-bold text-xs">Email</Text>
                </TouchableOpacity>
              </View>

              {/* Dynamic Ticket Form */}
              <View className="bg-gray-50 border border-[#e5e7eb] rounded-2xl p-4 mt-4">
                <Text className="text-xs font-bold text-[#0f3a31] mb-2.5">Send a Message</Text>

                {/* Subject Selector */}
                <View className="flex-row space-x-1.5 mb-3">
                  {["General", "Transactions", "Premium", "Refinance"].map((sub) => (
                    <TouchableOpacity
                      key={sub}
                      onPress={() => setSupportSubject(sub)}
                      className={`px-3 py-1.5 rounded-xl border ${supportSubject === sub
                          ? "bg-[#0f4a3f] border-[#0f4a3f]"
                          : "bg-white border-[#e5e7eb]"
                        }`}
                    >
                      <Text className={`text-[10px] font-extrabold ${supportSubject === sub ? "text-white" : "text-[#7c8a87]"
                        }`}>
                        {sub}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Message Input */}
                <View className="bg-white border border-[#e5e7eb] rounded-xl p-3 min-h-[90px] justify-between">
                  <TextInput
                    placeholder="Type your issue or query here..."
                    placeholderTextColor="#9ca3af"
                    multiline
                    value={supportMessage}
                    onChangeText={setSupportMessage}
                    className="text-xs text-[#0f3a31] flex-1"
                    style={{ textAlignVertical: "top" }}
                  />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleSendSupport}
                  disabled={supportSending || supportSuccess}
                  className={`mt-3 py-3 rounded-xl flex-row justify-center items-center space-x-2 ${supportSuccess
                      ? "bg-emerald-500"
                      : "bg-[#0f4a3f]"
                    }`}
                >
                  {supportSending ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : supportSuccess ? (
                    <>
                      <CheckCircle size={14} color="#ffffff" />
                      <Text className="text-white font-bold text-xs">Message Sent!</Text>
                    </>
                  ) : (
                    <>
                      <Send size={12} color="#ffffff" />
                      <Text className="text-white font-bold text-xs">Submit Ticket</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* FAQs Section */}
              <View className="mt-4 mb-6">
                <Text className="text-xs font-extrabold text-[#0f3a31] mb-3">Frequently Asked Questions</Text>
                <View className="space-y-2">
                  {FAQS.map((faq, idx) => {
                    const isOpen = activeFaqIndex === idx;
                    return (
                      <View
                        key={idx}
                        className={`border rounded-2xl overflow-hidden mb-2 ${isOpen ? "bg-white border-[#0f4a3f]/30 shadow-sm" : "bg-white border-[#e5e7eb]"
                          }`}
                      >
                        <TouchableOpacity
                          onPress={() => setActiveFaqIndex(isOpen ? null : idx)}
                          className="p-4 flex-row justify-between items-center"
                        >
                          <Text className={`text-xs font-bold pr-4 flex-1 ${isOpen ? "text-[#0f4a3f]" : "text-[#0f3a31]"}`}>{faq.q}</Text>
                          {isOpen ? <ChevronUp size={14} color="#0f4a3f" /> : <ChevronDown size={14} color="#7c8a87" />}
                        </TouchableOpacity>
                        {isOpen && (
                          <View className="px-4 pb-4 pt-3 border-t border-[#f3f4f6] bg-[#f9fafb]">
                            <Text className="text-xs text-[#4b5563] leading-relaxed font-medium">{faq.a}</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
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
