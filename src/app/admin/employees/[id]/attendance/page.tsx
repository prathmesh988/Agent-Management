"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Employee } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Download, Save, AlertCircle } from "lucide-react";
import { getEmployee } from "@/app/(actions)/employees";
import { updateEmployeeAction } from "@/app/(actions)/employees";
import { AttendanceCalendar, type AttendanceStatus, type AttendanceMetrics } from "@/components/admin/attendance-calendar";
import { AttendanceAnalytics } from "@/components/admin/attendance-analytics";

export const dynamic = "force-dynamic";

const ATTENDANCE_DAYS = Array.from({ length: 28 }, (_, i) => ({
  key: `${i + 1}${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][(i % 7)]}`,
  label: `${i + 1}`,
  day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i % 7],
}));

const ATTENDANCE_SUMMARY_FIELDS = [
  { key: "presentDays", label: "Present Days", type: "number", color: "emerald" },
  { key: "absentDays", label: "Absent Days", type: "number", color: "red" },
  { key: "leaveDays", label: "Leave Days", type: "number", color: "blue" },
  { key: "halfDays", label: "Half Days", type: "number", color: "amber" },
  { key: "weekOffDays", label: "Week Off", type: "number", color: "slate" },
  { key: "holidayDays", label: "Holidays", type: "number", color: "slate" },
];

export default function AttendanceOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadEmployee = async () => {
      try {
        console.log("🔍 Loading attendance employee with ID:", resolvedParams.id);
        const employee = await getEmployee(resolvedParams.id);

        if (!employee) {
          console.log("❌ Employee not found for ID:", resolvedParams.id);
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        console.log("✅ Loaded attendance employee:", employee);
        setCurrentEmployee(employee);
      } catch (error) {
        console.error("❌ Failed to load employee:", error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadEmployee();
  }, [resolvedParams.id]);

  const handleFieldChange = (key: string, value: string | number | undefined) => {
    const newEmployee = { ...currentEmployee! };
    
    // Convert empty string to undefined
    if (value === "") {
      (newEmployee as any)[key] = undefined;
    } else if (key.endsWith("Days") || key.match(/^(cl|overtime|totalPresent)$/)) {
      // For summary fields (presentDays, absentDays, etc.)
      (newEmployee as any)[key] = value !== "" ? Number(value) || 0 : undefined;
    } else {
      // For daily attendance fields (single character)
      (newEmployee as any)[key] = value;
    }

    setCurrentEmployee(newEmployee);
    setEditedFields((prev) => new Set([...prev, key]));
  };

  const handleSave = async () => {
    if (!currentEmployee || editedFields.size === 0) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const updates: Partial<Employee> = {};
      editedFields.forEach((field) => {
        updates[field as keyof Employee] = (currentEmployee as any)[field];
      });

      console.log("📦 Saving attendance updates:", updates);
      
      await updateEmployeeAction(resolvedParams.id, updates as Employee);
      setEditedFields(new Set());
      console.log("✅ Attendance updates saved successfully");
    } catch (error) {
      console.error("❌ Failed to save updates:", error);
      setSaveError(
        error instanceof Error ? error.message : "Failed to save updates"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAttendanceChange = (dayKey: string, status: AttendanceStatus, metrics: AttendanceMetrics) => {
    if (!currentEmployee) return;

    const updatedEmployee = { ...currentEmployee };
    
    // Update the daily attendance field
    (updatedEmployee as any)[dayKey] = status;
    
    // Update the computed metrics
    updatedEmployee.presentDays = metrics.presentDays;
    updatedEmployee.absentDays = metrics.absentDays;
    updatedEmployee.leaveDays = metrics.leaveDays;
    updatedEmployee.halfDays = metrics.halfDays;
    updatedEmployee.weekOffDays = metrics.weekOffDays;
    updatedEmployee.holidayDays = metrics.holidayDays;

    setCurrentEmployee(updatedEmployee);
    
    // Mark all affected fields as edited
    setEditedFields((prev) => new Set([
      ...prev,
      dayKey,
      'presentDays',
      'absentDays',
      'leaveDays',
      'halfDays',
      'weekOffDays',
      'holidayDays',
    ]));

    console.log("📝 Attendance updated:", dayKey, status, "Metrics:", metrics);
  };

  const handleDownloadReport = () => {
    if (!currentEmployee) return;

    const data = [
      ["Attendance Overview Report"],
      ["Employee Name", currentEmployee.name],
      ["Employee ID", currentEmployee.id || ""],
      ["Designation", currentEmployee.designation || "N/A"],
      ["Department", currentEmployee.process || "N/A"],
      [],
      ["Attendance Summary"],
      ["Present Days", (currentEmployee as any).presentDays || 0],
      ["Absent Days", (currentEmployee as any).absentDays || 0],
      ["Leave Days", (currentEmployee as any).leaveDays || 0],
      ["Half Days", (currentEmployee as any).halfDays || 0],
      ["Week Off", (currentEmployee as any).weekOffDays || 0],
      ["Holidays", (currentEmployee as any).holidayDays || 0],
    ];

    const csvContent = data.map((row) => row.join(",")).join("\n");
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent)
    );
    element.setAttribute(
      "download",
      `${currentEmployee.name}_attendance_report.csv`
    );
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Attendance Overview</h1>
        </div>
        <div className="flex items-center justify-center h-96">
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (notFound || !currentEmployee) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Attendance Overview</h1>
        </div>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <p className="text-red-600 font-medium">Employee not found</p>
          <p className="text-slate-600 text-sm">ID: {resolvedParams.id}</p>
          <Link href="/admin/employees">
            <Button>Back to Employees</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/*Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Attendance Overview</h1>
          <p className="text-slate-600 mt-1">{currentEmployee?.name}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            onClick={handleDownloadReport}
            variant="outline"
            size="lg"
            className="shadow-md"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
          <Link href={`/admin/employees/${resolvedParams.id}`}>
            <Button variant="outline" size="lg" className="shadow-md">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
          </Link>
          <Button
            onClick={handleSave}
            disabled={editedFields.size === 0 || isSaving}
            size="lg"
            className="shadow-md"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {saveError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      {/* Attendance Summary Cards */}
      <div className="grid grid-cols-6 gap-4">
        {ATTENDANCE_SUMMARY_FIELDS.map(({ key, label, color }) => {
          const colorVariants = {
            emerald: "border-emerald-200 bg-emerald-50",
            red: "border-red-200 bg-red-50",
            blue: "border-blue-200 bg-blue-50",
            amber: "border-amber-200 bg-amber-50",
            slate: "border-slate-200 bg-slate-50",
          };

          const textColorVariants = {
            emerald: "text-emerald-700",
            red: "text-red-700",
            blue: "text-blue-700",
            amber: "text-amber-700",
            slate: "text-slate-700",
          };

          const currentValue = (currentEmployee as any)?.[key] ?? 0;
          const isEdited = editedFields.has(key);

          return (
            <Card key={key} className={`border-2 ${colorVariants[color as keyof typeof colorVariants]}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-600">
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold">{currentValue}</div>
                <Input
                  type="number"
                  value={currentValue || ""}
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                  className={`h-8 text-sm ${
                    isEdited
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-300"
                  }`}
                  placeholder="0"
                  step="1"
                  min="0"
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Daily Attendance Grid */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Daily Attendance</CardTitle>
          <CardDescription>
            Enter attendance for each day. Use: P=Present, A=Absent, L=Leave, H=Half Day, W=Week Off, S=Holiday
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {ATTENDANCE_DAYS.map(({ key, label, day }) => {
              const currentValue = (currentEmployee as any)?.[key] ?? "";
              const isEdited = editedFields.has(key);

              const attendanceColors: Record<string, string> = {
                P: "bg-emerald-100 border-emerald-500",
                A: "bg-red-100 border-red-500",
                L: "bg-blue-100 border-blue-500",
                H: "bg-amber-100 border-amber-500",
                W: "bg-slate-100 border-slate-500",
                S: "bg-purple-100 border-purple-500",
              };

              return (
                <div key={key} className="flex flex-col items-center gap-2">
                  <div className="text-xs font-semibold text-slate-600">{label}</div>
                  <div className="text-xs text-slate-500 mb-1">{day}</div>
                  <Input
                    type="text"
                    value={currentValue}
                    onChange={(e) => handleFieldChange(key, e.target.value.toUpperCase())}
                    maxLength={1}
                    className={`h-10 w-10 text-center font-bold uppercase ${
                      isEdited
                        ? "border-blue-500 bg-blue-50"
                        : attendanceColors[currentValue] || "border-slate-300"
                    }`}
                    placeholder="-"
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Section */}
      {currentEmployee && (
        <div>
          <AttendanceAnalytics employee={currentEmployee} />
        </div>
      )}

      {/* Calendar Section */}
      {currentEmployee && (
        <div>
          <AttendanceCalendar 
            employee={currentEmployee} 
            onAttendanceChange={handleAttendanceChange}
          />
        </div>
      )}
    </div>
  );
}
