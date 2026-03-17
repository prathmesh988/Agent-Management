"use client";

import { useState } from "react";
import { AdminUser } from "@/lib/types";
import { Card } from "@/components/ui/card";

interface EditRoleModalProps {
  admin: AdminUser;
  isOpen: boolean;
  isUpdating: boolean;
  onClose: () => void;
  onRoleChange: (role: 'admin' | 'mvp') => Promise<void>;
}

export function EditRoleModal({
  admin,
  isOpen,
  isUpdating,
  onClose,
  onRoleChange,
}: EditRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'mvp'>(admin.role);

  const handleSave = async () => {
    if (selectedRole !== admin.role) {
      await onRoleChange(selectedRole);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6 mx-4">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Edit Role for {admin.name}
        </h2>

        <p className="text-sm text-slate-600 mb-4">
          Current role: <strong>{admin.role.toUpperCase()}</strong>
        </p>

        <div className="space-y-3 mb-6">
          {/* Admin Role Option */}
          <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200" 
                 style={{
                   borderColor: selectedRole === 'admin' ? '#b45309' : '#ccc',
                   backgroundColor: selectedRole === 'admin' ? '#fef3c7' : 'transparent'
                 }}>
            <input
              type="radio"
              name="role"
              value="admin"
              checked={selectedRole === 'admin'}
              onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'mvp')}
              className="w-4 h-4 text-amber-600"
              disabled={isUpdating}
            />
            <div className="ml-3">
              <p className="font-semibold text-slate-900">👤 Admin</p>
              <p className="text-xs text-slate-600">Full Access - Can manage all users and data</p>
            </div>
          </label>

          {/* MVP Role Option */}
          <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200"
                 style={{
                   borderColor: selectedRole === 'mvp' ? '#2563eb' : '#ccc',
                   backgroundColor: selectedRole === 'mvp' ? '#dbeafe' : 'transparent'
                 }}>
            <input
              type="radio"
              name="role"
              value="mvp"
              checked={selectedRole === 'mvp'}
              onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'mvp')}
              className="w-4 h-4 text-blue-600"
              disabled={isUpdating}
            />
            <div className="ml-3">
              <p className="font-semibold text-slate-900">👁️ MVP</p>
              <p className="text-xs text-slate-600">Read-only - Can only view data</p>
            </div>
          </label>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isUpdating || selectedRole === admin.role}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Card>
    </div>
  );
}
