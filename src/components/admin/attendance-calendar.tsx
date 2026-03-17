"use client";

import { Employee } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

interface AttendanceCalendarProps {
  employee: Employee;
}

type AttendanceStatus = "P" | "A" | "L" | "H" | "WO" | "HO" | "-";

interface AttendanceDay {
  date: number;
  day: string;
  status: AttendanceStatus;
}

const STATUS_COLORS: Record<AttendanceStatus, { bg: string; text: string; label: string }> = {
  P: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Present" },
  A: { bg: "bg-red-100", text: "text-red-700", label: "Absent" },
  L: { bg: "bg-blue-100", text: "text-blue-700", label: "Leave" },
  H: { bg: "bg-amber-100", text: "text-amber-700", label: "Half Day" },
  WO: { bg: "bg-slate-100", text: "text-slate-700", label: "Week Off" },
  HO: { bg: "bg-purple-100", text: "text-purple-700", label: "Holiday" },
  "-": { bg: "bg-gray-50", text: "text-gray-500", label: "No Data" },
};

export function AttendanceCalendar({ employee }: AttendanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Parse attendance data from employee record
  const getattendanceStatus = (dayKey: string): AttendanceStatus => {
    const value = (employee as any)[dayKey];
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
    const daysInMonth = 28; // Employee data has 28 days

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 1; i <= daysInMonth; i++) {
      const dayKey = `${i}${dayNames[i % 7]}`;
      const status = getattendanceStatus(dayKey);
      days.push({
        date: i,
        day: dayNames[i % 7],
        status,
      });
    }

    return days;
  }, [employee]);

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

  // Group days by week
  const weeksData: AttendanceDay[][] = [];
  for (let i = 0; i < attendanceDays.length; i += 7) {
    weeksData.push(attendanceDays.slice(i, i + 7));
  }

  return (
    <Card className="p-6 border border-slate-100 shadow-sm rounded-lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Attendance Calendar</h3>
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
              {week.map((day) => {
                const colors = STATUS_COLORS[day.status];
                return (
                  <div
                    key={`${day.date}-${day.day}`}
                    className={`p-3 rounded-lg text-center cursor-pointer transition-all hover:shadow-md transform hover:-translate-y-0.5 ${colors.bg} border border-slate-200`}
                    title={`${day.date} ${day.day} - ${colors.label}`}
                  >
                    <div className="text-sm font-bold text-slate-900">{day.date}</div>
                    <div className={`text-xs font-semibold mt-1 ${colors.text}`}>
                      {day.status === "-" ? "—" : day.status}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
          <p className="font-semibold mb-1">Attendance Status Guide:</p>
          <p><span className="font-semibold">P</span> - Present | <span className="font-semibold">A</span> - Absent | <span className="font-semibold">L</span> - Leave | <span className="font-semibold">H</span> - Half Day | <span className="font-semibold">WO</span> - Week Off | <span className="font-semibold">HO</span> - Holiday</p>
        </div>
      </div>
    </Card>
  );
}
