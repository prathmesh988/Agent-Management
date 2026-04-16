import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { canAccessRoute, isProtectedRoute } from '@/lib/route-protection';

export function useRouteProtection() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isLoading } = useCurrentUser();

  useEffect(() => {
    // Only check after user data is loaded
    if (isLoading) {
      return;
    }

    // Check if current route is protected and user has access
    const hasAccess = canAccessRoute(pathname, currentUser?.role);
    const protectedRoute = isProtectedRoute(pathname);

    if (protectedRoute && !hasAccess) {
      // Show alert notification
      alert(`Access Denied\n\n"${protectedRoute.title}" requires Admin role. You currently have MVP (read-only) access.`);

      // Redirect to dashboard
      router.push('/admin/dashboard');
    }
  }, [pathname, currentUser, isLoading, router]);
}
