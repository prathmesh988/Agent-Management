"use client";

import { Employee } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Save, AlertCircle } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateEmployeeAction } from "@/app/(actions)/employees";

interface AttendanceCalendarProps {
  employee: Employee;
  onEmployeeUpdate?: (employee: Employee) => void;
}

type AttendanceStatus = "P" | "A" | "L" | "H" | "WO" | "HO" | "-";

interface AttendanceDay {
  date: number;
  day: string;
  status: AttendanceStatus;
  dayKey: string;
}

const STATUS_COLORS: Record<AttendanceStatus, { bg: string; text: string; label: string; border: string }> = {
  P: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Present", border: "border-emerald-400" },
  A: { bg: "bg-red-100", text: "text-red-700", label: "Absent", border: "border-red-400" },
  L: { bg: "bg-blue-100", text: "text-blue-700", label: "Leave", border: "border-blue-400" },
  H: { bg: "bg-amber-100", text: "text-amber-700", label: "Half Day", border: "border-amber-400" },
  WO: { bg: "bg-slate-100", text: "text-slate-600", label: "Week Off", border: "border-slate-400" },
  HO: { bg: "bg-purple-100", text: "text-purple-700", label: "Holiday", border: "border-purple-400" },
  "-": { bg: "bg-gray-50", text: "text-gray-400", label: "No Data", border: "border-gray-300" },
};

// Cycle through statuses when clicked
const STATUS_CYCLE: AttendanceStatus[] = ["P", "A", "L", "H", "WO", "HO", "-"];

export function AttendanceCalendarEditable({ employee, onEmployeeUpdate }: AttendanceCalendarProps) {
  // Always use current month - no navigation
  const currentDate = new Date();
  const [localEmployee, setLocalEmployee] = useState<Employee>(employee);
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalEmployee(employee);
  }, [employee]);

  // Parse attendance data from employee record
  const getAttendanceStatus = (dayKey: string, emp: Employee = localEmployee): AttendanceStatus => {
    const value = (emp as any)[dayKey];
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
  }, [localEmployee]);

  const handleDayClick = (dayKey: string, currentStatus: AttendanceStatus) => {
    // Find next status in cycle
    const currentIndex = STATUS_CYCLE.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length;
    const nextStatus = STATUS_CYCLE[nextIndex];

    // Update local employee state
    const updatedEmployee = { ...localEmployee };
    (updatedEmployee as any)[dayKey] = nextStatus;
    setLocalEmployee(updatedEmployee);
    setEditedFields((prev) => new Set([...prev, dayKey]));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (editedFields.size === 0) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const updates: Partial<Employee> = {};
      editedFields.forEach((field) => {
        updates[field as keyof Employee] = (localEmployee as any)[field];
      });

      console.log("📦 Saving attendance updates:", updates);
      
      await updateEmployeeAction(employee.id, updates as Employee);
      
      setEditedFields(new Set());
      setSaveSuccess(true);
      
      // Update parent component
      if (onEmployeeUpdate) {
        onEmployeeUpdate(localEmployee);
      }
      
      console.log("✅ Attendance updates saved successfully");
      
      // Auto-hide success message after 2 seconds
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error("❌ Failed to save updates:", error);
      setSaveError(
        error instanceof Error ? error.message : "Failed to save updates"
      );
    } finally {
      setIsSaving(false);
    }
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
          <h3 className="text-lg font-bold text-slate-900">Editable Attendance - {monthYear}</h3>
          <p className="text-sm text-slate-600">Current Month Only</p>
        </div>

        {/* Error Alert */}
        {saveError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {saveSuccess && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">✅ Changes saved successfully!</AlertDescription>
          </Alert>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pb-4 border-b border-slate-200">
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
          <div className="grid grid-cols-7 gap-2">
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
                const isEdited = editedFields.has(day.dayKey);
                
                return (
                  <button
                    key={`${day.date}-${day.day}`}
                    onClick={() => handleDayClick(day.dayKey, day.status)}
                    className={`p-4 rounded-lg text-center border-2 transition-all hover:shadow-md transform hover:-translate-y-0.5 active:scale-95 cursor-pointer ${
                      colors.bg
                    } ${colors.border} ${isEdited ? "ring-2 ring-blue-500" : ""}`}
                    title={`Click to cycle - Currently: ${colors.label}`}
                  >
                    <div className="text-lg font-bold text-slate-900">{day.date}</div>
                    <div className={`text-sm font-bold mt-2 ${colors.text}`}>
                      {day.status === "-" ? "—" : day.status}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Save Button and Info */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 flex-1">
            <p className="font-semibold mb-1">💡 How to use:</p>
            <p>Click on any day to cycle through statuses: P → A → L → H → WO → HO → (empty)</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={editedFields.size === 0 || isSaving}
            className="ml-4 whitespace-nowrap"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : `Save Changes (${editedFields.size})`}
          </Button>
        </div>
      </div>
    </Card>
  );
}
