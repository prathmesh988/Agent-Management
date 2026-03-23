"use client";

import { Employee } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { getMonthlyAttendanceAction } from "@/app/(actions)/attendance";

interface MonthlyAttendanceOverviewProps {
  employee: Employee;
}

type AttendanceStatus = "P" | "A" | "L" | "H" | "WO" | "HO" | "-";

interface AttendanceDay {
  date: number;
  day: string;
  status: AttendanceStatus;
  dayKey: string;
}

const STATUS_COLORS: Record<AttendanceStatus, { bg: string; text: string; label: string; border: string }> = {
  P: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Present", border: "border-emerald-200" },
  A: { bg: "bg-red-50", text: "text-red-700", label: "Absent", border: "border-red-200" },
  L: { bg: "bg-blue-50", text: "text-blue-700", label: "Leave", border: "border-blue-200" },
  H: { bg: "bg-amber-50", text: "text-amber-700", label: "Half Day", border: "border-amber-200" },
  WO: { bg: "bg-slate-100", text: "text-slate-600", label: "Week Off", border: "border-slate-300" },
  HO: { bg: "bg-purple-50", text: "text-purple-700", label: "Holiday", border: "border-purple-200" },
  "-": { bg: "bg-gray-50", text: "text-gray-400", label: "No Data", border: "border-gray-200" },
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthlyAttendanceOverview({ employee }: MonthlyAttendanceOverviewProps) {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-indexed

  // Per-month attendance data loaded from the monthly_attendance collection
  const [monthData, setMonthData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getMonthlyAttendanceAction(employee.employeeId, year, month);
      setMonthData(result.success ? result.data : {});
    } catch {
      setMonthData({});
    } finally {
      setIsLoading(false);
    }
  }, [employee.employeeId, year, month]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const parseStatus = (value: string | undefined): AttendanceStatus => {
    if (!value) return "-";
    if (value === "P") return "P";
    if (value === "A") return "A";
    if (value === "L" || value === "LWP") return "L";
    if (value === "H" || value === "0.5") return "H";
    if (value === "WO") return "WO";
    if (value === "HO") return "HO";
    return "-";
  };

  const attendanceDays = useMemo(() => {
    const days: AttendanceDay[] = [];
    const daysInMonth = new Date(year, month, 0).getDate(); // month is 1-based here
    for (let i = 1; i <= daysInMonth; i++) {
      const dayName = DAY_NAMES[(i - 1) % 7];
      const dayKey = `${i}${dayName}`;
      days.push({ date: i, day: dayName, status: parseStatus(monthData[dayKey]), dayKey });
    }
    return days;
  }, [monthData, year, month]);

  const statusCounts = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = { P: 0, A: 0, L: 0, H: 0, WO: 0, HO: 0, "-": 0 };
    attendanceDays.forEach((d) => counts[d.status]++);
    return counts;
  }, [attendanceDays]);

  // Calendar grid with weekday offset
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

  const monthYear = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <Card className="p-6 border border-slate-200 shadow-sm rounded-lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Monthly Attendance Overview - {monthYear}</h3>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 pb-4 border-b border-slate-200">
          {(["P", "A", "L", "H", "WO", "HO"] as AttendanceStatus[]).map((status) => {
            const colors = STATUS_COLORS[status];
            return (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${colors.bg} border ${colors.border}`} />
                <span className="text-sm text-slate-700">
                  <span className="font-semibold">{status}</span> ({statusCounts[status]})
                </span>
              </div>
            );
          })}
        </div>

        {/* Calendar Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading attendance...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2 mb-2">
              {DAY_NAMES.map((day) => (
                <div key={day} className="p-2 text-center text-xs font-bold text-slate-700 uppercase bg-slate-50 rounded">
                  {day}
                </div>
              ))}
            </div>

            {weeksData.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-2">
                {week.map((day, cellIndex) => {
                  if (!day) return <div key={`empty-${weekIndex}-${cellIndex}`} />;
                  const colors = STATUS_COLORS[day.status];
                  return (
                    <div
                      key={`${day.date}-${day.day}`}
                      className={`p-4 rounded-lg text-center border-2 transition-all ${colors.bg} ${colors.border}`}
                      title={colors.label}
                    >
                      <div className="text-lg font-bold text-slate-900">{day.date}</div>
                      <div className={`text-sm font-bold mt-2 ${colors.text}`}>
                        {day.status === "-" ? "—" : day.status}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{colors.label}</div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-semibold mb-2">📋 Attendance Status Guide:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <p><span className="font-semibold">P</span> – Present</p>
            <p><span className="font-semibold">A</span> – Absent</p>
            <p><span className="font-semibold">L</span> – Leave</p>
            <p><span className="font-semibold">H</span> – Half Day</p>
            <p><span className="font-semibold">WO</span> – Week Off</p>
            <p><span className="font-semibold">HO</span> – Holiday</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
