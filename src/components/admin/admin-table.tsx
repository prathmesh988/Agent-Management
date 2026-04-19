"use client";

import { AdminUser } from "@/lib/types";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Edit2, Trash2, Eye, FilePen, RefreshCw, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { EditRoleModal } from "./edit-role-modal";
import { PageLoader } from "@/components/ui/page-loader";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface AdminTableProps {
  admins: AdminUser[];
  loading?: boolean;
  currentUserRole?: 'admin' | 'viewer' | 'mvp' | 'new_user' | null;
  onAddAdmin?: () => void;
  onEditAdmin?: (admin: AdminUser) => void;
  onDeleteAdmin?: (admin: AdminUser) => void;
  onUpdateRole?: (adminId: string, role: 'admin' | 'viewer' | 'mvp' | 'new_user') => Promise<void>;
  onApproveUser?: (adminId: string) => Promise<void>;
  onDisapproveUser?: (adminId: string) => Promise<void>;
}

const permissionColors: Record<string, string> = {
  READ: "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
  WRITE: "bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800",
  UPDATE: "bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800",
  DELETE: "bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800",
};


const roleStyles: Record<string, string> = {
  admin: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
  mvp: 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
  viewer: 'bg-muted text-muted-foreground border border-border',
  new_user: 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
};

export function AdminTable({
  admins,
  loading = false,
  currentUserRole = null,
  onAddAdmin,
  onEditAdmin,
  onDeleteAdmin,
  onUpdateRole,
  onApproveUser,
  onDisapproveUser,
}: AdminTableProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [disapproveTarget, setDisapproveTarget] = useState<AdminUser | null>(null);
  const canEditRoles = currentUserRole === 'admin';

  const handleRoleChange = async (adminId: string, role: 'admin' | 'viewer' | 'mvp') => {
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
          {!canEditRoles && currentUserRole === 'viewer' && (
            <div className="text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
              🔒 viewer users can only view roles
            </div>
          )}
        </div>

        <div className="overflow-x-auto px-4">
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
                          roleStyles[admin.role] || 'bg-muted text-muted-foreground border border-border'
                        }`}
                      >
                        {admin.role === 'new_user' ? '⏳ Pending' : admin.role.charAt(0).toUpperCase() + admin.role.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {admin.permissions.map((perm) => {
                          const meta = permissionMeta[perm];
                          if (!meta) return (
                            <span key={perm} className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground border border-border">{perm}</span>
                          );
                          const Icon = meta.icon;
                          return (
                            <Tooltip key={perm}>
                              <TooltipTrigger asChild>
                                <span className={`inline-flex items-center justify-center size-7 rounded-lg cursor-default transition-all duration-150 hover:scale-110 ${meta.className}`}>
                                  <Icon className="size-3.5" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs font-medium">
                                {meta.label}
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Approve button for pending users */}
                        {canEditRoles && admin.role === 'new_user' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={async () => {
                                  if (!onApproveUser) return;
                                  setUpdatingId(admin.id);
                                  try { await onApproveUser(admin.id); } finally { setUpdatingId(null); }
                                }}
                                disabled={updatingId === admin.id}
                                className="inline-flex items-center justify-center size-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-all duration-200 disabled:opacity-50"
                              >
                                <CheckCircle2 className="size-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs font-medium">
                              {updatingId === admin.id ? 'Approving…' : 'Approve user'}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {canEditRoles && admin.role !== 'new_user' && (
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
                              onClick={() => {
                                if (!onDisapproveUser) return;
                                setDisapproveTarget(admin);
                              }}
                              disabled={updatingId === admin.id}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900 transition-all duration-200 disabled:opacity-50"
                              title="Disapprove user - removes all labels and locks account"
                            >
                              {updatingId === admin.id ? 'Disapproving…' : '✗ Disapprove'}
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

      {/* Disapprove Confirm Dialog */}
      <ConfirmDialog
        open={!!disapproveTarget}
        onOpenChange={(open) => { if (!open) setDisapproveTarget(null); }}
        title="Disapprove User?"
        description={`This will remove all labels and lock ${disapproveTarget?.name ?? 'this user'}'s account. They will see "Your account is awaiting admin approval" when trying to login.`}
        confirmLabel="Disapprove"
        variant="destructive"
        onConfirm={async () => {
          if (!disapproveTarget || !onDisapproveUser) return;
          setUpdatingId(disapproveTarget.id);
          try {
            await onDisapproveUser(disapproveTarget.id);
          } finally {
            setUpdatingId(null);
          }
        }}
      />
    </>
  );
}
