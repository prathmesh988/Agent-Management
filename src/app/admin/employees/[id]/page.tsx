"use client";

import { EmployeeProfile } from "@/components/admin/employee-detail";
import { EditEmployeeModal } from "@/components/admin/edit-employee-modal";
import { Employee } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState, useEffect, use } from "react";
import { fetchEmployee, type EmployeeRecord } from "@/services/database";

export const dynamic = "force-dynamic";

export default function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadEmployeeDetails = async () => {
      try {
        // Fetch employee from database using the new database service
        const employee = await fetchEmployee(resolvedParams.id);

        if (!employee) {
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        // Type cast the employee record to Employee type
        // EmployeeRecord has all necessary fields for Employee interface
        const typedEmployee: Employee = {
          id: employee.$id || resolvedParams.id,
          employeeId: employee.employeeId || "",
          name: employee.name || "",
          email: "", // Email not in EmployeeRecord, use empty string
          status: "active",
          ctc: employee.ctc,
          attendanceAllowance: employee.attendanceAllowance,
          process: employee.process,
          designation: employee.designation,
          dateOfJoining: new Date(employee.dateOfJoining || "").getTime(), // Convert string date to timestamp
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

  const handleEdit = () => {
    setIsModalOpen(true);
  };

  const handleSaveEdit = (updatedEmployee: Employee) => {
    setCurrentEmployee(updatedEmployee);
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${currentEmployee?.name}?`)) {
      router.push("/admin/employees");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Employee Detail</h1>
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
          <h1 className="text-3xl font-bold text-slate-900">Employee Detail</h1>
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
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Employee Detail</h1>
      </div>

      {currentEmployee && (
        <>
          <EmployeeProfile
            employee={currentEmployee}
            employeeId={resolvedParams.id}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />

          <EditEmployeeModal
            employee={currentEmployee}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveEdit}
          />
        </>
      )}
    </div>
  );
}
