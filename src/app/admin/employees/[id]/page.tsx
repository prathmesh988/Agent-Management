"use client";

import { EmployeeProfile } from "@/components/admin/employee-detail";
import { EditEmployeeModal } from "@/components/admin/edit-employee-modal";
import { Employee } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useState, useEffect, use } from "react";
import { getEmployee } from "@/app/(actions)/employees";

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
        console.log("Loading employee with ID:", resolvedParams.id);
        // Fetch employee from server action which handles database service
        const employee = await getEmployee(resolvedParams.id);

        console.log("Fetched employee:", employee);
        if (!employee) {
          console.log("Employee not found for ID:", resolvedParams.id);
          setNotFound(true);
          setIsLoading(false);
          return;
        }

        // Employee is already properly typed from server action
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
