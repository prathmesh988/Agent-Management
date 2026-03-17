"use client";

import { AdminUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit2, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { EditRoleModal } from "./edit-role-modal";

interface AdminTableProps {
  admins: AdminUser[];
  loading?: boolean;
  currentUserRole?: 'admin' | 'mvp' | null;
  onAddAdmin?: () => void;
  onEditAdmin?: (admin: AdminUser) => void;
  onDeleteAdmin?: (admin: AdminUser) => void;
  onUpdateRole?: (adminId: string, role: 'admin' | 'mvp') => Promise<void>;
}

const permissionColors: Record<string, string> = {
  READ: "bg-blue-100 text-blue-700 border border-blue-200",
  WRITE: "bg-purple-100 text-purple-700 border border-purple-200",
  UPDATE: "bg-green-100 text-green-700 border border-green-200",
  DELETE: "bg-red-100 text-red-700 border border-red-200",
};


export function AdminTable({
  admins,
  loading = false,
  currentUserRole = null,
  onAddAdmin,
  onEditAdmin,
  onDeleteAdmin,
  onUpdateRole,
}: AdminTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const canEditRoles = currentUserRole === 'admin';

  const handleRoleChange = async (adminId: string, role: 'admin' | 'mvp') => {
    if (!onUpdateRole) return;
    try {
      setUpdatingId(adminId);
      await onUpdateRole(adminId, role);
      setEditingAdmin(null);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <Card>
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Admin Users ({admins.length})
          </h2>
          {!canEditRoles && currentUserRole === 'mvp' && (
            <div className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-200">
              🔒 MVP users can only view roles
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    Loading admins...
                  </TableCell>
                </TableRow>
              ) : admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    No admins found
                  </TableCell>
                </TableRow>
              ) : (
                admins.map((admin) => (
                  <TableRow
                    key={admin.id}
                    className="transition-colors duration-200 hover:bg-slate-50"
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900">{admin.name}</p>
                        <p className="text-xs text-slate-500">{admin.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          admin.role === 'admin'
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {admin.role.charAt(0).toUpperCase() + admin.role.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {admin.permissions.map((perm) => (
                          <span
                            key={perm}
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              permissionColors[perm] || 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
                          admin.status === 'active'
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {admin.status.charAt(0).toUpperCase() + admin.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEditRoles && (
                          <>
                            <button
                              onClick={() => setEditingAdmin(admin)}
                              disabled={updatingId === admin.id}
                              className="p-2 rounded-lg text-slate-600 hover:bg-blue-100 transition-all duration-200 hover:text-blue-900 disabled:opacity-50"
                              title="Edit admin role"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onDeleteAdmin?.(admin)}
                              disabled={updatingId === admin.id}
                              className="p-2 rounded-lg text-slate-600 hover:bg-red-100 transition-all duration-200 hover:text-red-900 disabled:opacity-50"
                              title="Delete admin"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Edit Role Modal */}
      {editingAdmin && (
        <EditRoleModal
          admin={editingAdmin}
          isOpen={true}
          isUpdating={updatingId === editingAdmin.id}
          onClose={() => setEditingAdmin(null)}
          onRoleChange={(role) => handleRoleChange(editingAdmin.id, role)}
        />
      )}
    </>
  );
}
