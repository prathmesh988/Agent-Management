"use client";

import { Employee } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Edit2, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface EmployeeProfileProps {
  employee: Employee;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function EmployeeProfile({
  employee,
  onEdit,
  onDelete,
}: EmployeeProfileProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/admin/employees">
          <Button
            variant="outline"
            size="sm"
            className="transition-all duration-200 hover:shadow-md hover:scale-105"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button
            onClick={onEdit}
            variant="outline"
            className="transition-all duration-200 hover:shadow-md hover:scale-105"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            onClick={onDelete}
            variant="outline"
            className="text-red-600 hover:text-red-700 transition-all duration-200 hover:shadow-md hover:scale-105"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="p-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Left Column */}
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {employee.name}
            </h1>
            <p className="mt-2 text-slate-600">{employee.designation}</p>

            <div className="mt-8 space-y-6">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Employee ID
                </p>
                <p className="mt-1 text-lg text-slate-900">{employee.id}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-600">Email</p>
                <p className="mt-1 text-lg text-slate-900">{employee.email}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-600">Department</p>
                <p className="mt-1 text-lg text-slate-900">
                  {employee.department || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-slate-600">Status</p>
              <div className="mt-1">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    employee.status === "active"
                      ? "bg-green-100 text-green-800"
                      : employee.status === "on-leave"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {employee.status
                    ? employee.status.charAt(0).toUpperCase() +
                      employee.status.slice(1)
                    : "N/A"}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-600">
                Date of Joining
              </p>
              <p className="mt-1 text-lg text-slate-900">
                {employee.dateOfJoining || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-600">Process</p>
              <p className="mt-1 text-lg text-slate-900">
                {employee.process || "N/A"}
              </p>
            </div>

            {employee.ctc && (
              <div>
                <p className="text-sm font-medium text-slate-600">CTC</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  ₹{employee.ctc.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Financial Information */}
      <Card className="p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">
          Financial Information
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {employee.grossSalary && (
            <div>
              <p className="text-sm font-medium text-slate-600">Gross Salary</p>
              <p className="mt-1 text-xl font-semibold text-emerald-600">
                ₹{employee.grossSalary.toLocaleString()}
              </p>
            </div>
          )}
          {employee.netSalary && (
            <div>
              <p className="text-sm font-medium text-slate-600">Net Salary</p>
              <p className="mt-1 text-xl font-semibold text-emerald-600">
                ₹{employee.netSalary.toLocaleString()}
              </p>
            </div>
          )}
          {employee.attendanceAllowance && (
            <div>
              <p className="text-sm font-medium text-slate-600">
                Attendance Allowance
              </p>
              <p className="mt-1 text-lg text-slate-900">
                ₹{employee.attendanceAllowance.toLocaleString()}
              </p>
            </div>
          )}
          {employee.shiftAllowance && (
            <div>
              <p className="text-sm font-medium text-slate-600">
                Shift Allowance
              </p>
              <p className="mt-1 text-lg text-slate-900">
                ₹{employee.shiftAllowance.toLocaleString()}
              </p>
            </div>
          )}
          {employee.advance && (
            <div>
              <p className="text-sm font-medium text-slate-600">Advance</p>
              <p className="mt-1 text-lg text-slate-900">
                ₹{employee.advance.toLocaleString()}
              </p>
            </div>
          )}
          {employee.arrear && (
            <div>
              <p className="text-sm font-medium text-slate-600">Arrear</p>
              <p className="mt-1 text-lg text-slate-900">
                ₹{employee.arrear.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Bank & Government Details */}
      <Card className="p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">
          Bank & Government Details
        </h2>
        <div className="grid gap-8 md:grid-cols-2">
          {employee.accountNumber && (
            <div>
              <p className="text-sm font-medium text-slate-600">
                Account Number
              </p>
              <p className="mt-1 text-lg text-slate-900">
                {employee.accountNumber}
              </p>
            </div>
          )}
          {employee.ifscCode && (
            <div>
              <p className="text-sm font-medium text-slate-600">IFSC Code</p>
              <p className="mt-1 text-lg text-slate-900">{employee.ifscCode}</p>
            </div>
          )}
          {employee.bankName && (
            <div>
              <p className="text-sm font-medium text-slate-600">Bank Name</p>
              <p className="mt-1 text-lg text-slate-900">{employee.bankName}</p>
            </div>
          )}
          {employee.paymentMode && (
            <div>
              <p className="text-sm font-medium text-slate-600">Payment Mode</p>
              <p className="mt-1 text-lg text-slate-900">
                {employee.paymentMode}
              </p>
            </div>
          )}
          {employee.uanNumber && (
            <div>
              <p className="text-sm font-medium text-slate-600">UAN Number</p>
              <p className="mt-1 text-lg text-slate-900">
                {employee.uanNumber}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Attendance Information */}
      <Card className="p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">
          Attendance Information
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {employee.presentDays !== undefined && (
            <div>
              <p className="text-sm font-medium text-slate-600">Present Days</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {employee.presentDays}
              </p>
            </div>
          )}
          {employee.absentDays !== undefined && (
            <div>
              <p className="text-sm font-medium text-slate-600">Absent Days</p>
              <p className="mt-1 text-2xl font-bold text-red-600">
                {employee.absentDays}
              </p>
            </div>
          )}
          {employee.leaveDays !== undefined && (
            <div>
              <p className="text-sm font-medium text-slate-600">Leave Days</p>
              <p className="mt-1 text-2xl font-bold text-blue-600">
                {employee.leaveDays}
              </p>
            </div>
          )}
          {employee.halfDays !== undefined && (
            <div>
              <p className="text-sm font-medium text-slate-600">Half Days</p>
              <p className="mt-1 text-lg text-slate-900">{employee.halfDays}</p>
            </div>
          )}
          {employee.weekOffDays !== undefined && (
            <div>
              <p className="text-sm font-medium text-slate-600">Week Off</p>
              <p className="mt-1 text-lg text-slate-900">
                {employee.weekOffDays}
              </p>
            </div>
          )}
          {employee.holidayDays !== undefined && (
            <div>
              <p className="text-sm font-medium text-slate-600">Holidays</p>
              <p className="mt-1 text-lg text-slate-900">
                {employee.holidayDays}
              </p>
            </div>
          )}
          {employee.cl !== undefined && (
            <div>
              <p className="text-sm font-medium text-slate-600">Casual Leave</p>
              <p className="mt-1 text-lg text-slate-900">
                {employee.cl}
              </p>
            </div>
          )}
          {employee.totalPresent !== undefined && (
            <div>
              <p className="text-sm font-medium text-slate-600">
                Total Present
              </p>
              <p className="mt-1 text-xl font-semibold text-emerald-600">
                {employee.totalPresent}
              </p>
            </div>
          )}
          {employee.overtime !== undefined && (
            <div>
              <p className="text-sm font-medium text-slate-600">Overtime</p>
              <p className="mt-1 text-lg text-slate-900">{employee.overtime}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Deductions & Contributions */}
      <Card className="p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">
          Deductions & Contributions
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {employee.tds5perc && (
            <div>
              <p className="text-sm font-medium text-slate-600">TDS</p>
              <p className="mt-1 text-lg font-semibold text-red-600">
                ₹{employee.tds5perc.toLocaleString()}
              </p>
            </div>
          )}
          {employee.employeeContribution && (
            <div>
              <p className="text-sm font-medium text-slate-600">
                Employee PF Contribution
              </p>
              <p className="mt-1 text-lg text-slate-900">
                ₹{employee.employeeContribution.toLocaleString()}
              </p>
            </div>
          )}
          {employee.employerContribution && (
            <div>
              <p className="text-sm font-medium text-slate-600">
                Employer PF Contribution
              </p>
              <p className="mt-1 text-lg text-slate-900">
                ₹{employee.employerContribution.toLocaleString()}
              </p>
            </div>
          )}
          {employee.employeeEsic && (
            <div>
              <p className="text-sm font-medium text-slate-600">
                Employee ESIC
              </p>
              <p className="mt-1 text-lg text-slate-900">
                ₹{employee.employeeEsic.toLocaleString()}
              </p>
            </div>
          )}
          {employee.employerEsic && (
            <div>
              <p className="text-sm font-medium text-slate-600">
                Employer ESIC
              </p>
              <p className="mt-1 text-lg text-slate-900">
                ₹{employee.employerEsic.toLocaleString()}
              </p>
            </div>
          )}
          {employee.penalty && (
            <div>
              <p className="text-sm font-medium text-slate-600">Penalty</p>
              <p className="mt-1 text-lg text-red-600">
                ₹{employee.penalty.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
