'use client';

import { EmployeeProfile } from '@/components/admin/employee-detail';
import { mockEmployees } from '@/lib/data/mock-data';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';

export default function EmployeeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const employee = mockEmployees.find((e) => e.id === params.id);

  if (!employee) {
    notFound();
  }

  const handleEdit = () => {
    // TODO: Implement edit modal
    console.log('Edit employee:', employee.id);
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${employee.name}?`)) {
      router.push('/admin/employees');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Employee Detail</h1>
      </div>

      <EmployeeProfile
        employee={employee}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
