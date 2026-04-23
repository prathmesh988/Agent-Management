"use client";

import { useState } from "react";
import { AdminUser } from "@/lib/types";
import { Card } from "@/components/ui/card";

type AssignableRole = 'admin' | 'manager' | 'hr' | 'viewer' | 'mvp' | 'new_user';

interface EditRoleModalProps {
  admin: AdminUser;
  isOpen: boolean;
  isUpdating: boolean;
  onClose: () => void;
  onRoleChange: (role: AssignableRole) => Promise<void>;
}

const ROLES: {
  value: AssignableRole;
  label: string;
  icon: string;
  desc: string;
  accent: string;
}[] = [
  {
    value: 'admin',
    label: 'Admin',
    icon: '👑',
    desc: 'Full system access — manage users, all data, roles and config',
    accent: 'border-amber-500 dark:border-amber-400 bg-amber-50 dark:bg-amber-950/40',
  },
  {
    value: 'manager',
    label: 'Manager',
    icon: '🏢',
    desc: 'Read + Write + Update records. Cannot delete or manage roles',
    accent: 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-950/40',
  },
  {
    value: 'hr',
    label: 'HR',
    icon: '👥',
    desc: 'Read + Write access. Manage employee records and onboarding',
    accent: 'border-cyan-500 dark:border-cyan-400 bg-cyan-50 dark:bg-cyan-950/40',
  },
  {
    value: 'mvp',
    label: 'MVP',
    icon: '🚀',
    desc: 'Approved user — full read access across the system',
    accent: 'border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
  },
  {
    value: 'viewer',
    label: 'Viewer',
    icon: '👁️',
    desc: 'Read-only access. View data and reports, no modifications',
    accent: 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/40',
  },
  {
    value: 'new_user',
    label: 'Pending (New User)',
    icon: '⏳',
    desc: 'No access. Account awaiting admin approval',
    accent: 'border-orange-500 dark:border-orange-400 bg-orange-50 dark:bg-orange-950/40',
  },
];

export function EditRoleModal({
  admin,
  isOpen,
  isUpdating,
  onClose,
  onRoleChange,
}: EditRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<AssignableRole>(
    (admin.role as AssignableRole) ?? 'mvp'
  );

  const handleSave = async () => {
    if (selectedRole !== admin.role) {
      await onRoleChange(selectedRole);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg p-6 mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-foreground mb-1">
          Edit Role for {admin.name}
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          Current role:{' '}
          <strong className="text-foreground capitalize">{admin.role.replace('_', ' ')}</strong>
        </p>

        <div className="space-y-2 mb-6">
          {ROLES.map((r) => (
            <label
              key={r.value}
              className={`flex items-center p-3.5 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                selectedRole === r.value
                  ? r.accent
                  : 'border-border bg-transparent hover:bg-muted/50'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={selectedRole === r.value}
                onChange={() => setSelectedRole(r.value)}
                className="w-4 h-4 accent-current"
                disabled={isUpdating}
              />
              <span className="ml-2 text-lg leading-none flex-shrink-0">{r.icon}</span>
              <div className="ml-3">
                <p className="font-semibold text-foreground text-sm">{r.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted transition-all duration-200 disabled:opacity-50 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isUpdating || selectedRole === admin.role}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isUpdating ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </Card>
    </div>
  );
}
