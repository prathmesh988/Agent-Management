"use client";

import { EmployeeTable } from "@/components/admin/employee-table";
import { EditEmployeeModal } from "@/components/admin/edit-employee-modal";
import { Employee } from "@/lib/types";
import { useEmployees } from "@/hooks/useEmployees";
import { useState } from "react";

export default function EmployeesPage() {
  const { employees, updateEmployee, deleteEmployee } = useEmployees();
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleSaveEdit = async (updatedEmployee: Employee) => {
    try {
      await updateEmployee(updatedEmployee);
      setIsModalOpen(false);
      setEditingEmployee(null);
      alert("Employee updated successfully!");
    } catch (error) {
      console.error("Error saving employee:", error);
      alert("Failed to update employee. Please try again.");
    }
  };

  const handleDelete = (employee: Employee) => {
    if (confirm(`Are you sure you want to delete ${employee.name}?`)) {
      deleteEmployee(employee.id);
    }
  };

  return (
    <div className="space-y-6">
      <EmployeeTable
        employees={employees}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <EditEmployeeModal
        employee={editingEmployee}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEmployee(null);
        }}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
