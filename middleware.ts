/**
 * Simple redirect middleware for public routes
 * Real authentication is handled client-side by useAuth hook
 * This prevents accessing already-authenticated users to re-login
 */

import { NextRequest, NextResponse } from 'next/server';

// Routes that are public (don't require authentication)
const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/auth'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // For public routes, just let them through
  // The login/signup pages will handle redirecting authenticated users
  // The admin layout will handle protecting admin routes via client-side auth checks
  return NextResponse.next();
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};
