import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { canAccessRoute, isProtectedRoute } from '@/lib/route-protection';

export function useRouteProtection() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, loading } = useCurrentUser();
  const hasShownAlert = useRef(false);

  useEffect(() => {
    // Only check after user data is loaded
    if (loading) {
      return;
    }

    // Check if current route is protected and user has access
    const hasAccess = canAccessRoute(pathname, currentUser?.role);
    const protectedRoute = isProtectedRoute(pathname);

    if (protectedRoute && !hasAccess && !hasShownAlert.current) {
      // Show alert notification only once
      hasShownAlert.current = true;
      alert(`Access Denied\n\n"${protectedRoute.title}" requires Admin role. You currently have viewer (read-only) access.`);

      // Redirect to dashboard
      router.push('/admin/dashboard');
    }
  }, [pathname, currentUser, loading, router]);
}
