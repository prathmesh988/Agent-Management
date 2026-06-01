"use client";

import { AdminTable } from "@/components/admin/admin-table";
import { useAdmins, type AdminUser } from "@/hooks/useAdmins";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useState } from "react";
import { Eye, Shield, AlertCircle, Clock, Users, Info, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageLoader } from "@/components/ui/page-loader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { RolesOverview } from "@/components/admin/roles-overview";
import { usePagePermission } from "@/hooks/usePagePermission";

export default function AdminsPage() {
  const { canWrite, canUpdate, canDelete, loading: permsLoading } = usePagePermission("admins");
  const { admins, loading, error, updateAdminRole, deleteAdmin, disapproveAdmin, fetchAdmins } = useAdmins();
  const { currentUser, loading: currentUserLoading, error: currentUserError } = useCurrentUser();
  const [updateError, setUpdateError] = useState<string | null>(null);

  const pendingUsers  = admins.filter((a) => a.role === 'new_user');
  const approvedUsers = admins.filter((a) => a.role !== 'new_user');

  // ── handlers ────────────────────────────────────────────────────────────────

  const handleUpdateRole = async (adminId: string, role: 'admin' | 'manager' | 'hr' | 'viewer' | 'mvp' | 'new_user') => {
    if (!canUpdate || permsLoading) { setUpdateError('You do not have permission to change user roles'); return; }
    const admin = admins.find((a) => a.id === adminId);
    const previousRole = admin?.role;
    try {
      setUpdateError(null);
      await updateAdminRole(adminId, role);
      toast.success(`${admin?.name ?? 'User'}'s role updated to ${role.toUpperCase()}`, {
        description: `Previous role: ${previousRole?.toUpperCase() ?? 'Unknown'}`,
        action: previousRole
          ? {
              label: "Undo",
              onClick: async () => {
                try {
                  await updateAdminRole(adminId, previousRole);
                  toast.info(`Reverted ${admin?.name ?? 'User'}'s role back to ${previousRole.toUpperCase()}`);
                } catch {
                  toast.error("Failed to undo role change");
                }
              },
            }
          : undefined,
      });
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to update role');
      toast.error("Failed to update role", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleApproveUser = async (adminId: string) => {
    if (!canUpdate || permsLoading) { setUpdateError('You do not have permission to approve users'); return; }
    const admin = admins.find((a) => a.id === adminId);
    try {
      setUpdateError(null);
      await updateAdminRole(adminId, 'mvp');
      toast.success(`${admin?.name ?? 'User'} has been approved`, {
        description: "They now have MVP access and can use the system.",
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await disapproveAdmin(adminId);
              toast.info(`Reverted approval for ${admin?.name ?? 'User'}`);
            } catch {
              toast.error("Failed to undo approval");
            }
          },
        },
      });
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to approve user');
      toast.error("Failed to approve user", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleDeleteAdmin = async (admin: AdminUser) => {
    if (!canDelete || permsLoading) { setUpdateError('You do not have permission to delete users'); return; }
    // Store snapshot for undo
    const snapshot = { ...admin };
    try {
      await deleteAdmin(admin.id);
      toast.success(`${admin.name} has been deleted`, {
        description: `${admin.email} — ${admin.role.toUpperCase()} role removed.`,
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              // Re-create the user by restoring their role (this re-adds them to the list)
              await updateAdminRole(snapshot.id, snapshot.role);
              toast.info(`${snapshot.name} has been restored`);
            } catch {
              // If API restore fails, at least refresh the list
              await fetchAdmins();
              toast.error("Failed to undo deletion — refreshed user list");
            }
          },
        },
      });
    } catch (err) {
      toast.error("Failed to delete user", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleDisapproveUser = async (adminId: string) => {
    if (!canUpdate || permsLoading) { setUpdateError('You do not have permission to disapprove users'); return; }
    const admin = admins.find((a) => a.id === adminId);
    const previousRole = admin?.role;
    try {
      setUpdateError(null);
      await disapproveAdmin(adminId);
      toast.success(`${admin?.name ?? 'User'} has been disapproved`, {
        description: "All labels removed. They will see a pending approval screen.",
        action: previousRole && previousRole !== 'new_user'
          ? {
              label: "Undo",
              onClick: async () => {
                try {
                  await updateAdminRole(adminId, previousRole);
                  toast.info(`Restored ${admin?.name ?? 'User'}'s ${previousRole.toUpperCase()} role`);
                } catch {
                  toast.error("Failed to undo disapproval");
                }
              },
            }
          : undefined,
      });
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Failed to disapprove user');
      toast.error("Failed to disapprove user", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  // ── shared table props ────────────────────────────────────────────────────
  const tableProps = {
    loading: loading || currentUserLoading || permsLoading,
    currentUserRole: currentUser?.role,
    onDeleteAdmin: handleDeleteAdmin,
    onUpdateRole: handleUpdateRole,
    onApproveUser: handleApproveUser,
    onDisapproveUser: handleDisapproveUser,
    canUpdate,
    canDelete,
  } as const;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Error / status banners ─────────────────────────────────────────── */}
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

      {currentUserLoading && (
        <PageLoader message="Loading admin information…" size="sm" className="py-8" />
      )}

      {!currentUserLoading && !currentUser && (
        <Card className="p-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-foreground font-medium">Admin access required</p>
          <p className="text-sm text-muted-foreground mt-1">Please log in with an admin account to manage users.</p>
        </Card>
      )}

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      {currentUser && (
        <Tabs defaultValue={pendingUsers.length > 0 ? "pending" : "all"} className="w-full">

          {/* Tab bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <TabsList className="h-10 p-1 gap-1">

              {/* Pending tab — highlighted when there are approvals */}
              <TabsTrigger value="pending" className="relative gap-2 px-4">
                <Clock className="h-3.5 w-3.5" />
                Pending
                {pendingUsers.length > 0 && (
                  <span className="ml-0.5 inline-flex items-center justify-center h-4.5 min-w-[1.25rem] px-1.5 rounded-full text-[10px] font-bold bg-orange-500 text-white leading-none">
                    {pendingUsers.length}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger value="all" className="gap-2 px-4">
                <Users className="h-3.5 w-3.5" />
                All Users
                <span className="ml-0.5 inline-flex items-center justify-center h-4.5 min-w-[1.25rem] px-1.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground leading-none">
                  {approvedUsers.length}
                </span>
              </TabsTrigger>

              <TabsTrigger value="roles" className="gap-2 px-4">
                <Info className="h-3.5 w-3.5" />
                Role Guide
              </TabsTrigger>

              <TabsTrigger value="permissions" className="gap-2 px-4">
                <Lock className="h-3.5 w-3.5" />
                Roles &amp; Permissions
              </TabsTrigger>
            </TabsList>

            {/* Logged-in-as pill */}
            {currentUser && (
              <span className="text-xs text-muted-foreground px-3 py-1.5 rounded-full border border-border bg-muted/50 hidden sm:inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {currentUser.name} · <strong className="text-foreground">{currentUser.role.toUpperCase()}</strong>
              </span>
            )}
          </div>

          {/* ── Pending tab ───────────────────────────────────────────────── */}
          <TabsContent value="pending" className="mt-4">
            {pendingUsers.length === 0 ? (
              <Card className="p-10 text-center border-dashed">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                  <p className="font-semibold text-foreground">No pending approvals</p>
                  <p className="text-sm text-muted-foreground">All users have been reviewed.</p>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card className="p-4 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800">
                  <div className="flex gap-3 items-start">
                    <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-orange-900 dark:text-orange-200">
                        {pendingUsers.length} user{pendingUsers.length > 1 ? 's are' : ' is'} waiting for approval
                      </h3>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mt-0.5">
                        Click <strong>✓ Approve</strong> to grant access. Approved users receive the <strong>MVP</strong> role.
                      </p>
                    </div>
                  </div>
                </Card>
                <AdminTable admins={pendingUsers} {...tableProps} />
              </div>
            )}
          </TabsContent>

          {/* ── All Users tab ─────────────────────────────────────────────── */}
          <TabsContent value="all" className="mt-4">
            <AdminTable admins={approvedUsers} {...tableProps} />
          </TabsContent>

          {/* ── Role Guide tab ────────────────────────────────────────────── */}
          <TabsContent value="roles" className="mt-4">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">

                <Card className="p-5 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center gap-2 pb-3 border-b border-border mb-3">
                    <span className="text-orange-500 text-base">⏳</span>
                    <h4 className="font-semibold text-sm text-foreground">New User (Pending)</h4>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-3">
                    <p>Account created, awaiting admin approval. Cannot access any routes.</p>
                    <div className="grid grid-cols-2 gap-y-2">
                      <span className="flex items-center gap-1.5 text-slate-400"><span className="text-rose-400 font-bold">✗</span> View data</span>
                      <span className="flex items-center gap-1.5 text-slate-400"><span className="text-rose-400 font-bold">✗</span> View reports</span>
                      <span className="flex items-center gap-1.5 text-slate-400"><span className="text-rose-400 font-bold">✗</span> Modifying</span>
                      <span className="flex items-center gap-1.5 text-slate-400"><span className="text-rose-400 font-bold">✗</span> Admin roles</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-5 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center gap-2 pb-3 border-b border-border mb-3">
                    <span className="text-emerald-500 text-base">🚀</span>
                    <h4 className="font-semibold text-sm text-foreground">MVP Role (Approved)</h4>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-3">
                    <p>Approved user — full read access to the system.</p>
                    <div className="grid grid-cols-2 gap-y-2">
                      <span className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> View data</span>
                      <span className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> View reports</span>
                      <span className="flex items-center gap-1.5 text-slate-400"><span className="text-rose-400 font-bold">✗</span> Modifying</span>
                      <span className="flex items-center gap-1.5 text-slate-400"><span className="text-rose-400 font-bold">✗</span> Admin roles</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-5 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center gap-2 pb-3 border-b border-border mb-3">
                    <Eye className="h-4 w-4 text-blue-500" />
                    <h4 className="font-semibold text-sm text-foreground">Viewer Role</h4>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-3">
                    <p>Read-only access. View employee data and reports safely.</p>
                    <div className="grid grid-cols-2 gap-y-2">
                      <span className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> View data</span>
                      <span className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> View reports</span>
                      <span className="flex items-center gap-1.5 text-slate-400"><span className="text-rose-400 font-bold">✗</span> Modifying</span>
                      <span className="flex items-center gap-1.5 text-slate-400"><span className="text-rose-400 font-bold">✗</span> Admin roles</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-5 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center gap-2 pb-3 border-b border-border mb-3">
                    <Shield className="h-4 w-4 text-amber-500" />
                    <h4 className="font-semibold text-sm text-foreground">Admin Role</h4>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-3">
                    <p>Full system access including modification and config rights.</p>
                    <div className="grid grid-cols-2 gap-y-2">
                      <span className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> Full view</span>
                      <span className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> Edit records</span>
                      <span className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> Delete records</span>
                      <span className="flex items-center gap-1.5"><span className="text-emerald-500 font-bold">✓</span> Manage roles</span>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-4 bg-muted border border-border">
                <p className="text-sm text-muted-foreground mb-3">
                  <span className="font-semibold text-foreground">Approval Flow:</span>{' '}
                  New users land on a waiting screen. Head to the <strong>Pending</strong> tab to approve them —
                  this grants them the <strong>MVP</strong> role and full read access. Only admins can approve users and change roles.
                </p>
              </Card>

              <Card className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-900 dark:text-red-100">
                  <span className="font-semibold">Disapprove Option (✗):</span>{' '}
                  Removes <strong>ALL labels</strong> from a user's account, effectively locking it.
                  Disapproved users will see "Your account is awaiting admin approval" when trying to login.
                  Use this to restrict access or temporarily lock an account. Re-approve by assigning a role again.
                </p>
              </Card>
            </div>
          </TabsContent>

          {/* ── Roles & Permissions tab ────────────────────────────────────── */}
          <TabsContent value="permissions" className="mt-4">
            <RolesOverview users={admins.map((a) => ({ id: a.id, name: a.name, email: a.email, role: a.role }))} />
          </TabsContent>

        </Tabs>
      )}
    </div>
  );
}
