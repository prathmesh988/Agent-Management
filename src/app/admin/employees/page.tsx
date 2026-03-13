'use client';

import { EmployeeTable } from '@/components/admin/employee-table';
import { mockEmployees } from '@/lib/data/mock-data';
import { useState } from 'react';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState(mockEmployees);

  const handleDelete = (employee: any) => {
    if (confirm(`Are you sure you want to delete ${employee.name}?`)) {
      setEmployees(employees.filter((e) => e.id !== employee.id));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Employees</h1>
        <p className="mt-2 text-slate-600">
          Manage your workforce with search, filter, and pagination.
        </p>
      </div>

      <EmployeeTable
        employees={employees}
        onDelete={handleDelete}
      />
    </div>
  );
}
