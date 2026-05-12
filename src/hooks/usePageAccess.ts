'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getPageIdFromPath } from '@/lib/permissions';

function getUserId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const s = localStorage.getItem('user_session');
    return s ? JSON.parse(s).userId ?? '' : '';
  } catch { return ''; }
}

/**
 * Hook that enforces page-level access control.
 * Redirects to dashboard if user doesn't have read permission on current page.
 * 
 * Use this in your layout to prevent unauthorized access to pages.
 */
export function usePageAccess() {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const lastCheckedPath = useRef<string>('');
  const isCheckingRef = useRef<boolean>(false);

  useEffect(() => {
    // Don't check the dashboard itself (prevent redirect loop)
    if (pathname === '/admin/dashboard' || pathname === '/admin/pending-approval') {
      setChecking(false);
      return;
    }

    // Skip if we're already checking or just checked this path
    if (isCheckingRef.current || lastCheckedPath.current === pathname) {
      setChecking(false);
      return;
    }

    const checkAccess = async () => {
      isCheckingRef.current = true;
      setChecking(true);

      // Get the pageId for this pathname
      const pageId = getPageIdFromPath(pathname);
      
      // If this path isn't a managed page, allow access
      if (!pageId) {
        setChecking(false);
        isCheckingRef.current = false;
        lastCheckedPath.current = pathname;
        return;
      }

      try {
        // Forward the user identity so the backend can resolve permissions
        const userId = getUserId();
        const headers: Record<string, string> = userId ? { 'x-user-id': userId } : {};

        // Check if user has read access to this page
        const res = await fetch(`/api/permissions/check?pageId=${pageId}&perm=r`, { headers });
        const data = await res.json();

        // If not allowed, redirect to dashboard (once only)
        if (!data.allowed) {
          console.log(`[usePageAccess] Access denied to ${pageId} (role: ${data.role}), redirecting to dashboard`);
          lastCheckedPath.current = pathname;
          isCheckingRef.current = false;
          router.replace('/admin/dashboard');
          return;
        }

        setChecking(false);
        lastCheckedPath.current = pathname;
        isCheckingRef.current = false;
      } catch (error) {
        console.error('[usePageAccess] Error checking access:', error);
        // On error, fail open for reads — don't bounce a user away due to a network hiccup
        setChecking(false);
        lastCheckedPath.current = pathname;
        isCheckingRef.current = false;
      }
    };

    checkAccess();
  }, [pathname, router]);

  return { checking };
}
