"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Employee } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { fetchEmployee, type EmployeeRecord } from "@/services/database";
import { AttendanceCalendar } from "@/components/admin/attendance-calendar";
import { AttendanceAnalytics } from "@/components/admin/attendance-analytics";

export const dynamic = "force-dynamic";

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

  useEffect(() => {
    const loadEmployeeDetails = async () => {
      try {
        const employee = await fetchEmployee(resolvedParams.id);

        if (!employee) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        const typedEmployee: Employee = {
          id: employee.$id || resolvedParams.id,
          employeeId: employee.employeeId || "",
          name: employee.name || "",
          email: "",
          status: "active",
          ctc: employee.ctc,
          attendanceAllowance: employee.attendanceAllowance,
          process: employee.process,
          designation: employee.designation,
          dateOfJoining: new Date(employee.dateOfJoining || "").getTime(),
          uanNumber: employee.uanNumber,
          accountNumber: employee.accountNumber,
          ifscCode: employee.ifscCode,
          bankName: employee.bankName,
          paymentMode: employee.paymentMode,
          presentDays: employee.presentDays,
          absentDays: employee.absentDays,
          leaveDays: employee.leaveDays,
          halfDays: employee.halfDays,
          weekOffDays: employee.weekOffDays,
          holidayDays: employee.holidayDays,
          cl: employee.cl,
          totalPresent: employee.totalPresent,
          overtime: employee.overtime,
          arrear: employee.arrear,
          advance: employee.advance,
          shiftAllowance: employee.shiftAllowance,
          grossSalary: employee.grossSalary,
          netSalary: employee.netSalary,
          tds5perc: employee.tds,
          employeeContribution: employee.employeeContribution,
          employerContribution: employee.employerContribution,
          employeeEsic: employee.employeeEsic,
          employerEsic: employee.employerEsic,
          penalty: employee.penalty,
          paidAmount: employee.paidAmount,
          // Copy all daily attendance fields
          ...Object.keys(employee).reduce((acc, key) => {
            if (/^\d+[A-Za-z]+$/.test(key)) {
              acc[key as keyof Employee] = (employee as any)[key];
            }
            return acc;
          }, {} as any),
        };

        setCurrentEmployee(typedEmployee);
      } catch (error) {
        console.error("Error loading employee details:", error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadEmployeeDetails();
  }, [resolvedParams.id]);

  const handleDownloadReport = () => {
    if (!currentEmployee) return;

    // Create a simple CSV export (you can enhance this with PDF if needed)
    const data = [
      ["Attendance Overview Report"],
      ["Employee Name", currentEmployee.name],
      ["Employee ID", currentEmployee.id],
      ["Designation", currentEmployee.designation || "N/A"],
      ["Department", currentEmployee.process || "N/A"],
      ["Date of Joining", new Date(currentEmployee.dateOfJoining || 0).toLocaleDateString()],
      [],
      ["Attendance Summary"],
      ["Present Days", currentEmployee.presentDays || 0],
      ["Absent Days", currentEmployee.absentDays || 0],
      ["Leave Days", currentEmployee.leaveDays || 0],
      ["Half Days", currentEmployee.halfDays || 0],
      ["Week Off", currentEmployee.weekOffDays || 0],
      ["Holidays", currentEmployee.holidayDays || 0],
      ["Total Present", currentEmployee.totalPresent || 0],
      ["Overtime Hours", currentEmployee.overtime || 0],
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
          <button
            onClick={() => router.push("/admin/employees")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Employees
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Attendance Overview</h1>
          <p className="text-slate-600 mt-1">{currentEmployee.name}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleDownloadReport}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
          <Link href={`/admin/employees/${resolvedParams.id}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Employee Quick Info */}
      <div className="grid grid-cols-4 gap-4 bg-slate-50 p-6 rounded-lg border border-slate-200">
        <div>
          <p className="text-xs uppercase font-bold text-slate-600 tracking-wider mb-1">
            Employee ID
          </p>
          <p className="text-lg font-semibold text-slate-900">{currentEmployee.id}</p>
        </div>
        <div>
          <p className="text-xs uppercase font-bold text-slate-600 tracking-wider mb-1">
            Designation
          </p>
          <p className="text-lg font-semibold text-slate-900">
            {currentEmployee.designation || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase font-bold text-slate-600 tracking-wider mb-1">
            Department
          </p>
          <p className="text-lg font-semibold text-slate-900">
            {currentEmployee.process || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase font-bold text-slate-600 tracking-wider mb-1">
            Status
          </p>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
              currentEmployee.status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {currentEmployee.status || "N/A"}
          </span>
        </div>
      </div>

      {/* Analytics Section */}
      <div>
        <AttendanceAnalytics employee={currentEmployee} />
      </div>

      {/* Calendar Section */}
      <div>
        <AttendanceCalendar employee={currentEmployee} />
      </div>
    </div>
  );
}
