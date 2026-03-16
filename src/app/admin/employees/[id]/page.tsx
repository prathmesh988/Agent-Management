'use client';

import { EmployeeProfile } from '@/components/admin/employee-detail';
import { EditEmployeeModal } from '@/components/admin/edit-employee-modal';
import { Employee } from '@/lib/data/mock-data';
import { useEmployees } from '@/hooks/useEmployees';
import { useRouter } from 'next/navigation';
import { useState, useEffect, use } from 'react';

export const dynamic = 'force-dynamic';

export default function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { getEmployee, updateEmployee, deleteEmployee, isLoading: employeesLoading } = useEmployees();
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (employeesLoading) return;

    const employee = getEmployee(resolvedParams.id);

    if (!employee) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }

    setCurrentEmployee(employee);
    setIsLoading(false);
  }, [resolvedParams.id, employeesLoading, getEmployee]);

  const handleEdit = () => {
    setIsModalOpen(true);
  };

  const handleSaveEdit = (updatedEmployee: Employee) => {
    updateEmployee(updatedEmployee);
    setCurrentEmployee(updatedEmployee);
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${currentEmployee?.name}?`)) {
      deleteEmployee(resolvedParams.id);
      router.push('/admin/employees');
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
            onClick={() => router.push('/admin/employees')}
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
