"use client";

import { PendingApprovalScreen } from "@/components/admin/pending-approval-screen";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageLoader } from "@/components/ui/page-loader";

/**
 * Pending Approval Page
 * 
 * This page is ONLY accessible to users with new_user role (no labels yet).
 * Once an admin approves them (adds a label), they're redirected to dashboard.
 * 
 * Route protection:
 * - new_user (no labels) → Stay on this page
 * - admin/mvp/viewer → Redirect to dashboard (already approved)
 * - unauthenticated → Redirect to login (via layout)
 */
export default function PendingApprovalPage() {
  const { currentUser, loading } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    // If user is not loading and has been approved (role != new_user), redirect to dashboard
    if (!loading && currentUser && currentUser.role !== "new_user") {
      console.log("[PendingApprovalPage] User approved, redirecting to dashboard");
      router.push("/admin/dashboard");
    }
  }, [currentUser, loading, router]);

  // Still loading
  if (loading) {
    return <PageLoader message="Checking approval status..." className="h-screen" />;
  }

  // No user (shouldn't happen due to layout, but fallback)
  if (!currentUser) {
    return <PageLoader message="Redirecting..." className="h-screen" />;
  }

  // If user is approved (role != new_user), they'll be redirected above
  // But if they somehow get here, show a message
  if (currentUser.role !== "new_user") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Redirecting to dashboard...</p>
      </div>
    );
  }

  // User is new_user (pending approval) - show the approval screen
  return (
    <PendingApprovalScreen
      userEmail={currentUser.email}
      userName={currentUser.name}
    />
  );
}
