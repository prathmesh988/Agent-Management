"use client";

import { EmployeeTable } from "@/components/admin/employee-table";
import { EditEmployeeModal } from "@/components/admin/edit-employee-modal";
import { Employee } from "@/lib/types";
import { useEmployees } from "@/hooks/useEmployees";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function EmployeesPage() {
  const { employees, updateEmployee, deleteEmployee, searchEmployees } = useEmployees();
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const { toast } = useToast();

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleSaveEdit = async (updatedEmployee: Employee) => {
    try {
      await updateEmployee(updatedEmployee);
      setIsModalOpen(false);
      setEditingEmployee(null);
      toast({ title: "Employee updated successfully!", variant: "success" });
    } catch (error) {
      console.error("Error saving employee:", error);
      toast({ title: "Failed to update employee", description: "Please try again.", variant: "error" });
    }
  };

  const handleDelete = (employee: Employee) => {
    setDeleteTarget(employee);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <EmployeeTable
        employees={employees}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSearch={searchEmployees}
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

      {/* Delete Employee Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete Employee?"
        description={`Are you sure you want to delete ${deleteTarget?.name ?? 'this employee'}? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => {
          if (deleteTarget) deleteEmployee(deleteTarget.id);
        }}
      />
    </div>
  );
}
