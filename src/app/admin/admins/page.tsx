'use client';

import { AdminTable } from '@/components/admin/admin-table';
import { mockAdmins } from '@/lib/data/mock-data';
import { useState } from 'react';

export default function AdminsPage() {
  const [admins, setAdmins] = useState(mockAdmins);

  const handleAddAdmin = () => {
    // TODO: Implement add admin modal
    console.log('Add new admin');
  };

  const handleEditAdmin = (admin: any) => {
    // TODO: Implement edit admin modal
    console.log('Edit admin:', admin.id);
  };

  const handleDeleteAdmin = (admin: any) => {
    if (confirm(`Are you sure you want to delete ${admin.name}?`)) {
      setAdmins(admins.filter((a) => a.id !== admin.id));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Management</h1>
        <p className="mt-2 text-slate-600">
          Manage admin users and their permissions.
        </p>
      </div>

      <AdminTable
        admins={admins}
        onAddAdmin={handleAddAdmin}
        onEditAdmin={handleEditAdmin}
        onDeleteAdmin={handleDeleteAdmin}
      />

      {/* Permissions Guide */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Permission Levels
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">READ</h4>
            <p className="text-sm text-slate-600">
              View employee data and reports. Cannot make changes.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">WRITE</h4>
            <p className="text-sm text-slate-600">
              Create, edit, and delete employee records.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-2">ADMIN</h4>
            <p className="text-sm text-slate-600">
              Full access including admin management and system settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
