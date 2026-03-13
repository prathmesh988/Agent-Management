'use client';

import { Admin } from '@/lib/data/mock-data';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit2, Trash2, Plus } from 'lucide-react';

interface AdminTableProps {
  admins: Admin[];
  onAddAdmin?: () => void;
  onEditAdmin?: (admin: Admin) => void;
  onDeleteAdmin?: (admin: Admin) => void;
}

const permissionColors: Record<string, string> = {
  READ: 'bg-blue-100 text-blue-800',
  WRITE: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-red-100 text-red-800',
};

export function AdminTable({
  admins,
  onAddAdmin,
  onEditAdmin,
  onDeleteAdmin,
}: AdminTableProps) {
  return (
    <Card>
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Admin Users</h2>
        <Button onClick={onAddAdmin} className="gap-2 transition-all duration-200 hover:shadow-lg hover:scale-105">
          <Plus className="h-4 w-4" />
          Add Admin
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((admin) => (
              <TableRow key={admin.id} className="transition-colors duration-200 hover:bg-slate-50">
                <TableCell className="font-medium">{admin.name}</TableCell>
                <TableCell className="text-slate-600">{admin.email}</TableCell>
                <TableCell>
                  <span className="inline-block px-2 py-1 rounded-lg bg-slate-100 text-slate-800 text-sm font-medium">
                    {admin.role === 'super-admin'
                      ? 'Super Admin'
                      : admin.role.charAt(0).toUpperCase() + admin.role.slice(1)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
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
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditAdmin?.(admin)}
                      className="transition-all duration-200 hover:scale-110 hover:bg-amber-100 hover:text-amber-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 transition-all duration-200 hover:scale-110 hover:bg-red-100"
                      onClick={() => onDeleteAdmin?.(admin)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
