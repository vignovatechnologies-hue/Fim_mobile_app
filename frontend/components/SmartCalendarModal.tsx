/**
 * SmartCalendarModal  –  v3
 * ─────────────────────────
 *  • Type-to-edit input  (DD-MM-YYYY) — live sync
 *  • Vertical Month dropdown
 *  • Infinite vertical Year list  (grows dynamically as you scroll)
 *  • Classic day-grid calendar
 *  • Always-visible  Cancel | Save  footer
 *    → Save works for ALL modes: typed date, dropdown pick, or day tap
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList as FlatListComponent,
  Modal as ModalComponent,
  Text as TextComponent,
  TextInput as TextInputComponent,
  TouchableOpacity as TouchableOpacityComponent,
  View as ViewComponent,
  ScrollView as ScrollViewComponent,
  ListRenderItemInfo,
} from "react-native";

const FlatList = FlatListComponent as any;
const Modal = ModalComponent as any;
const Text = TextComponent as any;
const TextInput = TextInputComponent as any;
const TouchableOpacity = TouchableOpacityComponent as any;
const View = ViewComponent as any;
const ScrollView = ScrollViewComponent as any;
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon,
  Check as CheckIcon,
  CalendarDays as CalendarDaysIcon,
} from "lucide-react-native";

const ChevronLeft = ChevronLeftIcon as any;
const ChevronRight = ChevronRightIcon as any;
const ChevronDown = ChevronDownIcon as any;
const ChevronUp = ChevronUpIcon as any;
const CheckIcon2 = CheckIcon as any;
const CalendarIcon = CalendarDaysIcon as any;

// ─── constants ────────────────────────────────────────────────────────────────
const MONTHS_FULL = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const THIS_YEAR = new Date().getFullYear();
const BATCH = 30;   // how many years to add per load
const ITEM_H = 50;   // year row height

// ─── helpers ──────────────────────────────────────────────────────────────────
const pad2 = (n: number) => String(n).padStart(2, "0");
const dimMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const firstDay = (y: number, m: number) => new Date(y, m, 1).getDay();
const dateToStr = (d: Date | null) =>
  d ? `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}` : "";

const strToDate = (s: string): Date | null => {
  const p = s.trim().split("-");
  if (p.length !== 3) return null;
  const [dd, mm, yyyy] = p.map(Number);
  if (!dd || !mm || !yyyy || mm < 1 || mm > 12 || dd < 1 || dd > 31 || yyyy < 1000) return null;
  const d = new Date(yyyy, mm - 1, dd);
  return isNaN(d.getTime()) ? null : d;
};

// Build initial year array: THIS_YEAR-50 … THIS_YEAR+50
const buildInitialYears = (): number[] => {
  const arr: number[] = [];
  for (let y = THIS_YEAR - 50; y <= THIS_YEAR + 50; y++) arr.push(y);
  return arr;
};

// ─── props ────────────────────────────────────────────────────────────────────
interface Props {
  visible: boolean;
  value: Date | null;
  title?: string;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function SmartCalendarModal({
  visible, value, title = "Select Date", onSelect, onClose,
}: Props) {

  // ── core state ──────────────────────────────────────────────────────────────
  const seed = value ?? new Date();

  const [pendingDate, setPendingDate] = useState<Date | null>(value);  // what "Save" will commit
  const [calYear, setCalYear] = useState(seed.getFullYear());
  const [calMonth, setCalMonth] = useState(seed.getMonth());

  const [showMonthDrop, setShowMonthDrop] = useState(false);
  const [showYearDrop, setShowYearDrop] = useState(false);

  const [typeText, setTypeText] = useState(dateToStr(value));
  const [typeError, setTypeError] = useState(false);

  // ── infinite year list ──────────────────────────────────────────────────────
  const [years, setYears] = useState<number[]>(buildInitialYears);
  const yearListRef = useRef<any>(null);
  const monthScrollRef = useRef<any>(null);

  // ── sync on open ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      const d = value ?? new Date();
      setPendingDate(value);
      setCalYear(d.getFullYear());
      setCalMonth(d.getMonth());
      setTypeText(dateToStr(value));
      setTypeError(false);
      setShowMonthDrop(false);
      setShowYearDrop(false);
    }
  }, [visible]);   // eslint-disable-line react-hooks/exhaustive-deps

  // ── auto-scroll year list to calYear ────────────────────────────────────────
  useEffect(() => {
    if (showYearDrop) {
      const idx = years.indexOf(calYear);
      if (idx >= 0) {
        setTimeout(() => {
          yearListRef.current?.scrollToIndex({
            index: Math.max(0, idx - 2),
            animated: true,
            viewOffset: 0,
          });
        }, 100);
      }
    }
  }, [showYearDrop]);   // eslint-disable-line react-hooks/exhaustive-deps

  // ── auto-scroll month list ───────────────────────────────────────────────────
  useEffect(() => {
    if (showMonthDrop) {
      setTimeout(() => {
        monthScrollRef.current?.scrollTo({ y: calMonth * ITEM_H, animated: true });
      }, 80);
    }
  }, [showMonthDrop]);  // eslint-disable-line react-hooks/exhaustive-deps

  // ─── infinite year loading ──────────────────────────────────────────────────
  const loadMoreFuture = useCallback(() => {
    setYears(prev => {
      const last = prev[prev.length - 1];
      const next: number[] = [];
      for (let y = last + 1; y <= last + BATCH; y++) next.push(y);
      return [...prev, ...next];
    });
  }, []);

  const loadMorePast = useCallback(() => {
    setYears(prev => {
      const first = prev[0];
      const next: number[] = [];
      for (let y = first - BATCH; y < first; y++) next.push(y);
      return [...next, ...prev];
    });
  }, []);

  // ─── live sync: text input → pendingDate + calendar view ───────────────────
  const handleTypeChange = (t: string) => {
    setTypeText(t);
    setTypeError(false);
    const d = strToDate(t);
    if (d) {
      setPendingDate(d);
      setCalYear(d.getFullYear());
      setCalMonth(d.getMonth());
    }
  };

  // ─── day tap → pending (no auto-close) ─────────────────────────────────────
  const handleDayTap = (day: number) => {
    const d = new Date(calYear, calMonth, day);
    setPendingDate(d);
    setTypeText(dateToStr(d));
    setTypeError(false);
  };

  // ─── month select ───────────────────────────────────────────────────────────
  const selectMonth = (m: number) => {
    setCalMonth(m);
    setShowMonthDrop(false);
    // keep pending day if valid in new month, else clamp
    if (pendingDate) {
      const maxDay = dimMonth(calYear, m);
      const day = Math.min(pendingDate.getDate(), maxDay);
      const d = new Date(calYear, m, day);
      setPendingDate(d);
      setTypeText(dateToStr(d));
    }
  };

  // ─── year select ────────────────────────────────────────────────────────────
  const selectYear = (yr: number) => {
    setCalYear(yr);
    setShowYearDrop(false);
    if (pendingDate) {
      const maxDay = dimMonth(yr, calMonth);
      const day = Math.min(pendingDate.getDate(), maxDay);
      const d = new Date(yr, calMonth, day);
      setPendingDate(d);
      setTypeText(dateToStr(d));
    }
  };

  // ─── SAVE ───────────────────────────────────────────────────────────────────
  const handleSave = () => {
    // 1. Try the text input first (most specific)
    const typed = strToDate(typeText.trim());
    if (typeText.trim() && !typed) { setTypeError(true); return; }

    const toSave = typed ?? pendingDate;
    if (!toSave) { setTypeError(true); return; }

    onSelect(toSave);
    onClose();
  };

  // ─── nav arrows ─────────────────────────────────────────────────────────────
  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  // ─── day grid ───────────────────────────────────────────────────────────────
  const renderGrid = () => {
    const total = dimMonth(calYear, calMonth);
    const start = firstDay(calYear, calMonth);
    const cells = [];

    for (let i = 0; i < start; i++) {
      cells.push(<View key={`e${i}`} style={{ width: "13.28%", aspectRatio: 1 }} />);
    }

    for (let d = 1; d <= total; d++) {
      const isPending =
        pendingDate !== null &&
        pendingDate.getDate() === d &&
        pendingDate.getMonth() === calMonth &&
        pendingDate.getFullYear() === calYear;
      const isToday =
        new Date().getDate() === d &&
        new Date().getMonth() === calMonth &&
        new Date().getFullYear() === calYear;

      cells.push(
        <TouchableOpacity
          key={`d${d}`}
          onPress={() => handleDayTap(d)}
          style={{
            width: "13.28%", aspectRatio: 1,
            alignItems: "center", justifyContent: "center",
            borderRadius: 999, marginVertical: 2,
            backgroundColor: isPending ? "#10b981" : isToday ? "#ecfdf5" : "transparent",
            borderWidth: isToday && !isPending ? 1 : 0,
            borderColor: "#10b981",
          }}
        >
          <Text style={{
            fontSize: 12, fontWeight: "700",
            color: isPending ? "#fff" : isToday ? "#10b981" : "#0f3a31",
          }}>{d}</Text>
        </TouchableOpacity>
      );
    }
    return cells;
  };

  // ─── year FlatList item ──────────────────────────────────────────────────────
  const renderYearItem = useCallback(({ item: yr }: ListRenderItemInfo<number>) => {
    const active = yr === calYear;
    const isCurrent = yr === THIS_YEAR;
    return (
      <TouchableOpacity
        onPress={() => selectYear(yr)}
        style={{
          height: ITEM_H, paddingHorizontal: 18,
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          backgroundColor: active ? "#10b981" : "transparent",
          borderBottomWidth: 1, borderBottomColor: "#f0f0f0",
        }}
      >
        <Text style={{ fontWeight: "700", fontSize: 14, color: active ? "#fff" : "#0f3a31" }}>
          {yr}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {isCurrent && !active && (
            <View style={{ backgroundColor: "#ecfdf5", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 }}>
              <Text style={{ fontSize: 9, color: "#10b981", fontWeight: "800" }}>NOW</Text>
            </View>
          )}
          {active && <CheckIcon2 size={14} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  }, [calYear]);   // eslint-disable-line react-hooks/exhaustive-deps

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ITEM_H, offset: ITEM_H * index, index,
  }), []);

  const keyExtractor = useCallback((yr: number) => String(yr), []);

  // ─── scroll near top → load past years ─────────────────────────────────────
  const handleYearScroll = useCallback((e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    if (y < ITEM_H * 3) loadMorePast();
  }, [loadMorePast]);

  // ──────────────────────────────────────────────────────────────────────────
  const hasPending = !!pendingDate || !!strToDate(typeText.trim());

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* backdrop tap closes dropdowns */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => { setShowMonthDrop(false); setShowYearDrop(false); }}
        style={{
          flex: 1, justifyContent: "center", alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 20,
        }}
      >
        {/* Card – inner tap doesn't close */}
        <TouchableOpacity activeOpacity={1} onPress={() => { }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 28, padding: 20, width: 320 }}>

            {/* ── Title row ── */}
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14 }}>
              <CalendarIcon size={16} color="#10b981" />
              <Text style={{ fontSize: 14, fontWeight: "800", color: "#0f3a31", marginLeft: 8 }}>
                {title}
              </Text>
            </View>

            {/* ── Text input (type DD-MM-YYYY) ── */}
            <View style={{
              flexDirection: "row", alignItems: "center",
              backgroundColor: typeError ? "#fef2f2" : "#f3f4f6",
              borderWidth: 1.5, borderColor: typeError ? "#ef4444" : pendingDate ? "#10b981" : "#e5e7eb",
              borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
              marginBottom: typeError ? 4 : 14,
            }}>
              <TextInput
                value={typeText}
                onChangeText={handleTypeChange}
                placeholder="DD-MM-YYYY"
                placeholderTextColor="#9ca3af"
                keyboardType="numbers-and-punctuation"
                style={{ flex: 1, fontSize: 14, fontWeight: "700", color: "#0f3a31" }}
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
              {pendingDate && (
                <Text style={{ fontSize: 10, color: "#10b981", fontWeight: "700" }}>✓ set</Text>
              )}
            </View>
            {typeError && (
              <Text style={{ fontSize: 10, color: "#ef4444", marginBottom: 10, fontWeight: "600" }}>
                ⚠ Use format DD-MM-YYYY  (e.g. 15-06-2026)
              </Text>
            )}

            {/* ── Month / Year header row ── */}
            <View style={{
              flexDirection: "row", alignItems: "center",
              justifyContent: "space-between", marginBottom: 10,
            }}>
              {/* ← prev month */}
              <TouchableOpacity
                onPress={prevMonth}
                style={{ padding: 8, backgroundColor: "#f3f4f6", borderRadius: 999 }}
              >
                <ChevronLeft size={16} color="#0f3a31" />
              </TouchableOpacity>

              {/* Month pill */}
              <TouchableOpacity
                onPress={() => { setShowMonthDrop(p => !p); setShowYearDrop(false); }}
                style={{
                  flexDirection: "row", alignItems: "center",
                  backgroundColor: showMonthDrop ? "#0f3a31" : "#ecfdf5",
                  paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
                  minWidth: 100, justifyContent: "space-between",
                }}
              >
                <Text style={{
                  fontWeight: "800", fontSize: 13,
                  color: showMonthDrop ? "#fff" : "#0f3a31",
                }}>
                  {MONTHS_SHORT[calMonth]}
                </Text>
                {showMonthDrop
                  ? <ChevronUp size={12} color="#fff" />
                  : <ChevronDown size={12} color="#0f3a31" />}
              </TouchableOpacity>

              {/* Year pill */}
              <TouchableOpacity
                onPress={() => { setShowYearDrop(p => !p); setShowMonthDrop(false); }}
                style={{
                  flexDirection: "row", alignItems: "center",
                  backgroundColor: showYearDrop ? "#0f3a31" : "#ecfdf5",
                  paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
                  minWidth: 86, justifyContent: "space-between",
                }}
              >
                <Text style={{
                  fontWeight: "800", fontSize: 13,
                  color: showYearDrop ? "#fff" : "#0f3a31",
                }}>
                  {calYear}
                </Text>
                {showYearDrop
                  ? <ChevronUp size={12} color="#fff" />
                  : <ChevronDown size={12} color="#0f3a31" />}
              </TouchableOpacity>

              {/* → next month */}
              <TouchableOpacity
                onPress={nextMonth}
                style={{ padding: 8, backgroundColor: "#f3f4f6", borderRadius: 999 }}
              >
                <ChevronRight size={16} color="#0f3a31" />
              </TouchableOpacity>
            </View>

            {/* ── Month dropdown (vertical) ── */}
            {showMonthDrop && (
              <View style={{
                borderRadius: 16, marginBottom: 12, overflow: "hidden",
                borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f9fafb",
              }}>
                <ScrollView
                  ref={monthScrollRef}
                  style={{ maxHeight: 220 }}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  {MONTHS_FULL.map((m, i) => {
                    const active = i === calMonth;
                    return (
                      <TouchableOpacity
                        key={m}
                        onPress={() => selectMonth(i)}
                        style={{
                          height: ITEM_H, paddingHorizontal: 18,
                          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                          backgroundColor: active ? "#10b981" : "transparent",
                          borderBottomWidth: i < 11 ? 1 : 0,
                          borderBottomColor: "#f0f0f0",
                        }}
                      >
                        <Text style={{ fontWeight: "700", fontSize: 14, color: active ? "#fff" : "#0f3a31" }}>
                          {m}
                        </Text>
                        {active && <CheckIcon2 size={14} color="#fff" />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* ── Year dropdown — INFINITE FlatList ── */}
            {showYearDrop && (
              <View style={{
                borderRadius: 16, marginBottom: 12, overflow: "hidden",
                borderWidth: 1, borderColor: "#e5e7eb", backgroundColor: "#f9fafb",
              }}>
                {/* header hint */}
                <View style={{
                  flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                  paddingHorizontal: 14, paddingVertical: 8,
                  borderBottomWidth: 1, borderBottomColor: "#e5e7eb",
                  backgroundColor: "#fff",
                }}>
                  <Text style={{ fontSize: 10, color: "#9ca3af", fontWeight: "700" }}>
                    SCROLL ↑ PAST  ·  SCROLL ↓ FUTURE
                  </Text>
                  <Text style={{ fontSize: 11, color: "#10b981", fontWeight: "800" }}>∞</Text>
                </View>

                <FlatList
                  ref={yearListRef}
                  data={years}
                  keyExtractor={keyExtractor}
                  renderItem={renderYearItem}
                  getItemLayout={getItemLayout}
                  style={{ height: 220 }}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                  onEndReached={loadMoreFuture}
                  onEndReachedThreshold={0.3}
                  onScroll={handleYearScroll}
                  scrollEventThrottle={100}
                  initialNumToRender={10}
                  maxToRenderPerBatch={15}
                  windowSize={7}
                />
              </View>
            )}

            {/* ── Day grid (hidden while dropdowns open) ── */}
            {!showMonthDrop && !showYearDrop && (
              <>
                {/* DOW row */}
                <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 6 }}>
                  {DOW.map(d => (
                    <Text key={d} style={{
                      width: "13.28%", textAlign: "center",
                      fontSize: 10, fontWeight: "700", color: "#9ca3af",
                    }}>{d}</Text>
                  ))}
                </View>
                {/* Day cells */}
                <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start" }}>
                  {renderGrid()}
                </View>
              </>
            )}

            {/* ── Hint: selected date summary ── */}
            {pendingDate && !showMonthDrop && !showYearDrop && (
              <View style={{
                marginTop: 10, backgroundColor: "#ecfdf5",
                borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
                flexDirection: "row", alignItems: "center",
              }}>
                <Text style={{ fontSize: 11, color: "#059669", fontWeight: "700" }}>
                  Selected: {pendingDate.toLocaleDateString("en-IN", {
                    weekday: "short", day: "numeric", month: "long", year: "numeric"
                  })}
                </Text>
              </View>
            )}

            {/* ══ Footer: Cancel | Save ══ */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              {/* Cancel */}
              <TouchableOpacity
                onPress={onClose}
                style={{
                  flex: 1, paddingVertical: 13, borderRadius: 14,
                  backgroundColor: "#f3f4f6", alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#6b7280" }}>Cancel</Text>
              </TouchableOpacity>

              {/* Save — always visible, disabled only if nothing selected */}
              <TouchableOpacity
                onPress={handleSave}
                style={{
                  flex: 1, paddingVertical: 13, borderRadius: 14,
                  backgroundColor: hasPending ? "#10b981" : "#d1fae5",
                  alignItems: "center", flexDirection: "row",
                  justifyContent: "center", gap: 6,
                }}
                disabled={!hasPending}
              >
                <CheckIcon2 size={14} color={hasPending ? "#fff" : "#6ee7b7"} />
                <Text style={{
                  fontSize: 13, fontWeight: "800",
                  color: hasPending ? "#fff" : "#6ee7b7",
                }}>Save Date</Text>
              </TouchableOpacity>
            </View>

          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
