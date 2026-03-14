"use client";

import { AdminTable } from "@/components/admin/admin-table";
import { mockAdmins } from "@/lib/data/mock-data";
import { useState } from "react";
import { Eye, PencilIcon, Shield, Card as CardIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function AdminsPage() {
  const [admins, setAdmins] = useState(mockAdmins);

  const handleAddAdmin = () => {
    // TODO: Implement add admin modal
    console.log("Add new admin");
  };

  const handleEditAdmin = (admin: any) => {
    // TODO: Implement edit admin modal
    console.log("Edit admin:", admin.id);
  };

  const handleDeleteAdmin = (admin: any) => {
    if (confirm(`Are you sure you want to delete ${admin.name}?`)) {
      setAdmins(admins.filter((a) => a.id !== admin.id));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-800 text-slate-900">Admin Management</h1>
        <p className="mt-2 text-slate-600">
          Manage admin users and their permissions across the system.
        </p>
      </div>

      <AdminTable
        admins={admins}
        onAddAdmin={handleAddAdmin}
        onEditAdmin={handleEditAdmin}
        onDeleteAdmin={handleDeleteAdmin}
      />

      {/* Permission Levels - Visual Cards */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-slate-900">
          Permission Levels
        </h3>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6 border-l-4 border-l-blue-600">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">READ</h4>
                <p className="text-sm text-slate-600">
                  View employee data and reports. Cannot make changes.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-purple-600">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <PencilIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">WRITE</h4>
                <p className="text-sm text-slate-600">
                  Create, edit, and delete employee records.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-amber-600">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-amber-100">
                <Shield className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-1">ADMIN</h4>
                <p className="text-sm text-slate-600">
                  Full access including admin management and system settings.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
