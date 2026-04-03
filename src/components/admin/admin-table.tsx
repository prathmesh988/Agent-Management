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
import { PageLoader } from "@/components/ui/page-loader";

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
  READ: "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
  WRITE: "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800",
  UPDATE: "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800",
  DELETE: "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800",
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
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Admin Users ({admins.length})
          </h2>
          {!canEditRoles && currentUserRole === 'mvp' && (
            <div className="text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
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
                {/* <TableHead>Status</TableHead> */}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-0">
                    <PageLoader message="Loading admins…" size="sm" />
                  </TableCell>
                </TableRow>
              ) : admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No admins found
                  </TableCell>
                </TableRow>
              ) : (
                admins.map((admin) => (
                  <TableRow
                    key={admin.id}
                    className="transition-colors duration-200 hover:bg-muted/50"
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{admin.name}</p>
                        <p className="text-xs text-muted-foreground">{admin.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-3 py-1 rounded-lg text-sm font-medium ${
                          admin.role === 'admin'
                            ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-muted text-muted-foreground border border-border'
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
                              permissionColors[perm] || 'bg-muted text-muted-foreground border border-border'
                            }`}
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                 
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canEditRoles && (
                          <>
                            <button
                              onClick={() => setEditingAdmin(admin)}
                              disabled={updatingId === admin.id}
                              className="p-2 rounded-lg text-muted-foreground hover:bg-primary/10 transition-all duration-200 hover:text-primary disabled:opacity-50"
                              title="Edit admin role"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onDeleteAdmin?.(admin)}
                              disabled={updatingId === admin.id}
                              className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 transition-all duration-200 hover:text-destructive disabled:opacity-50"
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
