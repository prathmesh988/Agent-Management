"use client";

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Employee } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Download, AlertCircle } from "lucide-react";
import { getEmployee } from "@/app/(actions)/employees";
import { getMonthlyAttendanceAction } from "@/app/(actions)/attendance";
import { MonthlyAttendanceOverview } from "@/components/admin/monthly-attendance-overview";
import { AttendanceCalendarEditable } from "@/components/admin/attendance-calendar-editable";
import { AttendanceAnalytics } from "@/components/admin/attendance-analytics";
import { PageLoader } from "@/components/ui/page-loader";

export const dynamic = "force-dynamic";

type AttendanceStatus = "P" | "A" | "L" | "H" | "WO" | "HO" | "-";

const STATUS_MAP: Record<string, AttendanceStatus> = {
  P: "P", A: "A", L: "L", LWP: "L", H: "H", "0.5": "H", WO: "WO", HO: "HO",
};

const SUMMARY_CARDS = [
  { key: "P",  label: "Present Days",  color: "emerald" },
  { key: "A",  label: "Absent Days",   color: "red"     },
  { key: "L",  label: "Leave Days",    color: "blue"    },
  { key: "H",  label: "Half Days",     color: "amber"   },
  { key: "WO", label: "Week Off",      color: "slate"   },
  { key: "HO", label: "Holidays",      color: "slate"   },
] as const;

const CARD_STYLES = {
  emerald: { border: "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" },
  red:     { border: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/30",         text: "text-red-700 dark:text-red-400"     },
  blue:    { border: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30",       text: "text-blue-700 dark:text-blue-400"    },
  amber:   { border: "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30",     text: "text-amber-700 dark:text-amber-400"   },
  slate:   { border: "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80",     text: "text-slate-700 dark:text-slate-300"   },
};

export default function AttendanceOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [overviewRefreshKey, setOverviewRefreshKey] = useState(0);

  // Counts calculated from live monthly_attendance data
  const [counts, setCounts] = useState<Record<string, number>>({ P: 0, A: 0, L: 0, H: 0, WO: 0, HO: 0 });

  useEffect(() => {
    const loadEmployee = async () => {
      try {
        const employee = await getEmployee(resolvedParams.id);
        if (!employee) { setNotFound(true); return; }
        setCurrentEmployee(employee);
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };
    loadEmployee();
  }, [resolvedParams.id]);

  // Fetch monthly attendance and calculate counts
  const recalculate = useCallback(async () => {
    if (!currentEmployee) return;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    try {
      const result = await getMonthlyAttendanceAction(currentEmployee.employeeId, year, month);
      if (!result.success) return;
      const fresh: Record<string, number> = { P: 0, A: 0, L: 0, H: 0, WO: 0, HO: 0 };
      Object.values(result.data).forEach((raw) => {
        const status = STATUS_MAP[raw as string];
        if (status && status !== "-" && status in fresh) fresh[status]++;
      });
      setCounts(fresh);
    } catch {}
  }, [currentEmployee]);

  // Recalculate on first load and after every save
  useEffect(() => { recalculate(); }, [recalculate, overviewRefreshKey]);

  const handleDownloadReport = () => {
    if (!currentEmployee) return;
    const rows = [
      ["Attendance Overview Report"],
      ["Employee Name", currentEmployee.name],
      ["Employee ID", currentEmployee.id || ""],
      [],
      ["Status", "Count"],
      ...SUMMARY_CARDS.map(({ key, label }) => [label, counts[key] ?? 0]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `${currentEmployee.name}_attendance_report.csv`;
    a.click();
  };

  if (isLoading) return (
    <PageLoader message="Loading attendance data…" className="h-96" />
  );

  if (notFound || !currentEmployee) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <p className="text-red-600 font-medium">Employee not found</p>
      <Link href="/admin/employees"><Button>Back to Employees</Button></Link>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Attendance Overview</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">{currentEmployee.name}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button onClick={handleDownloadReport} variant="outline" size="lg" className="shadow-md">
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
          <Link href={`/admin/employees/${resolvedParams.id}`}>
            <Button variant="outline" size="lg" className="shadow-md">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Auto-calculated summary cards (read-only) */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {SUMMARY_CARDS.map(({ key, label, color }) => {
          const styles = CARD_STYLES[color as keyof typeof CARD_STYLES];
          return (
            <Card key={key} className={`border-2 ${styles.border}`}>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className={`text-4xl font-bold ${styles.text}`}>{counts[key] ?? 0}</div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Auto-calculated</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Monthly Attendance Overview */}
      <MonthlyAttendanceOverview
        employee={currentEmployee}
        refreshKey={overviewRefreshKey}
      />

      {/* Editable Attendance Calendar */}
      <AttendanceCalendarEditable
        employee={currentEmployee}
        onEmployeeUpdate={(updated) => setCurrentEmployee(updated)}
        onSave={() => setOverviewRefreshKey((k) => k + 1)}
      />

      {/* Analytics */}
      <AttendanceAnalytics employee={currentEmployee} />
    </div>
  );
}
