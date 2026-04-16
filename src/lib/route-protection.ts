/**
 * Route protection configuration
 * Defines which routes require admin access
 */

export type ProtectedRoute = {
  path: string;
  title: string;
  requiresAdmin: boolean;
};

export const PROTECTED_ROUTES: ProtectedRoute[] = [
  {
    path: '/admin/employees/upload',
    title: 'Upload Employees',
    requiresAdmin: true,
  },
  {
    path: '/admin/admins',
    title: 'Admins',
    requiresAdmin: true,
  },
];

/**
 * Check if a pathname is a protected route that requires admin access
 */
export function isProtectedRoute(pathname: string): ProtectedRoute | null {
  return PROTECTED_ROUTES.find((route) => pathname.startsWith(route.path)) || null;
}

/**
 * Check if user has access to a route
 */
export function canAccessRoute(
  pathname: string,
  userRole: 'admin' | 'mvp' | null | undefined
): boolean {
  const protectedRoute = isProtectedRoute(pathname);

  // If route is not protected, everyone can access it
  if (!protectedRoute) {
    return true;
  }

  // If route requires admin and user is admin, allow
  if (protectedRoute.requiresAdmin && userRole === 'admin') {
    return true;
  }

  // Otherwise deny
  return false;
}
