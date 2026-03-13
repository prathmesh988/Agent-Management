import { NextRequest, NextResponse } from 'next/server';

// List of public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/forgot-password', '/'];

// List of protected routes
const protectedRoutes = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get the session cookie from the request
  const sessionCookie = request.cookies.get('a_session_')?.value;

  // Check if the route is public
  const isPublicRoute = publicRoutes.includes(pathname);

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If route is protected and user is not authenticated, redirect to login
  if (isProtectedRoute && !sessionCookie) {
    // Store the original URL to redirect back after login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated and tries to access login/signup, allow (they can logout if needed)
  if (sessionCookie && (pathname === '/login' || pathname === '/signup')) {
    // Optionally redirect authenticated users away from login/signup
    // return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
