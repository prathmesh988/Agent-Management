import { NextRequest, NextResponse } from "next/server";

// Public routes — no auth needed
const PUBLIC_ROUTES = ["/login", "/signup", "/forgot-password"];
const PUBLIC_PREFIXES = ["/onboard", "/api/onboarding"];

// Protected route prefixes
const PROTECTED_PREFIXES = ["/admin"];

const APPWRITE_ENDPOINT =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";

/**
 * Verify the Appwrite session by calling /v1/account directly.
 * Forwards all cookies so Appwrite can read its own session cookie
 * (a_session_<projectId>).  Returns true only when Appwrite confirms
 * the session is active (HTTP 200).
 */
async function isSessionValid(request: NextRequest): Promise<boolean> {
  if (!PROJECT_ID) return false;

  try {
    const res = await fetch(`${APPWRITE_ENDPOINT}/account`, {
      method: "GET",
      headers: {
        // Forward browser cookies → Appwrite reads its own session cookie
        cookie: request.headers.get("cookie") ?? "",
        "x-appwrite-project": PROJECT_ID,
        "content-type": "application/json",
      },
      // Must not follow redirects — a 3xx is also invalid
      redirect: "manual",
    });

    return res.status === 200;
  } catch {
    // Network error or timeout — treat as unauthenticated
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute  = PUBLIC_ROUTES.includes(pathname);
  const isPublicPrefix  = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
  const isPublic        = isPublicRoute || isPublicPrefix;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  // ── Verify with Appwrite on every relevant request ──────────────────────
  const valid = await isSessionValid(request);

  // Helper: clear our legacy client-set cookie if session is invalid
  const redirectUnauthenticated = (destination: string) => {
    const url = new URL(destination, request.url);
    const res = NextResponse.redirect(url);
    // Wipe the stale client cookie so middleware doesn't keep checking it
    res.cookies.delete("auth_session");
    return res;
  };

  // ── / root ───────────────────────────────────────────────────────────────
  if (pathname === "/") {
    return valid
      ? NextResponse.redirect(new URL("/admin/dashboard", request.url))
      : NextResponse.redirect(new URL("/login", request.url));
  }

  // ── Protected route + invalid/expired session → login ───────────────────
  if (isProtected && !valid) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return redirectUnauthenticated(loginUrl.toString());
  }

  // ── Public route (login/signup) + valid session → dashboard ────────────
  if (isPublic && valid) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     *  - api routes
     *  - Next.js internals (_next/*)
     *  - Static assets (favicon, images)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
