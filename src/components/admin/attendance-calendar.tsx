"use client";

import { Employee } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { ATTENDANCE } from "@/lib/constants";

interface AttendanceCalendarProps {
  employee: Employee;
  onAttendanceChange?: (dayKey: string, status: AttendanceCode, updatedMetrics: AttendanceMetrics) => void;
}

type AttendanceCode = typeof ATTENDANCE.CODES[number];

export interface AttendanceMetrics {
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  halfDays: number;
  weekOffDays: number;
  holidayDays: number;
}

interface AttendanceDay {
  date: number;
  day: string;
  status: AttendanceCode;
  dayKey: string;
}

const STATUS_COLORS: Record<AttendanceCode, { bg: string; text: string; label: string }> = {
  P: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Present" },
  A: { bg: "bg-red-100", text: "text-red-700", label: "Absent" },
  L: { bg: "bg-blue-100", text: "text-blue-700", label: "Leave" },
  HD: { bg: "bg-amber-100", text: "text-amber-700", label: "Half Day" },
  WO: { bg: "bg-slate-100", text: "text-slate-700", label: "Week Off" },
  CL: { bg: "bg-indigo-100", text: "text-indigo-700", label: "Casual Leave" },
  LC: { bg: "bg-orange-100", text: "text-orange-700", label: "Late Coming" },
  "": { bg: "bg-gray-50", text: "text-gray-500", label: "Not Marked" },
};

// Cycle through statuses when clicked
const STATUS_CYCLE: AttendanceCode[] = ATTENDANCE.CODES as unknown as AttendanceCode[];

/**
 * Safely get attendance value from employee object
 * Supports both legacy individual day keys and new attendance record
 */
function getAttendanceValue(employee: Employee, dayKey: string): string | undefined {
  // Try new attendance record first
  if (employee.attendance?.[dayKey]) {
    return employee.attendance[dayKey];
  }

  // Fall back to legacy keys (using key-value iteration to avoid unsafe casting)
  const value = Object.entries(employee).find(([key]) => key === dayKey)?.[1] as string | undefined;
  return value;
}

/**
 * Safely set attendance value on employee object
 * Updates the attendance record with the new status
 */
function setAttendanceValue(employee: Employee, dayKey: string, status: AttendanceCode): void {
  // Initialize attendance record if it doesn't exist
  if (!employee.attendance) {
    employee.attendance = {};
  }
  // Update the attendance record
  employee.attendance[dayKey] = status;
  
  // Also update legacy key for backward compatibility
  (employee as unknown as Record<string, unknown>)[dayKey] = status;
}

export function AttendanceCalendar({ employee, onAttendanceChange }: AttendanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [localEmployee, setLocalEmployee] = useState<Employee>(employee);

  // Sync local state with prop changes (e.g., on page refresh)
  useEffect(() => {
    setLocalEmployee(employee);
  }, [employee]);

  // Parse attendance data from employee record
  const getattendanceStatus = (dayKey: string, emp: Employee = localEmployee): AttendanceCode => {
    const value = getAttendanceValue(emp, dayKey);
    if (!value) return '';
    if (value === "P") return "P";
    if (value === "A") return "A";
    if (value === "L" || value === "LWP") return "L";
    if (value === "H" || value === "0.5" || value === "HD") return "HD";
    if (value === "WO") return "WO";
    if (value === "CL") return "CL";
    if (value === "LC") return "LC";
    return '';
  };

  // Compute attendance metrics from all daily statuses
  const computeMetrics = (updatedEmployee: Employee): AttendanceMetrics => {
    let presentDays = 0;
    let absentDays = 0;
    let leaveDays = 0;
    let halfDays = 0;
    let weekOffDays = 0;
    let holidayDays = 0;

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      // (i - 1) % 7 so that 1→Sun, 2→Mon, …7→Sat, 8→Sun — matches DB schema
      const dayKey = `${i}${dayNames[(i - 1) % 7]}`;
      const status = getattendanceStatus(dayKey, updatedEmployee);

      switch (status) {
        case "P":
          presentDays++;
          break;
        case "A":
          absentDays++;
          break;
        case "L":
        case "CL":
          leaveDays++;
          break;
        case "HD":
        case "LC":
          halfDays++;
          break;
        case "WO":
          weekOffDays++;
          break;
      }
    }

    return { presentDays, absentDays, leaveDays, halfDays, weekOffDays, holidayDays };
  };

  const attendanceDays = useMemo(() => {
    const days: AttendanceDay[] = [];
    // Compute actual days in the currently-viewed month (28 / 29 / 30 / 31)
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 1; i <= daysInMonth; i++) {
      // (i - 1) % 7 so that 1→Sun, 2→Mon, …7→Sat, 8→Sun — matches DB schema keys
      const dayName = dayNames[(i - 1) % 7];
      const dayKey = `${i}${dayName}`;
      const status = getattendanceStatus(dayKey);
      days.push({
        date: i,
        day: dayName,
        status,
        dayKey,
      });
    }

    return days;
  }, [localEmployee, currentDate]);

  const handleDayClick = (dayKey: string, currentStatus: AttendanceCode) => {
    // Find next status in cycle
    const currentIndex = STATUS_CYCLE.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
    const nextStatus = STATUS_CYCLE[nextIndex];

    // Update local employee state
    const updatedEmployee = { ...localEmployee };
    setAttendanceValue(updatedEmployee, dayKey, nextStatus);
    setLocalEmployee(updatedEmployee);

    // Compute new metrics
    const metrics = computeMetrics(updatedEmployee);

    // Update parent component
    if (onAttendanceChange) {
      onAttendanceChange(dayKey, nextStatus, metrics);
    }
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Build calendar grid with proper weekday offset
  const startOffset = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
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

  return (
    <Card className="p-6 border border-slate-100 shadow-sm rounded-lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Attendance Calendar (Editable)</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={previousMonth}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </button>
            <span className="text-sm font-semibold text-slate-700 min-w-[140px] text-center">
              {monthYear}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pb-4 border-b border-slate-200">
          {Object.entries(STATUS_COLORS).map(([status, { bg, label }]) => (
            <div key={status} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${bg}`} />
              <span className="text-xs text-slate-600">{label}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="space-y-3">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="p-2 text-center text-xs font-semibold text-slate-600 uppercase"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          {weeksData.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-2">
              {week.map((day, cellIndex) => {
                if (!day) {
                  return <div key={`empty-${weekIndex}-${cellIndex}`} />;
                }
                const colors = STATUS_COLORS[day.status];
                return (
                  <button
                    key={`${day.date}-${day.day}`}
                    onClick={() => handleDayClick(day.dayKey, day.status)}
                    className={`p-3 rounded-lg text-center transition-all hover:shadow-md transform hover:-translate-y-0.5 ${colors.bg} border-2 border-slate-200 hover:border-slate-400 active:scale-95`}
                    title={`Click to cycle status - Currently: ${colors.label}`}
                  >
                    <div className="text-sm font-bold text-slate-900">{day.date}</div>
                    <div className={`text-xs font-semibold mt-1 ${colors.text}`}>
                      {day.status === "" ? "—" : day.status}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
          <p className="font-semibold mb-1">Attendance Status Guide:</p>
          <p><span className="font-semibold">P</span> - Present | <span className="font-semibold">A</span> - Absent | <span className="font-semibold">L</span> - Leave | <span className="font-semibold">CL</span> - Casual Leave | <span className="font-semibold">HD</span> - Half Day | <span className="font-semibold">LC</span> - Late Coming | <span className="font-semibold">WO</span> - Week Off</p>
          <p className="mt-2 text-blue-600"><span className="font-semibold">💡 Tip:</span> Click on any day to cycle through attendance statuses. Metrics update automatically.</p>
        </div>
      </div>
    </Card>
  );
}
