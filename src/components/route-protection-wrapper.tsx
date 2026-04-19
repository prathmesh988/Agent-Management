"use client";

import { useAuth } from '@/hooks/useAuth';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { PageLoader } from '@/components/ui/page-loader';

export function RouteProtectionWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { currentUser, loading: userLoading } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only check route protection after authentication and user data are loaded
    if (authLoading || userLoading) {
      return;
    }

    // If not authenticated, let the auth system handle it (login page)
    if (!isAuthenticated) {
      return;
    }

    // If authenticated but currentUser is null, wait longer before checking
    if (!currentUser) {
      return;
    }

    // If authenticated but has empty labels (new_user), lock to pending-approval
    if (isAuthenticated && !currentUser.labels?.length) {
      console.log('[RouteProtectionWrapper] User has empty labels, checking pathname');
      
      // Only redirect if NOT already on pending-approval
      if (!pathname.includes('/admin/pending-approval')) {
        console.log('[RouteProtectionWrapper] Redirecting to pending-approval');
        router.replace('/admin/pending-approval');
      }
      return;
    }
  }, [authLoading, userLoading, isAuthenticated, currentUser, router, pathname]);

  // Show loading while checking auth and user data
  if (authLoading || userLoading) {
    return <PageLoader message="Checking access..." className="h-screen" />;
  }

  // If authenticated but has empty labels, show loading if trying to access other routes
  if (isAuthenticated && currentUser && !currentUser.labels?.length) {
    if (!pathname.includes('/admin/pending-approval')) {
      return <PageLoader message="Redirecting to approval page..." className="h-screen" />;
    }
  }

  // Render children for authenticated users with labels (or unauthenticated users going to login)
  return <>{children}</>;
}
