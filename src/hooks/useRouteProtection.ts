import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { canAccessRoute, isProtectedRoute } from '@/lib/route-protection';
import { useToast } from '@/components/ui/toast';

export function useRouteProtection() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, loading } = useCurrentUser();
  const { toast } = useToast();
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
      hasShownAlert.current = true;
      toast({
        title: 'Access Denied',
        description: `"${protectedRoute.title}" requires Admin role. You currently have viewer (read-only) access.`,
        variant: 'error',
      });

      // Redirect to dashboard
      router.push('/admin/dashboard');
    }
  }, [pathname, currentUser, loading, router]);
}
