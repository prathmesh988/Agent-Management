"use client";

import { AdminSidebar } from '@/components/admin/sidebar';
import { AdminHeader } from '@/components/admin/header';
import { SidebarProvider, useSidebar } from '@/components/admin/sidebar-context';
import { ToastProvider } from '@/components/ui/toast';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useRouteProtection } from '@/hooks/useRouteProtection';
import { usePageAccess } from '@/hooks/usePageAccess';
import { canAccessRoute, isProtectedRoute } from '@/lib/route-protection';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { PageLoader } from '@/components/ui/page-loader';

function AdminContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={cn(
        'flex-1 flex flex-col h-full overflow-hidden shadow-[inset_1px_0_0_0_rgba(0,0,0,0.1)] transition-all duration-300',
        collapsed ? 'md:ml-16' : 'md:ml-64'
      )}
    >
      <AdminHeader />
      <main className="flex-1 overflow-auto p-4 md:p-6 min-h-0 bg-slate-50 dark:bg-slate-950">
        {children}
      </main>
    </div>
  );
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  // Always call hooks at the top level — never conditionally
  const { currentUser, loading: currentUserLoading } = useCurrentUser();
  const pathname = usePathname();
  
  // Check route protection
  useRouteProtection();

  // Enforce page-level access control
  const { checking: accessChecking } = usePageAccess();

  // Effect: Redirect to login if not authenticated
  useEffect(() => {
    // If authentication check is complete and user is not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
      console.log('[AdminLayout] User logged out, redirecting to login');
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Effect: Redirect to pending-approval if user has no approved role
  useEffect(() => {
    if (!currentUserLoading && currentUser && !currentUser.labels?.length) {
      console.log('[AdminLayout] User has empty labels, checking pathname:', pathname);
      
      // If NOT already on pending-approval page, redirect
      if (!pathname.includes('/admin/pending-approval')) {
        console.log('[AdminLayout] Redirecting to pending-approval');
        router.replace('/admin/pending-approval');
      }
    }
  }, [currentUser, currentUserLoading, pathname, router]);

  // Effect: Redirect if user doesn't have access to current route
  useEffect(() => {
    if (!currentUserLoading && currentUser) {
      const hasAccess = canAccessRoute(pathname, currentUser?.role);
      const protectedRoute = isProtectedRoute(pathname);
      
      if (protectedRoute && !hasAccess) {
        console.log('[AdminLayout] User does not have access to:', pathname);
        router.replace('/admin/pending-approval');
      }
    }
  }, [pathname, currentUser, currentUserLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <PageLoader message="Checking authentication..." className="h-screen" />;
  }

  // If not authenticated, don't render the admin layout
  if (!isAuthenticated) {
    return null;
  }

  // Wait until we know the user's role before rendering
  if (currentUserLoading) {
    return <PageLoader message="Loading your profile..." className="h-screen" />;
  }

  // Wait for page access check to complete
  if (accessChecking) {
    return <PageLoader message="Checking access permissions..." className="h-screen" />;
  }

  // If user is pending approval and on pending-approval page, render full page (no navbar)
  if (currentUser && !currentUser.labels?.length && pathname.includes('/admin/pending-approval')) {
    return <>{children}</>;
  }

  // If user is pending approval but not on pending-approval page, we're redirecting
  if (currentUser && !currentUser.labels?.length) {
    return <PageLoader message="Redirecting to approval page..." className="h-screen" />;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        <AdminSidebar />
        <AdminContent>{children}</AdminContent>
      </div>
    </SidebarProvider>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
      <Toaster />
    </ToastProvider>
  );
}
