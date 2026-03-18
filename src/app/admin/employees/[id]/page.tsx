"use client";

import { Employee } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState, useEffect, use } from "react";
import { getEmployee } from "@/app/(actions)/employees";
import { EmployeeDetailPanel } from "@/components/admin/employee-detail-panel";

export const dynamic = "force-dynamic";

export default function EmployeeDetailPage({
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
        console.log("Loading employee with ID:", resolvedParams.id);
        const employee = await getEmployee(resolvedParams.id);

        console.log("Fetched employee:", employee);
        if (!employee) {
          console.log("Employee not found for ID:", resolvedParams.id);
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        setCurrentEmployee(employee);
      } catch (error) {
        console.error("Error loading employee details:", error);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadEmployeeDetails();
  }, [resolvedParams.id]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Employee Details</h1>
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
          <h1 className="text-3xl font-bold text-slate-900">Employee Details</h1>
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
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Employee Details</h1>
          <p className="text-slate-600 mt-2">
            {currentEmployee.name} • ID: {currentEmployee.employeeId}
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/employees")}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          ← Back to Employees
        </button>
      </div>

      {currentEmployee && (
        <EmployeeDetailPanel
          employee={currentEmployee}
          employeeId={resolvedParams.id}
        />
      )}
    </div>
  );
}
