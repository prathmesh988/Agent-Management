"use client";

import { Admin } from "@/lib/data/mock-data";
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
import { Edit2, Trash2, Plus, MoreVertical } from "lucide-react";
import { useState } from "react";

interface AdminTableProps {
  admins: Admin[];
  onAddAdmin?: () => void;
  onEditAdmin?: (admin: Admin) => void;
  onDeleteAdmin?: (admin: Admin) => void;
}

const permissionColors: Record<string, string> = {
  READ: "bg-blue-100 text-blue-700 border border-blue-200",
  WRITE: "bg-purple-100 text-purple-700 border border-purple-200",
  ADMIN: "bg-amber-100 text-amber-700 border border-amber-200",
};

// Action dropdown component
function ActionDropdown({ admin, onEdit, onDelete }: any) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-all duration-200 hover:text-slate-900"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-10 overflow-hidden">
          <button
            onClick={() => {
              onEdit(admin);
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors duration-200"
          >
            <Edit2 className="h-4 w-4 text-amber-600" />
            Edit Admin
          </button>
          <button
            onClick={() => {
              onDelete(admin);
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-red-50 flex items-center gap-2 transition-colors duration-200 border-t border-slate-200"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function AdminTable({
  admins,
  onAddAdmin,
  onEditAdmin,
  onDeleteAdmin,
}: AdminTableProps) {
  return (
    <Card>
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">
          Admin Users ({admins.length})
        </h2>
        <Button
          onClick={onAddAdmin}
          className="gap-2 transition-all duration-200 hover:shadow-lg hover:scale-105 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4" />
          Add Admin
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Admin</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((admin) => (
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
                    className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
                      admin.role === "super-admin"
                        ? "bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border border-purple-200"
                        : "bg-slate-100 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {admin.role === "super-admin"
                      ? "👑 Super Admin"
                      : admin.role.charAt(0).toUpperCase() +
                        admin.role.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {admin.permissions.map((perm) => (
                      <span
                        key={perm}
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${permissionColors[perm]}`}
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-slate-600 text-sm">
                  {admin.createdAt}
                </TableCell>
                <TableCell className="text-right">
                  <ActionDropdown
                    admin={admin}
                    onEdit={onEditAdmin}
                    onDelete={onDeleteAdmin}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
