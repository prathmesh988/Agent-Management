"use client";

import { Employee } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Edit2, Trash2, ArrowLeft, Mail, Briefcase, Calendar, Users } from "lucide-react";
import Link from "next/link";

interface EmployeeProfileProps {
  employee: Employee;
  onEdit?: () => void;
  onDelete?: () => void;
}

// Helper function to get initials
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Helper function to get avatar background color based on name
function getAvatarColor(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-indigo-500",
    "bg-teal-500",
  ];
  return colors[name.charCodeAt(0) % colors.length];
}

// Helper to format dates
function formatDate(timestamp?: number): string {
  if (!timestamp) return "N/A";
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function EmployeeProfile({
  employee,
  onEdit,
  onDelete,
}: EmployeeProfileProps) {
  const totalDeductions =
    (employee.tds5perc || 0) +
    (employee.employeeContribution || 0) +
    (employee.employeeEsic || 0) +
    (employee.penalty || 0);

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/admin/employees">
          <Button
            variant="outline"
            size="sm"
            className="transition-all duration-200 hover:shadow-md"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
      </div>

      {/* ========== HERO PROFILE HEADER ========== */}
      <Card className="p-8 bg-gradient-to-br from-slate-50 to-white border border-slate-100 shadow-sm rounded-lg">
        <div className="flex items-start justify-between gap-6">
          {/* Left: Avatar + Name + Quick Info */}
          <div className="flex gap-6 flex-1">
            {/* Avatar */}
            <div
              className={`h-24 w-24 rounded-full ${getAvatarColor(employee.name)} flex items-center justify-center text-white text-4xl font-bold flex-shrink-0`}
            >
              {getInitials(employee.name)}
            </div>

            {/* Name, Designation, Status */}
            <div className="flex-1 pt-1">
              <h1 className="text-4xl font-bold text-slate-900 leading-tight">
                {employee.name}
              </h1>
              <p className="text-lg text-slate-600 mt-1 font-medium">
                {employee.designation || "N/A"}
              </p>

              {/* Status Badge */}
              <div className="mt-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    employee.status === "active"
                      ? "bg-green-100 text-green-700"
                      : employee.status === "on-leave"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full mr-2 ${
                      employee.status === "active"
                        ? "bg-green-600"
                        : employee.status === "on-leave"
                          ? "bg-amber-600"
                          : "bg-red-600"
                    }`}
                  />
                  {employee.status ? employee.status.charAt(0).toUpperCase() + employee.status.slice(1) : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex gap-2 flex-shrink-0">
            <Button
              onClick={onEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 shadow-sm"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={onDelete}
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Quick Info Bar - Below Name */}
        <div className="mt-8 pt-8 border-t border-slate-200 grid grid-cols-4 gap-6">
          {/* Employee ID */}
          <div>
            <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">
              Employee ID
            </p>
            <p className="text-lg font-semibold text-slate-900">{employee.id || "N/A"}</p>
          </div>

          {/* Email */}
          <div>
            <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1 flex items-center gap-1">
              <Mail className="h-3 w-3" /> Email
            </p>
            <p className="text-sm text-slate-800 truncate">{employee.email || "N/A"}</p>
          </div>

          {/* Department */}
          <div>
            <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1 flex items-center gap-1">
              <Users className="h-3 w-3" /> Department
            </p>
            <p className="text-lg font-semibold text-slate-900">{employee.department || employee.process || "N/A"}</p>
          </div>

          {/* Date of Joining */}
          <div>
            <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Joined
            </p>
            <p className="text-lg font-semibold text-slate-900">{formatDate(employee.dateOfJoining)}</p>
          </div>
        </div>
      </Card>

      {/* ========== TWO-COLUMN LAYOUT ========== */}
      <div className="grid grid-cols-3 gap-6">
        {/* LEFT COLUMN (60%) - Work & Bank Details */}
        <div className="col-span-2 space-y-6">
          {/* Job Information Card */}
          <Card className="p-7 border border-slate-100 shadow-sm rounded-lg hover:shadow-md transition-shadow">
            <h3 className="text-sm uppercase font-bold text-slate-700 tracking-wider mb-5">
              Job Information
            </h3>
            <div className="grid grid-cols-2 gap-6">
              {employee.designation && (
                <div>
                  <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">
                    Designation
                  </p>
                  <p className="text-base font-semibold text-slate-900">
                    {employee.designation}
                  </p>
                </div>
              )}
              {employee.process && (
                <div>
                  <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">
                    Process
                  </p>
                  <p className="text-base font-semibold text-slate-900">
                    {employee.process}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Bank & Government Details Card */}
          <Card className="p-7 border border-slate-100 shadow-sm rounded-lg hover:shadow-md transition-shadow">
            <h3 className="text-sm uppercase font-bold text-slate-700 tracking-wider mb-5">
              Bank & Government Details
            </h3>
            <div className="grid grid-cols-2 gap-6">
              {employee.bankName && (
                <div>
                  <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">
                    Bank Name
                  </p>
                  <p className="text-base font-semibold text-slate-900">
                    {employee.bankName}
                  </p>
                </div>
              )}
              {employee.accountNumber && (
                <div>
                  <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">
                    Account Number
                  </p>
                  <p className="text-base font-semibold text-slate-900 font-mono">
                    {employee.accountNumber}
                  </p>
                </div>
              )}
              {employee.ifscCode && (
                <div>
                  <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">
                    IFSC Code
                  </p>
                  <p className="text-base font-semibold text-slate-900">
                    {employee.ifscCode}
                  </p>
                </div>
              )}
              {employee.paymentMode && (
                <div>
                  <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">
                    Payment Mode
                  </p>
                  <p className="text-base font-semibold text-slate-900">
                    {employee.paymentMode}
                  </p>
                </div>
              )}
              {employee.uanNumber && (
                <div className="col-span-2">
                  <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">
                    UAN Number
                  </p>
                  <p className="text-base font-semibold text-slate-900">
                    {employee.uanNumber}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN (40%) - Financials & Compensation */}
        <div className="space-y-6">
          {/* Compensation Card - Consolidated */}
          <Card className="p-7 border border-slate-100 shadow-sm rounded-lg hover:shadow-md transition-shadow bg-gradient-to-br from-emerald-50 to-white">
            <h3 className="text-sm uppercase font-bold text-slate-700 tracking-wider mb-5">
              Compensation
            </h3>

            {/* Gross & Net Salary - Large Display */}
            <div className="space-y-4 mb-6">
              {employee.grossSalary && (
                <div>
                  <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">
                    Gross Salary
                  </p>
                  <p className="text-3xl font-bold text-emerald-600">
                    ₹{(employee.grossSalary / 100000).toFixed(2)}L
                  </p>
                </div>
              )}
              {employee.netSalary && (
                <div>
                  <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">
                    Net Salary
                  </p>
                  <p className="text-2xl font-bold text-emerald-700">
                    ₹{(employee.netSalary / 100000).toFixed(2)}L
                  </p>
                </div>
              )}
            </div>

            {/* Salary Breakdown Visual - Stacked Bar */}
            {employee.grossSalary && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-3">
                  Breakdown
                </p>
                <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
                  {employee.netSalary && (
                    <div
                      className="bg-emerald-500 transition-all duration-300"
                      style={{
                        width: `${((employee.netSalary / employee.grossSalary) * 100).toFixed(0)}%`,
                      }}
                      title={`Net: ₹${employee.netSalary.toLocaleString()}`}
                    />
                  )}
                  {totalDeductions > 0 && (
                    <div
                      className="bg-red-400"
                      style={{
                        width: `${((totalDeductions / employee.grossSalary) * 100).toFixed(0)}%`,
                      }}
                      title={`Deductions: ₹${totalDeductions.toLocaleString()}`}
                    />
                  )}
                </div>
                <div className="flex justify-between text-xs text-slate-600 mt-2">
                  <span>Net</span>
                  <span>Deductions</span>
                </div>
              </div>
            )}

            {/* Other Allowances */}
            {(employee.attendanceAllowance || employee.shiftAllowance) && (
              <div className="mt-4 space-y-2">
                {employee.attendanceAllowance && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Attendance Allowance</span>
                    <span className="font-semibold text-slate-900">
                      ₹{employee.attendanceAllowance.toLocaleString()}
                    </span>
                  </div>
                )}
                {employee.shiftAllowance && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Shift Allowance</span>
                    <span className="font-semibold text-slate-900">
                      ₹{employee.shiftAllowance.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Quick Adjustments Card */}
          <Card className="p-7 border border-slate-100 shadow-sm rounded-lg hover:shadow-md transition-shadow">
            <h3 className="text-sm uppercase font-bold text-slate-700 tracking-wider mb-5">
              Adjustments
            </h3>
            <div className="space-y-3">
              {employee.advance && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Advance</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    ₹{employee.advance.toLocaleString()}
                  </span>
                </div>
              )}
              {employee.arrear && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Arrear</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                    ₹{employee.arrear.toLocaleString()}
                  </span>
                </div>
              )}
              {employee.penalty && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Penalty</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                    ₹{employee.penalty.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ========== ATTENDANCE SECTION ========== */}
      <Card className="p-7 border border-slate-100 shadow-sm rounded-lg hover:shadow-md transition-shadow">
        <h3 className="text-sm uppercase font-bold text-slate-700 tracking-wider mb-6">
          Attendance Overview
        </h3>

        <div className="grid grid-cols-4 gap-6">
          {/* Present Days */}
          {employee.presentDays !== undefined && (
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
              <p className="text-xs uppercase font-bold text-emerald-600 tracking-wider mb-2">
                Present
              </p>
              <p className="text-3xl font-bold text-emerald-700">
                {employee.presentDays}
              </p>
              <p className="text-xs text-emerald-600 mt-1">days</p>
            </div>
          )}

          {/* Absent Days */}
          {employee.absentDays !== undefined && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-100">
              <p className="text-xs uppercase font-bold text-red-600 tracking-wider mb-2">
                Absent
              </p>
              <p className="text-3xl font-bold text-red-700">{employee.absentDays}</p>
              <p className="text-xs text-red-600 mt-1">days</p>
            </div>
          )}

          {/* Leave Days */}
          {employee.leaveDays !== undefined && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <p className="text-xs uppercase font-bold text-blue-600 tracking-wider mb-2">
                Leave
              </p>
              <p className="text-3xl font-bold text-blue-700">{employee.leaveDays}</p>
              <p className="text-xs text-blue-600 mt-1">days</p>
            </div>
          )}

          {/* Half Days */}
          {employee.halfDays !== undefined && (
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
              <p className="text-xs uppercase font-bold text-amber-600 tracking-wider mb-2">
                Half Days
              </p>
              <p className="text-3xl font-bold text-amber-700">
                {employee.halfDays}
              </p>
              <p className="text-xs text-amber-600 mt-1">days</p>
            </div>
          )}
        </div>

        {/* Additional Attendance Details Grid */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          {employee.weekOffDays !== undefined && (
            <div>
              <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">
                Week Off
              </p>
              <p className="text-xl font-bold text-slate-900">{employee.weekOffDays}</p>
            </div>
          )}
          {employee.holidayDays !== undefined && (
            <div>
              <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">
                Holidays
              </p>
              <p className="text-xl font-bold text-slate-900">{employee.holidayDays}</p>
            </div>
          )}
          {employee.totalPresent !== undefined && (
            <div>
              <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">
                Total Present
              </p>
              <p className="text-xl font-bold text-emerald-600">
                {employee.totalPresent}
              </p>
            </div>
          )}
          {employee.overtime !== undefined && (
            <div>
              <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">
                Overtime
              </p>
              <p className="text-xl font-bold text-slate-900">{employee.overtime}</p>
            </div>
          )}
        </div>
      </Card>

      {/* ========== DEDUCTIONS & CONTRIBUTIONS ========== */}
      <Card className="p-7 border border-slate-100 shadow-sm rounded-lg hover:shadow-md transition-shadow">
        <h3 className="text-sm uppercase font-bold text-slate-700 tracking-wider mb-6">
          Deductions & Contributions
        </h3>

        <div className="grid grid-cols-3 gap-6">
          {/* PF Contributions */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-xs uppercase font-bold text-slate-600 tracking-wider mb-3">
              Provident Fund
            </p>
            {employee.employeeContribution && (
              <div className="mb-3">
                <p className="text-xs text-slate-500 mb-1">Employee</p>
                <p className="text-lg font-bold text-slate-900">
                  ₹{employee.employeeContribution.toLocaleString()}
                </p>
              </div>
            )}
            {employee.employerContribution && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Employer</p>
                <p className="text-lg font-bold text-slate-900">
                  ₹{employee.employerContribution.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* ESIC */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-xs uppercase font-bold text-slate-600 tracking-wider mb-3">
              ESIC
            </p>
            {employee.employeeEsic && (
              <div className="mb-3">
                <p className="text-xs text-slate-500 mb-1">Employee</p>
                <p className="text-lg font-bold text-slate-900">
                  ₹{employee.employeeEsic.toLocaleString()}
                </p>
              </div>
            )}
            {employee.employerEsic && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Employer</p>
                <p className="text-lg font-bold text-slate-900">
                  ₹{employee.employerEsic.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Tax & Other Deductions */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-xs uppercase font-bold text-slate-600 tracking-wider mb-3">
              Tax & Other
            </p>
            {employee.tds5perc && (
              <div className="mb-3">
                <p className="text-xs text-slate-500 mb-1">TDS</p>
                <p className="text-lg font-bold text-red-600">
                  ₹{employee.tds5perc.toLocaleString()}
                </p>
              </div>
            )}
            {employee.paidAmount && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Paid Amount</p>
                <p className="text-lg font-bold text-emerald-600">
                  ₹{employee.paidAmount.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
