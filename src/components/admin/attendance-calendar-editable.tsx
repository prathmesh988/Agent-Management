"use client";

import { Employee } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Save, AlertCircle, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getMonthlyAttendanceAction, saveMonthlyAttendanceAction } from "@/app/(actions)/attendance";

interface AttendanceCalendarProps {
  employee: Employee;
  onEmployeeUpdate?: (employee: Employee) => void;
  onSave?: () => void; // called after a successful save so parent can refresh siblings
}

type AttendanceStatus = "P" | "A" | "L" | "H" | "WO" | "HO" | "-";

interface AttendanceDay {
  date: number;
  day: string;
  status: AttendanceStatus;
  dayKey: string;
}

const STATUS_COLORS: Record<AttendanceStatus, { bg: string; text: string; label: string; border: string }> = {
  P: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", label: "Present", border: "border-emerald-400 dark:border-emerald-800" },
  A: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: "Absent", border: "border-red-400 dark:border-red-800" },
  L: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: "Leave", border: "border-blue-400 dark:border-blue-800" },
  H: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", label: "Half Day", border: "border-amber-400 dark:border-amber-800" },
  WO: { bg: "bg-slate-100 dark:bg-slate-800/80", text: "text-slate-600 dark:text-slate-300", label: "Week Off", border: "border-slate-400 dark:border-slate-600" },
  HO: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400", label: "Holiday", border: "border-purple-400 dark:border-purple-800" },
  "-": { bg: "bg-gray-50 dark:bg-slate-800/40", text: "text-gray-400 dark:text-gray-500", label: "No Data", border: "border-gray-300 dark:border-slate-700" },
};

const STATUS_CYCLE: AttendanceStatus[] = ["P", "A", "L", "H", "WO", "HO", "-"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AttendanceCalendarEditable({ employee, onEmployeeUpdate, onSave }: AttendanceCalendarProps) {
  // Month navigation
  const [currentDate, setCurrentDate] = useState(new Date());

  // Per-month attendance data (dayKey → status string), loaded from DB
  const [monthData, setMonthData] = useState<Record<string, string>>({});
  // Unsaved edits on top of monthData
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});

  const [isLoadingMonth, setIsLoadingMonth] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-indexed

  // ── Load attendance for the selected month ───────────────────────────────
  const loadMonthData = useCallback(async () => {
    setIsLoadingMonth(true);
    setEditedFields({});
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const result = await getMonthlyAttendanceAction(employee.employeeId, year, month);
      if (result.success) {
        setMonthData(result.data);
      } else {
        setMonthData({});
      }
    } catch (e) {
      console.error("Failed to load month data:", e);
      setMonthData({});
    } finally {
      setIsLoadingMonth(false);
    }
  }, [employee.employeeId, year, month]);

  useEffect(() => {
    loadMonthData();
  }, [loadMonthData]);

  // ── Merge DB data + unsaved edits for display ────────────────────────────
  const getAttendanceStatus = (dayKey: string): AttendanceStatus => {
    const merged = { ...monthData, ...editedFields };
    const value = merged[dayKey];
    if (!value) return "-";
    if (value === "P") return "P";
    if (value === "A") return "A";
    if (value === "L" || value === "LWP") return "L";
    if (value === "H" || value === "0.5") return "H";
    if (value === "WO") return "WO";
    if (value === "HO") return "HO";
    return "-";
  };

  // ── Build calendar days ──────────────────────────────────────────────────
  const attendanceDays = useMemo(() => {
    const days: AttendanceDay[] = [];
    const daysInMonth = new Date(year, month, 0).getDate(); // month is 1-indexed here, so month = next month's 0th day

    for (let i = 1; i <= daysInMonth; i++) {
      // Use actual calendar date to get correct day of week
      const date = new Date(year, month - 1, i);
      const dayName = DAY_NAMES[date.getDay()];
      const dayKey = `${i}${dayName}`;
      days.push({ date: i, day: dayName, status: getAttendanceStatus(dayKey), dayKey });
    }
    return days;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthData, editedFields, year, month]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = { P: 0, A: 0, L: 0, H: 0, WO: 0, HO: 0, "-": 0 };
    attendanceDays.forEach((d) => counts[d.status]++);
    return counts;
  }, [attendanceDays]);

  // ── Calendar grid with weekday offset ───────────────────────────────────
  const startOffset = new Date(year, month - 1, 1).getDay();
  const paddedDays: (AttendanceDay | null)[] = [
    ...Array<null>(startOffset).fill(null),
    ...attendanceDays,
  ];
  const weeksData: (AttendanceDay | null)[][] = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    const week = paddedDays.slice(i, i + 7);
    while (week.length < 7) week.push(null);
    weeksData.push(week);
  }

  // ── Handle day click ─────────────────────────────────────────────────────
  const handleDayClick = (dayKey: string, currentStatus: AttendanceStatus) => {
    const nextStatus = STATUS_CYCLE[(STATUS_CYCLE.indexOf(currentStatus) + 1) % STATUS_CYCLE.length];
    setEditedFields((prev) => ({ ...prev, [dayKey]: nextStatus === "-" ? "" : nextStatus }));
    setSaveSuccess(false);
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (Object.keys(editedFields).length === 0) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      // Build the full merged dataset to save
      const fullData: Record<string, string> = {};
      const merged = { ...monthData, ...editedFields };
      for (const [key, val] of Object.entries(merged)) {
        if (val && val !== "-") fullData[key] = val;
      }

      const result = await saveMonthlyAttendanceAction(
        employee.employeeId, year, month, fullData
      );

      if (result.success) {
        setMonthData(fullData);
        setEditedFields({});
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        onSave?.(); // notify parent so overview re-fetches
      } else {
        setSaveError(result.error || "Save failed");
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const monthYear = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const editCount = Object.keys(editedFields).length;

  return (
    <Card className="p-6 border border-slate-200 dark:border-slate-700 shadow-sm rounded-lg bg-card text-card-foreground">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Editable Attendance - {monthYear}</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 2))}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              title="Previous month"
            >
              <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </button>
            <span className="text-sm font-semibold text-slate-600 min-w-32.5 dark:text-slate-300 text-center">
              {monthYear}
            </span>
            <button
              onClick={() => setCurrentDate(new Date(year, month))}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              title="Next month"
            >
              <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </div>

        {/* Alerts */}
        {saveError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}
        {saveSuccess && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">✅ Changes saved successfully!</AlertDescription>
          </Alert>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
          {(["P", "A", "L", "H", "WO", "HO"] as AttendanceStatus[]).map((status) => {
            const colors = STATUS_COLORS[status];
            return (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${colors.bg} border ${colors.border}`} />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-semibold">{status}</span> ({statusCounts[status]})
                </span>
              </div>
            );
          })}
        </div>

        {/* Calendar Grid */}
        {isLoadingMonth ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading attendance...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2">
              {DAY_NAMES.map((d) => (
                <div key={d} className="p-2 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase bg-slate-50 dark:bg-slate-800/50 rounded">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar rows */}
            {weeksData.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-2">
                {week.map((day, cellIndex) => {
                  if (!day) return <div key={`empty-${weekIndex}-${cellIndex}`} />;
                  const colors = STATUS_COLORS[day.status];
                  const isEdited = day.dayKey in editedFields;
                  return (
                    <button
                      key={`${day.date}-${day.day}`}
                      onClick={() => handleDayClick(day.dayKey, day.status)}
                      className={`p-4 rounded-lg text-center border-2 transition-all hover:shadow-md transform hover:-translate-y-0.5 active:scale-95 cursor-pointer ${colors.bg} ${colors.border} ${isEdited ? "ring-2 ring-blue-500" : ""}`}
                      title={`Click to cycle - Currently: ${colors.label}`}
                    >
                      <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{day.date}</div>
                      <div className={`text-sm font-bold mt-2 ${colors.text}`}>
                        {day.status === "-" ? "—" : day.status}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-800 dark:text-blue-300 flex-1">
            <p className="font-semibold mb-1">💡 How to use:</p>
            <p>Click any day to cycle: P → A → L → H → WO → HO → (empty)</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={editCount === 0 || isSaving || isLoadingMonth}
            className="ml-4 whitespace-nowrap"
          >
            {isSaving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" />Save Changes ({editCount})</>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
