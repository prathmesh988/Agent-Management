import { NextRequest, NextResponse } from "next/server";

// List of public routes that don't require authentication
const publicRoutes = ["/login", "/signup", "/forgot-password"];

// List of protected routes
const protectedRoutes = ["/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get the auth session cookie from the request
  // We use a custom 'auth_session' cookie set by the client on successful login
  const authSessionCookie = request.cookies.get("auth_session")?.value;

  // Check if the route is public
  const isPublicRoute = publicRoutes.includes(pathname);

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // If user is not authenticated and tries to access root, redirect to login
  if (pathname === "/" && !authSessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If user is authenticated and at root, redirect to admin panel
  if (pathname === "/" && authSessionCookie) {
    return NextResponse.redirect(new URL("/admin/admins", request.url));
  }

  // If route is protected and user is not authenticated, redirect to login
  if (isProtectedRoute && !authSessionCookie) {
    // Store the original URL to redirect back after login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is authenticated and tries to access login/signup, redirect to admin panel
  if (authSessionCookie && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/admin/admins", request.url));
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
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
