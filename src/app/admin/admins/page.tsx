"use client";

import { AdminTable } from "@/components/admin/admin-table";
import { useAdmins } from "@/hooks/useAdmins";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useState } from "react";
import { Eye, Shield, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function AdminsPage() {
  const { admins, loading, error, updateAdminRole, deleteAdmin } = useAdmins();
  const { currentUser, loading: currentUserLoading, error: currentUserError } = useCurrentUser();
  const [updateError, setUpdateError] = useState<string | null>(null);

  const handleAddAdmin = () => {
    // TODO: Implement add admin modal
    console.log("Add new admin");
  };

  const handleUpdateRole = async (adminId: string, role: 'admin' | 'mvp') => {
    // Check if current user is admin
    if (currentUser?.role !== 'admin') {
      setUpdateError('Only admins can change user roles');
      return;
    }

    try {
      setUpdateError(null);
      await updateAdminRole(adminId, role);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update role';
      setUpdateError(errorMsg);
      console.error('Error updating role:', err);
    }
  };

  const handleDeleteAdmin = (admin: any) => {
    // Check if current user is admin
    if (currentUser?.role !== 'admin') {
      setUpdateError('Only admins can delete users');
      return;
    }

    if (confirm(`Are you sure you want to delete ${admin.name}?`)) {
      deleteAdmin(admin.id);
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <Card className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-rose-900 dark:text-rose-200">Error Loading Admins</h3>
              <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {currentUserError && currentUser === null && (
        <Card className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-rose-900 dark:text-rose-200">Authentication Error</h3>
              <p className="text-sm text-rose-700 dark:text-rose-300">Please log in again to access admin features.</p>
            </div>
          </div>
        </Card>
      )}

      {updateError && (
        <Card className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-200">Update Error</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">{updateError}</p>
            </div>
          </div>
        </Card>
      )}

      {currentUser && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <span className="font-semibold">Logged in as:</span> {currentUser.name} ({currentUser.role.toUpperCase()})
          </p>
        </Card>
      )}

      {currentUserLoading && (
        <Card className="p-4 bg-muted border border-border">
          <p className="text-sm text-muted-foreground">Loading admin information...</p>
        </Card>
      )}

      {!currentUserLoading && !currentUser && (
        <Card className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-200">Not Authenticated</h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">Please log in to access admin features.</p>
            </div>
          </div>
        </Card>
      )}

      {currentUser && (
        <AdminTable
          admins={admins}
          loading={loading || currentUserLoading}
          currentUserRole={currentUser?.role}
          onAddAdmin={handleAddAdmin}
          onDeleteAdmin={handleDeleteAdmin}
          onUpdateRole={handleUpdateRole}
        />
      )}

      {!currentUserLoading && !currentUser && (
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-foreground font-medium">Admin access required</p>
          <p className="text-sm text-muted-foreground mt-1">Please log in with an admin account to manage admins.</p>
        </Card>
      )}

      {/* Permission Levels - Visual Cards */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">
          Admin Roles & Permissions
        </h3>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6 border-l-4 border-l-blue-600 dark:border-l-blue-400">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-950/50">
                <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">MVP Role</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Read-only access. View employee data and reports without modification rights.
                </p>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground">Permissions:</p>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-2">
                    <li>✓ View employee data</li>
                    <li>✓ View reports</li>
                    <li>✗ Cannot edit or delete</li>
                    <li>✗ Cannot manage admins</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-amber-600 dark:border-l-amber-400">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-950/50">
                <Shield className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground mb-2">Admin Role</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Full access. Create, edit, update, and delete employee records and manage admins.
                </p>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground">Permissions:</p>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-2">
                    <li>✓ View all data</li>
                    <li>✓ Create records</li>
                    <li>✓ Edit & update</li>
                    <li>✓ Delete records</li>
                    <li>✓ Manage admin roles</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-4 bg-muted border border-border mt-6">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Change Roles:</span> Only admins can click role badges to change between MVP (Read-only) and Admin (Full Access) roles. MVP users will see roles as read-only.
          </p>
        </Card>
      </div>
    </div>
  );
}
