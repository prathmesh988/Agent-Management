"use client";

import { Employee } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { useMemo } from "react";

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

export function MonthlyAttendanceOverview({ employee }: MonthlyAttendanceOverviewProps) {
  // Always show current month - no navigation
  const currentDate = new Date();

  // Parse attendance data from employee record
  const getAttendanceStatus = (dayKey: string): AttendanceStatus => {
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
      const dayKey = `${i}${dayNames[(i - 1) % 7]}`;
      const status = getAttendanceStatus(dayKey);
      days.push({
        date: i,
        day: dayNames[(i - 1) % 7],
        status,
        dayKey,
      });
    }

    return days;
  }, [employee]);

  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Group days by week (4 weeks for 28 days)
  const weeksData: AttendanceDay[][] = [];
  for (let i = 0; i < attendanceDays.length; i += 7) {
    weeksData.push(attendanceDays.slice(i, i + 7));
  }

  // Count statuses
  const statusCounts = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = {
      P: 0,
      A: 0,
      L: 0,
      H: 0,
      WO: 0,
      HO: 0,
      "-": 0,
    };

    attendanceDays.forEach((day) => {
      counts[day.status]++;
    });

    return counts;
  }, [attendanceDays]);

  return (
    <Card className="p-6 border border-slate-200 shadow-sm rounded-lg bg-white">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Monthly Attendance Overview - {monthYear}</h3>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 pb-4 border-b border-slate-200">
          {[
            { status: "P" as AttendanceStatus, count: statusCounts.P },
            { status: "A" as AttendanceStatus, count: statusCounts.A },
            { status: "L" as AttendanceStatus, count: statusCounts.L },
            { status: "H" as AttendanceStatus, count: statusCounts.H },
            { status: "WO" as AttendanceStatus, count: statusCounts.WO },
            { status: "HO" as AttendanceStatus, count: statusCounts.HO },
          ].map(({ status, count }) => {
            const colors = STATUS_COLORS[status];
            return (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${colors.bg} border ${colors.border}`} />
                <span className="text-sm text-slate-700">
                  <span className="font-semibold">{status}</span> ({count})
                </span>
              </div>
            );
          })}
        </div>

        {/* Calendar Grid */}
        <div className="space-y-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="p-2 text-center text-xs font-bold text-slate-700 uppercase bg-slate-50 rounded"
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
                    className={`p-4 rounded-lg text-center border-2 transition-all ${colors.bg} ${colors.border}`}
                    title={`${colors.label}`}
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
