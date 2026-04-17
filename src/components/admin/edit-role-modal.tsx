"use client";

import { useState } from "react";
import { AdminUser } from "@/lib/types";
import { Card } from "@/components/ui/card";

interface EditRoleModalProps {
  admin: AdminUser;
  isOpen: boolean;
  isUpdating: boolean;
  onClose: () => void;
  onRoleChange: (role: 'admin' | 'viewer') => Promise<void>;
}

export function EditRoleModal({
  admin,
  isOpen,
  isUpdating,
  onClose,
  onRoleChange,
}: EditRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'viewer'>(admin.role);

  const handleSave = async () => {
    if (selectedRole !== admin.role) {
      await onRoleChange(selectedRole);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6 mx-4">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Edit Role for {admin.name}
        </h2>

        <p className="text-sm text-muted-foreground mb-4">
          Current role: <strong className="text-foreground">{admin.role.toUpperCase()}</strong>
        </p>

        <div className="space-y-3 mb-6">
          {/* Admin Role Option */}
          <label
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedRole === 'admin'
                ? 'border-amber-500 dark:border-amber-400 bg-amber-50 dark:bg-amber-950/40'
                : 'border-border bg-transparent hover:bg-muted/50'
            }`}
          >
            <input
              type="radio"
              name="role"
              value="admin"
              checked={selectedRole === 'admin'}
              onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'viewer')}
              className="w-4 h-4 text-amber-600 accent-amber-600"
              disabled={isUpdating}
            />
            <div className="ml-3">
              <p className="font-semibold text-foreground">👤 Admin</p>
              <p className="text-xs text-muted-foreground">Full Access - Can manage all users and data</p>
            </div>
          </label>

          {/* viewer Role Option */}
          <label
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedRole === 'viewer'
                ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/40'
                : 'border-border bg-transparent hover:bg-muted/50'
            }`}
          >
            <input
              type="radio"
              name="role"
              value="viewer"
              checked={selectedRole === 'viewer'}
              onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'viewer')}
              className="w-4 h-4 text-blue-600 accent-blue-600"
              disabled={isUpdating}
            />
            <div className="ml-3">
              <p className="font-semibold text-foreground">👁️ viewer</p>
              <p className="text-xs text-muted-foreground">Read-only - Can only view data</p>
            </div>
          </label>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-all duration-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isUpdating || selectedRole === admin.role}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Card>
    </div>
  );
}
